// GameScene: the actual game. Right now it is a placeholder sandbox:
// move a circle around with WASD/arrows and collect squares.
// Replace the contents of create()/update() once the concept is decided,
// but keep the structure: data from balance.json, entities in src/entities/,
// audio through AudioManager, HUD through the Hud scene.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import Player from '../entities/Player.js';
import AudioManager from '../audio/AudioManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.levelId = data.levelId || 'level-1';
  }

  create() {
    this.balance = this.cache.json.get('balance');
    this.level = this.cache.json.get('levels')[this.levelId];
    this.audio = new AudioManager(this);
    this.score = 0;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.player = new Player(this, this.level.playerStart.x, this.level.playerStart.y, this.balance.player);

    this.pickups = this.physics.add.group();
    for (const p of this.level.pickups) {
      this.pickups.create(p.x, p.y, 'pickup');
    }

    this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
      pickup.destroy();
      this.score += this.balance.scoring.pickupValue;
      this.audio.play('pickup');
      this.events.emit('score', this.score);
      if (this.pickups.countActive() === 0) this.events.emit('level-complete');
    });

    this.scene.launch('Hud', { gameScene: this });

    this.events.once('level-complete', () => {
      this.time.delayedCall(800, () => this.scene.start('Menu'));
    });

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }

  update(time, delta) {
    this.player.update(time, delta);
  }
}
