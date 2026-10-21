// Code Motion - Client Controller
window.onerror = function(msg, url, line) {
  console.error('Code Motion UI Error:', msg, 'at line', line);
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'color:#ff6b6b;background:#2d1515;padding:10px;border-radius:8px;font-size:11px;margin:8px 0;word-break:break-word;border:1px solid #ff4444;';
  errDiv.textContent = 'Script Error: ' + msg + ' (line ' + line + ')';
  document.body.prepend(errDiv);
};

// F5 and Ctrl+R panel reload support
window.addEventListener('keydown', function(e) {
  if (e.key === 'F5' || e.keyCode === 116 || (e.ctrlKey && (e.key === 'r' || e.keyCode === 82))) {
    e.preventDefault();
    window.location.reload();
  }
});

const isNode = typeof require !== 'undefined';
const fs = isNode ? require('fs') : null;
const path = isNode ? require('path') : {
  basename: (p) => p.split(/[\\/]/).pop(),
  dirname: (p) => p.substring(0, Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))),
  extname: (p) => { const b = p.split(/[\\/]/).pop(); const i = b.lastIndexOf('.'); return i >= 0 ? b.slice(i) : ''; },
  join: (...args) => args.join('/')
};

// Prevent CEF from navigating to the dropped file url
window.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

window.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0].path);
  }
}, false);

document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

document.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
}, false);

let csInterface = null;
let extensionPath = '';
let convertHtml = null;
let findBrowser = null;
let installFonts = null;

try {
  if (typeof CSInterface !== 'undefined') {
    csInterface = new CSInterface();
    extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
  }
} catch (e) {
  console.warn('CSInterface init warning:', e);
}

if (isNode) {
  try {
    let baseExt = extensionPath;
    if (!baseExt || !fs.existsSync(path.join(baseExt, 'client', 'trace', 'converter.js'))) {
      const candidates = [
        extensionPath,
        typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : null,
        typeof __dirname !== 'undefined' ? path.resolve(__dirname) : null,
        path.resolve('./CodeMotion'),
        path.resolve('.')
      ].filter(Boolean);
      for (const c of candidates) {
        if (fs.existsSync(path.join(c, 'client', 'trace', 'converter.js'))) {
          baseExt = c;
          break;
        } else if (fs.existsSync(path.join(c, 'trace', 'converter.js'))) {
          baseExt = path.resolve(c, '..');
          break;
        }
      }
    }
    const converterPath = path.join(baseExt || extensionPath || '.', 'client', 'trace', 'converter.js');
    if (fs.existsSync(converterPath)) {
      const convMod = require(converterPath);
      convertHtml = convMod.convertHtml;
      findBrowser = convMod.findBrowser;
    }
    const fontsPath = path.join(baseExt || extensionPath || '.', 'client', 'fonts.js');
    if (fs.existsSync(fontsPath)) {
      const fontsMod = require(fontsPath);
      installFonts = fontsMod.installFonts;
    }
  } catch (e) {
    console.warn('Module require warning:', e);
  }
}

// DOM Elements
const emptyEl = document.getElementById('empty');
const dropEl = document.getElementById('drop');
const openBtn = document.getElementById('open');
const pasteBtn = document.getElementById('pasteBtn');
const pasteDrawer = document.getElementById('pasteDrawer');
const pasteArea = document.getElementById('pasteArea');
const submitPasteBtn = document.getElementById('submitPasteBtn');
const cancelPasteBtn = document.getElementById('cancelPasteBtn');
const closePasteBtn = document.getElementById('closePasteBtn');
const loadedEl = document.getElementById('loaded');
const fnameEl = document.getElementById('fname');
const fdirEl = document.getElementById('fdir');
const fwhereEl = document.getElementById('fwhere');
const sCompsEl = document.getElementById('sComps');
const sLayersEl = document.getElementById('sLayers');
const sDurEl = document.getElementById('sDur');
const fontsRowEl = document.getElementById('fontsRow');
const targetBoxEl = document.getElementById('targetBox');
const tNewBtn = document.getElementById('tNew');
const tActiveBtn = document.getElementById('tActive');
const tHintEl = document.getElementById('tHint');
const buildBoxEl = document.getElementById('buildBox');
const buildBtn = document.getElementById('build');
const clearBtn = document.getElementById('clear');
const resultEl = document.getElementById('result');
const logEl = document.getElementById('log');
const statusFootEl = document.getElementById('statusFoot');

