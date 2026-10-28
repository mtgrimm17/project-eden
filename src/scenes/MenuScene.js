// MenuScene: title screen. Starts a fresh life.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(C.bg);
    this.registry.remove('history');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'PROJECT EDEN', {
      fontFamily: FONT, fontSize: '52px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 'a generational parenting roguelike · core loop toy', {
      fontFamily: FONT, fontSize: '15px', color: C.muteS,
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'ENTER · start a life', {
      fontFamily: FONT, fontSize: '18px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'WASD move   ·   mouse LEFT = left hand, mouse RIGHT = right hand\npress = grab   ·   release = drop   ·   move the mouse then release = throw to the cursor\nkeyboard: Q/J grab-drop, E/L throw   ·   ESC quit', {
      align: 'center',
      fontFamily: FONT, fontSize: '13px', color: C.muteS,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'press P for the platformer prototype', {
      fontFamily: FONT, fontSize: '13px', color: C.muteS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.input.keyboard.once('keydown-P', () => { window.location.href = 'runner/'; });

    const start = () => this.scene.start('Game');
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
