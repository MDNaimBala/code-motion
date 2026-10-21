const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function capture() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.resolve(__dirname, 'chrome_cdp_profile');
  
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--window-size=340,560'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9333/json/version');
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    proc.kill();
    throw new Error('Chrome CDP failed to start');
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
  const targetId = target.result.targetId;

  const session = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.result.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 340,
    height: 560,
    deviceScaleFactor: 1,
    mobile: false
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, '../MotionFlow/client/index.html').replace(/\\/g, '/');
  await sendSession('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 1: Empty state
  const ss1 = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, 'ui_empty.png'), Buffer.from(ss1.result.data, 'base64'));
  console.log('Saved scratch/ui_empty.png');

  // Trigger Loaded State
  const evalRes = await sendSession('Runtime.evaluate', {
    expression: `
      (function() {
        document.getElementById('empty').classList.add('hidden');
        document.getElementById('loaded').classList.remove('hidden');
        document.getElementById('targetBox').classList.remove('hidden');
        document.getElementById('buildBox').classList.remove('hidden');
        document.getElementById('result').classList.remove('hidden');

        document.getElementById('fname').textContent = 'fintech-card-3scenes.html';
        document.getElementById('fdir').textContent = 'custom-test/fintech-card-3scenes.html';
        document.getElementById('sComps').textContent = '20';
        document.getElementById('sLayers').textContent = '92';
        document.getElementById('sDur').textContent = '9.0s';

        const fontsRow = document.getElementById('fontsRow');
        fontsRow.innerHTML = '<span class="ic">F</span> <span>Fonts: <b>Outfit, Inter, Space Grotesk</b></span>';
        fontsRow.classList.remove('hidden');

        const logEl = document.getElementById('log');
        logEl.innerHTML = '<div class="info">Trace complete: 20 comps, 92 layers, 481 keys</div><div class="ok">Fonts verified & installed.</div><div class="ok">Ready to build into After Effects.</div>';
        document.getElementById('statusFoot').textContent = 'Ready to build';
        return 'OK';
      })()
    `
  });
  console.log('Evaluate result:', JSON.stringify(evalRes));

  await new Promise(r => setTimeout(r, 400));

  // Screenshot 2: Loaded state
  const ss2 = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, 'ui_loaded.png'), Buffer.from(ss2.result.data, 'base64'));
  console.log('Saved scratch/ui_loaded.png');

  ws.close();
  proc.kill();
}

capture().catch(console.error);
