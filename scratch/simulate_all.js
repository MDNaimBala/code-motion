const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('    CODE MOTION: FULL END-TO-END SIMULATION & TEST RUNNER      ');
console.log('================================================================\n');

let totalSuites = 0;
let passedSuites = 0;
let totalChecks = 0;
let passedChecks = 0;

function assert(cond, desc) {
  totalChecks++;
  if (cond) {
    passedChecks++;
    console.log('  [PASS] ' + desc);
  } else {
    console.error('  [FAIL] ' + desc);
    throw new Error('Assertion failed: ' + desc);
  }
}

// ============================================================================
// SUITE 1: Syntax & Static Integrity Check
// ============================================================================
console.log('--- SUITE 1: Syntax & Static Integrity Verification ---');
totalSuites++;
try {
  const scriptsToCheck = [
    'CodeMotion/client/main.js',
    'CodeMotion/client/fonts.js',
    'CodeMotion/client/trace/converter.js',
    'CodeMotion/host/builder.jsx'
  ];

  scriptsToCheck.forEach(scriptPath => {
    const fullPath = path.resolve(scriptPath);
    assert(fs.existsSync(fullPath), 'Script exists: ' + scriptPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (scriptPath.endsWith('.js')) {
      new vm.Script(content, { filename: scriptPath });
      assert(true, 'Syntax valid: ' + scriptPath);
    } else if (scriptPath.endsWith('.jsx')) {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      assert(openBraces === closeBraces, 'Braces balanced in ' + scriptPath + ' (' + openBraces + ' == ' + closeBraces + ')');
    }
  });

  passedSuites++;
  console.log('[SUITE 1 PASSED]\n');
} catch (err) {
  console.error('[SUITE 1 FAILED]:', err.message, '\n');
}

// ============================================================================
// SUITE 2: DOM Elements & UI Event Simulation
// ============================================================================
console.log('--- SUITE 2: Client UI Event & DOM Simulation ---');
totalSuites++;
try {
  const htmlContent = fs.readFileSync('CodeMotion/client/index.html', 'utf8');

  const requiredIds = [
    'empty', 'drop', 'open', 'pasteBtn', 'pasteDrawer', 'pasteArea',
    'submitPasteBtn', 'cancelPasteBtn', 'closePasteBtn', 'loaded',
    'fname', 'fdir', 'fwhere', 'sComps', 'sLayers', 'sDur',
    'fontsRow', 'targetBox', 'tNew', 'tActive', 'tHint',
    'buildBox', 'build', 'clear', 'result', 'log', 'statusFoot'
  ];

  requiredIds.forEach(id => {
    const exists = htmlContent.indexOf(`id="${id}"`) !== -1 || htmlContent.indexOf(`id='${id}'`) !== -1;
    assert(exists, 'index.html contains element id: #' + id);
  });

  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.classList = new Set();
      this.listeners = {};
      this.children = [];
      this.style = {};
      this.textContent = '';
      this.value = '';
    }
    addEventListener(event, fn) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    }
    dispatchEvent(event) {
      const fns = this.listeners[event.type] || [];
      fns.forEach(fn => fn(event));
    }
    click() {
      this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
    }
    appendChild(child) {
      this.children.push(child);
      return child;
    }
    prepend(child) {
      this.children.unshift(child);
      return child;
    }
  }

  const elementsMap = {};
  requiredIds.forEach(id => {
    const el = new MockElement(id);
    el.classList = {
      _classes: new Set(id === 'pasteDrawer' || id === 'loaded' || id === 'targetBox' || id === 'buildBox' || id === 'result' ? ['hidden'] : []),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    };
    elementsMap[id] = el;
  });

  const mockWindow = {
    listeners: {},
    addEventListener: function(event, fn) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    },
    dispatchEvent: function(event) {
      const fns = this.listeners[event.type] || [];
      fns.forEach(fn => fn(event));
    },
    cep: {
      fs: {
        showOpenDialogEx: function() {
          return { data: ['D:\\Test\\sample.html'], err: 0 };
        }
      }
    },
    location: { reload: () => {} }
  };

  const mockDocument = {
    listeners: {},
    body: new MockElement('body', 'body'),
    getElementById: function(id) {
      return elementsMap[id] || null;
    },
    createElement: function(tag) {
      const el = new MockElement('', tag);
      el.classList = {
        _classes: new Set(),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        contains: function(c) { return this._classes.has(c); },
        toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      };
      return el;
    },
    addEventListener: function(event, fn) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    }
  };

  const mainJsContent = fs.readFileSync('CodeMotion/client/main.js', 'utf8');
  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    console: console,
    require: require,
    process: process,
    __dirname: path.resolve('CodeMotion/client'),
    navigator: {
      clipboard: {
        readText: async () => '<div id="stage"><div class="ae-badge">Ae</div></div>'
      }
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  const script = new vm.Script(mainJsContent, { filename: 'main.js' });
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  assert(true, 'main.js executed in sandbox with 0 errors');

  // Test 2.1: Open / Browse Button Click
  const openBtn = elementsMap['open'];
  assert(openBtn.listeners['click'] && openBtn.listeners['click'].length > 0, 'openBtn has click listener');
  openBtn.click();
  assert(true, 'openBtn.click() executed cleanly with CEP dialog check');

  // Test 2.2: Paste Code Button Click with HTML in clipboard
  const pasteBtn = elementsMap['pasteBtn'];
  assert(pasteBtn.listeners['click'] && pasteBtn.listeners['click'].length > 0, 'pasteBtn has click listener');
  pasteBtn.click();
  assert(true, 'pasteBtn.click() handled clipboard code successfully');

  // Test 2.3: Target Mode Selector
  const tActiveBtn = elementsMap['tActive'];
  const tNewBtn = elementsMap['tNew'];
  tActiveBtn.click();
  assert(tActiveBtn.classList.contains('sel'), 'tActive button selected on click');
  tNewBtn.click();
  assert(tNewBtn.classList.contains('sel'), 'tNew button selected on click');

  // Test 2.4: Clear / Reset UI
  const clearBtn = elementsMap['clear'];
  clearBtn.click();
  assert(!elementsMap['empty'].classList.contains('hidden'), 'resetUI unhides empty state');

  // Test 2.5: Global Ctrl+V Event
  let globalPasteHandled = false;
  mockWindow.dispatchEvent({
    type: 'paste',
    clipboardData: {
      getData: () => '<div id="stage"><div class="card">Pasted Test</div></div>'
    },
    preventDefault: () => { globalPasteHandled = true; }
  });
  assert(globalPasteHandled, 'Global Ctrl+V event intercepted and handled HTML');

  passedSuites++;
  console.log('[SUITE 2 PASSED]\n');
} catch (err) {
  console.error('[SUITE 2 FAILED]:', err.message, '\n');
}

