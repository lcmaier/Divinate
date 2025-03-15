@echo off
echo Starting MTG Price Update - %date% %time%

:: Navigate to the project root directory
cd C:\Users\maier\Desktop\PYTHON\MTG_Price_Predictor_Dashboard

:: Define the path to the script relative to the project root
set SCRIPT_PATH=project_files\run_daily_update.py

:: Activate the virtual environment
call mtgpriceenv\Scripts\activate.bat

:: Run the script
echo Running Scryfall Daily Updater...
python "%SCRIPT_PATH%"

:: Capture the exit code
set EXIT_CODE=%ERRORLEVEL%

:: Deactivate the virtual environment
call deactivate

echo Update completed with exit code: %EXIT_CODE%
echo Finished at %date% %time%

:: Pause only if run manually (not when run by Task Scheduler)
if "%1"=="" pause