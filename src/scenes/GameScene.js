// GameScene: one year of a life, inside the house.
// Walk between stations, press SPACE to use one (opens a mini-game scene on top).
// Stamina is the round clock: when it hits 0 the year ends and ResultsScene takes over.
// Numbers live in balance.json; layout in house.json; narrator lines in narrator.json.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';
import Player from '../entities/Player.js';
import AudioManager from '../audio/AudioManager.js';
import Narrator from '../narrator/Narrator.js';
import Life from '../sim/Life.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.balance = this.cache.json.get('balance');
    this.house = this.cache.json.get('house');
    this.audio = new AudioManager(this);
    this.cameras.main.setBackgroundColor(C.bg);

    // One Life persists across years via the registry. Menu clears it for a new run.
    this.life = this.registry.get('life');
    if (!this.life) {
      this.life = new Life(this.balance);
      this.registry.set('life', this.life);
    }
    this.life.startYear();

    this.drawHouse();
    this.player = new Player(this, this.house.playerStart.x, this.house.playerStart.y, this.balance.player);
    this.player.setDepth(10);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.interactKey = this.input.keyboard.addKey('SPACE');
    this.interactKey2 = this.input.keyboard.addKey('E');
    this.input.keyboard.on('keydown-ESC', () => this.endYear('quit'));

    this.narrator = new Narrator(this, this.cache.json.get('narrator'), this.balance.narrator);
    this.scene.launch('Hud', { gameScene: this });
    this.events.once('shutdown', () => this.scene.stop('Hud'));

    this.inMinigame = false;
    this.nearStation = null;
    this.idleSeconds = 0;
    this.ending = false;

    this.time.delayedCall(600, () => this.narrator.say(this.life.year === 1 ? 'run-start' : 'year-start'));
  }

  drawHouse() {
    const g = this.add.graphics();
    for (const r of this.house.rooms) {
      g.fillStyle(C.floor, 1).fillRoundedRect(r.x, r.y, r.w, r.h, 10);
      g.lineStyle(4, C.wall, 1).strokeRoundedRect(r.x, r.y, r.w, r.h, 10);
      this.add.text(r.x + 12, r.y + 8, r.name.toUpperCase(), {
        fontFamily: FONT, fontSize: '11px', color: C.muteS, fontStyle: 'bold',
      });
    }

    this.stations = this.house.stations.map((s) => {
      const color = C[s.color] ?? C.ink;
      const rect = this.add.rectangle(s.x, s.y, s.w, s.h, color).setStrokeStyle(3, C.ink);
      const glyph = this.add.text(s.x, s.y, s.glyph, {
        fontFamily: FONT, fontSize: '28px', color: C.whiteS,
      }).setOrigin(0.5);
      const prompt = this.add.text(s.x, s.y - s.h / 2 - 16, `SPACE · ${s.prompt}`, {
        fontFamily: FONT, fontSize: '13px', color: C.inkS, fontStyle: 'bold',
        backgroundColor: C.bgS, padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setVisible(false).setDepth(20);
      return { ...s, rect, glyph, prompt };
    });
  }

  update(time, delta) {
    if (this.ending) return;
    const dt = delta / 1000;

    this.life.tick(dt);
    this.narrator.update(dt, this.life, this.inMinigame);

    if (!this.life.alive) return this.endYear('death');
    if (this.life.isYearOver()) return this.endYear('sleep');

    if (this.inMinigame) return;
    this.player.update();

    this.idleSeconds = this.player.isMoving() ? 0 : this.idleSeconds + dt;
    if (this.idleSeconds > this.balance.narrator.idleSeconds) {
      this.narrator.say('idle');
      this.idleSeconds = 0;
    }

    this.updateNearStation();
    if (this.nearStation && (Phaser.Input.Keyboard.JustDown(this.interactKey) || Phaser.Input.Keyboard.JustDown(this.interactKey2))) {
      this.openMinigame(this.nearStation);
    }
  }

  updateNearStation() {
    const r = this.balance.player.interactRadius;
    let best = null;
    let bestD = Infinity;
    for (const s of this.stations) {
      const dx = Math.max(Math.abs(this.player.x - s.x) - s.w / 2, 0);
      const dy = Math.max(Math.abs(this.player.y - s.y) - s.h / 2, 0);
      const d = Math.hypot(dx, dy);
      if (d < r && d < bestD) { best = s; bestD = d; }
    }
    if (best !== this.nearStation) {
      if (this.nearStation) this.nearStation.prompt.setVisible(false);
      if (best) best.prompt.setVisible(true);
      this.nearStation = best;
    }
  }

  openMinigame(station) {
    this.inMinigame = true;
    this.player.frozen = true;
    this.player.update();
    this.audio.play('ui-select');
    this.scene.launch(station.minigame, { stationId: station.id, balance: this.balance, life: this.life });
    const mg = this.scene.get(station.minigame);
    mg.events.once('minigame-done', (result) => this.closeMinigame(station, result));
  }

  // result: { outcome: 'junk' | 'cook' | 'done', score: 0..1 }
  closeMinigame(station, result) {
    this.scene.stop(station.minigame);
    this.inMinigame = false;
    this.player.frozen = false;

    const effects = this.balance.stations[station.id]?.[result.outcome];
    if (effects) {
      const changes = this.life.apply(effects, result.score);
      this.events.emit('resource-change', { stationId: station.id, outcome: result.outcome, score: result.score, changes });
    }
    const ys = this.life.yearStats;
    if (station.id === 'fridge') result.outcome === 'junk' ? ys.junk++ : ys.cooked++;
    if (station.id === 'shower') ys.showers++;
    if (station.id === 'bookshelf') ys.reads++;

    this.audio.play(result.score >= 0.6 ? 'good' : 'meh');
    this.narrator.say(`${station.id}-${result.outcome}`);
  }

  endYear(reason) {
    if (this.ending) return;
    this.ending = true;
    this.player.frozen = true;
    this.player.update();
    for (const s of this.stations) this.scene.stop(s.minigame);
    this.life.endYear();
    this.audio.play(reason === 'death' ? 'death' : 'sleep');

    if (reason === 'death') {
      this.scene.start('GameOver', { life: this.life });
    } else if (reason === 'quit') {
      this.registry.remove('life');
      this.scene.start('Menu');
    } else {
      this.scene.start('Results', { life: this.life });
    }
  }
}