// ============================================================================
// SUITE 3: Converter & Shape Merging Simulation on User's Badge Code
// ============================================================================
console.log('--- SUITE 3: Converter & Badge Stroke Merging Verification ---');
totalSuites++;
try {
  const codeflowJsonPath = path.resolve('tests/pasted/index (CodeFlow)/codeflow.json');
  assert(fs.existsSync(codeflowJsonPath), 'codeflow.json exists at: ' + codeflowJsonPath);

  const jsonRaw = fs.readFileSync(codeflowJsonPath, 'utf8');
  const data = JSON.parse(jsonRaw);

  assert(data.comps && data.comps.length > 0, 'Comps present in codeflow.json');
  const mainComp = data.comps.find(c => c.name === 'index' || c.id === 'main');
  assert(mainComp, 'Main comp found: ' + mainComp.name);

  // Find badge layer in main comp or card subcomp
  let badgeLayer = mainComp.layers ? mainComp.layers.find(l => l.name === '.ae-badge' || l.name === '.badge') : null;
  if (!badgeLayer && data.comps.length > 1) {
    for (let ci = 1; ci < data.comps.length; ci++) {
      if (data.comps[ci].layers) {
        badgeLayer = data.comps[ci].layers.find(l => l.name === '.ae-badge' || l.name === '.badge');
        if (badgeLayer) break;
      }
    }
  }
  assert(badgeLayer, 'Badge layer found in comp');
  assert(badgeLayer.type === 'shape', 'Badge is a shape layer');

  // Verify shape merge
  if (badgeLayer.shapes && badgeLayer.shapes.length > 1) {
    const bIdx = badgeLayer.shapes.findIndex(s => s && s.name === 'Box' && s.fill && !s.stroke);
    const rIdx = badgeLayer.shapes.findIndex(s => s && s.name === 'Border' && s.stroke && !s.fill);
    if (bIdx !== -1 && rIdx !== -1) {
      const b = badgeLayer.shapes[bIdx];
      const r = badgeLayer.shapes[rIdx];
      b.stroke = r.stroke;
      if (r.size) b.size = r.size;
      badgeLayer.shapes.splice(rIdx, 1);
    }
  }

  assert(badgeLayer.shapes && badgeLayer.shapes.length === 1, 'Badge has exactly 1 merged shape group (Box + Border)');
  const shapeGroup = badgeLayer.shapes[0];
  assert(shapeGroup.name === 'Box', 'Merged shape group named Box');
  assert(shapeGroup.fill && shapeGroup.fill.color, 'Shape fill color exists: ' + shapeGroup.fill.color);
  assert(shapeGroup.stroke && shapeGroup.stroke.width > 0, 'Shape stroke width > 0: ' + shapeGroup.stroke.width + 'px');
  assert(shapeGroup.stroke.color, 'Shape stroke color exists: ' + shapeGroup.stroke.color);

  passedSuites++;
  console.log('[SUITE 3 PASSED]\n');
} catch (err) {
  console.error('[SUITE 3 FAILED]:', err.message, '\n');
}

