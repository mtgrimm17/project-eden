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

game.scene.getScene('Menu').scene.start('Game', { levelId: 'level-1' });
await sleep(800);
if (active().includes('Game') && active().includes('Hud')) ok('Game + Hud start'); else fail(`expected Game+Hud, got [${active()}]`);

const g = game.scene.getScene('Game');
const level = g.cache.json.get('levels')['level-1'];
if (g.player && Math.round(g.player.x) === level.playerStart.x) ok('player spawns at level start'); else fail('player not at level start');
if (g.pickups.countActive() === level.pickups.length) ok(`${level.pickups.length} pickups spawned`); else fail('pickup count mismatch');

const first = g.pickups.getChildren()[0];
g.player.setPosition(first.x, first.y);
await sleep(300);
const expected = g.cache.json.get('balance').scoring.pickupValue;
if (g.score === expected && g.pickups.countActive() === level.pickups.length - 1) ok('pickup overlap scores'); else fail(`score ${g.score}, pickups ${g.pickups.countActive()}`);

// ---------------------------------------------------------------- done
game.destroy(true);
console.log(errors.length ? `\n${errors.length} problem(s)` : '\nall good');
process.exit(errors.length ? 1 : 0);
