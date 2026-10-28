// Fridge. Choose JUNK (instant, lowers your max) or COOK (12s catch game, raises max).
// COOK: ingredients fall; move the pan with A/D or arrows. Catch green, avoid brown.
// Score = good caught / good spawned, minus a penalty per bad one caught.

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class FridgeGame extends MiniGame {
  constructor() {
    super('MG_Fridge');
  }

  setup() {
    this.title.setText('FRIDGE');
    this.hint.setText('←  JUNK  (fast, max −)        COOK  (12s, max +)  →');
    this.phase = 'choose';

    const style = { fontFamily: FONT, fontSize: '20px', color: C.inkS, fontStyle: 'bold', align: 'center' };
    this.chooseObjs = [
      this.add.rectangle(this.cx - 150, this.cy + 10, 220, 160, C.yellow).setStrokeStyle(3, C.ink),
      this.add.text(this.cx - 150, this.cy + 10, 'JUNK\n\ninstant\nhunger max −6', style).setOrigin(0.5),
      this.add.rectangle(this.cx + 150, this.cy + 10, 220, 160, C.green).setStrokeStyle(3, C.ink),
      this.add.text(this.cx + 150, this.cy + 10, 'COOK\n\n12 seconds\nhunger max +3', { ...style, color: C.whiteS }).setOrigin(0.5),
    ];
  }

  tick(dt) {
    if (this.phase === 'choose') {
      if (this.pressedLeft()) return this.finish('junk', 1, 'Junk');
      if (this.pressedRight()) return this.startCook();
      return;
    }
    // --- cooking
    const dir = (this.heldRight() ? 1 : 0) - (this.heldLeft() ? 1 : 0);
    this.pan.x = Phaser.Math.Clamp(this.pan.x + dir * this.cfg.panSpeed * dt, this.left + 60, this.right - 60);

    for (const ing of this.ingredients) {
      if (!ing.active) continue;
      ing.y += this.cfg.fallSpeed * dt;
      const caught = Math.abs(ing.x - this.pan.x) < 56 && Math.abs(ing.y - this.pan.y) < 14;
      if (caught) {
        if (ing.bad) { this.badCaught += 1; this.flash(C.red); } else { this.goodCaught += 1; this.flash(C.green); }
        ing.setActive(false).setVisible(false);
      } else if (ing.y > this.bottom - 30) {
        ing.setActive(false).setVisible(false);
      }
    }
    this.scoreText.setText(`${this.goodCaught} / ${this.goodSpawned}`);
  }

  startCook() {
    this.phase = 'cook';
    this.chooseObjs.forEach((o) => o.destroy());
    this.hint.setText('A / D  or  ← →  to move the pan · catch green · avoid brown');
    this.goodCaught = 0; this.goodSpawned = 0; this.badCaught = 0;
    this.ingredients = [];

    this.pan = this.add.rectangle(this.cx, this.bottom - 50, 112, 16, C.ink);
    this.add.rectangle(this.cx, this.bottom - 42, this.cardW - 40, 2, C.wall);
    this.scoreText = this.add.text(this.cx, this.top + 72, '0 / 0', { fontFamily: FONT, fontSize: '16px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5);

    this.spawner = this.time.addEvent({ delay: this.cfg.spawnEveryMs, loop: true, callback: this.spawn, callbackScope: this });
    this.startTimer(this.cfg.seconds, () => {
      this.spawner.remove();
      const score = this.goodSpawned ? this.goodCaught / this.goodSpawned - this.badCaught * this.cfg.badPenalty : 0;
      this.finish('cook', score);
    });
  }

  spawn() {
    if (this.done) return;
    const bad = Math.random() < this.cfg.badChance;
    const x = Phaser.Math.Between(this.left + 50, this.right - 50);
    const obj = bad
      ? this.add.rectangle(x, this.top + 80, 22, 22, 0x8b5a2b).setStrokeStyle(2, C.ink)
      : this.add.circle(x, this.top + 80, 12, C.green).setStrokeStyle(2, C.ink);
    obj.bad = bad;
    if (!bad) this.goodSpawned += 1;
    this.ingredients.push(obj);
  }

  flash(color) {
    this.pan.fillColor = color;
    this.time.delayedCall(90, () => { if (this.pan.active) this.pan.fillColor = C.ink; });
  }
}
