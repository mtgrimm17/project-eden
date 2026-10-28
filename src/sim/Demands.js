// Demands: the ticket board. Pure logic, no Phaser.
// Spawns tickets by type on a schedule, counts them down, reports completions and expiries.
// Each type has a `fromYear`; setYear() decides which types are live.
//
//   demands.update(dt)                 -> { expired: [tickets] }
//   demands.complete('feed')           -> the oldest open 'feed' ticket, or null
//   demands.open                       -> live tickets [{ id, type, timer, total }]

export default class Demands {
  constructor(cfg, year = 1) {
    this.cfg = cfg;
    this.open = [];
    this.nextId = 1;
    this.stats = { spawned: 0, completed: 0, expired: 0 };
    this.timers = {};
    this.types = Object.entries(cfg).filter(([, d]) => d && typeof d === 'object' && 'every' in d).map(([t]) => t);
    this.setYear(year);
  }

  setYear(year) {
    this.year = year;
    for (const type of this.types) {
      const d = this.cfg[type];
      const live = (d.fromYear ?? 1) <= year;
      if (live && !(type in this.timers)) this.timers[type] = d.first ?? d.every;
      if (!live) delete this.timers[type];
    }
  }

  isLive(type) {
    return (this.cfg[type]?.fromYear ?? 1) <= this.year;
  }

  jitter(base) {
    const j = this.cfg.jitter ?? 0;
    return base * (1 + (Math.random() * 2 - 1) * j);
  }

  update(dt) {
    const expired = [];
    for (const type of Object.keys(this.timers)) {
      this.timers[type] -= dt;
      if (this.timers[type] <= 0) {
        if (this.open.length < (this.cfg.maxOpen ?? 99) && !this.open.some((t) => t.type === type)) this.spawn(type);
        this.timers[type] = this.jitter(this.cfg[type].every);
      }
    }
    for (const t of this.open) t.timer -= dt;
    for (const t of this.open.filter((t) => t.timer <= 0)) {
      this.open.splice(this.open.indexOf(t), 1);
      this.stats.expired += 1;
      expired.push(t);
    }
    return { expired };
  }

  spawn(type) {
    const d = this.cfg[type];
    const t = { id: this.nextId++, type, timer: d.timer, total: d.timer, label: d.label, color: d.color };
    this.open.push(t);
    this.stats.spawned += 1;
    return t;
  }

  has(type) {
    return this.open.some((t) => t.type === type);
  }

  complete(type) {
    const t = this.open.find((x) => x.type === type);
    if (!t) return null;
    this.open.splice(this.open.indexOf(t), 1);
    this.stats.completed += 1;
    return t;
  }
}
