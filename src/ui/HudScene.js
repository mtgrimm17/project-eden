// HudScene: overlay on GameScene. Ticket board (top-left), year clock and score (top-right),
// hands (bottom-left), mess (bottom-centre), and a year-summary pane that slides in on the right.
// Reads the game scene each frame; never mutates it.

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { C, FONT } from '../palette.js';

const TICKET_W = 120;
const TICKET_H = 54;
const TICKET_GAP = 8;
const PANE_W = 230;

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  init(data) {
    this.g = data.gameScene;
  }

  create() {
    this.tickets = new Map();
    this.timerText = this.add.text(GAME_WIDTH - 20, 14, '', { fontFamily: FONT, fontSize: '30px', color: C.inkS, fontStyle: 'bold' }).setOrigin(1, 0);
    this.yearText = this.add.text(GAME_WIDTH - 20, 50, '', { fontFamily: FONT, fontSize: '13px', color: C.muteS, fontStyle: 'bold' }).setOrigin(1, 0);
    this.scoreText = this.add.text(GAME_WIDTH - 110, 14, '', { fontFamily: FONT, fontSize: '22px', color: C.muteS, fontStyle: 'bold' }).setOrigin(1, 0);
    this.handsText = this.add.text(20, GAME_HEIGHT - 22, '', { fontFamily: FONT, fontSize: '13px', color: C.muteS, fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.messText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '', { fontFamily: FONT, fontSize: '13px', color: C.redS, fontStyle: 'bold' }).setOrigin(0.5);

    this.pane = this.makePane();

    this.g.events.on('ticket-complete', (t) => this.flashTicket(t, C.green, '+' + this.g.balance.scoring.complete), this);
    this.g.events.on('ticket-expired', (t) => this.flashTicket(t, C.red, String(this.g.balance.scoring.expire)), this);
    this.g.events.on('year-summary', this.showYear, this);
    this.g.events.once('shutdown', () => this.scene.stop());
  }

  update() {
    const g = this.g;
    this.timerText.setText(Math.ceil(Math.max(0, g.timeLeft)).toString());
    this.yearText.setText(`YEAR ${g.year} · ${g.baby.phase.name.toUpperCase()}`);
    this.scoreText.setText(`${Math.round(g.score)}`);
    const name = (k) => (k ? g.items[k].label.toUpperCase() : '—');
    this.handsText.setText(`LEFT (mouse L · Q/E): ${name(g.hands.L)}      RIGHT (mouse R · J/L): ${name(g.hands.R)}`);
    this.messText.setText(g.messOnFloor ? `${g.messOnFloor} thing${g.messOnFloor > 1 ? 's' : ''} on the floor` : '');

    const open = g.demands.open;
    for (const t of open) if (!this.tickets.has(t.id)) this.tickets.set(t.id, this.makeTicket(t));
    for (const [id, card] of this.tickets) {
      if (!open.some((t) => t.id === id) && !card.leaving) { card.leaving = true; this.time.delayedCall(350, () => { card.destroy(); this.tickets.delete(id); }); }
    }
    open.forEach((t, i) => {
      const card = this.tickets.get(t.id);
      card.setPosition(20 + i * (TICKET_W + TICKET_GAP), 14);
      const frac = Math.max(0, t.timer / t.total);
      card.bar.width = (TICKET_W - 12) * frac;
      card.bar.fillColor = frac < 0.25 ? C.red : C[t.color] ?? C.ink;
      card.time.setText(Math.ceil(t.timer).toString());
      card.box.setStrokeStyle(3, frac < 0.25 ? C.red : C.ink);
    });
  }

  makeTicket(t) {
    const c = this.add.container(0, 0);
    const box = this.add.rectangle(0, 0, TICKET_W, TICKET_H, C.bg).setOrigin(0, 0).setStrokeStyle(3, C.ink);
    const label = this.add.text(8, 8, t.label.toUpperCase(), { fontFamily: FONT, fontSize: '14px', color: C[`${t.color}S`] ?? C.inkS, fontStyle: 'bold' });
    const time = this.add.text(TICKET_W - 8, 8, '', { fontFamily: FONT, fontSize: '14px', color: C.muteS, fontStyle: 'bold' }).setOrigin(1, 0);
    const bg = this.add.rectangle(6, TICKET_H - 14, TICKET_W - 12, 8, C.wall).setOrigin(0, 0);
    const bar = this.add.rectangle(6, TICKET_H - 14, TICKET_W - 12, 8, C[t.color] ?? C.ink).setOrigin(0, 0);
    c.add([box, label, time, bg, bar]);
    c.box = box; c.bar = bar; c.time = time;
    c.setScale(0.6); this.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.Out' });
    return c;
  }

  flashTicket(t, color, text) {
    const card = this.tickets.get(t.id);
    const x = card ? card.x + TICKET_W / 2 : 80;
    const y = card ? card.y + TICKET_H / 2 : 40;
    if (card) card.box.fillColor = color;
    const f = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '22px', color: C.whiteS, fontStyle: 'bold', stroke: C.inkS, strokeThickness: 4 }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: f, y: y - 30, alpha: 0, duration: 800, onComplete: () => f.destroy() });
  }

  // ---- year pane: slides in from the right, stays a few seconds, slides out
  makePane() {
    const c = this.add.container(GAME_WIDTH + PANE_W, 90).setDepth(40);
    const box = this.add.rectangle(0, 0, PANE_W, 230, C.ink, 0.94).setOrigin(0, 0);
    const title = this.add.text(16, 14, '', { fontFamily: FONT, fontSize: '16px', color: C.whiteS, fontStyle: 'bold' });
    const stars = this.add.text(16, 38, '', { fontFamily: FONT, fontSize: '34px', color: C.yellowS, fontStyle: 'bold' });
    const body = this.add.text(16, 86, '', { fontFamily: FONT, fontSize: '13px', color: C.whiteS, lineSpacing: 6 });
    const foot = this.add.text(16, 176, '', { fontFamily: FONT, fontSize: '12px', color: C.yellowS, fontStyle: 'bold', wordWrap: { width: PANE_W - 32 } });
    c.add([box, title, stars, body, foot]);
    c.title = title; c.stars = stars; c.body = body; c.foot = foot;
    return c;
  }

  showYear(s) {
    const p = this.pane;
    p.title.setText(`YEAR ${s.year} DONE`);
    p.foot.setText(s.unlocked?.length ? `NEW: ${s.unlocked.join(', ')}` : '');
    p.stars.setText('★★★'.slice(0, s.stars) + '☆☆☆'.slice(0, 3 - s.stars));
    p.body.setText([
      `needs met   ${s.completed} / ${s.spawned}`,
      `missed      ${s.expired}`,
      `score       ${s.score > 0 ? '+' : ''}${s.score}`,
      `carried     ${s.carriedSeconds}s`,
      `mess left   ${s.messLeft}`,
    ].join('\n'));
    this.tweens.killTweensOf(p);
    this.tweens.add({ targets: p, x: GAME_WIDTH - PANE_W - 12, duration: 300, ease: 'Cubic.Out' });
    this.tweens.add({ targets: p, x: GAME_WIDTH + PANE_W, duration: 300, ease: 'Cubic.In', delay: s.unlocked?.length ? 6500 : 4500 });
  }
}
