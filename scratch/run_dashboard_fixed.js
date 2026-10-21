const fs = require('fs');
const path = require('path');
const conv = require('../CodeMotion/client/trace/converter.js');

const mdContent = fs.readFileSync('userpastedcode.md', 'utf8');
const htmlPath = path.resolve('scratch/dashboard_fixed.html');
fs.writeFileSync(htmlPath, mdContent, 'utf8');

async function test() {
  console.log('Testing dashboard_fixed.html...');
  const res = await conv.convertHtml(htmlPath, {
    duration: 5,
    fps: 30,
    onStatus: (s) => console.log('Status:', s)
  });
  console.log('Finished!');
  const jsonPath = res.open;
  console.log('JSON Path:', jsonPath);
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('\n--- COMP LAYERS ---');
    data.comps[0].layers.forEach(l => {
      let extra = '';
      if (l.type === 'shape') {
        const k = l.shapes && l.shapes[0] ? l.shapes[0].kind : 'unknown';
        extra = `(shape: ${k})`;
      } else if (l.type === 'text') {
        extra = `(text: "${l.text ? (l.text.text || l.text.content) : ''}")`;
      }
      console.log(`Layer: "${l.name}" | Type: ${l.type} ${extra}`);
    });
  }
}
test();
