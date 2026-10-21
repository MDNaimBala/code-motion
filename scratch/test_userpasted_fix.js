const path = require('path');
const fs = require('fs');
const conv = require('../CodeMotion/client/trace/converter.js');

const target = path.resolve('userpastedcode.md');
console.log('Testing convertHtml on updated userpastedcode.md...');

async function run() {
  try {
    const res = await conv.convertHtml(target, {
      duration: 5,
      fps: 30,
      onStatus: (s) => console.log('Status:', s)
    });
    console.log('Finished convertHtml successfully!');
    const jsonPath = res.open;
    console.log('Output JSON:', jsonPath);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('\n--- EXTRACTED COMP LAYERS ---');
      data.comps[0].layers.forEach(l => {
        let details = '';
        if (l.type === 'shape' && l.shapes && l.shapes[0]) {
          details = `[Shape: kind=${l.shapes[0].kind}, name=${l.shapes[0].name}]`;
        } else if (l.type === 'text') {
          details = `[Text: "${l.text.text || l.text.content}"]`;
        }
        console.log(`- Layer: "${l.name}" | Type: ${l.type} ${details}`);
      });
    }
  } catch(e) {
    console.error('Conversion failed:', e);
  }
}

run();
