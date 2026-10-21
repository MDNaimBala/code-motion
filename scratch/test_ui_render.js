const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testUI() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 340, height: 600 });

  const errors = [];
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => {
    // Expected in standalone browser without node integration
    console.log('PAGE ERROR (expected without CEF node):', err.message);
  });

  const indexPath = path.resolve(__dirname, '../MotionFlow/client/index.html');
  await page.goto('file:///' + indexPath.replace(/\\/g, '/'), { waitUntil: 'load' });

  // Take a screenshot of the empty state
  const ssEmpty = path.resolve(__dirname, 'ui_empty_state.png');
  await page.screenshot({ path: ssEmpty });
  console.log('Empty state screenshot saved:', ssEmpty);

  // Now simulate loaded state by toggling classes
  await page.evaluate(() => {
    document.getElementById('empty').classList.add('hidden');
    document.getElementById('loaded').classList.remove('hidden');
    document.getElementById('targetBox').classList.remove('hidden');
    document.getElementById('buildBox').classList.remove('hidden');
    document.getElementById('result').classList.remove('hidden');

    document.getElementById('fname').textContent = 'fintech-card-3scenes.html';
    document.getElementById('fdir').textContent = 'D:/Codes/00 Playground/14 Code flow extention/custom-test';
    document.getElementById('sComps').textContent = '20';
    document.getElementById('sLayers').textContent = '92';
    document.getElementById('sDur').textContent = '9s';

    const fontsRow = document.getElementById('fontsRow');
    fontsRow.innerHTML = '<span class="ic">F</span> <span>Fonts: <b>Outfit, Inter, Space Grotesk</b></span>';
    fontsRow.classList.remove('hidden');

    const logEl = document.getElementById('log');
    logEl.innerHTML = `
      <div class="info">Opening in Chrome: fintech-card-3scenes.html</div>
      <div class="info">Tracing 3 scenes: 20 comps, 92 layers, 481 keys</div>
      <div class="ok">Conversion completed in 6.9s.</div>
      <div class="ok">Verified / installed 3 fonts for After Effects.</div>
      <div class="ok">Ready to build into After Effects.</div>
    `;
    document.getElementById('statusFoot').textContent = 'Ready to build';
  });

  const ssLoaded = path.resolve(__dirname, 'ui_loaded_state.png');
  await page.screenshot({ path: ssLoaded });
  console.log('Loaded state screenshot saved:', ssLoaded);

  await browser.close();
}

testUI().catch(console.error);
