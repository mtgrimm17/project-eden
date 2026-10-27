// Electron entry for the Steam build. Loads the same index.html the browser uses.
// In development (`npm start`) it loads ../index.html directly; in a packaged build it loads
// the copy under resources/game/.

const { app, BrowserWindow } = require('electron');
const path = require('path');

const isPackaged = app.isPackaged;
const gameDir = isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, '..');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0b0b10',
    fullscreen: isPackaged,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(gameDir, 'index.html'));
}

app.whenReady().then(() => {
  // Steamworks: when ready, initialise here (see README.md) before creating the window.
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => app.quit());
