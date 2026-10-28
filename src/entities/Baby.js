// Baby: the thing everything is for. Who it is each year comes from balance.json `baby.phases`:
//   baby     stationary; need for attention rises until it cries for a hold
//   toddler  roams slowly; when neglected heads for the nearest hazard and cries there
//   kid      roams fast; when neglected climbs and jumps off something, or tips the bin
// Attention is a 0..1 meter shown as the kid's colour (green → yellow → red). Picking up resets
// it; walking past pats it down a little. The player interacts with the kid wherever it is.

import { C, FONT } from '../palette.js';

const GREEN = 0x3aa655; const YELLOW = 0xf3c13a; const RED = 0xe3262c;

export default class Baby {
  constructor(scene, cfg, crib, hazards) {
    this.scene = scene;
    this.cfg = cfg;
    this.crib = crib;
    this.hazards = hazards;   // live list, maintained by the scene
    this.climbables = [];     // live list, maintained by the scene
    this.tippables = [];

    this.x = crib.x; this.y = crib.y;
    this.state = 'crib';      // crib | floor | carried | danger | trouble
    this.phase = cfg.phases[0];
    this.target = null;
    this.pause = 0;
    this.retarget = 0;
    this.attention = 0;
    this.patCooldown = 0;
    this.cry = 0;
    this.unmet = {};
    this.carriedSeconds = 0;
    this.toyTimer = cfg.toyDropEverySeconds;
    this.onDropToy = null;    // (x, y)
    this.onTrouble = null;    // (kind, station) kind: 'cry' | 'hazard' | 'climb' | 'tip'
    this.troubleCooldown = 0;

    this.body = scene.add.circle(this.x, this.y, 13, GREEN).setStrokeStyle(3, C.ink).setDepth(9);
    this.face = scene.add.text(this.x, this.y, '☺', { fontFamily: FONT, fontSize: '16px', color: C.inkS }).setOrigin(0.5).setDepth(9);
    this.cryText = scene.add.text(this.x, this.y - 26, '', { fontFamily: FONT, fontSize: '14px', color: C.redS, fontStyle: 'bold' }).setOrigin(0.5).setDepth(9);
    this.h = 26;
  }

  setPhase(phase) {
    const changed = this.phase !== phase;
    this.phase = phase;
    this.body.setRadius(phase.name === 'kid' ? 16 : phase.name === 'toddler' ? 14 : 13);
    if (changed && this.state === 'crib' && phase.speed > 0) { this.state = 'floor'; this.pause = this.cfg.pauseAfterPutDownSeconds; }
    return changed;
  }

  pickUp() {
    this.state = 'carried';
    this.target = null;
    this.attention = 0;
  }

  putDown(x, y, inCrib) {
    this.x = x; this.y = y;
    this.state = inCrib ? 'crib' : 'floor';
    if (inCrib && this.phase.speed > 0) this.state = 'floor'; // a toddler doesn't stay in a crib
    this.pause = this.cfg.pauseAfterPutDownSeconds;
    this.retarget = 0;
    this.target = null;
  }

  isRed() { return this.attention >= 1; }

  // ---- targets
  nearest(list) {
    const live = list.filter((s) => s.active !== false);
    if (!live.length) return null;
    return live.reduce((a, b) => (Math.hypot(a.x - this.x, a.y - this.y) <= Math.hypot(b.x - this.x, b.y - this.y) ? a : b));
  }

  randomPoint() {
    const r = this.scene.house.rooms[0];
    return { x: Phaser.Math.Between(r.x + 50, r.x + r.w - 50), y: Phaser.Math.Between(r.y + 70, r.y + r.h - 40), w: 0, h: 0, kind: 'wander' };
  }

  pickTarget() {
    const p = this.phase;
    if (this.isRed()) {
      if (p.trouble === 'hazard') { const h = this.nearest(this.hazards); if (h) return { ...h, ref: h, kind: 'hazard' }; }
      if (p.trouble === 'antics') {
        const options = [];
        const c = this.nearest(this.climbables); if (c) options.push({ ...c, ref: c, kind: 'climb' });
        const t = this.nearest(this.tippables); if (t) options.push({ ...t, ref: t, kind: 'tip' });
        if (options.length) return Phaser.Utils.Array.GetRandom(options);
      }
    }
    return this.randomPoint();
  }

