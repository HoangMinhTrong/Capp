@echo off
title EduTrack - Python Backend & Vite Frontend Launcher
echo ========================================================
echo   EDUTRACK SYSTEM: Python Backend (FastAPI) + Vite SPA
echo ========================================================
echo.

echo [1/2] Dang khoi dong Python Backend tai http://127.0.0.1:8000 ...
start "EduTrack Python Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [2/2] Dang khoi dong Vite Frontend tai http://127.0.0.1:5173 ...
start "EduTrack Vite Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

timeout /t 2 >nul

echo.
echo ========================================================
echo   EduTrack da khoi dong thanh cong!
echo   - Web App Frontend: http://127.0.0.1:5173/
echo   - Python Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
start http://127.0.0.1:5173/
pause

