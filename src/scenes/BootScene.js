// BootScene: runs first. Loads the data files, launches the version badge, hands off to Preload.

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.json('balance', 'src/data/balance.json');
    this.load.json('house', 'src/data/house.json');
    this.load.json('narrator', 'src/data/narrator.json');
  }

  create() {
    this.scene.launch('Version'); // persistent version badge, never stopped
    this.scene.start('Preload');
  }
}
