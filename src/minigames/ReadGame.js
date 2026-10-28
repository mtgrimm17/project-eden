// Bookshelf: rhythm. A ring shrinks onto the page; press SPACE when it lands.
// Score = average timing accuracy across the beats. Quiet time, done attentively.

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class ReadGame extends MiniGame {
  constructor() {
    super('MG_Read');
  }

  setup() {
    this.title.setText('READ');
    this.hint.setText('press SPACE as the ring lands on the page');

    this.beat = 0;
    this.scores = [];
    this.elapsed = 0;
    this.hitThisBeat = false;

    this.page = this.add.rectangle(this.cx, this.cy, 70, 90, C.white).setStrokeStyle(3, C.ink);
    this.ring = this.add.circle(this.cx, this.cy, 120).setStrokeStyle(4, C.green);
    this.ring.isFilled = false;
    this.dots = [];
    for (let i = 0; i < this.cfg.beats; i++) {
      this.dots.push(this.add.circle(this.cx - (this.cfg.beats - 1) * 14 + i * 28, this.cy + 85, 7, C.wall).setStrokeStyle(2, C.ink));
    }
  }

  tick(dt) {
    this.elapsed += dt * 1000;
    const period = this.cfg.beatMs;
    const beatIndex = Math.floor(this.elapsed / period);
    const phase = (this.elapsed % period) / period; // 0..1, lands at 1

    if (beatIndex > this.beat) {
      if (!this.hitThisBeat) this.record(0, this.beat);
      this.beat = beatIndex;
      this.hitThisBeat = false;
      if (this.beat >= this.cfg.beats) {
        const avg = this.scores.reduce((a, b) => a + b, 0) / this.cfg.beats;
        return this.finish('done', avg);
      }
    }

    const r = 120 - 85 * phase;
    this.ring.setRadius(r);

    if (this.pressedSpace() && !this.hitThisBeat) {
      // distance to the nearest landing (end of this beat or end of previous)
      const toEnd = (1 - phase) * period;
      const fromStart = phase * period;
      const err = Math.min(toEnd, fromStart);
      const s = err <= this.cfg.perfectMs ? 1 : err <= this.cfg.goodMs ? 0.6 : 0.15;
      this.record(s, this.beat);
      this.hitThisBeat = true;
    }
  }

  record(score, i) {
    this.scores[i] = score;
    const dot = this.dots[i];
    if (dot) dot.fillColor = score >= 1 ? C.green : score >= 0.6 ? C.yellow : C.red;
  }
}