let currentJsonPath = null;
let currentFolder = null;
let targetMode = 'new'; // 'new' | 'active'

function log(msg, type = 'info') {
  if (resultEl.classList.contains('hidden')) {
    resultEl.classList.remove('hidden');
  }
  const line = document.createElement('div');
  line.className = type;
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = '';
  resultEl.classList.add('hidden');
}

// Target Mode Toggles
tNewBtn.addEventListener('click', () => {
  targetMode = 'new';
  tNewBtn.classList.add('sel');
  tActiveBtn.classList.remove('sel');
  tHintEl.textContent = 'Creates its own comps in the project. Your other comps are left alone.';
});

tActiveBtn.addEventListener('click', () => {
  targetMode = 'active';
  tActiveBtn.classList.add('sel');
  tNewBtn.classList.remove('sel');
  tHintEl.textContent = 'Builds the main animation directly into your currently selected After Effects composition.';
});

// Drop zone hover states
dropEl.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropEl.classList.add('hot');
});

dropEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropEl.classList.add('hot');
});

dropEl.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropEl.classList.remove('hot');
});

dropEl.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropEl.classList.remove('hot');
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0].path);
  }
});

openBtn.addEventListener('click', () => {
  // 1. Try CEP native file dialog if running in Adobe CEP
  if (window.cep && window.cep.fs) {
    try {
      const showDialog = window.cep.fs.showOpenDialogEx || window.cep.fs.showOpenDialog;
      if (typeof showDialog === 'function') {
        const res = showDialog(false, false, 'Select HTML or CodeFlow file', '', ['html', 'htm', 'json', 'codeflow']);
        if (res && res.data && res.data.length > 0) {
          handleFile(res.data[0]);
          return;
        }
      }
    } catch (e) {
      console.warn('CEP file dialog warning:', e);
    }
  }

  // 2. Reliable DOM file input fallback (attached to body so CEF doesn't block it)
  let input = document.getElementById('cmHiddenFileInput');
  if (!input) {
    input = document.createElement('input');
    input.id = 'cmHiddenFileInput';
    input.type = 'file';
    input.accept = '.html,.htm,.json,.codeflow';
    input.style.display = 'none';
    document.body.appendChild(input);
  }
  input.value = '';
  input.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      handleFile(f.path || f.name);
    }
  };
  input.click();
});

fwhereEl.addEventListener('click', () => {
  if (currentFolder) {
    require('child_process').exec(`explorer.exe "${currentFolder}"`);
  }
});

clearBtn.addEventListener('click', () => {
  resetUI();
});

function resetUI() {
  currentJsonPath = null;
  currentFolder = null;
  emptyEl.classList.remove('hidden');
  if (pasteDrawer) pasteDrawer.classList.add('hidden');
  loadedEl.classList.add('hidden');
  targetBoxEl.classList.add('hidden');
  buildBoxEl.classList.add('hidden');
  clearLog();
  statusFootEl.textContent = 'Ready';
}

function isHtmlCode(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.indexOf('<!DOCTYPE') === 0 || trimmed.indexOf('<!doctype') === 0) return true;
  return /<[a-z!][\s\S]*>/i.test(trimmed);
}

let lastEffectsMap = {};
let lastTrimsMap = {};

