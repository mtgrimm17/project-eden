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
const { default: Life } = await import(path.join(ROOT, 'src/sim/Life.js'));
{
  const life = new Life(balance);
  life.startYear();
  if (life.age === balance.life.startAge && life.res.stamina.cur === balance.life.staminaAt18) ok('life starts at 18 with full stamina'); else fail('bad life start');
  const old = new Life(balance); old.age = balance.life.oldAge; old.startYear();
  if (old.res.stamina.max < life.res.stamina.max) ok(`stamina shrinks with age (${life.res.stamina.max}s → ${old.res.stamina.max}s)`); else fail('stamina does not shrink with age');

  const beforeMax = life.res.hunger.max;
  life.apply(balance.stations.fridge.junk, 1);
  if (life.res.hunger.max < beforeMax) ok('junk food lowers hunger max'); else fail('junk food did not lower max');
  life.apply(balance.stations.fridge.cook, 1);
  if (life.res.hunger.max === beforeMax + balance.stations.fridge.junk.hunger.max + balance.stations.fridge.cook.hunger.max) ok('cooking raises hunger max'); else fail('cooking did not raise max');
  life.apply(balance.stations.fridge.cook, 0.1);
  const sMax = life.res.sanity.max;
  life.res.sanity.cur = 0; life.tick(5);
  if (life.res.sanity.max < sMax) ok('sanity at zero erodes sanity max'); else fail('sanity erosion missing');
  life.res.hunger.cur = 0; life.tick(balance.resources.hunger.starveSeconds + 1);
  if (!life.alive) ok('starving long enough is lethal'); else fail('starvation not lethal');
}

// --- Scene flow ---------------------------------------------------------------
game.scene.getScene('Menu').scene.start('Game');
await sleep(800);
if (active().includes('Game') && active().includes('Hud')) ok('Game + Hud start'); else fail(`expected Game+Hud, got [${active()}]`);
if (active().includes('Version')) ok('version badge survives scene change'); else fail('Version scene stopped');

const g = game.scene.getScene('Game');
const house = g.cache.json.get('house');
if (g.player && Math.round(g.player.x) === house.playerStart.x) ok('player spawns at house start'); else fail('player not at start');
if (g.stations.length === house.stations.length) ok(`${g.stations.length} stations placed`); else fail('station count mismatch');
if (g.life.year === 1 && g.life.res.stamina.cur > 0) ok('year 1 clock running'); else fail('life not started');

// Walk to the fridge and use it → mini-game scene appears on top.
const fridge = g.stations.find((s) => s.id === 'fridge');
g.player.setPosition(fridge.x + fridge.w / 2 + 10, fridge.y);
await sleep(100);
if (g.nearStation && g.nearStation.id === 'fridge') ok('station proximity detected'); else fail(`nearStation=${g.nearStation?.id}`);
g.openMinigame(fridge);
await sleep(200);
if (active().includes('MG_Fridge') && g.inMinigame) ok('fridge mini-game launches'); else fail(`mini-game not active [${active()}]`);
const hungerMaxBefore = g.life.res.hunger.max;
game.scene.getScene('MG_Fridge').finish('junk', 1, 'Junk');
await sleep(700);
if (!g.inMinigame && !active().includes('MG_Fridge')) ok('mini-game closes and returns control'); else fail('mini-game did not close');
if (g.life.res.hunger.max < hungerMaxBefore && g.life.yearStats.junk === 1) ok('junk outcome applied to life'); else fail('junk result not applied');

// Run the other two mini-games for a moment each (covers their tick loops), then finish them.
for (const [id, key] of [['shower', 'MG_Shower'], ['bookshelf', 'MG_Read']]) {
  const st = g.stations.find((s) => s.id === id);
  g.openMinigame(st);
  await sleep(900);
  if (active().includes(key)) ok(`${id} mini-game runs`); else fail(`${key} not active [${active()}]`);
  const before = g.life.res.sanity.cur;
  game.scene.getScene(key).finish('done', 1);
  await sleep(700);
  if (!g.inMinigame && g.life.res.sanity.cur > before) ok(`${id} result restores sanity`); else fail(`${id} result not applied`);
}

// Burn the clock → Results.
g.life.res.stamina.cur = 0.01;
await sleep(400);
if (active().includes('Results') && !active().includes('Game')) ok('year ends into Results'); else fail(`expected Results, got [${active()}]`);
if (g.life.history.length === 1) ok('year recorded in history'); else fail('history not recorded');
game.scene.getScene('Results').scene.start('Game');
await sleep(600);
const g2 = game.scene.getScene('Game');
if (g2.life.year === 2 && g2.life.age === 19) ok('next year starts at age 19'); else fail(`year ${g2.life.year}, age ${g2.life.age}`);

// Starve → GameOver.
g2.life.res.hunger.cur = 0; g2.life.starving = balance.resources.hunger.starveSeconds;
await sleep(400);
if (active().includes('GameOver')) ok('death ends in GameOver'); else fail(`expected GameOver, got [${active()}]`);

// ---------------------------------------------------------------- done
game.destroy(true);
console.log(errors.length ? `\n${errors.length} problem(s)` : '\nall good');
process.exit(errors.length ? 1 : 0);
