// VersionScene: tiny always-on overlay showing the build version bottom-right.
// Started once by BootScene and never stopped, so it's visible in every scene.
// It is last in the scene list in main.js, which keeps it drawn on top.

import { GAME_WIDTH, GAME_HEIGHT, VERSION } from '../config.js';
import { C, FONT } from '../palette.js';

export default class VersionScene extends Phaser.Scene {
  constructor() {
    super('Version');
  }

  create() {
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 6, `v${VERSION}`, {
      fontFamily: FONT, fontSize: '12px', color: C.muteS,
    }).setOrigin(1).setDepth(1000);
  }
}
