@echo off
cd /d "%~dp0"
title Serviceline - local demo

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Install it from https://nodejs.org, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo   First run - installing dependencies. This takes about a minute.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

cls
echo.
echo   ==========================================================
echo     Serviceline - local demo
echo   ==========================================================
echo.
echo     This PC     open the "Local" address below
echo     Your phone  open the "Network" address below
echo.
echo     The phone must be on the same Wi-Fi as this PC.
echo     It will warn that the certificate is not trusted -
echo     that is expected for a local demo. Tap Advanced,
echo     then Proceed, and the camera will work.
echo.
echo     Press Ctrl+C twice in this window to stop the server.
echo   ==========================================================
echo.

start "" cmd /c "timeout /t 6 /nobreak >nul & start "" https://localhost:5173"
call npm run dev:phone
echo.
echo   Server stopped.
pause
