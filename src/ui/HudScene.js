// HudScene: overlay on GameScene. Three bars (current inside max), age/year, narrator text.
// It reads the Life from the game scene each frame and listens for events; it never mutates state.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT, RESOURCE_COLORS } from '../palette.js';

const BAR_X = 20;
const BAR_Y = 16;
const BAR_H = 14;
const BAR_SCALE = 2.2; // pixels per point of max
const BAR_GAP = 24;

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.life = this.gameScene.life;
    this.bars = {};
    let y = BAR_Y;
    for (const key of ['stamina', 'hunger', 'sanity']) {
      const col = RESOURCE_COLORS[key];
      const glyph = this.add.text(BAR_X, y + BAR_H / 2, col.glyph, { fontFamily: FONT, fontSize: '16px', color: col.str, fontStyle: 'bold' }).setOrigin(0, 0.5);
      const maxRect = this.add.rectangle(BAR_X + 26, y, 10, BAR_H, C.wall).setOrigin(0, 0).setStrokeStyle(2, C.ink);
      const curRect = this.add.rectangle(BAR_X + 26, y, 10, BAR_H, col.fill).setOrigin(0, 0);
      const label = this.add.text(BAR_X + 26, y + BAR_H / 2, '', { fontFamily: FONT, fontSize: '11px', color: C.muteS }).setOrigin(0, 0.5);
      this.bars[key] = { glyph, maxRect, curRect, label };
      y += BAR_GAP;
    }

    this.ageText = this.add.text(GAME_WIDTH - 20, 16, '', { fontFamily: FONT, fontSize: '22px', color: C.inkS, fontStyle: 'bold' }).setOrigin(1, 0);
    this.yearText = this.add.text(GAME_WIDTH - 20, 44, '', { fontFamily: FONT, fontSize: '12px', color: C.muteS }).setOrigin(1, 0);

    this.narratorBox = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 34, 760, 44, C.ink, 0.92).setVisible(false);
    this.narratorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, '', {
      fontFamily: FONT, fontSize: '15px', color: C.whiteS, wordWrap: { width: 720 }, align: 'center',
    }).setOrigin(0.5).setVisible(false);

    this.gameScene.events.on('narrate', this.showNarration, this);
    this.gameScene.events.on('resource-change', this.showChange, this);
    this.gameScene.events.once('shutdown', () => this.scene.stop());
  }

  update() {
    for (const [key, b] of Object.entries(this.bars)) {
      const r = this.life.res[key];
      const maxW = Math.max(6, r.max * BAR_SCALE);
      const curW = Math.max(0, r.cur * BAR_SCALE);
      b.maxRect.width = maxW;
      b.curRect.width = curW;
      b.label.x = BAR_X + 26 + maxW + 8;
      b.label.setText(`${Math.ceil(r.cur)} / ${Math.round(r.max)}`);
      if (key !== 'stamina') b.curRect.fillColor = r.cur <= 0 ? C.ink : RESOURCE_COLORS[key].fill;
    }
    this.ageText.setText(`AGE ${this.life.age}`);
    this.yearText.setText(`year ${this.life.year}`);
  }

  showNarration({ text }) {
    this.narratorBox.setVisible(true);
    this.narratorText.setVisible(true).setText('');
    this.tweens.killTweensOf(this.narratorBox);
    this.narratorBox.alpha = 1;
    this.narratorText.alpha = 1;
    // typewriter
    let i = 0;
    if (this.typer) this.typer.remove();
    this.typer = this.time.addEvent({
      delay: 14, repeat: text.length - 1,
      callback: () => { i += 1; this.narratorText.setText(text.slice(0, i)); },
    });
    this.time.delayedCall(3800 + text.length * 14, () => {
      this.tweens.add({ targets: [this.narratorBox, this.narratorText], alpha: 0, duration: 400 });
    });
  }

  // Floating "+30 ♥  max −6" near the top bars.
  showChange({ changes }) {
    const parts = [];
    for (const [key, c] of Object.entries(changes)) {
      const g = RESOURCE_COLORS[key].glyph;
      if (Math.abs(c.cur) >= 1) parts.push(`${c.cur > 0 ? '+' : ''}${Math.round(c.cur)} ${g}`);
      if (c.max) parts.push(`max ${c.max > 0 ? '+' : ''}${c.max} ${g}`);
    }
    if (!parts.length) return;
    const t = this.add.text(BAR_X + 300, BAR_Y + 30, parts.join('   '), {
      fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1400, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  }
}
