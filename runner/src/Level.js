// Level: parses the text rows into tiles, builds the static physics bodies and the drawing.
// Also the editable model behind the editor: set(col, row, char) and rows() to export.

import { TILE } from './config.js';
import { C, FONT } from './palette.js';

export const LEGEND = { '#': 'solid', '^': 'spike', '$': 'gold', 'S': 'start', 'E': 'exit', '.': 'empty' };

export default class Level {
  constructor(scene, data) {
    this.scene = scene;
    this.name = data.name ?? 'untitled';
    this.grid = data.rows.map((r) => r.split(''));
    this.h = this.grid.length;
    this.w = Math.max(...this.grid.map((r) => r.length));
    for (const r of this.grid) while (r.length < this.w) r.push('.');

    // Solids are a tilemap layer: Arcade's tile collision handles the seams between tiles,
    // so a player sliding up a wall or along a floor never snags on tile edges.
    if (!scene.textures.exists('tile-solid')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(C.ink, 1).fillRect(0, 0, TILE, TILE);
      g.generateTexture('tile-solid', TILE, TILE);
      g.destroy();
    }
    this.map = scene.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: this.w, height: this.h });
    const tiles = this.map.addTilesetImage('tile-solid', 'tile-solid', TILE, TILE, 0, 0);
    this.layer = this.map.createBlankLayer('solids', tiles).setDepth(1);
    this.solids = this.layer;

    this.spikes = scene.physics.add.staticGroup();
    this.golds = scene.physics.add.staticGroup();
    this.exits = scene.physics.add.staticGroup();
    this.gfx = scene.add.graphics().setDepth(1);
    this.goldObjs = [];
    this.rebuild();
  }

  get solidCount() {
    let n = 0;
    for (const row of this.grid) for (const ch of row) if (ch === '#') n += 1;
    return n;
  }

  get pixelWidth() { return this.w * TILE; }
  get pixelHeight() { return this.h * TILE; }

  at(c, r) { return this.grid[r]?.[c] ?? '#'; }

  set(c, r, ch) {
    if (r < 0 || r >= this.h || c < 0 || c >= this.w) return;
    if (ch === 'S' || ch === 'E') { // only one start / exit
      for (const row of this.grid) for (let i = 0; i < row.length; i++) if (row[i] === ch) row[i] = '.';
    }
    this.grid[r][c] = ch;
  }

  rows() { return this.grid.map((r) => r.join('')); }

  find(ch) {
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) if (this.grid[r][c] === ch) return { c, r, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
    return null;
  }

  // Rebuild bodies and drawing from the grid (called after editing).
  rebuild() {
    for (const g of [this.spikes, this.golds, this.exits]) g.clear(true, true);
    this.goldObjs = [];
    const gfx = this.gfx.clear();
    gfx.fillStyle(C.ink, 1);

    for (let r = 0; r < this.h; r++) {
      for (let c = 0; c < this.w; c++) {
        const ch = this.grid[r][c];
        const x = c * TILE; const y = r * TILE;
        if (ch === '#') this.map.putTileAt(0, c, r, false, this.layer);
        else this.map.removeTileAt(c, r, true, false, this.layer);
        if (ch === '^') {
          gfx.fillStyle(C.red, 1).fillTriangle(x + 2, y + TILE, x + TILE / 2, y + 6, x + TILE - 2, y + TILE).fillStyle(C.ink, 1);
          const body = this.scene.add.zone(x + TILE / 2, y + TILE * 0.7, TILE * 0.6, TILE * 0.5);
          this.spikes.add(body);
        } else if (ch === '$') {
          const coin = this.scene.add.circle(x + TILE / 2, y + TILE / 2, 7, C.yellow).setStrokeStyle(2, C.ink).setDepth(2);
          this.golds.add(coin);
          this.goldObjs.push(coin);
        } else if (ch === 'E') {
          gfx.lineStyle(3, C.green, 1).strokeRect(x + 4, y + 2, TILE - 8, TILE - 2).lineStyle(0);
          gfx.fillStyle(C.green, 0.25).fillRect(x + 4, y + 2, TILE - 8, TILE - 2).fillStyle(C.ink, 1);
          const body = this.scene.add.zone(x + TILE / 2, y + TILE / 2, TILE - 8, TILE - 2);
          this.exits.add(body);
        }
      }
    }
    this.layer.setCollision(0, true, true);
    for (const g of [this.spikes, this.golds, this.exits]) g.refresh();
  }
}
