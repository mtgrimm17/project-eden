// harness.mjs: boots a Phaser game in Node with a fake browser (jsdom + no-op canvas + file XHR).
// Shared by smoke-test.mjs (root game) and smoke-runner.mjs (runner prototype).
//
//   const t = await boot({ root: REPO_ROOT, base: 'runner', entry: 'runner/src/main.js' });
//   t.game, t.window, t.ok(msg), t.fail(msg), t.sleep(ms), t.active(), t.done()
//
// `base` is the folder the game's relative URLs resolve against (where its index.html lives).

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

export async function boot({ root, base = '.', entry, bootWaitMs = 1500, timeoutMs = 60000 }) {
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
    'MutationObserver', 'Audio', 'HTMLAudioElement', 'screen', 'localStorage']) if (w[k] !== undefined) def(k, w[k]);
  def('self', globalThis);
  def('getComputedStyle', w.getComputedStyle.bind(w));
  def('AudioContext', undefined);
  if (!w.CanvasRenderingContext2D) w.CanvasRenderingContext2D = class CanvasRenderingContext2D {};
  def('CanvasRenderingContext2D', w.CanvasRenderingContext2D);

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

  const baseDir = path.join(root, base);
  class FakeXHR extends w.EventTarget {
    constructor() { super(); this.readyState = 0; this.status = 0; this.responseText = ''; this.response = ''; this.responseType = ''; this.timeout = 0; this.onload = null; this.onerror = null; this.onprogress = null; }
    open(_m, u) { this.url = u; this.readyState = 1; }
    setRequestHeader() {} overrideMimeType() {} abort() {} getResponseHeader() { return null; } getAllResponseHeaders() { return ''; }
    send() {
      setTimeout(() => {
        try {
          const t = fs.readFileSync(path.join(baseDir, this.url), 'utf8');
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

  new Function(fs.readFileSync(path.join(root, 'lib/phaser.min.js'), 'utf8'))();
  globalThis.Phaser.AUTO = Phaser.CANVAS;

  const errors = [];
  setTimeout(() => { console.error(`TIMEOUT: smoke test did not finish in ${timeoutMs / 1000}s`); process.exit(1); }, timeoutMs);
  process.on('uncaughtException', (e) => { errors.push(e); console.error('ERROR:', e.message); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fail = (msg) => { console.error('FAIL:', msg); errors.push(new Error(msg)); };
  const ok = (msg) => console.log('ok  ', msg);

  await import(path.join(root, entry));
  const game = w.game;
  await sleep(bootWaitMs);
  const active = () => game.scene.getScenes(true).map((s) => s.scene.key);
  const done = () => {
    game.destroy(true);
    console.log(errors.length ? `\n${errors.length} problem(s)` : '\nall good');
    process.exit(errors.length ? 1 : 0);
  };

  // Version stamping: config.js VERSION must equal every ?v= in the given index.html files.
  const checkVersion = (indexFiles) => {
    const cfg = fs.readFileSync(path.join(root, 'src/config.js'), 'utf8').match(/VERSION\s*=\s*'([^']+)'/)?.[1];
    for (const f of indexFiles) {
      const vParams = [...fs.readFileSync(path.join(root, f), 'utf8').matchAll(/\?v=([\w.-]+)/g)].map((m) => m[1]);
      if (cfg && vParams.length >= 2 && vParams.every((v) => v === cfg)) ok(`version ${cfg} stamped consistently in ${f}`);
      else fail(`version mismatch: config.js=${cfg}, ${f}=[${vParams}]`);
    }
  };

  return { game, window: w, sleep, ok, fail, active, done, errors, checkVersion };
}
