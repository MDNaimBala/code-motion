const fs = require('fs');
const path = require('path');

function isHtmlCode(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.indexOf('<!DOCTYPE') === 0 || trimmed.indexOf('<!doctype') === 0) return true;
  return /<[a-z!][\s\S]*>/i.test(trimmed);
}

function ensureFullHtmlDocument(rawCode) {
  const code = rawCode.trim();
  if (code.indexOf('<html') !== -1 || code.indexOf('<!DOCTYPE') !== -1 || code.indexOf('<!doctype') !== -1) {
    return code;
  }
  return '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>\n    body { margin: 0; background: #0b0f19; font-family: sans-serif; }\n  </style>\n</head>\n<body>\n' + code + '\n</body>\n</html>';
}

console.log('--- Testing isHtmlCode ---');
console.log('1. Full HTML:', isHtmlCode('<!DOCTYPE html><html><body>Hi</body></html>')); // true
console.log('2. Div Snippet:', isHtmlCode('<div id="stage"><div class="card">Card</div></div>')); // true
console.log('3. SVG:', isHtmlCode('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>')); // true
console.log('4. File path:', isHtmlCode('D:\\Codes\\test.html')); // false
console.log('5. Regular text:', isHtmlCode('Just some notes')); // false

console.log('\n--- Testing ensureFullHtmlDocument ---');
const snippet = '<div id="stage" style="width:1080px;height:1080px;background:#111;"><h1 style="color:#fff;">Pasted Title</h1></div>';
const full = ensureFullHtmlDocument(snippet);
console.log('Wrapped output preview:\n', full.slice(0, 120), '...');

// Ensure tests/pasted directory
const pastedDir = path.resolve('tests/pasted');
if (!fs.existsSync(pastedDir)) fs.mkdirSync(pastedDir, { recursive: true });
const targetFile = path.join(pastedDir, 'index.html');
fs.writeFileSync(targetFile, full, 'utf8');
console.log('\nSuccessfully saved pasted HTML to:', targetFile);
console.log('Exists:', fs.existsSync(targetFile));
