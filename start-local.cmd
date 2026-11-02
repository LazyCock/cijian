@echo off
setlocal
title CIJIAN Local Server
cd /d "%~dp0"

set "PATH=%LOCALAPPDATA%\pnpm\bin;%PATH%"

echo.
echo  CIJIAN - local start
echo  ---------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm was not found on PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [ERROR] node_modules is missing.
  echo Run "pnpm install" first.
  pause
  exit /b 1
)

set "MODE=start"
if not exist ".next\BUILD_ID" set "MODE=dev"
if /i "%~1"=="dev" set "MODE=dev"
if /i "%~1"=="prod" set "MODE=start"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo  Site is already running on http://localhost:3000
  start "" "http://localhost:3000"
  exit /b 0
)

echo  Mode: %MODE%
echo  URL:  http://localhost:3000
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

if /i "%MODE%"=="dev" (
  call pnpm dev
) else (
  call pnpm start
)

echo.
echo  Server stopped.
pause
