// ResultsScene: end-of-year card. Stars, what happened, and what the next generation will inherit.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  init(data) {
    this.r = data;
  }

  create() {
    this.cameras.main.setBackgroundColor(C.bg);
    const cx = GAME_WIDTH / 2;
    const r = this.r;

    this.add.text(cx, 60, `YEAR ${r.year}`, { fontFamily: FONT, fontSize: '16px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5);
    const stars = this.add.text(cx, 115, '★★★', { fontFamily: FONT, fontSize: '64px', color: C.wall, fontStyle: 'bold' }).setOrigin(0.5);
    const lit = this.add.text(cx, 115, '★★★'.slice(0, r.stars), { fontFamily: FONT, fontSize: '64px', color: C.yellowS, fontStyle: 'bold' }).setOrigin(0.5);
    lit.x = stars.x - stars.width / 2 + lit.width / 2;
    lit.setScale(0); this.tweens.add({ targets: lit, scale: 1, duration: 400, ease: 'Back.Out', delay: 200 });

    const rows = [
      ['demands met', `${r.completed} / ${r.spawned}  (${Math.round(r.rate * 100)}%)`],
      ['missed', `${r.expired}`],
      ['score', `${r.score}`],
      ['seconds carrying the baby', `${r.carriedSeconds}`],
      ['toys left on the floor', `${r.toysLeft}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = 190 + i * 30;
      this.add.text(cx - 220, y, k, { fontFamily: FONT, fontSize: '16px', color: C.muteS }).setOrigin(0, 0.5);
      this.add.text(cx + 220, y, v, { fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    const history = this.registry.get('history') ?? [];
    const total = history.reduce((a, h) => a + h.stars, 0);
    this.add.text(cx, 370, `lineage so far: ${total} ★ over ${history.length} year${history.length === 1 ? '' : 's'}`, {
      fontFamily: FONT, fontSize: '14px', color: C.muteS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 395, 'the kid you raise this way is the parent you play next', {
      fontFamily: FONT, fontSize: '13px', color: C.muteS,
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, GAME_HEIGHT - 40, 'ENTER · next year', { fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const next = () => this.scene.start('Game');
    this.input.keyboard.once('keydown-ENTER', next);
    this.input.keyboard.once('keydown-SPACE', next);
    this.input.once('pointerdown', next);
  }
}
