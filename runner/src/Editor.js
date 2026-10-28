// Editor: press TAB in play to paint the level. No code needed to make levels.
//
//   1 solid   2 spike   3 gold   4 start   5 exit   0 / right-click erase
//   left-drag paints · arrow keys / WASD scroll · TAB back to play (level restarts from start)
//   X exports the level as a JSON file (drop it in runner/src/data/ and point main.js at it)
//   C clears the saved copy and reloads the file version
//
// Edits autosave in this browser (localStorage) so a designer can iterate for an hour, then export.

import { GAME_WIDTH, GAME_HEIGHT, TILE } from './config.js';
import { C, FONT } from './palette.js';

const TOOLS = { ONE: '#', TWO: '^', THREE: '$', FOUR: 'S', FIVE: 'E', ZERO: '.' };
const NAMES = { '#': 'solid', '^': 'spike', '$': 'gold', 'S': 'start', 'E': 'exit', '.': 'erase' };

export default class Editor {
  constructor(scene, level, { onChange, saveKey }) {
    this.scene = scene;
    this.level = level;
    this.onChange = onChange;
    this.saveKey = saveKey;
    this.active = false;
    this.tool = '#';

    this.grid = scene.add.graphics().setDepth(90).setVisible(false);
    this.cursor = scene.add.rectangle(0, 0, TILE, TILE).setStrokeStyle(2, C.blue).setDepth(91).setVisible(false);
    this.cursor.isFilled = false;
    this.panel = scene.add.text(12, GAME_HEIGHT - 12, '', { fontFamily: FONT, fontSize: '13px', color: C.whiteS, backgroundColor: C.inkS, padding: { x: 10, y: 6 } }).setOrigin(0, 1).setScrollFactor(0).setDepth(100).setVisible(false);

    const k = scene.input.keyboard;
    this.keys = k.addKeys({ ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', FIVE: 'FIVE', ZERO: 'ZERO', X: 'X', C: 'C', left: 'A', right: 'D', up: 'W', down: 'S', left2: 'LEFT', right2: 'RIGHT', up2: 'UP', down2: 'DOWN' });
    scene.input.on('pointerdown', (p) => this.active && this.paint(p));
    scene.input.on('pointermove', (p) => this.active && p.isDown && this.paint(p));
    scene.input.mouse?.disableContextMenu();
  }

  toggle() {
    this.active = !this.active;
    const s = this.scene;
    if (this.active) {
      s.physics.world.pause();
      s.cameras.main.stopFollow();
      this.drawGrid();
      this.grid.setVisible(true); this.cursor.setVisible(true); this.panel.setVisible(true);
      s.hint.setText('EDITING · TAB to play');
    } else {
      s.physics.world.resume();
      this.grid.setVisible(false); this.cursor.setVisible(false); this.panel.setVisible(false);
      s.scene.restart();
    }
  }

  drawGrid() {
    const g = this.grid.clear().lineStyle(1, C.ink, 0.08);
    for (let c = 0; c <= this.level.w; c++) g.lineBetween(c * TILE, 0, c * TILE, this.level.pixelHeight);
    for (let r = 0; r <= this.level.h; r++) g.lineBetween(0, r * TILE, this.level.pixelWidth, r * TILE);
  }

  update(delta) {
    const k = this.keys;
    for (const [name, ch] of Object.entries(TOOLS)) if (Phaser.Input.Keyboard.JustDown(k[name])) this.tool = ch;
    if (Phaser.Input.Keyboard.JustDown(k.X)) this.exportJson();
    if (Phaser.Input.Keyboard.JustDown(k.C)) this.clearSaved();

    const cam = this.scene.cameras.main;
    const v = 600 * delta / 1000;
    const dx = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    const dy = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    cam.scrollX += dx * v; cam.scrollY += dy * v;

    const p = this.scene.input.activePointer;
    const c = Math.floor(p.worldX / TILE); const r = Math.floor(p.worldY / TILE);
    this.cursor.setPosition(c * TILE + TILE / 2, r * TILE + TILE / 2);
    this.panel.setText(`EDITOR   tool: ${NAMES[this.tool]}   1 solid · 2 spike · 3 gold · 4 start · 5 exit · 0 erase · right-click erase   X export · C reset to file   WASD scroll`);
  }

  paint(p) {
    const c = Math.floor(p.worldX / TILE); const r = Math.floor(p.worldY / TILE);
    const ch = p.rightButtonDown() ? '.' : this.tool;
    if (this.level.at(c, r) === ch) return;
    this.level.set(c, r, ch);
    this.level.rebuild();
    this.onChange?.();
  }

  exportJson() {
    const data = JSON.stringify({ name: this.level.name, rows: this.level.rows() }, null, 2);
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.level.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
    } catch { console.log(data); }
  }

  clearSaved() {
    try { localStorage.removeItem(this.saveKey); } catch {}
    this.active = false;
    this.scene.scene.restart();
  }
}
