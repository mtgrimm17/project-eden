#!/usr/bin/env bash
# Serves the game folder on http://localhost:8080 and opens it in a browser.
# ES modules can't load from file://, so we need a tiny local server. Python ships with one.
cd "$(dirname "$0")"
PORT=8080
echo "Project Eden -> http://localhost:$PORT  (Ctrl+C to stop)"
if command -v open >/dev/null 2>&1; then (sleep 1; open "http://localhost:$PORT") &
elif command -v xdg-open >/dev/null 2>&1; then (sleep 1; xdg-open "http://localhost:$PORT") & fi
if command -v python3 >/dev/null 2>&1; then python3 -m http.server $PORT
elif command -v python >/dev/null 2>&1; then python -m http.server $PORT
elif command -v npx >/dev/null 2>&1; then npx --yes serve -l $PORT .
else echo "Need python3 or node installed."; read -r -p "Press Enter to close"; fi
