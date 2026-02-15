@echo off
cd /d "%~dp0"
set PYTHONPATH=%cd%

echo ===============================
echo     SoulSketch Launcher
echo ===============================
echo.

REM === Step 0: Ensure shared_memory structure
call init_shared_memory_structure.bat

REM === Name of your conda environment
set CONDA_ENV=soulsketch-env

REM === Check for conda
where conda >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Conda is not installed or not in PATH.
    echo [ACTION] Please install Miniconda or Anaconda and ensure it's in the system PATH.
    pause
    exit /b
)

REM === Activate conda environment
call conda activate %CONDA_ENV%

REM === Check if streamlit is available in conda env
where streamlit >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Streamlit was not found in conda environment. Installing...
    pip install streamlit
)

REM === Launch app
echo.
echo [🚀] Running SoulSketch...
streamlit run app.py

pause