  // ---- per frame
  update(dt, playerX, playerY) {
    const p = this.phase;
    this.patCooldown = Math.max(0, this.patCooldown - dt);
    this.troubleCooldown = Math.max(0, this.troubleCooldown - dt);

    if (this.state === 'carried') {
      this.x = playerX; this.y = playerY - 4;
      this.carriedSeconds += dt;
      this.attention = 0;
    } else {
      // attention rises while not held; a pass-by pat relieves it a little
      this.attention = Math.min(1, this.attention + dt / p.attentionSeconds);
      if (this.patCooldown <= 0 && Math.hypot(playerX - this.x, playerY - this.y) < p.patRadius && this.attention > 0.05) {
        this.attention = Math.max(0, this.attention - p.patRelief);
        this.patCooldown = p.patCooldownSeconds;
        this.scene.events.emit('pat', this);
      }

      if (this.state === 'trouble') {
        // stays put, crying, until picked up
      } else if (p.trouble === 'cry' && this.isRed() && this.troubleCooldown <= 0) {
        this.state = 'trouble';
        this.onTrouble?.('cry', null);
      } else if (p.speed > 0 && this.state !== 'crib') {
        this.roam(dt);
      }
    }

    const upset = Object.values(this.unmet).some(Boolean) || this.state === 'danger' || this.state === 'trouble';
    this.cry = Phaser.Math.Clamp(this.cry + (upset ? this.cfg.cryRisePerSecond : -this.cfg.cryFallPerSecond) * dt, 0, this.cfg.cryMax);

    this.draw();
  }

  roam(dt) {
    const p = this.phase;
    this.pause -= dt;
    if (this.pause > 0) return;
    this.retarget -= dt;
    const wantsTrouble = this.isRed() && this.target?.kind === 'wander';
    if (!this.target || this.retarget <= 0 || wantsTrouble) { this.target = this.pickTarget(); this.retarget = p.retargetEverySeconds ?? 4; }

    const t = this.target;
    const dx = t.x - this.x; const dy = t.y - this.y; const d = Math.hypot(dx, dy);
    const reach = Math.max(t.w ?? 0, t.h ?? 0) / 2 + 8;
    if (d > reach) {
      this.x += (dx / d) * p.speed * dt;
      this.y += (dy / d) * p.speed * dt;
      if (this.state !== 'danger') this.state = 'floor';
      if (p.dropsToys && this.toysOn) {
        this.toyTimer -= dt;
        if (this.toyTimer <= 0) { this.toyTimer = this.cfg.toyDropEverySeconds; this.onDropToy?.(this.x, this.y); }
      }
      return;
    }
    // arrived
    if (t.kind === 'hazard') {
      if (this.state !== 'danger') { this.state = 'danger'; this.onTrouble?.('hazard', t.ref); }
    } else if (t.kind === 'climb' || t.kind === 'tip') {
      this.state = 'trouble';
      this.doAntic(t);
    } else {
      this.target = null; // wandered to a point: pick another after a beat
      this.retarget = 0;
      this.pause = 0.6;
    }
  }

  doAntic(t) {
    if (t.kind === 'climb') {
      // climb up, jump off, land crying
      this.scene.tweens.add({ targets: [this.body, this.face], y: t.y - t.h / 2 - 20, duration: 500, yoyo: true, hold: 300, onComplete: () => this.onTrouble?.('climb', t.ref) });
    } else {
      this.onTrouble?.('tip', t.ref);
    }
    this.target = null;
  }

  draw() {
    const carried = this.state === 'carried';
    this.body.setVisible(!carried); this.face.setVisible(!carried);
    const t = this.scene.time.now / 1000;
    const wobble = this.cry > 0 ? Math.sin(t * (6 + this.cry * 4)) * this.cry * 2 : 0;
    this.body.setPosition(this.x + wobble, this.y);
    this.face.setPosition(this.x + wobble, this.y);

    // colour by attention: green → yellow → red
    const a = this.attention;
    const col = a < 0.5 ? Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(GREEN), Phaser.Display.Color.ValueToColor(YELLOW), 1, a * 2)
      : Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(YELLOW), Phaser.Display.Color.ValueToColor(RED), 1, (a - 0.5) * 2);
    this.body.fillColor = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
    this.face.setText(this.state === 'danger' || this.state === 'trouble' ? '!' : this.cry > 1 ? '☹' : '☺');
    this.cryText.setPosition(this.x, this.y - 26).setText(this.cry > 0.5 ? 'WAAA' : '');
  }

  isCrying() {
    return this.cry >= this.cfg.cryMax * 0.66;
  }

  distanceTo(px, py) {
    return Math.hypot(px - this.x, py - this.y) - 13;
  }
}
