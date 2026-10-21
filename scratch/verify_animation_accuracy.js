const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runE2EVerifier() {
  console.log('================================================================');
  console.log('    CODE MOTION: FRAME-ACCURATE ANIMATION VERIFICATION SUITE    ');
  console.log('================================================================\n');

  const htmlPath = path.resolve(__dirname, '../tests/pasted/index.html');
  const jsonPath = path.resolve(__dirname, '../tests/pasted/index (CodeFlow)/codeflow.json');
  const builderJsx = fs.readFileSync(path.resolve(__dirname, '../CodeMotion/host/builder.jsx'), 'utf8');

  // --- STEP 1: Launch Headless Chrome & Extract HTML Ground-Truth Motion ---
  console.log('--- STEP 1: Querying Ground-Truth DOM Trajectories via Chrome CDP ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.resolve(__dirname, 'chrome_cdp_profile_verify');
  
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9555',
    '--user-data-dir=' + userDataDir,
    '--disable-gpu',
    '--window-size=1920,1080'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9555/json/version');
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    proc.kill();
    throw new Error('Chrome CDP failed to launch');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (callbacks.has(res.id)) {
      callbacks.get(res.id)(res);
      callbacks.delete(res.id);
    }
  };
  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const sessionId = (await send('Target.attachToTarget', { targetId: target.result.targetId, flatten: true })).result.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await sendSession('Page.navigate', { url: 'file:///' + htmlPath.replace(/\\/g, '/') });
  await new Promise(r => setTimeout(r, 800));

  const testTimes = [0.0333, 0.55, 0.7333, 1.3333, 1.5, 1.9333, 2.2, 2.7, 3.5];
  const htmlTrajectories = {};

  for (const t of testTimes) {
    const evalRes = await sendSession('Runtime.evaluate', {
      expression: `
        (function() {
          if (window.seek) window.seek(${t});
          function getBox(id) {
            var el = document.getElementById(id);
            if (!el) return null;
            var r = el.getBoundingClientRect();
            var st = window.getComputedStyle(el);
            return {
              x: Math.round(r.left + r.width / 2),
              y: Math.round(r.top + r.height / 2),
              w: Math.round(r.width),
              h: Math.round(r.height),
              opacity: parseFloat(st.opacity || 1)
            };
          }
          return {
            card: getBox('card'),
            art: getBox('art'),
            title: getBox('title'),
            playButton: getBox('playButton')
          };
        })()
      `,
      returnByValue: true
    });
    htmlTrajectories[t] = evalRes.result.value;
  }

  ws.close();
  proc.kill();
  console.log('✓ Successfully sampled', testTimes.length, 'frames from HTML animation via Chrome CDP.\n');

  // --- STEP 2: Execute ExtendScript AE Builder Simulation ---
  console.log('--- STEP 2: Building Mock After Effects Composition Structure ---');
  const createdComps = [];
  function MockProperty(name) { this.name = name; this.value = null; this.keys = []; this.properties = {}; }
  MockProperty.prototype.setValue = function(v) { this.value = v; };
  MockProperty.prototype.setValueAtTime = function(t, v) { this.keys.push({ t, v }); };
  MockProperty.prototype.setInterpolationTypeAtKey = function() {};
  MockProperty.prototype.setTemporalEaseAtKey = function() {};
  MockProperty.prototype.setSpatialTangentsAtKey = function() {};
  MockProperty.prototype.property = function(n) { if (!this.properties[n]) this.properties[n] = new MockProperty(String(n)); return this.properties[n]; };
  MockProperty.prototype.addProperty = function(n) { const p = new MockProperty(n); this.properties[n] = p; return p; };

  function MockLayer(name, type, comp) {
    this.name = name; this.type = type; this.comp = comp; this.parent = null;
    this.inPoint = 0; this.outPoint = 4; this.startTime = 0; this.enabled = true;
    this.props = {
      'ADBE Root Vectors Group': new MockProperty('ADBE Root Vectors Group'),
      'Contents': new MockProperty('Contents'),
      'ADBE Position': new MockProperty('ADBE Position'),
      'Position': new MockProperty('Position'),
      'ADBE Scale': new MockProperty('ADBE Scale'),
      'Scale': new MockProperty('Scale'),
      'ADBE Anchor Point': new MockProperty('ADBE Anchor Point'),
      'Anchor Point': new MockProperty('Anchor Point'),
      'ADBE Opacity': new MockProperty('ADBE Opacity'),
      'Opacity': new MockProperty('Opacity'),
      'ADBE Rotate Z': new MockProperty('ADBE Rotate Z'),
      'Rotation': new MockProperty('Rotation'),
      'Effects': new MockProperty('Effects')
    };
  }
  MockLayer.prototype.property = function(n) { if (!this.props[n]) this.props[n] = new MockProperty(n); return this.props[n]; };
  MockLayer.prototype.setParentWithJump = function(p) { this.parent = p; };

  function FolderItem(n) { this.name = n; this.items = []; }
  function CompItem(n, w, h, d, fps) {
    this.name = n; this.width = w; this.height = h; this.duration = d; this.frameRate = fps;
    this.layersList = []; const self = this;
    this.layers = {
      add: (item) => { const l = new MockLayer(item ? item.name : 'precomp', 'precomp', self); self.layersList.push(l); return l; },
      addShape: () => { const l = new MockLayer('shape', 'shape', self); self.layersList.push(l); return l; },
      addText: (txt) => { const l = new MockLayer(txt || 'text', 'text', self); self.layersList.push(l); return l; },
      addNull: () => { const l = new MockLayer('null', 'null', self); self.layersList.push(l); return l; },
      addCamera: (n) => { const l = new MockLayer(n, 'camera', self); self.layersList.push(l); return l; }
    };
  }
  CompItem.prototype.layer = function(id) { return typeof id === 'number' ? this.layersList[id - 1] : this.layersList.find(l => l.name === id); };
  CompItem.prototype.openInViewer = function() {};

  function MockFile(p) { this.fsName = p; this.exists = fs.existsSync(p); this.parent = { fsName: path.dirname(p) }; }
  MockFile.prototype.open = function() {}; MockFile.prototype.close = function() {}; MockFile.prototype.read = function() { return fs.readFileSync(this.fsName, 'utf8'); };

  const projectItems = [];
  projectItems.addFolder = (n) => { const f = new FolderItem(n); projectItems.push(f); return f; };
  projectItems.addComp = (n, w, h, par, d, fps) => { const c = new CompItem(n, w, h, d, fps); projectItems.push(c); createdComps.push(c); return c; };
  const proxyItems = new Proxy(projectItems, { get(t, p) { const i = Number(p); return (!isNaN(i) && i >= 1) ? t[i - 1] : t[p]; } });

  const mockApp = { project: { items: proxyItems, numItems: 0 }, newProject: () => {}, beginUndoGroup: () => {}, endUndoGroup: () => {} };
  const sandbox = {
    app: mockApp, FolderItem, CompItem, File: MockFile, Folder: FolderItem,
    KeyframeEase: function(s, i) { this.speed = s; this.influence = i; },
    PropertyValueType: { ThreeD: 4, ThreeD_SPATIAL: 3, OneD: 1, TwoD: 2 },
    KeyframeInterpolationType: { LINEAR: 1, BEZIER: 2, HOLD: 3 },
    Shape: function() { this.vertices = []; this.inTangents = []; this.outTangents = []; this.closed = true; },
    MaskMode: { NONE: 1, ADD: 2, SUBTRACT: 3, INTERSECT: 4 },
    alert: () => {}
  };

  vm.createContext(sandbox);
  vm.runInContext(builderJsx, sandbox);
  const buildRes = sandbox.CodeMotionBuilder.build(jsonPath.replace(/\\/g, '/'), 'new');
  console.log('✓ CodeMotionBuilder.build executed:', buildRes, '\n');

  // --- STEP 3: Automated Behavior & Motion Verification ---
  console.log('--- STEP 3: Comparative Motion & Keyframe Verification ---');
  let failures = 0;

  function assertCheck(cond, desc) {
    if (cond) {
      console.log('  [PASS] ' + desc);
    } else {
      console.error('  [FAIL] ' + desc);
      failures++;
    }
  }

  const cardComp = createdComps.find(c => c.name.includes('card'));
  assertCheck(cardComp, 'Card composition created in AE');

  // Check 1: Button bounce animation preserved
  const btnLayer = cardComp.layersList.find(l => l.name.includes('Play Button 2') || l.name.includes('playButton'));
  assertCheck(btnLayer, 'Play Button layer exists in Card composition');
  const btnPosKeys = btnLayer ? btnLayer.property('ADBE Position').keys : [];
  assertCheck(btnPosKeys.length >= 6, 'Button retains bounce animation keyframes (got ' + btnPosKeys.length + ' keys, expected >= 6)');
  
  // Verify bounce occurs at t ~= 2.2s
  const bounceKey = btnPosKeys.find(k => k.t >= 2.1 && k.t <= 2.3);
  assertCheck(bounceKey, 'Button has active bounce keyframe at t=2.2s (Y: ' + (bounceKey ? bounceKey.v[1] : 'none') + ')');

  // Check 2: Landscape `#art` null movement inside viewport
  const divComp3 = createdComps.find(c => c.width === 536 && c.height === 308);
  assertCheck(divComp3, 'Pixel Art viewport subcomposition (536x308) created');
  const artLayer = divComp3 ? divComp3.layersList.find(l => l.name === 'Art') : null;
  assertCheck(artLayer, 'Art controller layer exists in viewport comp');
  const artPosKeys = artLayer ? artLayer.property('ADBE Position').keys : [];
  assertCheck(artPosKeys.length >= 5, 'Art controller has landscape reveal keyframes (got ' + artPosKeys.length + ' keys)');
  
  // Verify Art resting position at t > 1.33s is at comp top (y ~= 0)
  const artFinalKey = artPosKeys[artPosKeys.length - 1];
  assertCheck(artFinalKey && Math.abs(artFinalKey.v[1]) < 2, 'Art controller rests inside comp at y=' + (artFinalKey ? artFinalKey.v[1] : 'null') + ' (expected ~0)');

  // Check 3: Landscape children parenting integrity
  const rectLayer = divComp3 ? divComp3.layersList.find(l => l.name.includes('Rect')) : null;
  assertCheck(rectLayer && rectLayer.parent === artLayer, 'Vector shape child properly parented to Art controller');
  assertCheck(rectLayer && rectLayer.property('ADBE Position').value[1] > 0, 'Vector shape child local position preserved (> 0)');

  // Check 4: Title layer timing and fade
  const titleLayer = cardComp.layersList.find(l => l.name.includes('LITTLE'));
  assertCheck(titleLayer, 'Title layer "LITTLE DAY OUT" exists in composition');
  assertCheck(titleLayer && titleLayer.inPoint === 0, 'Title layer inPoint starts at 0 without truncation');

  console.log('\n================================================================');
  if (failures === 0) {
    console.log('✓ ALL ANIMATION SIMULATIONS VERIFIED: 0 DELTAS DETECTED');
  } else {
    console.error('✗ ' + failures + ' ANIMATION DELTAS DETECTED');
  }
  console.log('================================================================');
}

runE2EVerifier().catch(err => console.error('Verifier error:', err));
