// MiniGame: base class for every station mini-game.
// Launched on top of GameScene; the house keeps ticking underneath (stamina still drains).
// Subclasses implement setup() and optionally tick(dt); they call this.finish(outcome, score).
//
//   outcome : a key in balance.json stations.<stationId> (e.g. 'junk', 'cook', 'done')
//   score   : 0..1, how well the player did

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

export default class MiniGame extends Phaser.Scene {
  init(data) {
    this.stationId = data.stationId;
    this.balance = data.balance;
    this.life = data.life;
    this.cfg = this.balance.minigames[this.stationId] ?? {};
    this.done = false;
  }

  create() {
    // Card
    this.cardW = 520;
    this.cardH = 300;
    this.cx = GAME_WIDTH / 2;
    this.cy = GAME_HEIGHT / 2;
    this.add.rectangle(this.cx, this.cy, GAME_WIDTH, GAME_HEIGHT, C.ink, 0.35);
    this.add.rectangle(this.cx, this.cy, this.cardW, this.cardH, C.bg).setStrokeStyle(4, C.ink);
    this.title = this.add.text(this.cx, this.cy - this.cardH / 2 + 28, '', {
      fontFamily: FONT, fontSize: '22px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.hint = this.add.text(this.cx, this.cy + this.cardH / 2 - 24, '', {
      fontFamily: FONT, fontSize: '14px', color: C.muteS,
    }).setOrigin(0.5);

    this.space = this.input.keyboard.addKey('SPACE');
    this.left = this.input.keyboard.addKey('LEFT');
    this.right = this.input.keyboard.addKey('RIGHT');
    this.a = this.input.keyboard.addKey('A');
    this.d = this.input.keyboard.addKey('D');

    this.setup();
  }

  update(time, delta) {
    if (this.done) return;
    this.tick(delta / 1000);
  }

  setup() {}
  tick() {}

  pressedLeft() { return Phaser.Input.Keyboard.JustDown(this.left) || Phaser.Input.Keyboard.JustDown(this.a); }
  pressedRight() { return Phaser.Input.Keyboard.JustDown(this.right) || Phaser.Input.Keyboard.JustDown(this.d); }
  pressedSpace() { return Phaser.Input.Keyboard.JustDown(this.space); }

  // Flash a verdict, then hand the result back to GameScene.
  finish(outcome, score, label) {
    if (this.done) return;
    this.done = true;
    score = Phaser.Math.Clamp(score, 0, 1);
    const verdict = label ?? (score >= 0.9 ? 'Perfect' : score >= 0.6 ? 'Good' : score >= 0.3 ? 'Meh' : 'Poor');
    this.add.text(this.cx, this.cy, verdict, {
      fontFamily: FONT, fontSize: '40px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.time.delayedCall(450, () => this.events.emit('minigame-done', { outcome, score }));
  }
}
