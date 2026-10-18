@echo off
echo ========================================================
echo   Starting GKA Construction ERP Development Servers
echo ========================================================
echo.
echo 1. Starting Backend API (Port 5000)...
start "GKA Backend API" cmd /k "cd /d %~dp0server && npm run dev"
echo.
echo 2. Starting Frontend Client (Port 3000)...
start "GKA Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"
echo.
echo Both servers are launching in separate windows!
echo Web App: http://localhost:3000
echo API:     http://localhost:5000
echo ========================================================
pause
