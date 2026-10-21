const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function capture() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.resolve(__dirname, 'chrome_cdp_profile2');
  
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--user-data-dir=' + userDataDir,
    '--disable-gpu',
    '--window-size=1920,1080'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9444/json/version');
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
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, '../tests/pasted/index.html').replace(/\\/g, '/');
  await sendSession('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 1000));

  const times = [
    { t: 0.7333, file: 'html_00_22.png' },
    { t: 1.9333, file: 'html_01_28.png' }
  ];

  for (const item of times) {
    await sendSession('Runtime.evaluate', {
      expression: 'window.seek(' + item.t + ');'
    });
    await new Promise(r => setTimeout(r, 300));
    const ss = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, item.file), Buffer.from(ss.result.data, 'base64'));
    console.log('Saved scratch/' + item.file);
  }

  ws.close();
  proc.kill();
  console.log('Finished capturing.');
}

capture().catch(err => console.error('Error:', err));
