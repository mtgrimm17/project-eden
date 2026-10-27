@echo off
REM Windows: double-click this file to run the game.
cd /d "%~dp0"
echo Project Eden -^> http://localhost:8080  (close this window to stop)
start "" http://localhost:8080
where python >nul 2>nul && (python -m http.server 8080 & goto :eof)
where py >nul 2>nul && (py -m http.server 8080 & goto :eof)
where npx >nul 2>nul && (npx --yes serve -l 8080 . & goto :eof)
echo Need Python or Node installed. Ask an engineer or Claude.
pause
