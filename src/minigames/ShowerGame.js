// Shower. 12s scrub game: hold the mouse and move it over grime spots to scrub them away.
// Each spot needs a set amount of mouse travel. Score = spots cleaned / spots total,
// with partial credit for partly-scrubbed spots.

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class ShowerGame extends MiniGame {
  constructor() {
    super('MG_Shower');
  }

  setup() {
    this.title.setText('SHOWER');
    this.hint.setText('hold the mouse button and scrub the spots');

    // body silhouette
    this.add.ellipse(this.cx, this.top + 110, 70, 80, C.wall);
    this.add.rectangle(this.cx, this.cy + 50, 150, 190, C.wall);

    this.spots = [];
    const r = this.cfg.spotRadius;
    for (let i = 0; i < this.cfg.spots; i++) {
      const x = Phaser.Math.Between(this.cx - 65, this.cx + 65);
      const y = Phaser.Math.Between(this.top + 90, this.bottom - 50);
      const spot = this.add.circle(x, y, r, 0x7a6a4f).setStrokeStyle(2, C.ink);
      spot.need = this.cfg.scrubPixels;
      spot.left = spot.need;
      this.spots.push(spot);
    }
    this.cleanedText = this.add.text(this.cx, this.top + 72, '', { fontFamily: FONT, fontSize: '16px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5);

    this.sponge = this.add.circle(this.cx, this.cy, 18, C.yellow, 0.9).setStrokeStyle(2, C.ink).setDepth(3);
    this.lastX = null; this.lastY = null;

    this.startTimer(this.cfg.seconds, () => this.finish('done', this.score()));
  }

  tick() {
    const p = this.input.activePointer;
    const x = p.worldX; const y = p.worldY;
    this.sponge.setPosition(x, y);
    this.sponge.setScale(p.isDown ? 1.15 : 1);

    if (p.isDown && this.lastX !== null) {
      const travel = Math.hypot(x - this.lastX, y - this.lastY);
      for (const s of this.spots) {
        if (s.left <= 0) continue;
        if (Math.hypot(x - s.x, y - s.y) < s.radius + 14) {
          s.left = Math.max(0, s.left - travel);
          const f = s.left / s.need;
          s.setScale(0.35 + 0.65 * f);
          s.alpha = 0.4 + 0.6 * f;
          if (s.left <= 0) s.setVisible(false);
        }
      }
    }
    this.lastX = x; this.lastY = y;

    const cleaned = this.spots.filter((s) => s.left <= 0).length;
    this.cleanedText.setText(`${cleaned} / ${this.spots.length} clean`);
    if (cleaned === this.spots.length) this.finish('done', 1);
  }

  score() {
    const total = this.spots.reduce((a, s) => a + (1 - s.left / s.need), 0);
    return total / this.spots.length;
  }
}
