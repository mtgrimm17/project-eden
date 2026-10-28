// Narrator: an AI observer analysing your parenting. Lines live in src/data/narrator.json,
// keyed by trigger. Writers own that file; this class only decides *when* to speak.
//
//   narrator.say('junk-food')     -> picks a line for that trigger (no repeats until exhausted)
//   narrator.update(dt, life)     -> watches the bars and fires low-bar / zero-bar triggers
//
// The HUD listens for the 'narrate' event and renders the text.

export default class Narrator {
  constructor(scene, lines, cfg) {
    this.scene = scene;
    this.lines = lines;
    this.cfg = cfg;
    this.cooldownMs = 0;
    this.used = {};
    this.flags = {};
  }

  say(trigger, force = false) {
    const pool = this.lines[trigger];
    if (!pool || pool.length === 0) return false;
    if (!force && this.cooldownMs > 0) return false;

    const used = (this.used[trigger] ??= new Set());
    if (used.size >= pool.length) used.clear();
    const candidates = pool.map((l, i) => i).filter((i) => !used.has(i));
    const i = Phaser.Utils.Array.GetRandom(candidates);
    used.add(i);

    this.cooldownMs = this.cfg.cooldownMs;
    this.scene.events.emit('narrate', { trigger, text: pool[i] });
    return true;
  }

  update(dt, life, inMinigame) {
    this.cooldownMs = Math.max(0, this.cooldownMs - dt * 1000);
    const low = this.cfg.lowBarFraction;

    this.watch('hunger-low', life.fraction('hunger') < low);
    this.watch('sanity-low', life.fraction('sanity') < low);
    this.watch('sanity-zero', life.res.sanity.cur <= 0);
    this.watch('hunger-zero', life.res.hunger.cur <= 0);
    this.watch('stamina-low', life.res.stamina.cur <= 10 && !inMinigame);
  }

  // Fire once when a condition becomes true; re-arm when it becomes false.
  watch(trigger, condition) {
    if (condition && !this.flags[trigger]) {
      this.flags[trigger] = true;
      this.say(trigger);
    } else if (!condition) {
      this.flags[trigger] = false;
    }
  }
}
