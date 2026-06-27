@echo off
echo ========================================
echo BIS Deployment Setup for Windows Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Navigate to project
cd /d "%~dp0"

REM Create virtual environment
echo.
echo [1/5] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate

REM Install dependencies
echo.
echo [2/5] Installing Python dependencies...
pip install django djangorestframework django-cors-headers mysqlclient pymysql django-dotenv pillow daphne channels channels-redis

REM Install wfastcgi for IIS
echo.
echo [3/5] Installing wfastcgi for IIS...
pip install wfastcgi
python -m fastcgi

REM Collect static files
echo.
echo [4/5] Collecting static files...
python manage.py collectstatic --noinput

REM Run migrations
echo.
echo [5/5] Running database migrations...
python manage.py migrate

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure .env file with production settings
echo 2. Set up IIS website pointing to this folder
echo 3. Set handler mapping for FastCGI in IIS
echo.

pause
