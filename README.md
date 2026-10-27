# Project Eden

A 2D game by Sound Games, built in four weeks with Claude. Phaser 3, plain JavaScript, no build step.
Target platform: Steam (via Electron).

## Play it locally

- macOS: double-click `play.command`
- Windows: double-click `play.bat`
- Anything with Python: `./play.sh`

Then open http://localhost:8080 (it opens automatically on Mac/Windows).

## Layout

```
index.html          entry page
lib/phaser.min.js   Phaser 3.90 (vendored, don't edit)
src/
  main.js           boots Phaser, lists scenes
  config.js         canvas size, debug flag, version
  scenes/           Boot → Preload → Menu → Game
  entities/         Player and other world objects
  ui/               HUD overlay
  audio/            AudioManager + cue table
  data/             balance.json, levels.json (designers edit these)
assets/             images, audio, fonts
docs/               DESIGN.md, ROADMAP.md
steam/              Electron wrap for the Steam build
tools/              smoke test (boots the game in Node, no browser needed)
.github/workflows/  deploys main to GitHub Pages on every push
```

## Shipping a change

```
cd ~/Developer/project-eden && ./ship.sh "v0.0.2 — what changed"
```

Pulls, runs the smoke test, commits (long description from `.ship-message` if present), pushes.
The version badge bottom-right of the game tells you which build you're looking at.

## For contributors

Read `CONTRIBUTING.md` (non-engineers) and `CLAUDE.md` (what Claude is told about this repo).

## Steam build

See `steam/README.md`. Short version: `cd steam && npm install && npm run build`.
