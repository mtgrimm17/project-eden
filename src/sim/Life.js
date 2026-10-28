// Life: the pure simulation of one human. No Phaser in here, so it is easy to test and reason about.
// Three resources, each with a current value and a maximum. Maxima are where long-term damage lives.
//   stamina : seconds left in the current year. Max shrinks with age. Year ends at 0.
//   hunger  : drains every second. Junk food refills fast but lowers the max. At 0 you starve.
//   sanity  : drains every second. For every second at 0, max drops.

export default class Life {
  constructor(balance) {
    this.b = balance;
    this.age = balance.life.startAge;
    this.year = 0;
    this.alive = true;
    this.decayMult = 1; // >1 = stamina decays faster with age (bad decisions push this up)
    this.starving = 0;
    this.traits = [];
    this.history = []; // one entry per completed year

    const r = balance.resources;
    this.res = {
      stamina: { cur: 0, max: 0 },
      hunger: { cur: r.hunger.startMax, max: r.hunger.startMax },
      sanity: { cur: r.sanity.startMax, max: r.sanity.startMax },
    };
    this.yearStats = this.freshYearStats();
  }

  freshYearStats() {
    return { junk: 0, cooked: 0, showers: 0, reads: 0, secondsAtZeroSanity: 0, secondsStarving: 0 };
  }

  staminaMaxForAge(age) {
    const l = this.b.life;
    const t = Math.min(1, Math.max(0, (age - l.startAge) / (l.oldAge - l.startAge)));
    const base = l.staminaAt18 + (l.staminaAtOld - l.staminaAt18) * t * this.decayMult;
    return Math.max(l.minStamina, Math.round(base));
  }

  // Called at the start of every year (including the first).
  startYear() {
    if (this.year > 0) this.age += 1;
    this.year += 1;
    this.res.stamina.max = this.staminaMaxForAge(this.age);
    this.res.stamina.cur = this.res.stamina.max;
    this.yearStats = this.freshYearStats();
  }

  endYear() {
    this.history.push({ age: this.age, ...this.yearStats, snapshot: this.snapshot() });
  }

  // dt in seconds.
  tick(dt) {
    if (!this.alive) return;
    const r = this.b.resources;
    const R = this.res;

    R.stamina.cur = Math.max(0, R.stamina.cur - r.stamina.drain * dt);
    R.hunger.cur = Math.max(0, R.hunger.cur - r.hunger.drain * dt);
    R.sanity.cur = Math.max(0, R.sanity.cur - r.sanity.drain * dt);

    if (R.sanity.cur <= 0) {
      R.sanity.max = Math.max(r.sanity.minMax, R.sanity.max - r.sanity.erosionAtZero * dt);
      this.yearStats.secondsAtZeroSanity += dt;
    }
    if (R.hunger.cur <= 0) {
      this.starving += dt;
      this.yearStats.secondsStarving += dt;
      if (this.starving >= r.hunger.starveSeconds) this.alive = false;
    } else {
      this.starving = 0;
    }
  }

  // effects: { hunger: { cur: 45, max: -6 }, ... }   score: 0..1 from the mini-game
  apply(effects, score = 1) {
    const threshold = this.b.stations.maxThreshold;
    const r = this.b.resources;
    const changes = {};
    for (const [key, e] of Object.entries(effects)) {
      const res = this.res[key];
      if (!res) continue;
      const dCur = (e.cur || 0) * score;
      let dMax = e.max || 0;
      if (dMax > 0 && score < threshold) dMax = 0;
      res.max = Math.max(r[key]?.minMax ?? 0, res.max + dMax);
      res.cur = Math.min(res.max, Math.max(0, res.cur + dCur));
      changes[key] = { cur: dCur, max: dMax };
    }
    return changes;
  }

  isYearOver() {
    return this.res.stamina.cur <= 0;
  }

  fraction(key) {
    const r = this.res[key];
    return r.max > 0 ? r.cur / r.max : 0;
  }

  snapshot() {
    return {
      age: this.age,
      year: this.year,
      alive: this.alive,
      stamina: { ...this.res.stamina },
      hunger: { ...this.res.hunger },
      sanity: { ...this.res.sanity },
    };
  }
}
