# Steam build (Electron wrap)

Engineer-owned. Nothing in here affects the browser version of the game. Plan: week 3.

## Why Electron

The game is plain HTML/JS. Electron bundles a Chromium runtime around it so it ships as a normal
desktop app. Steam is fine with this; several well-known indie games ship this way.

## Local test

```
cd steam
npm install
npm start          # opens the game in an Electron window, loading ../index.html
npm run build      # produces dist/mac/ and dist/win-unpacked/ (unsigned)
```

The packaged build copies `index.html`, `lib/`, `src/` and `assets/` into `resources/game/`.
If you add a top-level folder the game needs, add it to `extraResources` in `package.json`.

## Steamworks integration (achievements, overlay, cloud)

Use **steamworks.js** (`npm i steamworks.js`), the maintained Node binding for the Steamworks SDK.
Rough steps:

1. Create the app in Steamworks partner site; note the App ID.
2. In `main.js` before `createWindow()`: `const steamworks = require('steamworks.js'); const client = steamworks.init(APP_ID);`
3. Call `steamworks.electronEnableSteamOverlay()` for the overlay.
4. Expose what the game needs via `preload.js` → `window.eden` (achievements, user name).
5. For local testing create `steam/steam_appid.txt` containing the App ID (git-ignored).

## Upload to Steam

- Install the Steamworks SDK, use `steamcmd` + `ContentBuilder` with a depot per platform
  (`dist/win-unpacked` and `dist/mac/Project Eden.app`).
- Push to a `playtest` branch first; set it live for the team before touching `default`.
- Mac builds should be signed and notarized before public release (Apple Developer account).
  Unsigned is fine for internal playtest if people right-click → Open.

## Checklist before review

- Launches from the Steam client on a clean Windows machine and a clean Mac.
- Works fully offline.
- Fullscreen toggles (F11 or in-game).
- Quit from the in-game menu closes the app (use `window.close()` from the page; Electron quits).
- Store page: capsule images, 5+ screenshots, trailer, description, tags, pricing.
