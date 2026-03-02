@echo off
title App Reader — Launcher
color 0B
cls

echo ============================================
echo   APP READER — AI Readiness Platform v2.0
echo ============================================
echo.

:: ── MongoDB ───────────────────────────────────
echo [1/3] Starting MongoDB...
where mongod >nul 2>&1
if %errorlevel%==0 (
    start /min "MongoDB" cmd /c "mongod --quiet"
    timeout /t 3 /nobreak >nul
    echo       MongoDB started OK
) else (
    echo       WARNING: mongod not found in PATH.
    echo       Ensure MongoDB is installed and running.
    timeout /t 2 /nobreak >nul
)

:: ── Backend ───────────────────────────────────
echo.
echo [2/3] Starting FastAPI Backend (port 8000)...
cd /d "%~dp0backend"
if exist ".venv\Scripts\uvicorn.exe" (
    start "App Reader Backend" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000"
) else if exist ".venv\Scripts\python.exe" (
    start "App Reader Backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
) else (
    start "App Reader Backend" cmd /k "uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
)
timeout /t 5 /nobreak >nul
echo       Backend started OK

:: ── Frontend ──────────────────────────────────
echo.
echo [3/3] Starting React Frontend (port 5173)...
cd /d "%~dp0frontend"
start "App Reader Frontend" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
echo       Frontend started OK

:: ── Open Browser ──────────────────────────────
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================
echo   All services started!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ============================================
echo.
pause
