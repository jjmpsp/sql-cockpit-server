import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const smoke = process.argv.includes('--smoke-test');
let window: BrowserWindow | null = null;
const timeout = smoke ? setTimeout(() => app.exit(1), 20000) : null;

function createWindow() {
  window = new BrowserWindow({
    width: 1160, height: 820, minWidth: 720, minHeight: 620,
    title: 'SQL Cockpit Server', backgroundColor: '#0b1020', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
  });
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.once('ready-to-show', () => { if (!smoke) window?.show(); });
  window.webContents.once('did-finish-load', async () => {
    if (!smoke) return;
    try {
      const info = await window!.webContents.executeJavaScript(`new Promise((resolve, reject) => {
        const started = Date.now();
        const check = () => {
          const version = document.querySelector('[data-testid="installed-version"]')?.textContent;
          if (version && version !== 'Loading…') resolve({ version, text: document.body.innerText });
          else if (Date.now() - started > 5000) reject(new Error('Renderer/version bridge did not load'));
          else setTimeout(check, 100);
        }; check();
      })`);
      if (info.version !== app.getVersion() || !info.text.includes('Release integration test') || !info.text.includes('does not connect to databases')) throw new Error('Smoke check failed');
      console.log(JSON.stringify({ ok: true, version: info.version, platform: process.platform, arch: process.arch }));
      if (timeout) clearTimeout(timeout);
      app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
  });
  window.webContents.once('did-fail-load', () => { if (smoke) app.exit(1); });
  void window.loadFile(path.join(__dirname, '../dist/index.html'));
}
app.whenReady().then(() => {
  const payloadPath = app.isPackaged ? path.join(process.resourcesPath, 'server-payload', 'hello.txt') : path.join(app.getAppPath(), 'payloads', process.platform, 'hello.txt');
  const payload = readFileSync(payloadPath, 'utf8');
  if (!payload.includes(process.platform)) throw new Error('Incorrect platform payload');
  console.log(payload.trim());
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  ipcMain.handle('app:version', event => {
    if (event.sender !== window?.webContents) throw new Error('Unexpected sender');
    return app.getVersion();
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
