// MenuScene: title screen. Starts a fresh life.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(C.bg);
    this.registry.remove('life');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'PROJECT EDEN', {
      fontFamily: FONT, fontSize: '52px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 'a generational parenting roguelike · week-1 slice', {
      fontFamily: FONT, fontSize: '15px', color: C.muteS,
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'ENTER · begin observation', {
      fontFamily: FONT, fontSize: '18px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'WASD move · SPACE use a station · ESC quit', {
      fontFamily: FONT, fontSize: '13px', color: C.muteS,
    }).setOrigin(0.5);

    const start = () => this.scene.start('Game');
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
