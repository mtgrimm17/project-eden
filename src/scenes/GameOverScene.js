// GameOverScene: the lineage ends. For the week-1 slice, that means you starved.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.life = data.life;
  }

  create() {
    this.cameras.main.setBackgroundColor(C.ink);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 180, 'LINEAGE ENDED', { fontFamily: FONT, fontSize: '40px', color: C.whiteS, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, 235, `starved at age ${this.life.age} · ${this.life.year} years`, { fontFamily: FONT, fontSize: '16px', color: C.muteS }).setOrigin(0.5);

    const prompt = this.add.text(cx, GAME_HEIGHT - 60, 'ENTER · start another life',{ fontFamily: FONT, fontSize: '16px', color: C.yellowS, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const again = () => { this.registry.remove('life'); this.scene.start('Menu'); };
    this.input.keyboard.once('keydown-ENTER', again);
    this.input.once('pointerdown', again);
  }
}
