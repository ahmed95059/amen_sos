@echo off
cd /d "%~dp0"

echo ===============================
echo     SoulSketch - Force Delete .venv
echo ===============================
echo.

rmdir /s /q ".venv"
echo [DONE] .venv folder removed (if existed).

echo.
echo [EXIT] Press any key to close...
pause >nul
