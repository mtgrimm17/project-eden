// AudioManager: the single place game code goes to make sound.
// Game code calls `audio.play('pickup')` with a *name*; this file decides what that means.
// That keeps the audio team free to swap, layer and tune sounds without touching gameplay code.
//
// If a named sound has no loaded asset yet, a short synthesized blip plays instead,
// so the game is never silent while real audio is in progress.

import { CUES } from './cues.js';

export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.music = null;
  }

  play(name) {
    const cue = CUES[name];
    if (!cue) {
      console.warn(`[audio] unknown cue "${name}"`);
      return;
    }
    if (cue.key && this.scene.cache.audio.exists(cue.key)) {
      this.scene.sound.play(cue.key, { volume: cue.volume ?? 1 });
    } else {
      this.blip(cue.fallback ?? 440);
    }
  }

  playMusic(key, opts = {}) {
    if (this.music) this.music.stop();
    if (!this.scene.cache.audio.exists(key)) return;
    this.music = this.scene.sound.add(key, { loop: true, volume: opts.volume ?? 0.6 });
    this.music.play();
  }

  stopMusic() {
    if (this.music) this.music.stop();
    this.music = null;
  }

  // Tiny WebAudio placeholder so unfinished cues are still audible.
  blip(freq) {
    const ctx = this.scene.sound.context;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }
}