function parseTrimValue(val) {
  if (!val) return null;
  val = String(val).trim();
  const parts = val.split(/[,\s]+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
  if (parts.length >= 2) {
    return {
      start: parts[0],
      end: parts[1],
      offset: parts[2] !== undefined ? parts[2] : 0
    };
  } else if (parts.length === 1) {
    return {
      start: 0,
      end: parts[0],
      offset: 0
    };
  }
  return null;
}

function parseHtmlTrims(html) {
  const map = {};
  if (!html || typeof html !== 'string') return map;
  const tagRegex = /<([a-zA-Z0-9_-]+)[^>]*(?:data-ae-trim|data-trim)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = tagRegex.exec(html)) !== null) {
    const fullTag = m[0];
    const trimObj = parseTrimValue(m[2]);
    if (!trimObj) continue;
    const idMatch = /id\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    const dataNameMatch = /(?:data-name|data-ae-name)\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    const classMatch = /class\s*=\s*["']([^"']+)["']/i.exec(fullTag);
    if (idMatch) {
      map[idMatch[1]] = trimObj;
      map['#' + idMatch[1]] = trimObj;
    }
    if (dataNameMatch) {
      const clean = dataNameMatch[1].replace(/[^a-zA-Z0-9_-]+/g, '-');
      map[dataNameMatch[1]] = trimObj;
      map[clean] = trimObj;
      map['#' + clean] = trimObj;
    }
    if (classMatch) {
      classMatch[1].trim().split(/\s+/).forEach(c => {
        if (c) {
          map['.' + c] = trimObj;
        }
      });
    }
  }
  return map;
}

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

function ensureFullHtmlDocument(rawCode) {
  const code = rawCode.trim();
  const nameScript = '\n<script>\n  document.querySelectorAll("[data-name],[data-ae-name],[data-ae-effect],[data-plugin],[data-ae-trim],[data-trim]").forEach(function(el) {\n    var n = el.getAttribute("data-name") || el.getAttribute("data-ae-name");\n    if (n && !el.id) {\n      el.id = n.replace(/[^a-zA-Z0-9_-]+/g, "-");\n    } else if (!el.id && (el.getAttribute("data-ae-effect") || el.getAttribute("data-plugin") || el.getAttribute("data-ae-trim") || el.getAttribute("data-trim"))) {\n      var base = el.className ? el.className.trim().split(/\\s+/)[0] : "layer";\n      el.id = base.replace(/[^a-zA-Z0-9_-]+/g, "-") + "-fx";\n    }\n  });\n</script>\n';
  if (code.indexOf('<html') !== -1 || code.indexOf('<!DOCTYPE') !== -1 || code.indexOf('<!doctype') !== -1) {
    if (code.indexOf('data-name') !== -1 || code.indexOf('data-ae-name') !== -1 || code.indexOf('data-ae-effect') !== -1 || code.indexOf('data-plugin') !== -1 || code.indexOf('data-ae-trim') !== -1 || code.indexOf('data-trim') !== -1) {
      if (code.indexOf('</body>') !== -1) {
        return code.replace('</body>', nameScript + '</body>');
      }
      return code + nameScript;
    }
    return code;
  }
  // If it's a component or snippet, wrap in valid HTML document
  return '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>\n    body { margin: 0; background: #0b0f19; font-family: sans-serif; }\n  </style>\n</head>\n<body>\n' + code + nameScript + '</body>\n</html>';
}

function getPastedHtmlPath(rawCode) {
  let baseDir = null;
  try {
    if (isNode) {
      let realExtPath = extensionPath;
      try {
        if (fs.existsSync(extensionPath) && fs.lstatSync(extensionPath).isSymbolicLink()) {
          realExtPath = fs.realpathSync(extensionPath);
        }
      } catch(e) {}

      const candidates = [
        realExtPath,
        extensionPath,
        typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : null,
        typeof __dirname !== 'undefined' ? path.resolve(__dirname) : null,
        path.resolve('./CodeMotion'),
        path.resolve('.')
      ].filter(Boolean);

      for (const base of candidates) {
        if (fs.existsSync(base)) {
          const wsTests = path.resolve(base, '..', 'tests', 'pasted');
          if (fs.existsSync(path.resolve(base, '..', 'tests'))) {
            baseDir = wsTests;
            break;
          }
        }
      }
    }
  } catch(e) {}

  if (!baseDir) {
    baseDir = path.join(extensionPath || '.', 'temp', 'pasted');
  }

  try { fs.mkdirSync(baseDir, { recursive: true }); } catch(e) {}

  // Generate unique build session folder so previous comp assets in AE are NEVER overwritten or lost
  let title = 'index';
  if (rawCode) {
    const tMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(rawCode);
    if (tMatch && tMatch[1]) {
      const cleanT = tMatch[1].trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
      if (cleanT && cleanT !== 'index' && cleanT.length > 2) {
        title = cleanT;
      }
    }
  }

  // Isolated session directory: tests/pasted/builds/<title>_<timestamp>/
  const buildsDir = path.join(baseDir, 'builds');
  try { fs.mkdirSync(buildsDir, { recursive: true }); } catch(e) {}

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const sessionDir = path.join(buildsDir, `${title}_${timestamp}`);
  try { fs.mkdirSync(sessionDir, { recursive: true }); } catch(e) {}

  return path.join(sessionDir, `${title}.html`);
}

