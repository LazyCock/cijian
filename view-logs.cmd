@echo off
setlocal
title CIJIAN Logs
cd /d "%~dp0"

if not exist "logs" mkdir "logs"

if /i "%~1"=="caddy" (
  powershell -NoProfile -Command "if (Test-Path 'logs\caddy-access.log') { Get-Content 'logs\caddy-access.log' -Tail 100 -Wait } else { Write-Host 'No caddy-access.log yet.'; Read-Host 'Press Enter' }"
  exit /b 0
)

echo.
echo  App log: %CD%\logs\app.log
echo  Caddy access log: %CD%\logs\caddy-access.log
echo  Press Ctrl+C to stop following.
echo.

if exist "logs\app.log" (
  powershell -NoProfile -Command "Get-Content 'logs\app.log' -Tail 100 -Wait"
) else (
  echo No app.log yet. Start the site with start-local.cmd first.
  pause
)
