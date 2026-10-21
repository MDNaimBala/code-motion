const path = require('path');
const fs = require('fs');
const conv = require('../CodeMotion/client/trace/converter.js');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    #stage {
      position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; margin: -540px 0 0 -960px;
      background: #3b82f6;
    }
    .panel { position: absolute; background: #fff; border-radius: 20px; }
    .button-one { left: 100px; top: 100px; width: 200px; height: 80px; display: flex; align-items: center; justify-content: center; }
    .button-two { left: 350px; top: 100px; width: 240px; height: 80px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .button-heart { left: 630px; top: 100px; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
    .heart { color: #ff8258; font-size: 32px; }
    .star { color: #f6c945; font-size: 32px; }
    .rank-card { left: 800px; top: 100px; width: 250px; height: 250px; padding: 20px; }
  </style>
</head>
<body>
  <div id="stage">
    <div class="panel button button-one" data-name="Button One">Button</div>
    <div class="panel button button-two" data-name="Button with Heart">
      <span class="heart" aria-hidden="true">♥</span><span>Button</span>
    </div>
    <div class="panel button button-heart" data-name="Heart Button">
      <span class="heart" aria-hidden="true">♥</span>
    </div>
    <div class="panel rank-card" data-name="Ranks Card">
      <h2 class="card-label" data-name="Ranks Label">Ranks</h2>
      <div class="rank-content">
        <span class="star" data-name="Rank Star" aria-hidden="true">★</span>
        <span class="rank-value" data-name="Rank Value">4,8</span>
      </div>
    </div>
  </div>
</body>
</html>`;

const testHtmlPath = path.resolve('scratch/test_heart_star.html');
fs.writeFileSync(testHtmlPath, html, 'utf8');

async function run() {
  console.log('Running convertHtml on test_heart_star.html...');
  try {
    const res = await conv.convertHtml(testHtmlPath, {
      duration: 5,
      fps: 30,
      onStatus: (s) => console.log('Status:', s)
    });
    console.log('Finished convertHtml.');
    const jsonPath = res.open;
    console.log('Result JSON Path:', jsonPath);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('Layers in comp:');
      data.comps[0].layers.forEach(l => {
        console.log(`- Layer: "${l.name}" | Type: ${l.type} | Text: ${l.text ? JSON.stringify(l.text.text || l.text.content) : 'N/A'}`);
      });
    }
  } catch(e) {
    console.error('Error running convertHtml:', e);
  }
}
run();
