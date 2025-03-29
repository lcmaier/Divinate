@echo off
echo Starting MTG Price Update - %date% %time%

:: Use absolute paths
set PROJECT_ROOT=C:\Users\maier\Desktop\PYTHON\MTG_Price_Predictor_Dashboard
set PYTHON_EXE=%PROJECT_ROOT%\mtgenv\Scripts\python.exe
set SCRIPT_PATH=%PROJECT_ROOT%\project_files\run_daily_update.py

:: Navigate to the project root directory
cd /d %PROJECT_ROOT%

:: Define the path to the script relative to the project root
echo Running Scryfall Daily Updater...
"%PYTHON_EXE%" "%SCRIPT_PATH%"

:: Capture the exit code
set EXIT_CODE=%ERRORLEVEL%

echo Update completed with exit code: %EXIT_CODE%
echo Finished at %date% %time%

:: Pause only if run manually (not when run by Task Scheduler)
if "%1"=="" pause