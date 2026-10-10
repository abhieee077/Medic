```bat
@echo off
setlocal
set "ROOT=%~dp0"

cd /d "%ROOT%"

echo.
echo ========================================
echo          Starting MEDIC
echo ========================================
echo.

echo Checking Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running.
    echo Start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting Orthanc...
docker compose -f "dicom\docker-compose.yml" up -d
if errorlevel 1 (
    echo ERROR: Failed to start Orthanc.
    pause
    exit /b 1
)

echo Starting existing themed OHIF...
docker compose -f "dicom\ohif-compose.yml" up -d
if errorlevel 1 (
    echo ERROR: Failed to start OHIF.
    pause
    exit /b 1
)

echo Starting MEDIC backend in the background...
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Set-Location -LiteralPath '%ROOT%'; & '.\backend\.venv\Scripts\python.exe' -m uvicorn backend.main:app --reload --reload-dir backend --port 8001 *> '.\backend-startup.log'"

echo Starting MEDIC frontend in the background...
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Set-Location -LiteralPath '%ROOT%frontend'; npm.cmd run dev *> '..\frontend-startup.log'"

echo Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo Opening MEDIC workspace...
start "" "http://localhost:5173/workspace"

echo Opening MEDIC-themed OHIF...
start "" "http://localhost:3000"

echo.
echo MEDIC startup commands sent.
echo The server processes are running in the background.
echo Logs: backend-startup.log and frontend-startup.log
echo.

exit /b 0
```