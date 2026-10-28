// Entry point. Wires scenes together and starts Phaser.
// If you are adding a new scene, import it here and add it to the `scene` array.
// Order matters for rendering: later scenes draw on top. VersionScene stays last.

import { GAME_WIDTH, GAME_HEIGHT, DEBUG } from './config.js';
import { C } from './palette.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import HudScene from './ui/HudScene.js';
import FridgeGame from './minigames/FridgeGame.js';
import ShowerGame from './minigames/ShowerGame.js';
import ReadGame from './minigames/ReadGame.js';
import VersionScene from './ui/VersionScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
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
    BootScene, PreloadScene, MenuScene, GameScene, ResultsScene, GameOverScene,
    HudScene,
    FridgeGame, ShowerGame, ReadGame,
    VersionScene, // keep last
  ],
};

window.game = new Phaser.Game(config);
