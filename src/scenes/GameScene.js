// GameScene: continuous years, Overcooked-style, with two hands.
//
//   Move           WASD / arrows
//   Left hand      mouse LEFT button      (keyboard: Q grab/drop, E throw)
//   Right hand     mouse RIGHT button     (keyboard: J grab/drop, L throw)
//   Press          grab what you're next to (instant)
//   Release        in place = drop (into the container you're next to, or the floor)
//                  after moving the cursor = throw to where the cursor is
//
// There is no "use". Drop a cold bottle in the microwave and it warms on its own. Drop dishes in
// the sink and they wash. Hold the baby in one hand and a warm bottle in the other and it feeds
// over a few seconds while you keep walking; baby + clean diaper changes the same way.
//
// Demands arrive as tickets. The kid's need for attention rises while not held (its colour goes
// green → yellow → red); neglected, it cries (baby), heads for a hazard (toddler) or climbs and
// jumps / tips the bin (kid). See balance.json baby.phases. Years roll over in place.
// Numbers: balance.json. Layout, stations, items: house.json.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';
import Player from '../entities/Player.js';
import Station from '../entities/Station.js';
import Baby from '../entities/Baby.js';
import Demands from '../sim/Demands.js';
import AudioManager from '../audio/AudioManager.js';

const BABY_TYPES = ['feed', 'change', 'soothe'];
export const HANDS = ['L', 'R'];
const KEYS = { L: { grab: 'Q', throw: 'E' }, R: { grab: 'J', throw: 'L' } };
const COMBOS = [
  { with: 'bottle-warm', secondsKey: 'feedSeconds', result: 'bottle-empty', demand: 'feed', label: 'feeding' },
  { with: 'diaper-clean', secondsKey: 'changeSeconds', result: 'diaper-dirty', demand: 'change', label: 'changing' },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.balance = this.cache.json.get('balance');
    this.house = this.cache.json.get('house');
    this.items = this.house.items;
    this.audio = new AudioManager(this);
    this.cameras.main.setBackgroundColor(C.bg);

    this.year = 1;
    this.history = [];
    this.registry.set('history', this.history);

    this.drawRooms();
    this.stations = this.house.stations.map((d) => new Station(this, d));
    for (const s of this.stations) s.onDone = () => this.audio.play('good');
    this.crib = this.stations.find((s) => s.type === 'baby');
    this.hazards = [];
    this.baby = new Baby(this, this.balance.baby, this.crib, this.hazards);
    this.baby.onDropToy = (x, y) => this.spawnMess('toy', x, y);
    this.baby.onTrouble = (kind, station) => this.babyTrouble(kind, station);

    this.player = new Player(this, this.house.playerStart.x, this.house.playerStart.y, this.balance.player);
    this.player.setDepth(10);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.hands = { L: null, R: null };
    this.handIcons = {
      L: this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11),
      R: this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11),
    };
    this.comboRing = this.add.graphics().setDepth(12);
    this.combo = null; // { hand (item hand), babyHand, def, elapsed }
    this.floorItems = [];
    this.throws = [];
    this.aim = null; // { hand, startX, startY, line }
    this.aimLine = this.add.graphics().setDepth(13);
    this.messTimers = { clothes: this.balance.mess.clothesEverySeconds, trash: this.balance.mess.trashEverySeconds };

    this.demands = new Demands(this.balance.demands, this.year);
    this.applyYear();
    this.timeLeft = this.balance.round.seconds;
    this.score = 0;
    this.yearScoreStart = 0;
    this.yearCarryStart = 0;
    this.yearStatsStart = { ...this.demands.stats };
    this.sootheTime = 0;
    this.focus = null;
    this.focusPrompt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '13px', color: C.inkS, fontStyle: 'bold', backgroundColor: C.bgS, padding: { x: 6, y: 3 }, align: 'center',
    }).setOrigin(0.5, 1).setVisible(false).setDepth(20);

    this.keys = {};
    for (const h of HANDS) {
      this.keys[h] = { grab: this.input.keyboard.addKey(KEYS[h].grab), throw: this.input.keyboard.addKey(KEYS[h].throw) };
    }
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));

    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => this.pointerDown(p));
    this.input.on('pointerup', (p) => this.pointerUp(p));

    this.scene.launch('Hud', { gameScene: this });
    this.events.once('shutdown', () => this.scene.stop('Hud'));
  }

  // The difficulty ramp: stations, demands, mobility and mess unlock by the kid's year.
  // Returns the names of things that just unlocked (for the year pane).
  applyYear() {
    const y = this.year;
    const unlocked = [];
    for (const s of this.stations) {
      const on = (s.fromYear ?? 1) <= y;
      if (on && !s.active) { if (y > 1) unlocked.push(s.name.toLowerCase()); }
      s.setActive(on);
    }
    this.hazards.length = 0;
    this.hazards.push(...this.stations.filter((s) => s.hazard && s.active));
    this.baby.climbables = this.stations.filter((s) => s.climbable && s.active);
    this.baby.tippables = this.stations.filter((s) => s.tippable && s.active);
    this.demands.setYear(y);
    const phase = [...this.balance.baby.phases].reverse().find((p) => p.fromYear <= y) ?? this.balance.baby.phases[0];
    if (this.baby.setPhase(phase) && y > 1) unlocked.push(`${phase.name}: ${phase._trouble?.split('=')[1]?.trim() ?? phase.trouble}`);
    this.baby.toysOn = !!phase.dropsToys;
    return unlocked;
  }

  // The kid did something because nobody was paying attention.
  babyTrouble(kind, station) {
    if (!this.demands.has('soothe')) this.demands.spawn('soothe');
    this.baby.unmet.soothe = true;
    if (kind === 'tip' && station) {
      const n = this.baby.phase.trashSpill ?? 3;
      for (let i = 0; i < n; i++) this.spawnMess('trash', station.x + Phaser.Math.Between(-70, 70), station.y + Phaser.Math.Between(-40, 30));
      this.flashAt(station.x, station.y - 30, 'CRASH', C.redS);
    } else if (kind === 'climb' && station) {
      this.flashAt(station.x, station.y - 30, 'THUD', C.redS);
    } else if (kind === 'hazard' && station) {
      this.flashAt(station.x, station.y - 30, '!', C.redS);
    }
    this.audio.play('meh');
  }

  drawRooms() {
    const g = this.add.graphics();
    for (const r of this.house.rooms) {
      g.fillStyle(C.floor, 1).fillRoundedRect(r.x, r.y, r.w, r.h, 12);
      g.lineStyle(4, C.wall, 1).strokeRoundedRect(r.x, r.y, r.w, r.h, 12);
    }
  }

  // ------------------------------------------------------------------ hands
  handWith(key) { return HANDS.find((h) => this.hands[h] === key) ?? null; }
  freeHand() { return HANDS.find((h) => !this.hands[h]) ?? null; }
  bothFree() { return !this.hands.L && !this.hands.R; }
  carryingBaby() { return this.handWith('baby') !== null; }
  isTwoHanded(key) { return (this.items[key]?.hands ?? 1) === 2; }

  take(hand, key) {
    if (this.isTwoHanded(key)) {
      if (!this.bothFree()) return false;
      this.hands.L = key; this.hands.R = key;
    } else {
      if (this.hands[hand]) return false;
      this.hands[hand] = key;
    }
    this.refreshHandIcons();
    return true;
  }

  release(hand) {
    const key = this.hands[hand];
    if (!key) return null;
    if (this.isTwoHanded(key)) { this.hands.L = null; this.hands.R = null; } else this.hands[hand] = null;
    this.refreshHandIcons();
    return key;
  }

  refreshHandIcons() {
    for (const h of HANDS) {
      const key = this.hands[h];
      const it = key ? this.items[key] : null;
      this.handIcons[h].setText(it ? it.glyph : '').setColor(it ? (C[`${it.color}S`] ?? C.inkS) : C.inkS);
    }
  }

  // ------------------------------------------------------------------ loop
  update(time, delta) {
    const dt = delta / 1000;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this.rolloverYear();

    for (const s of this.stations) s.update(dt, this.items);
    this.updateMessSpawns(dt);
    const { expired } = this.demands.update(dt);
    for (const t of expired) {
      this.score += this.balance.scoring.expire;
      if (BABY_TYPES.includes(t.type)) this.baby.unmet[t.type] = true;
      this.events.emit('ticket-expired', t);
      this.audio.play('meh');
    }

    this.baby.update(dt, this.player.x, this.player.y);
    if (this.baby.state === 'danger') this.score += this.balance.baby.dangerPenaltyPerSecond * dt;
    if (this.baby.isCrying()) this.score += this.balance.scoring.cryPerSecond * dt;
    this.messOnFloor = this.floorItems.filter((f) => this.items[f.key].mess).length;
    this.score += this.messOnFloor * this.balance.mess.perItemPerSecond * dt;

    if (this.carryingBaby()) {
      this.sootheTime += dt;
      if (this.sootheTime >= this.balance.baby.sootheCarrySeconds && this.demands.has('soothe')) {
        this.completeDemand('soothe');
        this.sootheTime = 0;
      }
    }

    this.updateCombo(dt);
    this.updateThrows(dt);

    this.player.frozen = false;
    this.player.stats.maxSpeed = this.carryingBaby() ? this.balance.player.carryingBabySpeed : this.player.stats.maxSpeedBase;
    this.player.update();
    this.handIcons.L.setPosition(this.player.x - 20, this.player.y - 22);
    this.handIcons.R.setPosition(this.player.x + 20, this.player.y - 22);

    this.updateFocus();
    this.updateAim();
    for (const h of HANDS) {
      if (Phaser.Input.Keyboard.JustDown(this.keys[h].grab)) this.grabOrDrop(h);
      if (Phaser.Input.Keyboard.JustDown(this.keys[h].throw)) this.throwFacing(h);
    }
  }

  // ------------------------------------------------------------------ mouse hands
  pointerDown(p) {
    const hand = p.button === 0 ? 'L' : p.button === 2 ? 'R' : null;
    if (!hand) return;
    if (!this.hands[hand]) { this.grabOrDrop(hand); return; }        // empty hand: grab, instantly
    this.aim = { hand, startX: p.x, startY: p.y };                     // full hand: release decides drop vs throw
  }

  pointerUp(p) {
    const hand = p.button === 0 ? 'L' : p.button === 2 ? 'R' : null;
    if (!hand || !this.aim || this.aim.hand !== hand) return;
    const moved = Math.hypot(p.x - this.aim.startX, p.y - this.aim.startY);
    this.aim = null;
    this.aimLine.clear();
    if (moved < this.balance.throw.dragThresholdPx) this.grabOrDrop(hand);
    else this.throwTo(hand, p.worldX, p.worldY);
  }

  updateAim() {
    this.aimLine.clear();
    if (!this.aim) return;
    const p = this.input.activePointer;
    const moved = Math.hypot(p.x - this.aim.startX, p.y - this.aim.startY);
    if (moved < this.balance.throw.dragThresholdPx) return;
    const target = this.clampThrowTarget(p.worldX, p.worldY);
    this.aimLine.lineStyle(2, C.ink, 0.5).lineBetween(this.player.x, this.player.y - 10, target.x, target.y);
    this.aimLine.lineStyle(2, C.ink, 0.8).strokeCircle(target.x, target.y, 10);
  }

  clampThrowTarget(x, y) {
    const dx = x - this.player.x; const dy = y - this.player.y;
    const d = Math.hypot(dx, dy) || 1;
    const max = this.balance.throw.maxDistance;
    const k = Math.min(1, max / d);
    return { x: this.player.x + dx * k, y: this.player.y + dy * k };
  }

  // ------------------------------------------------------------------ focus
  updateFocus() {
    const r = this.balance.player.interactRadius;
    const px = this.player.x; const py = this.player.y;
    let best = null; let bestD = Infinity;
    for (const s of this.stations) {
      const d = s.distanceTo(px, py);
      if (d < r && d < bestD && s.type !== 'hazard') { best = s; bestD = d; }
    }
    if (!this.carryingBaby()) {
      const d = this.baby.distanceTo(px, py) - 30; // the baby wins ties, e.g. against the crib it lies in
      if (d < r && d < bestD) { best = this.baby; bestD = d; }
    }
    for (const f of this.floorItems) {
      const d = Math.hypot(px - f.x, py - f.y) - 10;
      if (d < r && d < bestD) { best = f; bestD = d; }
    }
    this.focus = best;
    const text = best ? this.promptFor(best) : null;
    if (text) this.focusPrompt.setPosition(best.x, best.y - ((best.h ?? 30) / 2) - 8).setText(text).setVisible(true);
    else this.focusPrompt.setVisible(false);
  }

  promptFor(f) {
    const lines = [];
    const g = this.grabbableFrom(f);
    if (g && this.freeHand()) lines.push(this.isTwoHanded(g) && !this.bothFree() ? 'needs both hands' : `take ${this.items[g].label}`);
    for (const h of HANDS) {
      const key = this.hands[h];
      if (key && this.accepts(f, key)) lines.push(`${h === 'L' ? 'L' : 'R'}: put ${this.items[key].label}`);
    }
    return lines.length ? lines.join('\n') : null;
  }

  grabbableFrom(f) {
    if (f === this.baby) return 'baby';
    if (f instanceof Station) {
      if (f.type === 'source') return f.gives;
      if (f.type === 'dishes' && f.dishes > 0) return 'dish-dirty';
      if ((f.type === 'counter' || f.type === 'processor') && f.stored) return f.stored;
      return null;
    }
    return f.key;
  }

  accepts(f, key) {
    if (!(f instanceof Station)) return false;
    if (f.type === 'sink') return f.accepts.includes(key);
    if (f.type === 'counter') return !f.stored && key !== 'baby';
    if (f.type === 'processor') return !f.stored && f.acceptsItem(key);
    if (f.type === 'baby') return key === 'baby';
    return false;
  }

  // ------------------------------------------------------------------ grab / drop
  grabOrDrop(hand) {
    const f = this.focus;
    const key = this.hands[hand];
    if (!key) {
      const g = f ? this.grabbableFrom(f) : null;
      if (!g || !this.take(hand, g)) return;
      if (f === this.baby) { this.baby.pickUp(); this.sootheTime = 0; this.baby.unmet.soothe = this.demands.has('soothe'); }
      else if (f instanceof Station) {
        if (f.type === 'dishes') f.setDishes(f.dishes - 1);
        else f.setStored(null, this.items);
      } else this.removeFloorItem(f);
      this.audio.play('ui-select');
    } else {
      this.cancelComboIf(hand);
      if (f && this.accepts(f, key)) {
        this.release(hand);
        if (f.type === 'sink') { if (f.completes && this.demands.has(f.completes)) this.completeDemand(f.completes); }
        else if (f.type === 'baby') this.baby.putDown(f.x, f.y, true);
        else f.setStored(key, this.items);
      } else {
        this.release(hand);
        if (key === 'baby') this.baby.putDown(this.player.x, this.player.y + 24, false);
        else this.addFloorItem(key, this.player.x + (hand === 'L' ? -16 : 16), this.player.y + 26);
      }
      this.audio.play('ui-select');
    }
    this.updateFocus();
  }

  // ------------------------------------------------------------------ combos (baby + item in the other hand)
  updateCombo(dt) {
    const babyHand = this.handWith('baby');
    const other = babyHand === 'L' ? 'R' : 'L';
    const def = babyHand ? COMBOS.find((c) => this.hands[other] === c.with) : null;
    if (!def) { this.combo = null; this.comboRing.clear(); return; }
    if (!this.combo || this.combo.def !== def) this.combo = { hand: other, babyHand, def, elapsed: 0 };
    this.combo.elapsed += dt;
    const secs = this.balance.baby[def.secondsKey];
    const frac = Math.min(1, this.combo.elapsed / secs);
    this.comboRing.clear().lineStyle(4, C.green, 1).beginPath().arc(this.player.x, this.player.y - 4, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac).strokePath();
    if (frac >= 1) {
      this.release(other); this.take(other, def.result);
      this.completeDemand(def.demand);
      this.audio.play('good');
      this.combo = null; this.comboRing.clear();
    }
  }

  cancelComboIf(hand) {
    if (this.combo && (this.combo.hand === hand || this.combo.babyHand === hand)) { this.combo = null; this.comboRing.clear(); }
  }

  completeDemand(type) {
    const t = this.demands.complete(type);
    this.baby.unmet[type] = false;
    if (t) { this.score += this.balance.scoring.complete; this.events.emit('ticket-complete', t); }
  }

  // ------------------------------------------------------------------ throwing
  canThrow(hand) {
    const key = this.hands[hand];
    return key && key !== 'baby' && !this.isTwoHanded(key);
  }

  throwFacing(hand) {
    if (!this.canThrow(hand)) return;
    const d = this.balance.throw.distance;
    this.throwTo(hand, this.player.x + this.player.facing.x * d, this.player.y + this.player.facing.y * d);
  }

  throwTo(hand, tx, ty) {
    if (!this.canThrow(hand)) { this.grabOrDrop(hand); return; }
    this.cancelComboIf(hand);
    const target = this.clampThrowTarget(tx, ty);
    const key = this.release(hand);
    const it = this.items[key];
    const cfg = this.balance.throw;
    const dx = target.x - this.player.x; const dy = target.y - this.player.y;
    const dist = Math.max(20, Math.hypot(dx, dy));
    const icon = this.add.text(this.player.x, this.player.y - 10, it.glyph, { fontFamily: FONT, fontSize: '22px', color: C[`${it.color}S`] ?? C.inkS, fontStyle: 'bold' }).setOrigin(0.5).setDepth(12);
    this.throws.push({ key, icon, x: this.player.x, y: this.player.y - 10, vx: (dx / dist) * cfg.speed, vy: (dy / dist) * cfg.speed, travelled: 0, total: dist });
    this.audio.play('ui-select');
  }

  updateThrows(dt) {
    const cfg = this.balance.throw;
    for (const t of [...this.throws]) {
      const step = Math.hypot(t.vx, t.vy) * dt;
      t.x += t.vx * dt; t.y += t.vy * dt; t.travelled += step;
      const arc = Math.sin(Math.PI * Math.min(1, t.travelled / t.total));
      t.icon.setPosition(t.x, t.y - arc * 28).setScale(1 + arc * 0.5);
      const landed = t.travelled >= t.total;

      // caught by a container (or appliance) that accepts it, when it lands there or passes close
      const container = this.stations.find((s) => this.accepts(s, t.key) && s.type !== 'counter' && s.distanceTo(t.x, t.y) < (landed ? cfg.catchRadius : 2));
      if (container) {
        if (container.type === 'sink') { if (container.completes && this.demands.has(container.completes)) this.completeDemand(container.completes); }
        else container.setStored(t.key, this.items);
        this.flashAt(t.x, t.y, 'in!', C.greenS); this.audio.play('good');
        this.endThrow(t); continue;
      }
      if (!this.carryingBaby() && Math.hypot(t.x - this.baby.x, t.y - this.baby.y) < cfg.babyHitRadius) {
        this.baby.cry = Math.min(this.baby.cfg.cryMax, this.baby.cry + this.balance.baby.hitByThrowCry);
        if (!this.demands.has('soothe')) this.demands.spawn('soothe');
        this.flashAt(t.x, t.y, 'ouch', C.redS); this.audio.play('meh');
        this.addFloorItem(t.key, t.x, t.y + 16);
        this.endThrow(t); continue;
      }
      const hazard = this.hazards.find((s) => !this.accepts(s, t.key) && s.distanceTo(t.x, t.y) < 2);
      if (hazard && t.travelled > 30) {
        this.score += cfg.hazardHitPenalty;
        this.flashAt(t.x, t.y, `${cfg.hazardHitPenalty}`, C.redS); this.audio.play('meh');
        this.addFloorItem(t.key, t.x, t.y + 16);
        this.endThrow(t); continue;
      }
      const inRoom = this.house.rooms.some((r) => t.x > r.x && t.x < r.x + r.w && t.y > r.y && t.y < r.y + r.h);
      if (landed || !inRoom) {
        this.addFloorItem(t.key, Phaser.Math.Clamp(t.x, 60, GAME_WIDTH - 60), Phaser.Math.Clamp(t.y, 110, GAME_HEIGHT - 50));
        this.endThrow(t);
      }
    }
  }

  endThrow(t) {
    t.icon.destroy();
    this.throws.splice(this.throws.indexOf(t), 1);
  }

  flashAt(x, y, text, color) {
    const f = this.add.text(x, y - 10, text, { fontFamily: FONT, fontSize: '16px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: f, y: y - 40, alpha: 0, duration: 700, onComplete: () => f.destroy() });
  }

  // ------------------------------------------------------------------ floor items / mess
  addFloorItem(key, x, y) {
    const it = this.items[key];
    const icon = this.add.text(x, y, it.glyph, { fontFamily: FONT, fontSize: '20px', color: C[`${it.color}S`] ?? C.inkS, fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
    const f = { key, x, y, icon, h: 20 };
    this.floorItems.push(f);
    return f;
  }

  removeFloorItem(f) {
    this.floorItems.splice(this.floorItems.indexOf(f), 1);
    f.icon.destroy();
  }

  spawnMess(key, x, y) {
    if (this.messOnFloor >= this.balance.mess.maxOnFloor) return;
    const room = this.house.rooms[0];
    const fx = x ?? Phaser.Math.Between(room.x + 40, room.x + room.w - 40);
    const fy = y ?? Phaser.Math.Between(room.y + 60, room.y + room.h - 40);
    const f = this.addFloorItem(key, fx + Phaser.Math.Between(-14, 14), fy + Phaser.Math.Between(6, 20));
    this.tweens.add({ targets: f.icon, scale: { from: 1.6, to: 1 }, duration: 250 });
  }

  updateMessSpawns(dt) {
    for (const key of ['clothes', 'trash']) {
      if (this.year < (this.balance.mess[`${key}FromYear`] ?? 1)) continue;
      this.messTimers[key] -= dt;
      if (this.messTimers[key] <= 0) {
        this.messTimers[key] = this.balance.mess[`${key}EverySeconds`];
        this.spawnMess(key);
      }
    }
  }

  // ------------------------------------------------------------------ years
  rolloverYear() {
    const s = this.demands.stats;
    const spawned = s.spawned - this.yearStatsStart.spawned;
    const completed = s.completed - this.yearStatsStart.completed;
    const expired = s.expired - this.yearStatsStart.expired;
    const rate = spawned ? completed / spawned : 1;
    const sc = this.balance.scoring;
    const stars = rate >= sc.threeStars ? 3 : rate >= sc.twoStars ? 2 : rate >= sc.oneStar ? 1 : 0;
    const summary = {
      year: this.year, stars, rate, spawned, completed, expired,
      score: Math.round(this.score - this.yearScoreStart),
      carriedSeconds: Math.round(this.baby.carriedSeconds - this.yearCarryStart),
      messLeft: this.messOnFloor ?? 0,
    };
    this.history.push(summary);
    this.audio.play('sleep');

    this.year += 1;
    summary.unlocked = this.applyYear();
    this.events.emit('year-summary', summary);
    this.timeLeft = this.balance.round.seconds;
    this.yearScoreStart = this.score;
    this.yearCarryStart = this.baby.carriedSeconds;
    this.yearStatsStart = { ...s };
  }
}
