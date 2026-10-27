# Roadmap — four weeks

Guiding rule: the game on `main` is always playable. Scope down before slipping.

## Week 1 — Playable (see docs/DESIGN.md "Week-1 slice")
- Day 1: everyone clones, runs the game, makes one trivial change, ships it.
- Day 2–3: walkable house, three bars with current/max, round timer = stamina, one mini-game.
  Decide if the 60-second prioritisation loop is fun.
- Day 4–5: three mini-games, junk-food and sanity-erosion rules, results screen, narrator lines.
- Exit: someone outside the team plays three years, laughs at the narrator, and wants a fourth.

## Week 2 — Fun
- Tune `balance.json` daily. Add the second and third "verbs" only if the first is already fun.
- Real audio replaces placeholder blips. Music loop in.
- 3–5 levels or one procedural generator.
- Menu, pause, game over, restart flow.
- Exit: the team wants to keep playing after the playtest ends.

## Week 3 — Steam
- Engineer: Electron wrap builds on Mac and Windows (`steam/`). Steamworks app set up, depot
  uploads, playtest branch.
- Everyone else: content, polish, juice (screen shake, particles, sound layering).
- Exit: a Steam build installs and runs via the Steam client on a clean machine.

## Week 4 — Ship
- Freeze features Monday. Bug fixes, balance, store page assets (capsule art, screenshots, trailer).
- Submit for Steam review (allow several business days).
- Exit: it's live, or in review, and we're proud of it.
