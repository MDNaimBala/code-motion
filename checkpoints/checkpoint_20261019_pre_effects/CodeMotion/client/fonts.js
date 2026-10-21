const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function installFonts(fontDefs, baseDir) {
  if (!fontDefs || typeof fontDefs !== 'object') return [];

  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const userFontsDir = path.join(localAppData, 'Microsoft', 'Windows', 'Fonts');
  if (!fs.existsSync(userFontsDir)) {
    try { fs.mkdirSync(userFontsDir, { recursive: true }); } catch(e) {}
  }

  const installed = [];
  for (const fontKey in fontDefs) {
    if (!fontDefs.hasOwnProperty(fontKey)) continue;
    const item = fontDefs[fontKey];
    const relFile = item.file || item.path || '';
    const src = path.isAbsolute(relFile) ? relFile : path.join(baseDir, relFile);
    if (!fs.existsSync(src)) continue;

    const baseName = path.basename(src);
    const dest = path.join(userFontsDir, baseName);

    try {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    } catch(err) {}

    const fontTitle = path.parse(baseName).name.replace(/-/g, ' ') + ' (TrueType)';
    try {
      execSync(`reg add "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /v "${fontTitle}" /t REG_SZ /d "${dest}" /f`, { stdio: 'ignore' });
    } catch(e) {}
    installed.push(dest);
  }

  if (installed.length > 0 && process.platform === 'win32') {
    const psScript = `
      Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;
      public class WinFont {
        [DllImport("gdi32.dll", EntryPoint="AddFontResourceW", SetLastError=true)]
        public static extern int AddFontResource([MarshalAs(UnmanagedType.LPWStr)] string lpFileName);
        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
      }
"@
      ${installed.map(f => `[WinFont]::AddFontResource("${f.replace(/\\/g, '\\\\')}")`).join(';')}
      [WinFont]::SendMessage([IntPtr]0xffff, 0x001D, [IntPtr]0, [IntPtr]0)
    `;
    try {
      execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' });
    } catch(e) {}
  }

  return installed;
}

module.exports = {
  installFonts
};