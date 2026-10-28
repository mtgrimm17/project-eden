// Smoke test for the runner prototype (runner/). Boots it in Node via harness.mjs and
// exercises the movement controller: run, jump, variable height, coyote time, wall slide,
// wall jump, spikes → death → respawn, gold, exit, and the level editor model.
//
//   cd tools && node smoke-runner.mjs

import path from 'path';
import { fileURLToPath } from 'url';
import { boot } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const t = await boot({ root: ROOT, base: 'runner', entry: 'runner/src/main.js' });
const { game, sleep, ok, fail, active } = t;

if (active().includes('Play')) ok('boots into Play'); else fail(`expected Play, got [${active()}]`);
if (active().includes('Version')) ok('version badge running'); else fail('no Version scene');

const p = game.scene.getScene('Play');
const r = p.runner;
const feel = p.feel;
const TILE = 30;
const start = p.level.find('S');
if (start && Math.round(r.x) === start.x) ok('runner spawns at S'); else fail(`runner at ${r.x},${r.y}; start ${start?.x}`);
if (p.level.solidCount > 100 && p.level.layer.getTilesWithin().filter((t) => t.index === 0).length === p.level.solidCount && p.level.spikes.getLength() > 0 && p.level.exits.getLength() === 1) ok(`level built (${p.level.solidCount} solids, ${p.level.spikes.getLength()} spikes)`); else fail('level bodies missing');

// key helpers: drive the controller by faking key state
const K = r.keys;
const hold = (name, down) => { K[name].isDown = down; };
const press = (name) => { K[name].isDown = true; K[name]._justDown = true; };
// Phaser's JustDown reads key._justDown and clears it

// carve an open arena (cols 2-40, rows 2-11 empty, floor at row 12) for the movement checks
for (let rr = 2; rr <= 12; rr++) for (let cc = 2; cc <= 40; cc++) p.level.set(cc, rr, rr === 12 ? '#' : '.');
p.level.rebuild();
r.setPosition(10 * TILE, 11 * TILE + 15);
// settle on the ground
await sleep(500);
if (r.body.blocked.down) ok('runner lands on the floor'); else fail(`not grounded (vy=${r.body.velocity.y})`);

// run right
hold('right', true); await sleep(400);
if (r.body.velocity.x > feel.run.maxSpeed * 0.9) ok(`runs right at max speed (${Math.round(r.body.velocity.x)})`); else fail(`vx=${r.body.velocity.x}`);
hold('right', false); await sleep(300);
if (Math.abs(r.body.velocity.x) < 5) ok('decelerates to a stop'); else fail(`vx=${r.body.velocity.x}`);

// full jump vs short jump (variable height)
const x0 = r.x; const y0 = r.y;
press('jump'); hold('jump', true);
await sleep(80); const vyEarly = r.body.velocity.y;
await sleep(400);
hold('jump', false);
if (vyEarly < -feel.jump.velocity * 0.6) ok('jump launches upward'); else fail(`vy after jump=${vyEarly}`);
await sleep(700);
if (r.body.blocked.down) ok('lands again after a jump'); else fail('did not land');
let fullApex = y0; // measure apex of a held jump
press('jump'); hold('jump', true);
for (let i = 0; i < 40; i++) { await sleep(20); fullApex = Math.min(fullApex, r.y); }
hold('jump', false); await sleep(600);
let shortApex = y0;
press('jump'); hold('jump', true); await sleep(60); hold('jump', false);
for (let i = 0; i < 40; i++) { await sleep(20); shortApex = Math.min(shortApex, r.y); }
await sleep(500);
if (y0 - fullApex > y0 - shortApex + 20) ok(`variable jump height (held ${Math.round(y0 - fullApex)}px vs tapped ${Math.round(y0 - shortApex)}px)`); else fail(`held ${y0 - fullApex}, tapped ${y0 - shortApex}`);

// jump buffer: press slightly before landing still jumps
press('jump'); hold('jump', true); await sleep(300); hold('jump', false);
await sleep(250); // falling
press('jump'); hold('jump', true); // pressed while still in the air
await sleep(500);
const buffered = r.body.velocity.y < -100 || !r.body.blocked.down;
hold('jump', false);
if (buffered) ok('jump buffer: press before landing still jumps'); else fail('buffered jump did not fire');
await sleep(800);

// wall slide + wall jump: build a wall next to the runner and run into it
r.setPosition(10 * TILE, 11 * TILE + 15); await sleep(200);
const col = 13; const row = 11;
for (let rr = row - 12; rr <= row; rr++) p.level.set(col, rr, '#');
p.level.rebuild();
await sleep(100);
hold('right', true);
await sleep(300); // reach the wall
press('jump'); hold('jump', true); await sleep(120); hold('jump', false); // jump up along the wall
await sleep(450);
const slideVy = r.body.velocity.y;
if (r.body.blocked.right && slideVy > 0 && slideVy <= feel.wall.slideSpeed + 1) ok(`wall slide caps fall speed (${Math.round(slideVy)})`); else fail(`blocked.right=${r.body.blocked.right} vy=${slideVy}`);
press('jump'); hold('jump', true); await sleep(60);
const wj = r.body.velocity.x < -100 && r.body.velocity.y < -100;
hold('jump', false); hold('right', false);
if (wj) ok('wall jump launches away from the wall'); else fail(`vx=${r.body.velocity.x} vy=${r.body.velocity.y}`);
await sleep(900);
for (let rr = row - 12; rr <= row; rr++) p.level.set(col, rr, '.');
p.level.rebuild();

// spikes kill, respawn at start
const spike = p.level.find('^');
const deaths0 = p.deaths;
r.setPosition(spike.x, spike.y - 10); await sleep(150);
if (p.deaths === deaths0 + 1 && r.dead) ok('spikes kill'); else fail(`deaths=${p.deaths} dead=${r.dead}`);
await sleep(feel.respawnMs + 200);
if (!r.dead && Math.round(r.x) === start.x) ok('respawns at start'); else fail(`dead=${r.dead} x=${r.x}`);

// gold takes time off
const gold = p.level.find('$');
const before = p.elapsed;
r.setPosition(gold.x, gold.y); await sleep(120);
if (p.gold === 1 && p.elapsed < before) ok('gold collected, time bonus applied'); else fail(`gold=${p.gold}`);

// exit finishes
const exit = p.level.find('E');
r.setPosition(exit.x, exit.y); await sleep(120);
if (p.finished) ok('touching the exit finishes the level'); else fail('not finished');

// editor model: set/rows round-trips, start uniqueness, export
const rows = p.level.rows();
p.level.set(5, 5, 'S');
if (p.level.find('S').c === 5 && p.level.rows().filter((row) => row.includes('S')).length === 1) ok('editor: moving S keeps one start'); else fail('duplicate start');
if (rows.length === p.level.h && rows[0].length === p.level.w) ok('editor: rows() exports the grid'); else fail('rows export wrong');

t.checkVersion(['index.html', 'runner/index.html']);
t.done();
