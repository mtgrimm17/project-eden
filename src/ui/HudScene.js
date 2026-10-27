// HudScene: overlay drawn on top of GameScene (score, prompts, etc).
// It listens to events emitted by the game scene rather than reaching into it.

import { GAME_WIDTH } from '../config.js';

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    const style = { fontFamily: 'monospace', fontSize: '20px', color: '#e8e6e3' };
    this.scoreText = this.add.text(16, 12, 'SCORE 0', style);
    this.add.text(GAME_WIDTH - 16, 12, 'WASD / arrows to move   ESC menu', { ...style, fontSize: '14px', color: '#9a9aa5' }).setOrigin(1, 0);

    this.gameScene.events.on('score', (s) => this.scoreText.setText(`SCORE ${s}`));
    this.gameScene.events.once('level-complete', () => {
      this.add.text(GAME_WIDTH / 2, 80, 'LEVEL COMPLETE', { ...style, fontSize: '32px' }).setOrigin(0.5);
    });
    this.gameScene.events.once('shutdown', () => this.scene.stop());
  }
}
