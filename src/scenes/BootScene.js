// BootScene: runs first. Loads the tiny things needed to draw a loading bar,
// then hands off to PreloadScene. You will rarely need to edit this.

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.json('balance', 'src/data/balance.json');
    this.load.json('levels', 'src/data/levels.json');
  }

  create() {
    this.scene.launch('Version'); // persistent version badge, never stopped
    this.scene.start('Preload');
  }
}
