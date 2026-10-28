// Entry point. Wires scenes together and starts Phaser.
// If you are adding a new scene, import it here and add it to the `scene` array.
// Order matters for rendering: later scenes draw on top. VersionScene stays last.

import { GAME_WIDTH, GAME_HEIGHT, DEBUG, DPR } from './config.js';
import { C } from './palette.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HudScene from './ui/HudScene.js';
import VersionScene from './ui/VersionScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  // Physical canvas is DPR times larger than the logical 960x540; cameras zoom to compensate.
  width: GAME_WIDTH * DPR,
  height: GAME_HEIGHT * DPR,
  backgroundColor: C.bg,
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: DEBUG,
    },
  },
  scene: [
    BootScene, PreloadScene, MenuScene, GameScene,
    HudScene,
    VersionScene, // keep last
  ],
};

const game = new Phaser.Game(config);
window.game = game;

// Every scene renders its logical 960x540 world zoomed by DPR. Done here once so no scene
// has to remember. Physics, input and all coordinates stay in logical units.
game.events.once('ready', () => {
  for (const scene of game.scene.scenes) {
    const fit = () => scene.cameras.main.setZoom(DPR).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    scene.sys.events.on('create', fit);
    if (scene.sys.settings.status >= Phaser.Scenes.CREATE) fit();
  }
});
