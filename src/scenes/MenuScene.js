// MenuScene: title screen. Press Enter / click to start.

import { GAME_WIDTH, GAME_HEIGHT, VERSION } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'PROJECT EDEN', {
      fontFamily: 'monospace', fontSize: '48px', color: '#e8e6e3',
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'press ENTER or click to start', {
      fontFamily: 'monospace', fontSize: '18px', color: '#9a9aa5',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 12, `v${VERSION}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#55555f',
    }).setOrigin(1);

    const start = () => this.scene.start('Game', { levelId: 'level-1' });
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
