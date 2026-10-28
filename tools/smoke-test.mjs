// Smoke test: boots the real game in Node (no browser needed) and checks that
// Boot → Preload → Menu → Game all start without errors, data files load, and the
// core loop (player overlaps pickup → score goes up) works.
//
//   cd tools && npm install        (once; installs jsdom only, dev-only)
//   node smoke-test.mjs            (exit code 0 = pass)
//
// Claude: run this after any change to src/ before saying a change is done.
// It fakes the DOM, canvas and XHR, so it can't catch visual bugs — only wiring,
// data and logic errors. Extend the CHECKS section when the concept lands.

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOT_WAIT_MS = 1500;

// ---------------------------------------------------------------- fake browser
const dom = new JSDOM('<!doctype html><html><body><div id="game"></div></body></html>', {
  pretendToBeVisual: true, url: 'http://localhost/',
});
const w = dom.window;
dom.virtualConsole?.on?.('jsdomError', () => {});
w.focus = () => {};
const def = (k, v) => { try { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); } catch {} };

for (const k of ['window', 'document', 'navigator', 'HTMLCanvasElement', 'requestAnimationFrame', 'cancelAnimationFrame',
  'HTMLElement', 'Element', 'Event', 'KeyboardEvent', 'MouseEvent', 'TouchEvent', 'Blob', 'URL',
  'HTMLVideoElement', 'HTMLImageElement', 'ImageData', 'Path2D', 'DOMParser', 'XMLSerializer', 'FileReader',
  'MutationObserver', 'Audio', 'HTMLAudioElement', 'screen']) if (w[k] !== undefined) def(k, w[k]);
def('self', globalThis);
def('getComputedStyle', w.getComputedStyle.bind(w));
def('AudioContext', undefined); // forces Phaser onto HTML5 audio, which is a no-op here
if (!w.CanvasRenderingContext2D) w.CanvasRenderingContext2D = class CanvasRenderingContext2D {};
def('CanvasRenderingContext2D', w.CanvasRenderingContext2D);

