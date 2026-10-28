// PreloadScene: loads every image, sound and font the game uses, with a progress bar.
// To add an asset: drop the file in assets/ and add one load line here.
// Placeholder textures are generated in code so the game runs with zero art.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C } from '../palette.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.cameras.main.setBackgroundColor(C.bg);
    const bar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 0, 12, C.ink).setOrigin(0.5);
    this.load.on('progress', (p) => bar.setSize(400 * p, 12));

    // --- Images ---------------------------------------------------------
    // this.load.image('player', 'assets/images/player.png');

    // --- Audio ----------------------------------------------------------
    // this.load.audio('sfx-good', ['assets/audio/good.ogg', 'assets/audio/good.mp3']);
  }

  create() {
    this.makePlaceholderTextures();
    this.scene.start('Menu');
  }

  // Flat shapes so everything is visible before real art exists.
  makePlaceholderTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    if (!this.textures.exists('player')) {
      g.clear();
      g.fillStyle(C.ink, 0.15).fillEllipse(18, 32, 28, 10);   // shadow
      g.fillStyle(C.ink, 1).fillCircle(18, 18, 16);           // body
      g.fillStyle(C.white, 1).fillCircle(23, 14, 4);          // eye
      g.generateTexture('player', 36, 40);
    }
    g.destroy();
  }
}