async function handlePastedHtml(rawCode) {
  if (!rawCode || !rawCode.trim()) return;
  lastEffectsMap = parseHtmlEffects(rawCode);
  lastTrimsMap = parseHtmlTrims(rawCode);
  const fullHtml = ensureFullHtmlDocument(rawCode);
  const targetPath = getPastedHtmlPath(rawCode);
  try {
    if (isNode) {
      fs.writeFileSync(targetPath, fullHtml, 'utf8');

      // Also mirror to legacy tests/pasted/index.html so existing fixed-path tests stay valid
      try {
        const legacyPath = path.resolve(path.dirname(targetPath), '..', '..', 'index.html');
        if (legacyPath !== targetPath && fs.existsSync(path.dirname(legacyPath))) {
          fs.writeFileSync(legacyPath, fullHtml, 'utf8');
        }
      } catch(e) {}

      if (pasteDrawer) pasteDrawer.classList.add('hidden');
      log('Detected pasted HTML. Saved to: ' + targetPath, 'info');
      handleFile(targetPath);
    }
  } catch(err) {
    log('Error saving pasted HTML: ' + err.message, 'bad');
  }
}

// Global Paste Event (Ctrl + V anywhere on panel)
window.addEventListener('paste', (e) => {
  // If actively typing inside the paste text area, let standard paste happen
  if (e.target && e.target === pasteArea) return;

  const pastedText = (e.clipboardData || window.clipboardData).getData('text');
  if (pastedText && isHtmlCode(pastedText)) {
    e.preventDefault();
    handlePastedHtml(pastedText);
  }
});

// Paste Code Button Click
if (pasteBtn) {
  pasteBtn.addEventListener('click', async () => {
    let clipText = null;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        clipText = await navigator.clipboard.readText();
      }
    } catch(e) {}

    if (!clipText && isNode) {
      try {
        const { execSync } = require('child_process');
        clipText = execSync('powershell -NoProfile -Command "Get-Clipboard"', { encoding: 'utf8' }).trim();
      } catch(e) {}
    }

    if (clipText && isHtmlCode(clipText)) {
      handlePastedHtml(clipText);
    } else {
      emptyEl.classList.add('hidden');
      pasteDrawer.classList.remove('hidden');
      pasteArea.value = clipText || '';
      pasteArea.focus();
    }
  });
}

function closeDrawer() {
  if (pasteDrawer) pasteDrawer.classList.add('hidden');
  emptyEl.classList.remove('hidden');
}

if (cancelPasteBtn) cancelPasteBtn.addEventListener('click', closeDrawer);
if (closePasteBtn) closePasteBtn.addEventListener('click', closeDrawer);

if (submitPasteBtn) {
  submitPasteBtn.addEventListener('click', () => {
    const code = pasteArea.value;
    if (!code || !code.trim()) {
      log('Please paste or type HTML code first.', 'bad');
      return;
    }
    handlePastedHtml(code);
  });
}