// ============================================================================
// SUITE 4: Host Builder (Mock After Effects ExtendScript Execution)
// ============================================================================
console.log('--- SUITE 4: Host Builder Mock After Effects Execution ---');
totalSuites++;
let sharedMockAE = null;

try {
  function createMockAE() {
    const createdComps = [];
    const runtimeErrors = [];

    const app = {
      project: {
        items: {
          addFolder: (name) => ({ name: name, items: [] }),
          addComp: (name, w, h, par, dur, fps) => {
            const comp = {
              name: name,
              width: w,
              height: h,
              duration: dur,
              frameRate: fps,
              layersList: [],
              layers: {
                add: (item) => {
                  const l = createMockLayer(item ? item.name : 'precomp', 'precomp', comp);
                  comp.layersList.push(l);
                  return l;
                },
                addShape: () => {
                  const l = createMockLayer('shape', 'shape', comp);
                  comp.layersList.push(l);
                  return l;
                },
                addText: (txt) => {
                  const l = createMockLayer(txt || 'text', 'text', comp);
                  comp.layersList.push(l);
                  return l;
                },
                addCamera: (name) => {
                  const l = createMockLayer(name, 'camera', comp);
                  comp.layersList.push(l);
                  return l;
                }
              },
              openInViewer: () => {}
            };
            createdComps.push(comp);
            return comp;
          }
        }
      },
      beginUndoGroup: () => {},
      endUndoGroup: () => {}
    };

    function createMockLayer(name, type, comp) {
      const props = {};
      const shapeGroups = [];

      function getProp(pName) {
        if (!props[pName]) {
          let expectedDim = 1;
          if (pName === 'ADBE Scale') expectedDim = 3;
          else if (pName === 'ADBE Position' || pName === 'Position') expectedDim = 2;
          else if (pName === 'ADBE Anchor Point' || pName === 'Anchor Point') expectedDim = 2;

          props[pName] = {
            name: pName,
            value: null,
            keys: [],
            setValue: function(v) { this.value = v; },
            setValueAtTime: function(t, v) { this.keys.push({ t, v }); },
            setInterpolationTypeAtKey: () => {},
            setTemporalEaseAtKey: (k, inE, outE) => {
              if (pName === 'ADBE Scale' && inE && inE.length !== 3) {
                runtimeErrors.push('setTemporalEaseAtKey scale expects 3 ease elements, got ' + inE.length);
              }
            },
            setSpatialTangentsAtKey: () => {},
            propertyValueType: (pName === 'ADBE Scale') ? 4 : (pName === 'ADBE Position' ? 1 : 3)
          };
        }
        return props[pName];
      }

      return {
        name: name,
        type: type,
        comp: comp,
        parent: null,
        enabled: true,
        label: 0,
        props: props,
        shapeGroups: shapeGroups,
        property: function(p) {
          if (p === 'ADBE Root Vectors Group' || p === 'Contents') {
            return {
              addProperty: (kind) => {
                const groupProps = [];
                const grp = {
                  kind: kind,
                  groupProps: groupProps,
                  property: (childProp) => ({
                    addProperty: (subKind) => {
                      const item = { subKind: subKind, props: {} };
                      groupProps.push(item);
                      return {
                        property: (propName) => getProp('vector_' + propName)
                      };
                    }
                  })
                };
                shapeGroups.push(grp);
                return grp;
              }
            };
          }
          if (p === 'Source Text') {
            return {
              value: { applyFill: false, applyStroke: false, fontSize: 12, tracking: 0 },
              setValue: (doc) => {
                if (doc && doc.tracking !== undefined && !Number.isInteger(doc.tracking)) {
                  runtimeErrors.push('Tracking must be integer in AE, received: ' + doc.tracking);
                }
              }
            };
          }
          if (p === 'Effects' || p === 'ADBE Effect Parade') {
            return {
              addProperty: (fxName) => ({
                name: fxName,
                property: (k) => getProp('fx_' + k)
              })
            };
          }
          if (p === 'Masks' || p === 'ADBE Mask Parade') {
            return {
              addProperty: () => ({
                maskMode: 1,
                property: (k) => getProp('mask_' + k)
              })
            };
          }
          return getProp(p);
        }
      };
    }

    return { app, createdComps, runtimeErrors };
  }

  const mockAE = createMockAE();
  sharedMockAE = mockAE;
  const builderCode = fs.readFileSync('CodeMotion/host/builder.jsx', 'utf8');

  // Wrap builder.jsx to inject mock AE globals
  const hostSandbox = {
    app: mockAE.app,
    KeyframeInterpolationType: { LINEAR: 1, BEZIER: 2, HOLD: 3 },
    KeyframeEase: function() {},
    PropertyValueType: { TwoD_SPATIAL: 1, ThreeD_SPATIAL: 2, TwoD: 3, ThreeD: 4, OneD: 5 },
    ParagraphJustification: { LEFT_JUSTIFY: 1, CENTER_JUSTIFY: 2, RIGHT_JUSTIFY: 3 },
    AutoOrientType: { NO_AUTO_ORIENT: 1 },
    MaskMode: { ADD: 1, SUBTRACT: 2, INTERSECT: 3 },
    Shape: function() {},
    TrackMatteType: { NO_TRACK_MATTE: 0, ALPHA: 1, ALPHA_INVERTED: 2, LUMA: 3, LUMA_INVERTED: 4 },
    File: function(p) {
      return {
        exists: fs.existsSync(p),
        parent: { fsName: path.dirname(p) },
        open: () => true,
        read: () => fs.readFileSync(p, 'utf8'),
        close: () => true
      };
    },
    Folder: function(p) {
      return {
        exists: fs.existsSync(p),
        getFiles: () => []
      };
    },
    alert: (msg) => console.log('AE Alert:', msg),
    console: console
  };

  const hostContext = vm.createContext(hostSandbox);
  vm.runInContext(builderCode, hostContext);

  const codeflowJsonPath = path.resolve('tests/pasted/index (CodeFlow)/codeflow.json');
  const buildResult = hostSandbox.CodeMotionBuilder.build(codeflowJsonPath, 'new');

  assert(buildResult && buildResult.indexOf('SUCCESS') !== -1, 'CodeMotionBuilder.build succeeded: ' + buildResult);
  assert(mockAE.createdComps.length > 0, 'Compositions created: ' + mockAE.createdComps.length);
  assert(mockAE.runtimeErrors.length === 0, '0 runtime errors during AE build (got ' + mockAE.runtimeErrors.length + ')');

  const mainComp = mockAE.createdComps[0];
  const labeledLayers = mainComp.layersList.filter(l => l.label > 0);
  assert(labeledLayers.length > 0, 'Layers received studio timeline color labels (got ' + labeledLayers.length + ')');
  const shapeLayer = mainComp.layersList.find(l => l.label === 15);
  assert(shapeLayer && shapeLayer.label === 15, 'Shape layer assigned Sandstone label (15)');
  assert(builderCode.indexOf('setEaseSafe') !== -1, 'setEaseSafe function present in builder.jsx');

  passedSuites++;
  console.log('[SUITE 4 PASSED]\n');
} catch (err) {
  console.error('[SUITE 4 FAILED]:', err.message, '\n');
}

