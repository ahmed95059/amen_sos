@echo off
echo [INFO] Installing Python dependencies for SoulSketch...
echo.

REM === Create virtual environment if not exists ===
IF NOT EXIST .venv (
    echo [INFO] Creating virtual environment...
    python -m venv .venv
)

REM === Activate virtual environment ===
call .venv\Scripts\activate

REM === Upgrade pip and install dependencies ===
echo [INFO] Installing requirements (CPU-only torch)...
pip install --upgrade pip

REM === Important: Pass requirements with external index URL ===
pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

echo.
echo [✅ DONE] All dependencies installed in virtual environment.
pause
