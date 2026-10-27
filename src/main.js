// Entry point. Wires scenes together and starts Phaser.
// If you are adding a new scene, import it here and add it to the `scene` array.

import { GAME_WIDTH, GAME_HEIGHT, DEBUG } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HudScene from './ui/HudScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b0b10',
  pixelArt: true,
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
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HudScene],
};

window.game = new Phaser.Game(config);
