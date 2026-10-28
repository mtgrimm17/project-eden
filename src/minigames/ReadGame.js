// Bookshelf. 15s stacker: each book slides across; press SPACE to drop it on the pile.
// Overhang is trimmed off, so sloppy drops make the next book narrower.
// Score = average overlap across books placed (unplaced books count as zero).

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class ReadGame extends MiniGame {
  constructor() {
    super('MG_Read');
  }

  setup() {
    this.title.setText('BOOKSHELF');
    this.hint.setText('SPACE to drop the sliding book onto the pile');

    this.placed = 0;
    this.overlaps = [];
    this.shelfY = this.bottom - 50;
    this.add.rectangle(this.cx, this.shelfY + 4, this.cardW - 80, 8, C.ink);

    this.colors = [C.red, C.blue, C.green, C.yellow];
    this.baseX = this.cx; this.baseW = this.cfg.bookWidth; // the top of the pile
    this.spawnBook();
    this.countText = this.add.text(this.cx, this.top + 72, '', { fontFamily: FONT, fontSize: '16px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5);

    this.startTimer(this.cfg.seconds, () => this.finish('done', this.score()));
  }

  spawnBook() {
    const w = this.baseW;
    const y = this.shelfY - (this.placed + 0.5) * this.cfg.bookHeight;
    this.dir = this.placed % 2 === 0 ? 1 : -1;
    const startX = this.dir === 1 ? this.left + 20 + w / 2 : this.right - 20 - w / 2;
    this.book = this.add.rectangle(startX, y, w, this.cfg.bookHeight - 2, this.colors[this.placed % 4]).setStrokeStyle(2, C.ink);
    this.speed = this.cfg.slideSpeed + this.placed * this.cfg.speedUpPerBook;
  }

  tick(dt) {
    const b = this.book;
    b.x += this.dir * this.speed * dt;
    const minX = this.left + 20 + b.width / 2; const maxX = this.right - 20 - b.width / 2;
    if (b.x <= minX || b.x >= maxX) { this.dir *= -1; b.x = Phaser.Math.Clamp(b.x, minX, maxX); }

    if (this.pressedSpace()) this.drop();
    this.countText.setText(`${this.placed} / ${this.cfg.books}`);
  }

  drop() {
    const b = this.book;
    const leftEdge = Math.max(b.x - b.width / 2, this.baseX - this.baseW / 2);
    const rightEdge = Math.min(b.x + b.width / 2, this.baseX + this.baseW / 2);
    const overlapW = rightEdge - leftEdge;

    if (overlapW <= 8) {
      // missed the pile entirely: book falls off, no credit
      this.tweens.add({ targets: b, y: b.y + 200, alpha: 0, angle: 30, duration: 350 });
      this.overlaps.push(0);
    } else {
      b.x = (leftEdge + rightEdge) / 2; b.width = overlapW;
      b.setSize(overlapW, this.cfg.bookHeight - 2);
      this.overlaps.push(overlapW / this.cfg.bookWidth);
      this.baseX = b.x; this.baseW = overlapW;
    }
    this.placed += 1;
    if (this.placed >= this.cfg.books) return this.finish('done', this.score());
    this.spawnBook();
  }

  score() {
    const sum = this.overlaps.reduce((a, v) => a + v, 0);
    return sum / this.cfg.books;
  }
}
