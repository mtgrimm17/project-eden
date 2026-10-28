// MiniGame: base class for every station mini-game.
// Launched on top of GameScene; the house keeps ticking underneath (stamina still drains).
// Subclasses implement setup() and tick(dt); they call this.finish(outcome, score).
//
//   outcome : a key in balance.json stations.<stationId> (e.g. 'junk', 'cook', 'done')
//   score   : 0..1, how well the player did
//
// Helpers: this.startTimer(seconds, onExpire) draws a countdown bar under the title.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class MiniGame extends Phaser.Scene {
  init(data) {
    this.stationId = data.stationId;
    this.balance = data.balance;
    this.life = data.life;
    this.cfg = this.balance.minigames[this.stationId] ?? {};
    this.done = false;
    this.timeLeft = null;
  }

  create() {
    this.cardW = 640;
    this.cardH = 380;
    this.cx = GAME_WIDTH / 2;
    this.cy = GAME_HEIGHT / 2;
    this.top = this.cy - this.cardH / 2;
    this.bottom = this.cy + this.cardH / 2;
    this.left = this.cx - this.cardW / 2;
    this.right = this.cx + this.cardW / 2;

    this.add.rectangle(this.cx, this.cy, GAME_WIDTH, GAME_HEIGHT, C.ink, 0.35);
    this.add.rectangle(this.cx, this.cy, this.cardW, this.cardH, C.bg).setStrokeStyle(4, C.ink);
    this.title = this.add.text(this.left + 20, this.top + 18, '', {
      fontFamily: FONT, fontSize: '20px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0, 0);
    this.hint = this.add.text(this.cx, this.bottom - 20, '', {
      fontFamily: FONT, fontSize: '14px', color: C.muteS,
    }).setOrigin(0.5);

    this.space = this.input.keyboard.addKey('SPACE');
    this.leftKey = this.input.keyboard.addKey('LEFT');
    this.rightKey = this.input.keyboard.addKey('RIGHT');
    this.a = this.input.keyboard.addKey('A');
    this.d = this.input.keyboard.addKey('D');

    this.setup();
  }

  update(time, delta) {
    if (this.done) return;
    const dt = delta / 1000;
    if (this.timeLeft !== null) {
      this.timeLeft -= dt;
      this.timerBar.width = Math.max(0, (this.cardW - 40) * (this.timeLeft / this.timerTotal));
      this.timerText.setText(Math.max(0, this.timeLeft).toFixed(1));
      if (this.timeLeft <= 0) { this.timeLeft = null; this.onExpire?.(); if (this.done) return; }
    }
    this.tick(dt);
  }

  setup() {}
  tick() {}

  startTimer(seconds, onExpire) {
    this.timerTotal = seconds;
    this.timeLeft = seconds;
    this.onExpire = onExpire;
    const y = this.top + 50;
    this.add.rectangle(this.left + 20, y, this.cardW - 40, 6, C.wall).setOrigin(0, 0.5);
    this.timerBar = this.add.rectangle(this.left + 20, y, this.cardW - 40, 6, C.yellow).setOrigin(0, 0.5);
    this.timerText = this.add.text(this.right - 20, this.top + 18, '', { fontFamily: FONT, fontSize: '20px', color: C.muteS, fontStyle: 'bold' }).setOrigin(1, 0);
  }

  heldLeft() { return this.leftKey.isDown || this.a.isDown; }
  heldRight() { return this.rightKey.isDown || this.d.isDown; }
  pressedLeft() { return Phaser.Input.Keyboard.JustDown(this.leftKey) || Phaser.Input.Keyboard.JustDown(this.a); }
  pressedRight() { return Phaser.Input.Keyboard.JustDown(this.rightKey) || Phaser.Input.Keyboard.JustDown(this.d); }
  pressedSpace() { return Phaser.Input.Keyboard.JustDown(this.space); }

  // Flash a verdict, then hand the result back to GameScene.
  finish(outcome, score, label) {
    if (this.done) return;
    this.done = true;
    this.timeLeft = null;
    score = Phaser.Math.Clamp(score, 0, 1);
    const verdict = label ?? (score >= 0.9 ? 'Perfect' : score >= 0.6 ? 'Good' : score >= 0.3 ? 'Meh' : 'Poor');
    this.add.rectangle(this.cx, this.cy, 260, 80, C.bg, 0.92).setStrokeStyle(3, C.ink).setDepth(5);
    this.add.text(this.cx, this.cy, verdict, {
      fontFamily: FONT, fontSize: '40px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);
    this.time.delayedCall(550, () => this.events.emit('minigame-done', { outcome, score }));
  }
}
