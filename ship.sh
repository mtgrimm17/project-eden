#!/usr/bin/env bash
# ship.sh — the ONLY way code leaves this machine. Run from Terminal:
#   cd ~/Developer/project-eden && ./ship.sh "v0.0.2 — what changed"
#
# Pulls (rebase), runs the smoke test if tools/ is installed, commits everything
# with the long description from .ship-message, pushes, then deletes .ship-message.
# Claude never runs this or any other git command; a human does.
set -e
cd "$(dirname "$0")"

MSG="$1"
if [ -z "$MSG" ]; then
  echo 'usage: ./ship.sh "v0.0.2 — short description (under 72 chars)"'
  exit 1
fi

# Stale lock left by a crashed process (older than 2 minutes, no git running) — clear it.
for lock in .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock; do
  if [ -f "$lock" ] && ! pgrep -x git >/dev/null && [ "$(find "$lock" -mmin +2)" ]; then
    echo "removing stale $lock"; rm -f "$lock"
  fi
done

if [ -d tools/node_modules ]; then
  echo "== smoke test"
  (cd tools && node smoke-test.mjs) || { echo "!! smoke test failed; not shipping."; exit 1; }
fi

echo "== committing"
git add -A
if git diff --cached --quiet; then
  echo "(nothing new to commit; pushing what's already committed)"
elif [ -f .ship-message ]; then
  git commit -m "$MSG" -m "$(cat .ship-message)"
else
  git commit -m "$MSG"
fi

echo "== pulling everyone else's work"
git pull --rebase origin main || {
  echo
  echo "!! Rebase conflict. Paste the output above to Claude; it will tell you which file and what each version does."
  echo "   To keep YOUR version of a file:   git checkout --theirs <file> && git add <file> && git rebase --continue"
  echo "   To keep the REMOTE version:       git checkout --ours <file>   && git add <file> && git rebase --continue"
  echo "   Then run ./ship.sh again with the same message."
  exit 1
}

echo "== pushing"
git push origin HEAD
rm -f .ship-message
echo
echo "shipped: $MSG"
echo "live in ~1 min at https://mtgrimm17.github.io/project-eden/"
