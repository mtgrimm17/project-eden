// Runner: the player's movement controller. All numbers come from feel.json.
// Arcade physics handles collision; this class decides velocity every frame:
// run accel/decel with turn boost, air control, variable-height jump, coyote time,
// jump buffering, apex hang, wall slide and wall jump with input lock.
// Squash/stretch and a motion trail are here too because they are part of the feel.

import { C } from '../palette.js';

export default class Runner {
  constructor(scene, x, y, feel) {
    this.scene = scene;
    this.f = feel;

    const { width, height } = feel.body;
    // physics body (invisible) and the drawn body (squashes and stretches) are separate,
    // so feel animation never changes the collision box
    this.sprite = scene.add.rectangle(x, y, width, height).setVisible(false);
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    this.body.setAllowGravity(false); // gravity is applied here so up/down can differ
    this.body.setSize(width, height);
    this.visual = scene.add.rectangle(x, y, width, height, C.blue).setStrokeStyle(3, C.ink).setDepth(10);
    this.eye = scene.add.circle(x + 5, y - 6, 3, C.white).setDepth(11);

    this.facing = 1;
    this.coyote = 0;
    this.buffer = 0;
    this.lock = 0;          // horizontal input lock after a wall jump (ms)
    this.wallStick = 0;
    this.jumping = false;
    this.wasGrounded = false;
    this.dead = false;
    this.trail = [];

    const k = scene.input.keyboard;
    this.keys = k.addKeys({ left: 'A', right: 'D', up: 'W', jump: 'SPACE', left2: 'LEFT', right2: 'RIGHT', up2: 'UP', jump2: 'K', jump3: 'Z' });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this.body.reset(x, y);
    this.visual.setPosition(x, y);
  }

  input() {
    const k = this.keys;
    const dir = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    const jumpHeld = k.jump.isDown || k.jump2.isDown || k.jump3.isDown || k.up.isDown || k.up2.isDown;
    const jumpPressed = [k.jump, k.jump2, k.jump3, k.up, k.up2].some((key) => Phaser.Input.Keyboard.JustDown(key));
    return { dir, jumpHeld, jumpPressed };
  }

  update(dtMs) {
    if (this.dead) return;
    const f = this.f;
    const dt = dtMs / 1000;
    const b = this.body;
    const { dir, jumpHeld, jumpPressed } = this.input();
    const grounded = b.blocked.down;
    const onWallLeft = b.blocked.left && !grounded;
    const onWallRight = b.blocked.right && !grounded;

    // timers
    this.coyote = grounded ? f.jump.coyoteMs : Math.max(0, this.coyote - dtMs);
    this.buffer = jumpPressed ? f.jump.bufferMs : Math.max(0, this.buffer - dtMs);
    this.lock = Math.max(0, this.lock - dtMs);

    // ---- horizontal
    let vx = b.velocity.x;
    const inputDir = this.lock > 0 ? 0 : dir;
    if (inputDir !== 0) {
      const cfg = grounded ? f.run : f.air;
      const reversing = Math.sign(vx) === -inputDir && vx !== 0;
      const accel = cfg.accel * (reversing && grounded ? f.run.turnBoost : 1);
      vx = Phaser.Math.Clamp(vx + inputDir * accel * dt, -cfg.maxSpeed, cfg.maxSpeed);
      this.facing = inputDir;
    } else {
      const decel = grounded ? f.run.decel : f.air.decel;
      vx = Math.abs(vx) <= decel * dt ? 0 : vx - Math.sign(vx) * decel * dt;
    }

    // ---- vertical
    let vy = b.velocity.y;
    const atApex = !grounded && Math.abs(vy) < f.jump.apexThreshold && this.jumping;
    let g = vy < 0 ? f.gravity.up : f.gravity.down;
    if (atApex) g *= f.jump.apexGravityScale;
    vy += g * dt;

    // wall slide: pressing into a wall while falling
    const pressingWall = (onWallLeft && dir < 0) || (onWallRight && dir > 0);
    const sliding = pressingWall && vy > 0;
    if (sliding) vy = Math.min(vy, f.wall.slideSpeed);
    vy = Math.min(vy, f.gravity.maxFall);

    // jump: from ground/coyote, or off a wall
    const wantsJump = this.buffer > 0;
    if (wantsJump && (grounded || this.coyote > 0)) {
      vy = -f.jump.velocity;
      this.jumping = true;
      this.buffer = 0; this.coyote = 0;
      this.squash(0.75, 1.3);
      this.scene.events.emit('runner-jump');
    } else if (wantsJump && (onWallLeft || onWallRight)) {
      const away = onWallLeft ? 1 : -1;
      vx = away * f.wall.jumpVx;
      vy = -f.wall.jumpVy;
      this.lock = f.wall.lockMs;
      this.jumping = true;
      this.buffer = 0;
      this.facing = away;
      this.squash(0.8, 1.25);
      this.scene.events.emit('runner-walljump');
    }

    // variable height: release early = cut the jump short
    if (this.jumping && !jumpHeld && vy < 0) {
      vy *= f.jump.cutMultiplier;
      this.jumping = false;
    }
    if (vy >= 0) this.jumping = false;

    b.setVelocity(vx, vy);

    // landing squash
    if (grounded && !this.wasGrounded) { this.squash(1.3, 0.7); this.scene.events.emit('runner-land', Math.abs(this.lastVy)); }
    this.wasGrounded = grounded;
    this.lastVy = vy;

    // looks
    this.visual.setPosition(this.sprite.x, this.sprite.y);
    this.eye.setPosition(this.sprite.x + this.facing * 5, this.sprite.y - 6);
    this.visual.scaleX += (1 - this.visual.scaleX) * 0.2;
    this.visual.scaleY += (1 - this.visual.scaleY) * 0.2;
    this.visual.fillColor = sliding ? C.green : C.blue;
    this.updateTrail();
  }

  squash(sx, sy) {
    this.visual.setScale(sx, sy);
  }

  updateTrail() {
    const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (speed > 250) {
      const ghost = this.scene.add.rectangle(this.sprite.x, this.sprite.y, this.f.body.width, this.f.body.height, C.blue, 0.25).setDepth(9);
      this.scene.tweens.add({ targets: ghost, alpha: 0, scaleX: 0.6, scaleY: 0.6, duration: 220, onComplete: () => ghost.destroy() });
    }
  }

  die() {
    this.dead = true;
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.visual.setVisible(false);
    this.eye.setVisible(false);
  }

  revive(x, y) {
    this.dead = false;
    this.body.enable = true;
    this.setPosition(x, y);
    this.visual.setPosition(x, y).setVisible(true).setScale(1);
    this.eye.setVisible(true);
    this.coyote = 0; this.buffer = 0; this.lock = 0; this.jumping = false;
  }
}