async function handleFile(filePath) {
  clearLog();
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.html' || ext === '.htm') {
    log('Opening in Chrome: ' + path.basename(filePath));
    statusFootEl.textContent = 'Converting HTML in Chrome...';

    // Show loaded card with live progress
    emptyEl.classList.add('hidden');
    loadedEl.classList.remove('hidden');
    targetBoxEl.classList.add('hidden');
    buildBoxEl.classList.add('hidden');
    fnameEl.textContent = path.basename(filePath);
    fdirEl.textContent = 'Converting...';
    sCompsEl.textContent = '...';
    sLayersEl.textContent = '...';
    sDurEl.textContent = '...';

    let conversionPath = filePath;
    let tempPathToClean = null;

    try {
      // Auto-fallback: if the HTML is purely static and defines no DURATION, default to 5s comp
      let staticDuration = undefined;
      try {
        if (fs && fs.existsSync(filePath)) {
          const src = fs.readFileSync(filePath, 'utf8');
          lastEffectsMap = parseHtmlEffects(src);
          lastTrimsMap = parseHtmlTrims(src);
          if (!/DURATION\s*[:=]/.test(src)) {
            staticDuration = 5;
          }

          // If the HTML uses data-name, data-ae-name, data-ae-effect, or data-ae-trim, ensure elements receive clean IDs for Chrome tracing
          const hasDataAttrs = src.indexOf('data-name') !== -1 || src.indexOf('data-ae-name') !== -1 || src.indexOf('data-ae-effect') !== -1 || src.indexOf('data-plugin') !== -1 || src.indexOf('data-ae-trim') !== -1 || src.indexOf('data-trim') !== -1;
          if (hasDataAttrs && src.indexOf('[data-name]') === -1) {
            const nameScript = '\n<script>\n  document.querySelectorAll("[data-name],[data-ae-name],[data-ae-effect],[data-plugin],[data-ae-trim],[data-trim]").forEach(function(el) {\n    var n = el.getAttribute("data-name") || el.getAttribute("data-ae-name");\n    if (n && !el.id) {\n      el.id = n.replace(/[^a-zA-Z0-9_-]+/g, "-");\n    } else if (!el.id && (el.getAttribute("data-ae-effect") || el.getAttribute("data-plugin") || el.getAttribute("data-ae-trim") || el.getAttribute("data-trim"))) {\n      var base = el.className ? el.className.trim().split(/\\s+/)[0] : "layer";\n      el.id = base.replace(/[^a-zA-Z0-9_-]+/g, "-") + "-fx";\n    }\n  });\n</script>\n';
            let modifiedSrc = src;
            if (src.indexOf('</body>') !== -1) {
              modifiedSrc = src.replace('</body>', nameScript + '</body>');
            } else {
              modifiedSrc = src + nameScript;
            }
            tempPathToClean = path.join(path.dirname(filePath), '._cm_trace_temp.html');
            fs.writeFileSync(tempPathToClean, modifiedSrc, 'utf8');
            conversionPath = tempPathToClean;
          }
        }
      } catch(e) {}

      const convOptions = {
        onStatus: (st) => {
          log(st);
          statusFootEl.textContent = st;
          fdirEl.textContent = st;
        },
        fps: 30
      };
      if (staticDuration) convOptions.duration = staticDuration;

      const res = await convertHtml(conversionPath, convOptions);

      if (res && res.open) {
        currentJsonPath = res.open;
        currentFolder = res.folder || path.dirname(res.open);
        displayLoadedData(currentJsonPath);
      } else {
        log('Conversion completed, but output file was not found.', 'bad');
      }
    } catch (err) {
      log('Error converting HTML: ' + err.message, 'bad');
      statusFootEl.textContent = 'Error';
      fdirEl.textContent = 'Failed: ' + err.message;
    } finally {
      if (tempPathToClean && fs && fs.existsSync(tempPathToClean)) {
        try { fs.unlinkSync(tempPathToClean); } catch(e) {}
      }
    }
  } else {
    // If it's a directory or codeflow json
    let targetJson = filePath;
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        targetJson = path.join(filePath, 'codeflow.json');
      }
    } catch(e) {}

    if (fs.existsSync(targetJson)) {
      currentJsonPath = targetJson;
      currentFolder = path.dirname(targetJson);
      displayLoadedData(currentJsonPath);
    } else {
      log('No codeflow.json found in: ' + filePath, 'bad');
    }
  }
}

