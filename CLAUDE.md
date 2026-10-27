# Project Eden — instructions for Claude

You are helping a small team (designers, product, engineers, audio) build a 2D game in four weeks.
Most contributors are not engineers. Optimise for: things working, being readable, and not breaking
other people's work. Not for cleverness.

## What this is

- A 2D game built with **Phaser 3** (vendored at `lib/phaser.min.js`, v3.90) in plain **ES modules**.
- **No build step.** The game runs by serving the folder (`./play.command` or `./play.sh`) and opening
  `index.html`. Do not introduce bundlers, TypeScript, npm dependencies, or frameworks.
- Target platform is **Steam** (Windows/macOS) via an Electron wrap in `steam/`. Keep everything
  working offline: no CDN links, no network calls.
- Canvas is 960x540, pixel-art rendering is on.

## Where things live (and who owns them)

| Path | Contents | Typical owner |
|---|---|---|
| `src/scenes/` | Phaser scenes: Boot, Preload, Menu, Game | engineers |
| `src/entities/` | Things in the world (Player, enemies, pickups). One class per file. | engineers |
| `src/ui/` | HUD, menus, overlays | product / engineers |
| `src/audio/` | `AudioManager.js` and the cue table `cues.js` | audio |
| `src/data/*.json` | Balance numbers, level layouts, text. **No code here.** | designers |
| `assets/` | images, audio, fonts | art / audio |
| `docs/` | design docs, roadmap, decisions | everyone |
| `steam/` | Electron wrap + Steamworks notes | engineers |
| `tools/` | Dev-only: smoke test. Only place npm deps are allowed. | engineers |

When asked to make a change, put it in the right folder. If a request spans folders, say so and
keep the change minimal in the folders the person doesn't own.

## Rules

1. **Numbers go in `src/data/balance.json`**, never hard-coded in gameplay code. Read them from
   `this.cache.json.get('balance')` (already loaded in BootScene).
2. **Sound goes through `AudioManager`**: `this.audio.play('cue-name')`. Add new cue names to
   `src/audio/cues.js`. Never call `this.sound.play` directly from gameplay code.
3. **Levels are data** in `src/data/levels.json`. GameScene reads them; it does not contain layout.
4. **Scenes talk through events** (`this.events.emit`), not by reaching into each other's fields.
5. **New entities** extend `Phaser.Physics.Arcade.Sprite`, take a `stats` object from balance.json,
   and expose `update()`. Follow `src/entities/Player.js`.
6. **Placeholder art is fine.** If an asset doesn't exist, generate a coloured shape in
   `PreloadScene.makePlaceholderTextures()` so the game still runs.
7. **Keep files small.** If a file passes ~200 lines, split it.
8. **Never edit `lib/`.**
9. Before saying a change is done, run the smoke test: `cd tools && npm install && node smoke-test.mjs`.
   It boots the real game in Node and must print `all good`. If it fails, fix it before reporting back.
   When you add a mechanic, add a check for it to the CHECKS section of `tools/smoke-test.mjs`.
   It can't see visuals, so also ask the person to refresh their browser and look.
10. Don't rename or move files other people are likely working in without being asked.

## Working with git (do this for non-engineers)

If the person asks you to "sync", "save my work", "get the latest" or similar:

```
git pull --rebase origin main      # get everyone else's work first
git add -A
git commit -m "<short description of the change>"
git push origin HEAD
```

If there's a merge conflict, explain in plain language which file and what the two versions do,
and ask which to keep. Never force-push.

## Phaser notes (common mistakes to avoid)

- Phaser is loaded as a global `Phaser` from a classic script tag; **do not `import Phaser`**.
- Arcade physics bodies: use `setVelocity`, `setAcceleration`, `setDrag`; don't set `x`/`y` on a
  moving physics sprite every frame.
- `this.add.existing(obj)` *and* `this.physics.add.existing(obj)` are both needed for a custom sprite.
- Text uses `fontFamily: 'monospace'` until we load a real font.
- Scene keys are strings: `'Boot' | 'Preload' | 'Menu' | 'Game' | 'Hud'`.

## The game itself

See `docs/DESIGN.md` for the current concept and `docs/ROADMAP.md` for the week-by-week plan.
If `docs/DESIGN.md` says "TBD", the concept isn't decided yet: don't invent mechanics beyond the
sandbox in GameScene.
