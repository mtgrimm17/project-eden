// Player entity: the human you're currently living as. Tunables come from balance.json `player`.
// Pattern for new entities: extend a Phaser sprite, take a `stats` object, expose update().

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.stats = { ...stats, maxSpeedBase: stats.maxSpeed };
    this.frozen = false;
    this.facing = { x: 0, y: 1 }; // last movement direction; throws go this way
    this.setCollideWorldBounds(true);
    this.setCircle(16);
    if (stats.movement === 'floaty') {
      this.setDrag(stats.drag);
      this.setMaxVelocity(stats.maxSpeed);
    }

    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
    });
  }

  isMoving() {
    return Math.abs(this.body.velocity.x) > 1 || Math.abs(this.body.velocity.y) > 1;
  }

  update() {
    if (this.frozen) {
      this.setVelocity(0, 0);
      this.setAcceleration(0, 0);
      return;
    }
    const k = this.keys;
    const ax = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    const ay = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    if (ax || ay) { const l = Math.hypot(ax, ay); this.facing = { x: ax / l, y: ay / l }; }

    if (this.stats.movement === 'floaty') {
      this.setAcceleration(ax * this.stats.acceleration, ay * this.stats.acceleration);
    } else {
      const len = Math.hypot(ax, ay) || 1;
      this.setVelocity((ax / len) * this.stats.maxSpeed, (ay / len) * this.stats.maxSpeed);
    }
  }
}