// Canvas 2D context: every method is a no-op, measurements return plausible numbers.
const fakeCtx = new Proxy({
  canvas: null,
  measureText: () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
  getImageData: (x, y, cw, ch) => ({ data: new Uint8ClampedArray(cw * ch * 4), width: cw, height: ch }),
  createImageData: (cw, ch) => ({ data: new Uint8ClampedArray(cw * ch * 4), width: cw, height: ch }),
  createLinearGradient: () => ({ addColorStop() {} }),
  createPattern: () => ({}),
}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
w.HTMLCanvasElement.prototype.getContext = (type) => (type === '2d' ? fakeCtx : null);
w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';

// XHR: serve files straight from the repo folder.
class FakeXHR extends w.EventTarget {
  constructor() { super(); this.readyState = 0; this.status = 0; this.responseText = ''; this.response = ''; this.responseType = ''; this.timeout = 0; this.onload = null; this.onerror = null; this.onprogress = null; }
  open(_m, u) { this.url = u; this.readyState = 1; }
  setRequestHeader() {} overrideMimeType() {} abort() {} getResponseHeader() { return null; } getAllResponseHeaders() { return ''; }
  send() {
    setTimeout(() => {
      try {
        const t = fs.readFileSync(path.join(ROOT, this.url), 'utf8');
        this.status = 200; this.readyState = 4; this.responseText = t; this.response = t;
        this.dispatchEvent(new w.Event('load')); if (this.onload) this.onload(new w.Event('load'));
      } catch (e) {
        this.status = 404; this.readyState = 4;
        if (this.onerror) this.onerror(e); this.dispatchEvent(new w.Event('error'));
      }
    }, 5);
  }
}
def('XMLHttpRequest', FakeXHR); w.XMLHttpRequest = FakeXHR;

// Image: "loads" instantly as a 32x32 image.
const ImgStub = function () {
  const el = w.document.createElement('img');
  Object.defineProperty(el, 'src', {
    set(v) {
      el.__src = v;
      for (const [k, val] of Object.entries({ width: 32, height: 32, naturalWidth: 32, naturalHeight: 32, complete: true })) Object.defineProperty(el, k, { value: val, configurable: true });
      setTimeout(() => el.dispatchEvent(new w.Event('load')), 1);
    },
    get() { return el.__src; }, configurable: true,
  });
  return el;
};
def('Image', ImgStub); w.Image = ImgStub;

// ---------------------------------------------------------------- boot phaser + game
new Function(fs.readFileSync(path.join(ROOT, 'lib/phaser.min.js'), 'utf8'))();
globalThis.Phaser.AUTO = Phaser.CANVAS;

const errors = [];
setTimeout(() => { console.error('TIMEOUT: smoke test did not finish in 60s'); process.exit(1); }, 60000);
process.on('uncaughtException', (e) => { errors.push(e); console.error('ERROR:', e.message); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { console.error('FAIL:', msg); errors.push(new Error(msg)); };
const ok = (msg) => console.log('ok  ', msg);

await import(path.join(ROOT, 'src/main.js'));
const game = w.game;
await sleep(BOOT_WAIT_MS);

// ---------------------------------------------------------------- CHECKS
const active = () => game.scene.getScenes(true).map((s) => s.scene.key);

if (active().includes('Menu')) ok('boots to Menu'); else fail(`expected Menu active, got [${active()}]`);
if (active().includes('Version')) ok('version badge scene is running'); else fail('Version scene not active');

// Version must be stamped consistently (config.js VERSION == every ?v= in index.html).
const cfg = fs.readFileSync(path.join(ROOT, 'src/config.js'), 'utf8').match(/VERSION\s*=\s*'([^']+)'/)?.[1];
const vParams = [...fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').matchAll(/\?v=([\w.-]+)/g)].map((m) => m[1]);
if (cfg && vParams.length >= 2 && vParams.every((v) => v === cfg)) ok(`version ${cfg} stamped consistently`);
else fail(`version mismatch: config.js=${cfg}, index.html=[${vParams}]`);

// --- Pure simulation checks (no Phaser needed) -----------------------------
const balance = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/balance.json'), 'utf8'));
const { default: Demands } = await import(path.join(ROOT, 'src/sim/Demands.js'));
{
  const d = new Demands(balance.demands);
  d.update(balance.demands.feed.first + 0.01);
  if (d.has('feed')) ok('demands: feed ticket spawns on schedule'); else fail('feed ticket did not spawn');
  const t = d.complete('feed');
  if (t && d.stats.completed === 1 && !d.has('feed')) ok('demands: complete removes the ticket'); else fail('complete failed');
  d.spawn('change'); d.update(balance.demands.change.timer + 0.01);
  if (d.stats.expired >= 1 && !d.has('change')) ok('demands: tickets expire'); else fail('expiry failed');
}

// --- Scene flow ---------------------------------------------------------------
game.scene.getScene('Menu').scene.start('Game');
await sleep(800);
if (active().includes('Game') && active().includes('Hud')) ok('Game + Hud start'); else fail(`expected Game+Hud, got [${active()}]`);
if (active().includes('Version')) ok('version badge survives scene change'); else fail('Version scene stopped');

const g = game.scene.getScene('Game');
const house = g.cache.json.get('house');
if (g.stations.length === house.stations.length) ok(`${g.stations.length} stations placed`); else fail('station count mismatch');
if (g.timeLeft > 0 && g.year === 1) ok('year 1 clock running'); else fail('round not started');
{
  const activeIds = g.stations.filter((s) => s.active).map((s) => s.id).sort().join(',');
  if (activeIds === 'crib,dishwasher,fridge,microwave') ok('year 1 shows only fridge, microwave, dishwasher, crib'); else fail(`year 1 stations: ${activeIds}`);
  if (g.demands.isLive('feed') && g.demands.isLive('soothe') && !g.demands.isLive('change') && !g.demands.isLive('dishes')) ok('year 1 demands are feed + soothe only'); else fail('year 1 demand gating wrong');
  if (g.baby.phase.name === 'baby' && g.baby.phase.speed === 0) ok('year 1 kid is a stationary baby'); else fail(`phase=${g.baby.phase.name}`);
}
// Unlock everything for the rest of the checks.
g.year = 5; const unlockedNow = g.applyYear();
g.messTimers.clothes = 1e9; g.messTimers.trash = 1e9; // keep random mess out of the deterministic steps
g.baby.setPhase({ ...g.baby.phase, speed: 0, attentionSeconds: 1e9 }); // and keep the kid still until the phase checks
if (g.stations.every((s) => s.active) && g.demands.isLive('dishes') && g.baby.phase.name === 'kid' && unlockedNow.length > 0) ok(`year 5 unlocks everything (${unlockedNow.length} new things)`); else fail('year 5 did not unlock everything');

// Helpers: stand next to something so it becomes the focus, then use hands.
const stn = (id) => g.stations.find((s) => s.id === id);
const goTo = async (s) => { g.player.setPosition(s.x, s.y + (s.h ?? 26) / 2 + 20); g.updateFocus(); await sleep(60); };
const goToBaby = async () => { g.player.setPosition(g.baby.x, g.baby.y + 30); g.updateFocus(); await sleep(60); };
const grab = (hand) => { g.grabOrDrop(hand); };
const ensure = (type) => { if (!g.demands.has(type)) g.demands.spawn(type); };
const open = async () => { g.player.setPosition(500, 300); g.updateFocus(); await sleep(60); };
const mouse = (button, x, y, type) => ({ button, x: x * 2, y: y * 2, worldX: x, worldY: y });

// Feed chain with the left hand: fridge → microwave (works on its own) → baby + bottle combo.
await goTo(stn('fridge')); grab('L');
if (g.hands.L === 'bottle-cold') ok('Q takes a cold bottle into the left hand'); else fail(`L=${g.hands.L}`);
await goTo(stn('microwave')); grab('L');
if (g.hands.L === null && stn('microwave').stored === 'bottle-cold') ok('dropping the bottle in the microwave starts it'); else fail(`L=${g.hands.L} stored=${stn('microwave').stored}`);
await sleep(stn('microwave').holdSeconds * 1000 + 300);
if (stn('microwave').stored === 'bottle-warm') ok('microwave warms the bottle on its own'); else fail(`stored=${stn('microwave').stored}`);
grab('L');
if (g.hands.L === 'bottle-warm') ok('grab takes the warm bottle back out'); else fail(`L=${g.hands.L}`);
ensure('feed');
await goToBaby();
if (g.focus === g.baby) ok('baby is the focus when near'); else fail(`focus=${g.focus?.id}`);
grab('R');
if (g.hands.R === 'baby') ok('J picks the baby up into the right hand'); else fail(`R=${g.hands.R}`);
await open(); g.player.setPosition(520, 320); // walking while feeding
await sleep(balance.baby.feedSeconds * 1000 + 400);
if (g.hands.L === 'bottle-empty' && !g.demands.has('feed')) ok('bottle + baby in hands feeds over time'); else fail(`L=${g.hands.L} feedOpen=${g.demands.has('feed')}`);
await goTo(stn('dishwasher')); grab('L');
if (g.hands.L === null && stn('dishwasher').stored === 'bottle-empty') ok('Q at the dishwasher puts the empty bottle in'); else fail('dishwasher did not take bottle');
await sleep(stn('dishwasher').holdSeconds * 1000 + 300);
if (stn('dishwasher').stored === null) ok('dishwasher washes the empty bottle away'); else fail(`stored=${stn('dishwasher').stored}`);

// Change combo.
ensure('change'); await goTo(stn('shelf')); grab('L');
if (g.hands.L === 'diaper-clean') ok('shelf gives a diaper into the free hand while carrying the baby'); else fail(`L=${g.hands.L}`);
await sleep(balance.baby.changeSeconds * 1000 + 400);
if (g.hands.L === 'diaper-dirty' && !g.demands.has('change')) ok('diaper + baby changes over time'); else fail(`L=${g.hands.L}`);
await open(); grab('L');
if (g.hands.L === null && g.floorItems.some((f) => f.key === 'diaper-dirty')) ok('Q in open space puts the item on the floor'); else fail(`L=${g.hands.L}`);
grab('L'); await goTo(stn('bin')); grab('L'); // tidy up so later steps don't trip over it

// Two-handed rule, soothe, crib, dishes through the sink.
stn('table').setDishes(2); await goTo(stn('table')); grab('L');
if (g.hands.L === null) ok('two-handed dishes refused with the baby in a hand'); else fail('took dishes one-handed');
ensure('soothe'); g.sootheTime = 0; await sleep(balance.baby.sootheCarrySeconds * 1000 + 200);
if (!g.demands.has('soothe')) ok('carrying long enough soothes'); else fail('soothe not completed');
if (g.baby.carriedSeconds > 3) ok('carried seconds are tracked'); else fail('carriedSeconds not tracked');
await goTo(stn('crib')); grab('R');
if (g.hands.R === null && g.baby.state !== 'carried') ok('J at the crib puts the baby down'); else fail(`state=${g.baby.state} R=${g.hands.R}`);
await goTo(stn('table')); grab('L');
if (g.hands.L === 'dish-dirty' && g.hands.R === 'dish-dirty') ok('dishes fill both hands'); else fail(`L=${g.hands.L} R=${g.hands.R}`);
await goTo(stn('dishwasher')); grab('R');
if (g.bothFree() && stn('dishwasher').stored === 'dish-dirty') ok('dishes dropped in the dishwasher'); else fail(`stored=${stn('dishwasher').stored}`);
await sleep(stn('dishwasher').holdSeconds * 1000 + 300); grab('L');
if (g.hands.L === 'dish-clean') ok('dishwasher washes dishes on its own'); else fail(`L=${g.hands.L} stored=${stn('dishwasher').stored}`);
ensure('dishes'); await goTo(stn('cupboard')); grab('R');
if (g.bothFree() && !g.demands.has('dishes')) ok('cupboard completes the dishes ticket'); else fail('dishes not completed');

// Mouse hands: press grabs; release in place drops; move then release throws to the cursor.
g.addFloorItem('toy', 500, 300); await open();
g.pointerDown(mouse(0, 500, 300));
if (g.hands.L === 'toy') ok('mouse left press grabs into the left hand'); else fail(`L=${g.hands.L}`);
g.pointerDown(mouse(0, 500, 300)); g.pointerUp(mouse(0, 502, 301));
if (g.hands.L === null && g.floorItems.some((f) => f.key === 'toy')) ok('release in place drops'); else fail(`L=${g.hands.L}`);
g.pointerDown(mouse(0, 500, 300));
const tb = stn('toybox');
g.pointerDown(mouse(0, 500, 300)); g.pointerUp(mouse(0, tb.x, tb.y));
if (g.throws.length === 1 && g.hands.L === null) ok('move then release throws'); else fail(`throws=${g.throws.length} L=${g.hands.L}`);
await sleep(900);
if (g.throws.length === 0 && !g.floorItems.some((f) => f.key === 'toy')) ok('thrown toy lands in the toy box'); else fail(`toy on floor=${g.floorItems.some((f) => f.key === 'toy')}`);
g.addFloorItem('trash', 500, 300); await open(); g.pointerDown(mouse(2, 500, 300));
if (g.hands.R === 'trash') ok('mouse right press grabs into the right hand'); else fail(`R=${g.hands.R}`);
const cryBefore = g.baby.cry;
g.pointerDown(mouse(2, 500, 300)); g.pointerUp(mouse(2, g.baby.x, g.baby.y)); await sleep(900);
if (g.baby.cry > cryBefore && g.demands.has('soothe')) ok('hitting the baby makes it cry and spawns soothe'); else fail(`cry ${cryBefore}→${g.baby.cry}`);
await goTo(stn('fridge')); grab('L'); const mw = stn('microwave');
g.pointerDown(mouse(0, 500, 300)); g.pointerUp(mouse(0, mw.x, mw.y)); await sleep(800);
if (mw.stored === 'bottle-cold') ok('a thrown bottle lands in the microwave'); else fail(`microwave stored=${mw.stored}`);
mw.setStored(null, g.items);

// Attention: rises while not held, pats relieve it, pick-up resets it, red = trouble.
const phases = balance.baby.phases;
g.baby.setPhase(phases[0]); g.baby.putDown(stn('crib').x, stn('crib').y, true); g.baby.attention = 0; g.baby.state = 'crib';
g.player.setPosition(300, 300); await sleep(600);
if (g.baby.attention > 0.02) ok('attention rises while the baby is not held'); else fail(`attention=${g.baby.attention}`);
g.baby.attention = 0.6; g.baby.patCooldown = 0; g.player.setPosition(g.baby.x + 20, g.baby.y); await sleep(80);
if (g.baby.attention < 0.6) ok('walking past pats attention down'); else fail(`attention=${g.baby.attention}`);
g.baby.attention = 1; g.player.setPosition(300, 300); await sleep(150);
if (g.baby.state === 'trouble' && g.demands.has('soothe')) ok('red baby cries and spawns a soothe ticket'); else fail(`state=${g.baby.state} soothe=${g.demands.has('soothe')}`);
await goToBaby(); grab('R');
if (g.baby.attention === 0 && g.baby.state === 'carried') ok('picking up resets attention'); else fail(`attention=${g.baby.attention} state=${g.baby.state}`);
await sleep(balance.baby.sootheCarrySeconds * 1000 + 200);
if (!g.demands.has('soothe')) ok('carrying soothes the crying baby'); else fail('soothe not completed');
await open(); grab('R'); // put the kid down on the floor

// Toddler: when red, heads for a hazard and cries there; drops toys on the way.
g.baby.setPhase({ ...phases[1], speed: 400 }); g.baby.toysOn = true; g.baby.toyTimer = 0.1; g.baby.cfg.toyDropEverySeconds = 0.2;
g.baby.attention = 1; g.baby.pause = 0; g.baby.target = null; g.player.setPosition(900, 90);
await sleep(1500);
if (g.baby.state === 'danger') ok('neglected toddler reaches a hazard'); else fail(`toddler state=${g.baby.state}`);
if (g.floorItems.some((f) => f.key === 'toy')) ok('toddler drops toys while roaming'); else fail('no toys dropped');
const scoreBefore = g.score; await sleep(300);
if (g.score < scoreBefore) ok('danger and mess cost score'); else fail('no penalty applied');
g.messTimers.clothes = 0.01; await sleep(100);
if (g.floorItems.some((f) => f.key === 'clothes')) ok('clothes appear on their own'); else fail('no clothes spawned');

// Kid: when red, climbs and jumps or tips the bin (trash spill); cries until picked up.
await goToBaby(); grab('R'); await open(); grab('R');
g.baby.setPhase({ ...phases[2], speed: 700 }); g.baby.tippables = [stn('bin')]; g.baby.climbables = [];
const trashBefore = g.floorItems.filter((f) => f.key === 'trash').length;
g.baby.attention = 1; g.baby.pause = 0; g.baby.target = null; g.player.setPosition(100, 100);
await sleep(1500);
const trashAfter = g.floorItems.filter((f) => f.key === 'trash').length;
if (g.baby.state === 'trouble' && trashAfter >= trashBefore + (phases[2].trashSpill ?? 3)) ok(`neglected kid tips the bin (${trashAfter - trashBefore} trash)`); else fail(`kid state=${g.baby.state} trash ${trashBefore}→${trashAfter}`);
if (g.demands.has('soothe')) ok('kid in trouble needs soothing'); else fail('no soothe after antics');

// Year rolls over in place: no scene change, summary pane, clock reset.
let summary = null; g.events.once('year-summary', (s) => { summary = s; });
const yBefore = g.year; g.timeLeft = 0.01; await sleep(300);
if (active().includes('Game') && g.year === yBefore + 1 && g.timeLeft > 20) ok('year rolls over without leaving the house'); else fail(`year=${g.year} (was ${yBefore}) active=[${active()}]`);
if (summary && typeof summary.stars === 'number' && g.history.length >= 1) ok(`year summary emitted (${summary.stars}★, ${summary.completed}/${summary.spawned})`); else fail('no year summary');

// ---------------------------------------------------------------- done
game.destroy(true);
console.log(errors.length ? `\n${errors.length} problem(s)` : '\nall good');
process.exit(errors.length ? 1 : 0);
