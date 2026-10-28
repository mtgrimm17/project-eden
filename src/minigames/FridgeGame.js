// Fridge: choose JUNK (instant, lowers your max) or COOK (mash SPACE; fills more, raises max).
// The short-term/long-term trade in its purest form.

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class FridgeGame extends MiniGame {
  constructor() {
    super('MG_Fridge');
  }

  setup() {
    this.title.setText('FRIDGE');
    this.hint.setText('←  junk   ·   cook  →');
    this.phase = 'choose';

    const style = { fontFamily: FONT, fontSize: '18px', color: C.inkS, fontStyle: 'bold', align: 'center' };
    this.junkBox = this.add.rectangle(this.cx - 120, this.cy, 180, 130, C.yellow).setStrokeStyle(3, C.ink);
    this.add.text(this.cx - 120, this.cy, 'JUNK\n\nfast\nmax −', style).setOrigin(0.5);
    this.cookBox = this.add.rectangle(this.cx + 120, this.cy, 180, 130, C.green).setStrokeStyle(3, C.ink);
    this.add.text(this.cx + 120, this.cy, 'COOK\n\nslow\nmax +', { ...style, color: C.whiteS }).setOrigin(0.5);
  }

  tick(dt) {
    if (this.phase === 'choose') {
      if (this.pressedLeft()) return this.finish('junk', 1, 'Junk');
      if (this.pressedRight()) return this.startCook();
      return;
    }
    // cooking: mash SPACE
    this.timeLeft -= dt;
    if (this.pressedSpace()) {
      this.taps += 1;
      this.pot.setScale(1 + 0.08 * Math.sin(this.taps * 1.7));
      this.progress.width = 300 * Math.min(1, this.taps / this.cfg.cookTaps);
    }
    this.timer.setText(this.timeLeft.toFixed(1));
    if (this.taps >= this.cfg.cookTaps) return this.finish('cook', 1);
    if (this.timeLeft <= 0) return this.finish('cook', this.taps / this.cfg.cookTaps);
  }

  startCook() {
    this.phase = 'cook';
    this.junkBox.destroy();
    this.cookBox.destroy();
    this.children.list.filter((o) => o.type === 'Text' && o !== this.title && o !== this.hint).forEach((o) => o.destroy());
    this.hint.setText('mash SPACE');
    this.taps = 0;
    this.timeLeft = this.cfg.cookSeconds;

    this.pot = this.add.circle(this.cx, this.cy - 20, 44, C.green).setStrokeStyle(3, C.ink);
    this.add.rectangle(this.cx, this.cy + 60, 300, 16, C.wall).setStrokeStyle(2, C.ink);
    this.progress = this.add.rectangle(this.cx - 150, this.cy + 60, 0, 16, C.green).setOrigin(0, 0.5);
    this.timer = this.add.text(this.cx + 170, this.cy + 60, '', { fontFamily: FONT, fontSize: '14px', color: C.muteS }).setOrigin(0, 0.5);
  }
}
