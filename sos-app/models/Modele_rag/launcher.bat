@echo off
REM Medical Chatbot Launcher - Windows Batch Script
REM Run this file to launch the medical chatbot application

title Medical Chatbot Launcher
cls

echo.
echo ============================================================
echo             MEDICAL CHATBOT LAUNCHER
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in your PATH
    echo Please install Python 3.10+ from https://www.python.org
    echo.
    pause
    exit /b 1
)

REM Run the launcher
python launcher.py

pause
