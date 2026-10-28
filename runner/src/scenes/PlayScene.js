// PlayScene: one level. Run, jump, wall-slide, wall-jump; spikes kill instantly and you respawn
// at the start; gold takes time off the clock; touch the exit to finish. TAB opens the editor.
//
//   Move      A/D or ←/→          Jump   SPACE / W / ↑ / K / Z (hold for height, release to cut)
//   Restart   R                   Editor TAB

import { GAME_WIDTH, GAME_HEIGHT, TILE } from '../config.js';
import { C, FONT } from '../palette.js';
import Level from '../Level.js';
import Runner from '../entities/Runner.js';
import Editor from '../Editor.js';

const SAVE_KEY = 'eden-runner-level';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  create() {
    this.feel = this.cache.json.get('feel');
    this.cameras.main.setBackgroundColor(C.bg);

    const saved = this.loadSaved();
    this.level = new Level(this, saved ?? this.cache.json.get('level1'));
    this.physics.world.setBounds(0, 0, this.level.pixelWidth, this.level.pixelHeight);

    const start = this.level.find('S') ?? { x: TILE * 2, y: TILE * 2 };
    this.runner = new Runner(this, start.x, start.y, this.feel);
    this.physics.add.collider(this.runner.sprite, this.level.solids);
    this.physics.add.overlap(this.runner.sprite, this.level.spikes, () => this.die());
    this.physics.add.overlap(this.runner.sprite, this.level.golds, (_r, coin) => this.collect(coin));
    this.physics.add.overlap(this.runner.sprite, this.level.exits, () => this.finish());

    this.cameras.main.setBounds(0, 0, this.level.pixelWidth, this.level.pixelHeight);
    this.cameras.main.startFollow(this.runner.sprite, true, this.feel.camera.lerp, this.feel.camera.lerp);

    this.elapsed = 0;
    this.deaths = 0;
    this.gold = 0;
    this.finished = false;
    this.running = true;

    this.hud = this.add.text(12, 10, '', { fontFamily: FONT, fontSize: '16px', color: C.inkS, fontStyle: 'bold' }).setScrollFactor(0).setDepth(100);
    this.hint = this.add.text(GAME_WIDTH - 12, 10, 'A/D move · SPACE jump · R restart · TAB edit', { fontFamily: FONT, fontSize: '12px', color: C.muteS }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', { fontFamily: FONT, fontSize: '36px', color: C.inkS, fontStyle: 'bold', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    this.events.on('runner-land', (v) => { if (v > 500) this.cameras.main.shake(60, 0.004); });

    this.input.keyboard.on('keydown-R', () => this.restart());
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault(); this.editor.toggle(); });
    this.editor = new Editor(this, this.level, { onChange: () => this.onLevelEdited(), saveKey: SAVE_KEY });
  }

  loadSaved() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  update(time, delta) {
    if (this.editor.active) { this.editor.update(delta); return; }
    if (!this.running) return;
    this.elapsed += delta / 1000;
    this.runner.update(delta);
    // camera look-ahead
    const cam = this.cameras.main;
    cam.followOffset.x += ((-this.runner.facing * this.feel.camera.lookAhead) - cam.followOffset.x) * 0.05;
    if (this.runner.y > this.level.pixelHeight + 60) this.die();
    this.hud.setText(`${this.elapsed.toFixed(2)}s   ★ ${this.gold}   ✕ ${this.deaths}`);
  }

  die() {
    if (this.runner.dead || this.finished) return;
    this.deaths += 1;
    this.burst(this.runner.x, this.runner.y, C.blue, 14);
    this.cameras.main.shake(120, 0.008);
    this.runner.die();
    this.time.delayedCall(this.feel.respawnMs, () => {
      const s = this.level.find('S') ?? { x: TILE * 2, y: TILE * 2 };
      this.runner.revive(s.x, s.y);
    });
  }

  collect(coin) {
    coin.destroy();
    this.gold += 1;
    this.elapsed = Math.max(0, this.elapsed - this.feel.goldTimeBonusSeconds);
    this.burst(coin.x, coin.y, C.yellow, 8);
    const t = this.add.text(coin.x, coin.y - 10, `-${this.feel.goldTimeBonusSeconds.toFixed(1)}s`, { fontFamily: FONT, fontSize: '14px', color: C.inkS, fontStyle: 'bold' }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: coin.y - 40, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.runner.body.setVelocity(0, 0);
    this.banner.setText(`${this.level.name}\n${this.elapsed.toFixed(2)}s   ★ ${this.gold}   ✕ ${this.deaths}\n\nR to run it again`).setVisible(true);
  }

  restart() {
    this.scene.restart();
  }

  onLevelEdited() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ name: this.level.name, rows: this.level.rows() })); } catch {}
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const p = this.add.rectangle(x, y, 6, 6, color).setDepth(20);
      const a = Math.random() * Math.PI * 2; const s = 80 + Math.random() * 180;
      this.tweens.add({ targets: p, x: x + Math.cos(a) * s, y: y + Math.sin(a) * s, alpha: 0, scale: 0.3, duration: 350 + Math.random() * 200, onComplete: () => p.destroy() });
    }
  }
}