function displayLoadedData(jsonPath) {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    fnameEl.textContent = data.name || path.basename(jsonPath);
    fdirEl.textContent = path.dirname(jsonPath);

    const compCount = (data.comps && data.comps.length) || 1;
    let layerCount = 0;
    let duration = 0;

    if (data.comps && data.comps.length > 0) {
      data.comps.forEach(c => {
        if (c.layers) layerCount += c.layers.length;
      });
      duration = data.comps[0].duration || 0;
    }

    let dirty = false;
    // Sanitize any extreme ramp scale coordinates and ensure matte anchor points match parent
    if (data.comps && data.comps.length > 0) {
      data.comps.forEach(c => {
        const layerMap = {};
        (c.layers || []).forEach(l => { if (l.id) layerMap[l.id] = l; });
        (c.layers || []).forEach(l => {
          if (!l.aeEffect && lastEffectsMap && Object.keys(lastEffectsMap).length > 0) {
            for (const k in lastEffectsMap) {
              if (l.name && (l.name === k || l.name.indexOf(k) !== -1 || (l.id && l.id === k))) {
                l.aeEffect = lastEffectsMap[k];
                dirty = true;
                break;
              }
            }
          }
          if (!l.trim && lastTrimsMap && Object.keys(lastTrimsMap).length > 0) {
            for (const k in lastTrimsMap) {
              if (l.name && (l.name === k || l.name.indexOf(k) !== -1 || (l.id && l.id === k))) {
                l.trim = lastTrimsMap[k];
                dirty = true;
                break;
              }
            }
          }
          if (l.effects && Array.isArray(l.effects)) {
            l.effects.forEach(e => {
              if (e.type === 'ramp') {
                const overflowLimit = Math.max(10000, (c.h || 1080) * 4);
                if (e.start && Array.isArray(e.start) && Math.abs(e.start[1]) >= overflowLimit) {
                  e.start[1] = Math.round(e.start[1] / 100);
                  dirty = true;
                }
                if (e.end && Array.isArray(e.end) && Math.abs(e.end[1]) >= overflowLimit) {
                  e.end[1] = Math.round(e.end[1] / 100);
                  dirty = true;
                }
              }
            });
          }
          // Fix: Merge Box (fill) and Border (stroke) into a unified shape group
          if (l.shapes && Array.isArray(l.shapes) && l.shapes.length > 1) {
            const bIdx = l.shapes.findIndex(s => s && s.name === 'Box' && s.fill && !s.stroke);
            const rIdx = l.shapes.findIndex(s => s && s.name === 'Border' && s.stroke && !s.fill);
            if (bIdx !== -1 && rIdx !== -1) {
              const b = l.shapes[bIdx];
              const r = l.shapes[rIdx];
              b.stroke = r.stroke;
              if (r.size) b.size = r.size;
              if (b.roundness && typeof b.roundness === 'number' && b.roundness > 0) {
                if (!b.stroke.join || b.stroke.join === 'miter') b.stroke.join = 'round';
              }
              l.shapes.splice(rIdx, 1);
              dirty = true;
            }
          }
          if (l.parent && layerMap[l.parent] && (l.name.indexOf('(alpha)') !== -1 || (layerMap[l.parent].matte && layerMap[l.parent].matte.source === l.id))) {
            const pLayer = layerMap[l.parent];
            if (pLayer.transform && pLayer.transform.anchor && l.transform) {
              const pAnc = pLayer.transform.anchor;
              if (!l.transform.anchor || l.transform.anchor[0] !== pAnc[0] || l.transform.anchor[1] !== pAnc[1]) {
                l.transform.anchor = [pAnc[0], pAnc[1]];
                dirty = true;
              }
              if (!l.transform.position || l.transform.position[0] !== pAnc[0] || l.transform.position[1] !== pAnc[1]) {
                l.transform.position = [pAnc[0], pAnc[1]];
                dirty = true;
              }
            }
          }
          // Fix: Fade-in layers trimmed by tracer - ensure lead-in zero keyframe so layer doesn't pop in abruptly or get clipped
          if (l.in && l.in > 0 && l.transform && l.transform.opacity && l.transform.opacity.k && Array.isArray(l.transform.opacity.k)) {
            const opKeys = l.transform.opacity.k;
            if (opKeys.length > 0 && opKeys[0].t > 0.05 && opKeys[0].v < 50) {
              opKeys.unshift({ t: 0, v: 0, e: 'linear' });
              l.in = 0;
              dirty = true;
            }
          }
        });
      });
      if (dirty) {
        try { fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
      }
    }

    sCompsEl.textContent = compCount;
    sLayersEl.textContent = layerCount;
    sDurEl.textContent = duration + 's';

    // Fonts list and auto-installation
    fontsRowEl.innerHTML = '';
    if (data.fonts && Object.keys(data.fonts).length > 0) {
      const fontList = Object.keys(data.fonts).join(', ');
      fontsRowEl.innerHTML = `<span class="ic">F</span> <span>Fonts: <b>${fontList}</b></span>`;
      fontsRowEl.classList.remove('hidden');
      try {
        const installed = installFonts(data.fonts, path.dirname(jsonPath));
        if (installed && installed.length > 0) {
          log('Verified / installed ' + installed.length + ' fonts for After Effects.', 'info');
        }
      } catch(fErr) {
        console.warn('Font installation warning:', fErr);
      }
    } else {
      fontsRowEl.classList.add('hidden');
    }

    emptyEl.classList.add('hidden');
    loadedEl.classList.remove('hidden');
    targetBoxEl.classList.remove('hidden');
    buildBoxEl.classList.remove('hidden');
    statusFootEl.textContent = 'Ready to build';
    log('Ready to build into After Effects.', 'ok');
  } catch (err) {
    log('Error reading animation data: ' + err.message, 'bad');
  }
}

