const path = require('path');
const fs = require('fs');
const conv = require('../CodeMotion/client/trace/converter.js');

const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    #stage { width: 1080px; height: 1080px; background: #0f172a; position: absolute; }
    .box { position: absolute; left: 100px; top: 100px; width: 200px; height: 200px; background: #38bdf8; border-radius: 20px; }
    h1 { position: absolute; left: 100px; top: 350px; color: white; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="stage">
    <div class="box"></div>
    <h1>Pure Static Title</h1>
  </div>
</body>
</html>`;

fs.writeFileSync('scratch/pure_static.html', html);

async function test() {
  const target = path.resolve('scratch/pure_static.html');
  console.log('Testing pure static with { duration: 5 } option in convertHtml...');
  try {
    const res = await conv.convertHtml(target, {
      duration: 5,
      fps: 30,
      onStatus: (s) => console.log('Status:', s)
    });
    console.log('SUCCESS! Report:', res.report);
    console.log('Output JSON:', res.open);
  } catch(e) {
    console.error('Failed:', e.message);
  }
}
test();
