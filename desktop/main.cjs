const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
function createWindow() {
  const window = new BrowserWindow({ width: 1440, height: 940, minWidth: 820, minHeight: 640, backgroundColor: '#151a1b', title: 'Tangled Mess', webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'https://example.com/' || url === 'https://example.com') shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
