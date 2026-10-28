# Runner prototype (`runner/`)

A precision platformer prototype: static levels, camera on the player, movement that feels great.
Lives in `runner/`, shares Phaser and the version number with the root game, and is reachable at
`/runner/` on the Pages URL (or press P on the root menu).

## Controls

- Move: A/D or ←/→
- Jump: SPACE, W, ↑, K or Z. Hold for height, release early to cut it short.
- Wall slide: hold into a wall while falling. Jump off it to wall-jump.
- R restart · TAB level editor

## The feel (`runner/src/data/feel.json`)

Everything that makes it feel like something is a number in that file: ground accel/decel and
turn boost, air control, jump velocity, jump-cut multiplier (variable height), coyote time, jump
buffer, apex hang (gravity scale near the top), separate up/down gravity, max fall, wall slide
speed, wall jump (vx, vy) and the input lock after it, camera lerp and look-ahead.
Change one, refresh, feel it.

## Levels (`runner/src/data/level1.json`)

Text rows, 30px tiles: `#` solid, `^` spike, `$` gold (takes a second off the clock), `S` start,
`E` exit, `.` empty. Solids are a tilemap layer so the player never snags on tile seams.

## Editor (TAB)

Press TAB in play. 1 solid · 2 spike · 3 gold · 4 start · 5 exit · 0 or right-click erase.
Left-drag paints, WASD scrolls. Edits autosave in your browser; X downloads the level as JSON
(drop it in `runner/src/data/` and point `main.js` at it); C resets to the file version.
TAB again restarts the level from the start.

## What's next (once the feel is right)

The riff. Candidates discussed: time-loop echo, builder/runner, tide. Decide after the movement is
fun on its own. Also: a death counter that matters, ghosts, level select, ~30 levels.
