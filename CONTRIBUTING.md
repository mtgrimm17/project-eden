# How to contribute to Project Eden (no coding required)

You'll use Claude (Cowork or Claude Code) to make changes. You describe what you want; Claude edits
the files; you look at the result in your browser. This page is the whole workflow.

## One-time setup (15 minutes)

1. **Install GitHub Desktop** (desktop.github.com) and sign in with your GitHub account.
2. **Clone the repo**: in GitHub Desktop, File → Clone repository → pick `project-eden`.
   Remember the folder it lands in (usually `~/Documents/GitHub/project-eden`).
3. **Open Claude Cowork** and connect it to that folder (choose the folder when Cowork asks what to work on).
4. **Run the game once**: double-click `play.command` (Mac) or `play.bat` (Windows). A browser tab opens
   with the game. Keep that terminal window open while you play; close it when you're done.

If step 4 doesn't work, tell Claude "the game won't start" and paste whatever the window says.

## Every time you work

1. **Get the latest**: in GitHub Desktop press *Fetch origin* then *Pull*.
2. **Ask Claude for what you want.** Be concrete. Good requests:
   - "Make the player 20% faster."
   - "Add three more pickups to level 1 near the top-left."
   - "The pickup sound should be lower pitched and shorter."
   - "Add a pause menu with Resume and Quit."
3. **Refresh the browser tab** to see the change. Play it. If it's wrong, say what's wrong.
4. **Save your work** in GitHub Desktop: write a one-line summary, click *Commit to main*, then
   *Push origin*. (Claude is told never to do this for you; it breaks things in Cowork.)

That's it. Pull → ask → refresh → commit & push.

## What you own

To avoid stepping on each other, each person mostly works in their own area:

- **Designers**: `src/data/` (balance numbers, levels), `docs/DESIGN.md`
- **Product**: `src/ui/`, menus, flow, `docs/ROADMAP.md`
- **Audio**: `src/audio/`, `assets/audio/`
- **Art**: `assets/images/`
- **Engineers**: `src/scenes/`, `src/entities/`, `steam/`, and anything that's broken

You can ask Claude to change things outside your area, just mention it in the team channel
so the owner knows.

## If something breaks

- "Game won't load / black screen": tell Claude "the game shows a black screen, check the browser console".
- "Merge conflict" in GitHub Desktop: don't guess. Ask Claude to explain what the two versions do,
  then pick one in Desktop, or ping an engineer.
- GitHub Desktop says something about a ".lock" file: open Terminal and paste
  `rm -f ~/Developer/project-eden/.git/*.lock ~/Developer/project-eden/.git/objects/maintenance.lock`
  (adjust the path if your clone is elsewhere), then try again.
- Nuclear option: GitHub Desktop → Branch → *Discard all changes*, then Pull. You lose only your
  unsynced work.

## Things not to do

- Don't edit anything in `lib/`.
- Don't add npm packages, build tools, or online dependencies. The game must work offline.
- Don't push if the game doesn't load. Fix it or discard first.