// Build in After Effects
buildBtn.addEventListener('click', () => {
  if (!currentJsonPath) return;

  // Ensure fonts are registered before AE starts building
  try {
    const raw = fs.readFileSync(currentJsonPath, 'utf8');
    const data = JSON.parse(raw);
    if (data.fonts) {
      installFonts(data.fonts, path.dirname(currentJsonPath));
    }
  } catch(e) {}

  buildBtn.disabled = true;
  statusFootEl.textContent = 'Building in AE...';
  log('Starting After Effects build...', 'info');

  const builderScript = path.join(extensionPath, 'host', 'builder.jsx').replace(/\\/g, '/');
  const escapedPath = currentJsonPath.replace(/\\/g, '/');

  const evalString = `
    (function() {
      try {
        $.evalFile("${builderScript}");
        var engine = (typeof CodeMotionBuilder !== 'undefined') ? CodeMotionBuilder : MotionFlowBuilder;
        return engine.build("${escapedPath}", "${targetMode}");
      } catch(e) {
        return "ERROR: " + e.toString() + " (line " + e.line + ")";
      }
    })();
  `;

  csInterface.evalScript(evalString, (result) => {
    buildBtn.disabled = false;
    if (result && result.indexOf('ERROR') === 0) {
      log(result, 'bad');
      statusFootEl.textContent = 'Build failed';
    } else {
      let mainMsg = result || 'Build completed successfully!';
      let warnList = [];
      if (mainMsg.indexOf('||WARNINGS:') !== -1) {
        const parts = mainMsg.split('||WARNINGS:');
        mainMsg = parts[0];
        if (parts[1]) {
          warnList = parts[1].split(';;');
        }
      }
      log(mainMsg, 'ok');
      if (warnList.length > 0) {
        warnList.forEach(w => {
          if (w.trim()) log('⚠️ ' + w.trim(), 'warn');
        });
      }
      statusFootEl.textContent = warnList.length > 0 ? `Build finished (${warnList.length} warnings)` : 'Build finished';
    }
  });
});