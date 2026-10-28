// Runner prototype entry. Loads feel + level data, then PlayScene.

import { GAME_WIDTH, GAME_HEIGHT, DEBUG, DPR, VERSION } from './config.js';
import { C, FONT } from './palette.js';
import PlayScene from './scenes/PlayScene.js';

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.json('feel', 'src/data/feel.json');
    this.load.json('level1', 'src/data/level1.json');
  }
  create() { this.scene.start('Play'); }
}

class VersionScene extends Phaser.Scene {
  constructor() { super('Version'); }
  create() {
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 6, `runner v${VERSION}`, { fontFamily: FONT, fontSize: '12px', color: C.muteS }).setOrigin(1).setScrollFactor(0);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH * DPR,
  height: GAME_HEIGHT * DPR,
  backgroundColor: C.bg,
  antialias: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: DEBUG, tileBias: 30 } },
  scene: [BootScene, PlayScene, VersionScene],
});
window.game = game;

game.events.once('ready', () => {
  game.scene.start('Version');
  for (const scene of game.scene.scenes) {
    const fit = () => scene.cameras.main.setZoom(DPR);
    scene.sys.events.on('create', fit);
    if (scene.sys.settings.status >= Phaser.Scenes.CREATE) fit();
  }
});