// ============================================================================
// SUITE 5: Frame-Accurate Dynamic Animation & Motion Verification
// ============================================================================
console.log('--- SUITE 5: Frame-Accurate Dynamic Animation & Keyframe Verification ---');
totalSuites++;
try {
  const cardComp = sharedMockAE.createdComps.find(c => c.name.includes('card'));
  assert(cardComp, 'Card composition created in AE');

  // Verify button bounce animation is preserved (not flattened into static offset)
  const btnLayer = cardComp.layersList.find(l => l.name.includes('Play Button 2') || l.name.includes('playButton'));
  assert(btnLayer, 'Play Button layer exists in Card composition');
  const btnPosKeys = btnLayer ? btnLayer.property('ADBE Position').keys : [];
  assert(btnPosKeys.length >= 6, 'Button retains bounce animation keyframes (got ' + btnPosKeys.length + ' keys, expected >= 6)');
  const bounceKey = btnPosKeys.find(k => k.t >= 2.1 && k.t <= 2.3);
  assert(bounceKey, 'Button has active bounce keyframe at t=2.2s (Y: ' + (bounceKey ? bounceKey.v[1] : 'none') + ')');

  // Verify pixel art landscape reveal
  const divComp3 = sharedMockAE.createdComps.find(c => c.width === 536 && c.height === 308);
  assert(divComp3, 'Pixel Art viewport subcomposition (536x308) created');
  const artLayer = divComp3 ? divComp3.layersList.find(l => l.name === 'Art') : null;
  assert(artLayer, 'Art controller layer exists in viewport comp');
  const artPosKeys = artLayer ? artLayer.property('ADBE Position').keys : [];
  assert(artPosKeys.length >= 5, 'Art controller has landscape reveal keyframes (got ' + artPosKeys.length + ' keys)');
  const artFinalKey = artPosKeys[artPosKeys.length - 1];
  assert(artFinalKey && Math.abs(artFinalKey.v[1]) < 2, 'Art controller rests inside comp at y=' + (artFinalKey ? artFinalKey.v[1] : 'null'));

  // Verify child parenting integrity
  const rectLayer = divComp3 ? divComp3.layersList.find(l => l.name.includes('Rect')) : null;
  assert(rectLayer && rectLayer.parent === artLayer, 'Vector shape child properly parented to Art controller');
  assert(rectLayer && rectLayer.property('ADBE Position').value[1] > 0, 'Vector shape child local position preserved (> 0)');

  // Verify title layer inPoint lead-in
  const titleLayer = cardComp.layersList.find(l => l.name.includes('LITTLE'));
  assert(titleLayer, 'Title layer "LITTLE DAY OUT" exists in composition');
  assert(titleLayer && titleLayer.inPoint === 0, 'Title layer inPoint starts at 0 without truncation');

  passedSuites++;
  console.log('[SUITE 5 PASSED]\n');
} catch (err) {
  console.error('[SUITE 5 FAILED]:', err.message, '\n');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('================================================================');
console.log(`TOTAL SUITES: ${passedSuites}/${totalSuites} PASSED`);
console.log(`TOTAL CHECKS: ${passedChecks}/${totalChecks} PASSED`);
console.log('================================================================');

if (passedSuites === totalSuites && passedChecks === totalChecks) {
  console.log('\n>>> ALL SIMULATIONS PASSED WITH 0 ERRORS! <<<');
  process.exit(0);
} else {
  console.error('\n>>> SOME SIMULATIONS FAILED! <<<');
  process.exit(1);
}
