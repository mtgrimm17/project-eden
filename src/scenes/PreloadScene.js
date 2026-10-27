// PreloadScene: loads every image, sound and font the game uses, with a progress bar.
// To add an asset: drop the file in assets/ and add one load line here.
// Placeholder textures are generated in code so the game runs with zero art.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const bar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 0, 12, 0xe8e6e3).setOrigin(0.5);
    this.load.on('progress', (p) => bar.setSize(400 * p, 12));

    // --- Images ---------------------------------------------------------
    // this.load.image('player', 'assets/images/player.png');

    // --- Audio ----------------------------------------------------------
    // this.load.audio('sfx-hit', ['assets/audio/hit.ogg', 'assets/audio/hit.mp3']);
    // this.load.audio('music-main', ['assets/audio/main.ogg', 'assets/audio/main.mp3']);
  }

  create() {
    this.makePlaceholderTextures();
    this.scene.start('Menu');
  }

  // Simple coloured squares/circles so everything is visible before real art exists.
  makePlaceholderTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    if (!this.textures.exists('player')) {
      g.clear().fillStyle(0x7ad7ff, 1).fillCircle(16, 16, 16);
      g.generateTexture('player', 32, 32);
    }
    if (!this.textures.exists('enemy')) {
      g.clear().fillStyle(0xff6b6b, 1).fillRect(0, 0, 28, 28);
      g.generateTexture('enemy', 28, 28);
    }
    if (!this.textures.exists('pickup')) {
      g.clear().fillStyle(0xffd166, 1).fillRect(0, 0, 14, 14);
      g.generateTexture('pickup', 14, 14);
    }
    g.destroy();
  }
}
