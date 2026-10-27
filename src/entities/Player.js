// Player entity. All tunable numbers come from balance.json (passed in as `stats`).
// Pattern for new entities: extend a Phaser sprite, take a `stats` object, expose update().

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, stats) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.stats = stats;
    this.setCollideWorldBounds(true);
    this.setDrag(stats.drag);
    this.setMaxVelocity(stats.maxSpeed);

    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
    });
  }

  update() {
    const k = this.keys;
    const ax = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    const ay = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    this.setAcceleration(ax * this.stats.acceleration, ay * this.stats.acceleration);
  }
}
