const fs = require('fs');

// 1. Test parseHtmlEffects logic
const html = `
<!DOCTYPE html>
<html>
<body>
  <div id="hero-glow" data-ae-effect="Deep Glow" class="glow-box"></div>
  <div data-name="badge-card" data-ae-effect="Sapphire Glow" class="badge"></div>
  <div class="custom-card" data-plugin="Particular"></div>
</body>
</html>
`;

function parseHtmlEffects(html) {
  const map = {};
  if (!html || typeof html !== 'string') return map;
  const tagRegex = /<([a-zA-Z0-9_-]+)[^>]*(?:data-ae-effect|data-plugin)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = tagRegex.exec(html)) !== null) {
    const fullTag = m[0];
    const effName = m[2];
    const idMatch = /id\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    const dataNameMatch = /(?:data-name|data-ae-name)\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    const classMatch = /class\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    if (idMatch) {
      map[idMatch[1]] = effName;
      map['#' + idMatch[1]] = effName;
    }
    if (dataNameMatch) {
      const clean = dataNameMatch[1].replace(/[^a-zA-Z0-9_-]+/g, '-');
      map[dataNameMatch[1]] = effName;
      map[clean] = effName;
      map['#' + clean] = effName;
    }
    if (classMatch) {
      classMatch[1].trim().split(/\s+/).forEach(c => {
        if (c) {
          map['.' + c] = effName;
          map[c + '-fx'] = effName;
        }
      });
    }
  }
  return map;
}

const effectsMap = parseHtmlEffects(html);
console.log('1. Extracted Effects Map:', JSON.stringify(effectsMap, null, 2));

// Assertions for Map
if (effectsMap['#hero-glow'] !== 'Deep Glow') throw new Error('Missing #hero-glow');
if (effectsMap['#badge-card'] !== 'Sapphire Glow') throw new Error('Missing #badge-card');
if (effectsMap['.custom-card'] !== 'Particular') throw new Error('Missing .custom-card');

// 2. Test Layer Matching logic
const mockLayers = [
  { id: 'l1', name: '#hero-glow.glow-box' },
  { id: 'l2', name: '#badge-card.badge' },
  { id: 'l3', name: '.custom-card' },
  { id: 'l4', name: 'unrelated-layer' }
];

mockLayers.forEach(l => {
  for (const k in effectsMap) {
    if (l.name && (l.name === k || l.name.indexOf(k) !== -1 || (l.id && l.id === k))) {
      l.aeEffect = effectsMap[k];
      break;
    }
  }
});

console.log('2. Mapped Layers:', JSON.stringify(mockLayers, null, 2));
if (mockLayers[0].aeEffect !== 'Deep Glow') throw new Error('Failed to attach Deep Glow');
if (mockLayers[1].aeEffect !== 'Sapphire Glow') throw new Error('Failed to attach Sapphire Glow');
if (mockLayers[2].aeEffect !== 'Particular') throw new Error('Failed to attach Particular');
if (mockLayers[3].aeEffect !== undefined) throw new Error('Unrelated layer got effect!');

// 3. Test Warning Parser in evalScript callback
const mockBuildResultWithWarnings = 'SUCCESS: Built 1 compositions successfully!||WARNINGS:Plugin \'Deep Glow\' not installed in AE (fallback applied for \'#hero-glow\');;Layer \'text-badge\' skipped unsupported effect \'twirl\'';
const parts = mockBuildResultWithWarnings.split('||WARNINGS:');
const mainMsg = parts[0];
const warnings = parts[1] ? parts[1].split(';;') : [];

console.log('3. Unpacked Result:');
console.log('   Main:', mainMsg);
console.log('   Warnings:', warnings);

if (warnings.length !== 2) throw new Error('Expected 2 warnings');
if (!warnings[0].includes('Deep Glow')) throw new Error('Expected Deep Glow warning');
if (!warnings[1].includes('twirl')) throw new Error('Expected twirl warning');

console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
