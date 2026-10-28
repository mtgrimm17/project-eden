// Station: a thing in the house. Visual + the little state each type keeps.
//   source    gives an item when grabbed
//   processor an appliance: holds one item and transforms it over time (microwave, sink)
//   sink      swallows items it accepts (bin, cupboard, toy box, hamper)
//   counter   holds one item
//   dishes    the table: dirty dishes pile up over time
//   baby      the crib
//   hazard    nothing to use; the baby crawls toward anything with hazard: true
// The scene decides what grab/drop mean at each station; this file only keeps state and draws it.

import { C, FONT } from '../palette.js';

export default class Station {
  constructor(scene, def) {
    this.scene = scene;
    Object.assign(this, def);
    const color = C[def.color] ?? C.ink;

    this.rect = scene.add.rectangle(def.x, def.y, def.w, def.h, color).setStrokeStyle(3, C.ink);
    this.glyphText = scene.add.text(def.x, def.y, def.glyph ?? '', { fontFamily: FONT, fontSize: '26px', color: color === C.wall ? C.inkS : C.whiteS }).setOrigin(0.5);
    this.label = scene.add.text(def.x, def.y + def.h / 2 + 10, def.name.toUpperCase(), { fontFamily: FONT, fontSize: '10px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0.5, 0);

    this.barBg = scene.add.rectangle(def.x, def.y + def.h / 2 + 2, def.w, 6, C.wall).setOrigin(0.5, 0).setVisible(false).setDepth(21);
    this.bar = scene.add.rectangle(def.x - def.w / 2, def.y + def.h / 2 + 2, 0, 6, C.ink).setOrigin(0, 0).setVisible(false).setDepth(22);

    this.active = true;      // false until the kid reaches `fromYear`
    this.stored = null;      // counters and appliances hold one item
    this.storedIcon = null;
    this.progress = 0;       // appliance: seconds the stored item has been processing
    this.dishes = 0;
    this.spawnTimer = def.spawnEverySeconds ?? 0;
  }

  setActive(on) {
    this.active = on;
    for (const o of [this.rect, this.glyphText, this.label]) o.setVisible(on);
    if (!on) this.showProgress(0);
    if (this.storedIcon) this.storedIcon.setVisible(on);
    if (on && !this.appeared) {
      this.appeared = true;
      this.scene.tweens.add({ targets: [this.rect, this.glyphText], scale: { from: 0.2, to: 1 }, duration: 350, ease: 'Back.Out' });
    }
  }

  showProgress(frac) {
    this.barBg.setVisible(frac > 0);
    this.bar.setVisible(frac > 0);
    this.bar.width = this.w * Math.min(1, frac);
  }

  setStored(itemKey, items) {
    this.stored = itemKey;
    this.progress = 0;
    this.showProgress(0);
    if (this.storedIcon) { this.storedIcon.destroy(); this.storedIcon = null; }
    if (itemKey) {
      const it = items[itemKey];
      this.storedIcon = this.scene.add.text(this.x, this.y - 4, it.glyph, { fontFamily: FONT, fontSize: '22px', color: C[`${it.color}S`] ?? C.inkS, fontStyle: 'bold', stroke: C.bgS, strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
    }
  }

  setDishes(n) {
    this.dishes = n;
    this.glyphText.setText(n > 0 ? '◠'.repeat(Math.min(n, 4)) : '');
  }

  update(dt, items) {
    if (!this.active) return;
    if (this.type === 'dishes' && this.spawnEverySeconds) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnEverySeconds;
        if (this.dishes < this.maxDishes) this.setDishes(this.dishes + 1);
      }
    }
    // appliances work on their own
    if (this.type === 'processor' && this.stored && this.acceptsItem(this.stored)) {
      this.progress += dt;
      this.showProgress(this.progress / this.holdSeconds);
      if (this.progress >= this.holdSeconds) {
        this.setStored(this.produceFor(this.stored), items);
        this.onDone?.(this);
      }
    }
  }

  acceptsItem(key) {
    const a = this.accepts;
    return Array.isArray(a) ? a.includes(key) : a === key;
  }

  // What an appliance turns `key` into. null = consumed (e.g. an empty bottle washed away).
  produceFor(key) {
    if (this.produces && typeof this.produces === 'object') return this.produces[key] ?? null;
    return this.produces ?? null;
  }

  distanceTo(px, py) {
    if (!this.active) return Infinity;
    const dx = Math.max(Math.abs(px - this.x) - this.w / 2, 0);
    const dy = Math.max(Math.abs(py - this.y) - this.h / 2, 0);
    return Math.hypot(dx, dy);
  }
}
