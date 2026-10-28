// ResultsScene: end-of-year card. Shows what the year did to your maximums, then next year.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT, RESOURCE_COLORS } from '../palette.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  init(data) {
    this.life = data.life;
  }

  create() {
    this.cameras.main.setBackgroundColor(C.bg);
    const cx = GAME_WIDTH / 2;
    const last = this.life.history[this.life.history.length - 1];
    const prev = this.life.history[this.life.history.length - 2];
    const lines = this.cache.json.get('narrator')['year-end'];

    this.add.text(cx, 70, `AGE ${this.life.age} · YEAR ${this.life.year} COMPLETE`, {
      fontFamily: FONT, fontSize: '30px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);

    const rows = [
      ['cooked / junk', `${last.cooked} / ${last.junk}`],
      ['showers', `${last.showers}`],
      ['quiet time', `${last.reads}`],
      ['seconds at zero sanity', `${Math.round(last.secondsAtZeroSanity)}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = 140 + i * 30;
      this.add.text(cx - 200, y, k, { fontFamily: FONT, fontSize: '16px', color: C.muteS }).setOrigin(0, 0.5);
      this.add.text(cx + 200, y, v, { fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    // Maximums: this is the line that matters.
    this.add.text(cx, 285, 'YOUR MAXIMUMS', { fontFamily: FONT, fontSize: '13px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5);
    ['hunger', 'sanity'].forEach((key, i) => {
      const col = RESOURCE_COLORS[key];
      const now = Math.round(this.life.res[key].max);
      const before = prev ? Math.round(prev.snapshot[key].max) : now;
      const d = now - before;
      const y = 315 + i * 30;
      this.add.text(cx - 200, y, `${col.glyph}  ${key}`, { fontFamily: FONT, fontSize: '16px', color: col.str, fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.add.text(cx + 200, y, `${now}  ${d === 0 ? '' : d > 0 ? `(+${d})` : `(${d})`}`, {
        fontFamily: FONT, fontSize: '16px', color: d < 0 ? C.redS : d > 0 ? C.greenS : C.inkS, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    });
    const nextMax = this.life.staminaMaxForAge(this.life.age + 1);
    this.add.text(cx, 385, `next year: ${nextMax} seconds`, { fontFamily: FONT, fontSize: '14px', color: C.muteS }).setOrigin(0.5);

    this.add.text(cx, 440, Phaser.Utils.Array.GetRandom(lines), {
      fontFamily: FONT, fontSize: '15px', color: C.whiteS, backgroundColor: C.inkS, padding: { x: 14, y: 8 },
      wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, GAME_HEIGHT - 40, 'ENTER · next year', { fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    const next = () => this.scene.start('Game');
    this.input.keyboard.once('keydown-ENTER', next);
    this.input.keyboard.once('keydown-SPACE', next);
    this.input.once('pointerdown', next);
  }
}
