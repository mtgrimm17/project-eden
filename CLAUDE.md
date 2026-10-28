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
| `tools/` | Dev-only: smoke tests (`smoke-test.mjs` root game, `smoke-runner.mjs` runner, `harness.mjs` shared). Only place npm deps are allowed. | engineers |
| `runner/` | The platformer prototype. Own `src/`, shares `lib/` and `VERSION`. See `docs/RUNNER.md`. | everyone |

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
9. Before saying a change is done, run the smoke tests: `cd tools && npm install && node smoke-test.mjs && node smoke-runner.mjs`.
   They boot the real games in Node and must print `all good`. If one fails, fix it before reporting back.
   When you add a mechanic, add a check for it to the matching test.
   It can't see visuals, so also ask the person to refresh their browser and look.
10. Don't rename or move files other people are likely working in without being asked.
11. Then bump the version (see Versioning) and write `.ship-message` + the ship one-liner (see Git).

## Git: Claude runs NO git command. None.

1. **Claude runs no git command in this repo.** Not `commit`, `push`, `pull`, `status`, `log`, `diff`,
   `fetch`, `stash`, `gc`, nothing. The Cowork sandbox cannot delete files inside `.git`, so any git
   command Claude runs leaves a stale `.git/index.lock` and half-written `.git/objects/tmp_obj_*`
   behind, which then breaks the human's git with "index.lock: File exists". Claude also never
   `rm`s anything under `.git`. If a pull or anything git-related is needed, Claude says so and
   stops; the human runs it in a real terminal. This applies even if the person asks Claude to do it.
2. **Division of labor:** Claude edits files only. Humans commit and push, always via `./ship.sh`
   from Terminal (or GitHub Desktop if they prefer; `ship.sh` is the recommended path).
3. **Every batch of edits ends with two things, both required:**
   - a `.ship-message` file at the repo root (git-ignored; `ship.sh` uses it as the commit body and
     deletes it after a successful push) carrying the long description of what changed and why;
   - a copiable one-liner printed in chat, with the `cd` included:
     `cd ~/Developer/project-eden && ./ship.sh "v0.0.X — what changed"`
     The subject stays under 72 characters including the version prefix. Claude supplies both and
     does not ask the person to choose.
4. **Rebase conflicts:** `ship.sh` rebases, so during a conflict "keep mine" is
   `git checkout --theirs <file>` and "keep remote" is `git checkout --ours <file>`. Before
   advising, Claude reads which version number the remote side carries. If it is equal to or
   higher than ours, go above both and restamp; never publish new bytes under a number that's
   already live. Claude explains in plain language which file conflicts and what each version does;
   the human runs the commands.

Also don't run `npm install` inside the project folder except in `tools/` (git-ignored there).

## Versioning (cache-busted static site)

5. **Bump the version once per ship, not once per edit.** One batch of edits = one bump, however
   many files changed. Read the current number from the files themselves (`VERSION` in
   `src/config.js` and the `?v=` params in `index.html`), never from a doc that says "current
   version"; those go stale.
6. **Before choosing a number, check what's live.** Fetch
   `https://mtgrimm17.github.io/project-eden/src/config.js?nocache=<random>` and read its VERSION.
   If deployed is higher than local, stop and tell the person to pull; edit nothing until they
   confirm. Equal or lower is fine. If the fetch fails, say so and ask; never silently skip it.
7. **The version is stamped in all of these, every time:**
   - `src/config.js` → `VERSION`
   - `index.html` → both `?v=` params (phaser.min.js and main.js)
   - `runner/index.html` → both `?v=` params
   The badge bottom-right of the game (`src/ui/VersionScene.js`, launched by BootScene and never
   stopped) reads `VERSION`, so it updates on its own. It must be visible in every scene; if you add
   a scene, keep `VersionScene` last in the scene list in `main.js`.
   Format: `0.0.N` during pre-alpha; bump the middle number when the concept lands.

## Secrets

8. Real keys (Steam App ID is fine; Steamworks publisher keys, signing certs, API keys are not)
   never go into committed files. Placeholders like `__API_KEY__` stay in source; real values live
   only in git-ignored files (`secrets/`, `steam/steam_appid.txt`) injected at build time. If the
   person pastes a secret into chat, Claude stores it only in a git-ignored file and reminds them
   they can rotate it.

## Working style

9. Give copiable commands for anything the person must run, with the `cd` included, one command
   per line. Say which terminal tab if several are open. Detailed step-by-step, no assumed
   knowledge: most of this team are not terminal people.
10. When someone reports an error, ask for the exact output (screenshot or paste) before guessing
    twice.
11. Keep them informed as you go, but no recaps of what you both just watched.
12. Fix the tool, not the case: prefer a generic improvement (a rule in this file, a helper in
    `tools/`, a data field in `balance.json`) over a one-off hack for a single file or instance.

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
