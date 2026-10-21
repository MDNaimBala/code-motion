const fs = require('fs');
const path = require('path');
const { convertHtml } = require('../CodeMotion/client/trace/converter.js');

async function run() {
  const htmlContent = fs.readFileSync('userpastedcode.md', 'utf8');
  const targetDir = path.resolve('tests/pasted');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const htmlPath = path.join(targetDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  console.log('Starting conversion of userpastedcode.md...');
  const res = await convertHtml(htmlPath, {
    fps: 30,
    duration: 4.0,
    onStatus: (st) => console.log('STATUS:', st)
  });

  console.log('Conversion complete. Result:', res);
  const jsonPath = path.join(targetDir, 'index (CodeFlow)', 'codeflow.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('\n--- COMPS & LAYERS ---');
    data.comps.forEach(c => {
      console.log(`Comp: "${c.name}" (${c.w}x${c.h}, dur: ${c.duration}s, layers: ${c.layers ? c.layers.length : 0})`);
      if (c.layers) {
        c.layers.forEach((l, idx) => {
          console.log(`  [${idx}] "${l.name}" (type: ${l.type}, in: ${l.in}, out: ${l.out})`);
          if (l.transform) {
            const pos = l.transform.position;
            const sc = l.transform.scale;
            const op = l.transform.opacity;
            console.log(`       pos keys: ${pos && pos.k ? pos.k.length : 'static'}`);
            console.log(`       scale keys: ${sc && sc.k ? sc.k.length : 'static'}`);
            console.log(`       opacity keys: ${op && op.k ? op.k.length : 'static'}`);
          }
          if (l.masks && l.masks.length > 0) {
            console.log(`       masks: ${l.masks.length}`);
          }
        });
      }
    });
  } else {
    console.log('codeflow.json not found at:', jsonPath);
  }
}

run().catch(err => console.error('ERROR:', err));
