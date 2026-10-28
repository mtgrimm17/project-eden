// Shower: steady-hand. Hold SPACE to raise the needle, release to let it fall.
// Keep it inside the drifting comfort zone. Score = fraction of time in the zone.

import MiniGame from './MiniGame.js';
import { C, FONT } from '../palette.js';

export default class ShowerGame extends MiniGame {
  constructor() {
    super('MG_Shower');
  }

  setup() {
    this.title.setText('SHOWER');
    this.hint.setText('hold SPACE to go hotter · release to cool · stay in the zone');

    this.timeLeft = this.cfg.seconds;
    this.inZone = 0;
    this.needle = 0.5;       // 0 = cold (bottom), 1 = hot (top)
    this.zoneY = 0.5;        // centre of comfort zone
    this.zoneDir = 1;
    this.t = 0;

    this.gaugeH = 200;
    this.gaugeTop = this.cy - this.gaugeH / 2 + 10;
    this.add.rectangle(this.cx, this.cy + 10, 60, this.gaugeH, C.wall).setStrokeStyle(2, C.ink);
    this.zone = this.add.rectangle(this.cx, this.cy, 60, this.gaugeH * this.cfg.zoneHeight, C.blue, 0.6);
    this.needleObj = this.add.rectangle(this.cx, this.cy, 84, 6, C.ink);
    this.timer = this.add.text(this.cx + 80, this.cy + 10, '', { fontFamily: FONT, fontSize: '18px', color: C.muteS }).setOrigin(0, 0.5);
  }

  tick(dt) {
    this.t += dt;
    this.timeLeft -= dt;

    // zone drifts with a smooth wander
    this.zoneY = 0.5 + 0.3 * Math.sin(this.t * this.cfg.zoneSpeed * 2.4) * Math.cos(this.t * 0.7);

    const up = this.space.isDown;
    this.needle += (up ? this.cfg.needleRise : -this.cfg.needleFall) * dt;
    this.needle = Phaser.Math.Clamp(this.needle, 0, 1);

    const half = this.cfg.zoneHeight / 2;
    const inside = Math.abs(this.needle - this.zoneY) <= half;
    if (inside) this.inZone += dt;

    const yOf = (v) => this.gaugeTop + (1 - v) * this.gaugeH;
    this.zone.y = yOf(this.zoneY);
    this.needleObj.y = yOf(this.needle);
    this.needleObj.fillColor = inside ? C.blue : C.red;
    this.timer.setText(Math.max(0, this.timeLeft).toFixed(1));

    if (this.timeLeft <= 0) this.finish('done', this.inZone / this.cfg.seconds);
  }
}
