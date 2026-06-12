@echo off
title Smart Room Booking Launcher
echo =========================================================
echo       SMART CONFERENCE ROOM BOOKING SYSTEM LAUNCHER
echo =========================================================
echo.
echo Starting backend server on port 8080...
start "Booking Backend (Port 8080)" cmd /k "cd backend && mvn spring-boot:run"

echo Starting frontend dev server on port 5173...
start "Booking Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================
echo Launch completed.
echo Backend URL: http://localhost:8080
echo Frontend URL: http://localhost:5173
echo.
echo Test Credentials:
echo   - Super Admin:    superadmin / password123
echo   - Facility Admin: admin / password123
echo   - Manager:        manager / password123
echo   - Employee:       employee / password123
echo =========================================================
pause
