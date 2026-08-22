@echo off
title Midnight Studio V4 - Dev Server

echo ============================================
echo Midnight Studio V4 - Starting Dev Server
echo ============================================
echo.

echo Installing dependencies if needed...
call npm install --legacy-peer-deps

echo.
echo Starting Next.js dev server...
echo Frontend: http://localhost:3000
echo.

npm run dev

pause
