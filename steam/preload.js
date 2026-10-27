// Bridge between the game page and Electron/Steam. Exposes a tiny, safe API on window.eden.
// Game code can check `window.eden?.isSteam` to adapt (e.g. show "Quit" in the menu).

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('eden', {
  isSteam: true,
  platform: process.platform,
  // Add Steamworks calls here later, e.g. unlockAchievement(id)
});
