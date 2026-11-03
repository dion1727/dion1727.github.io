@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher [py] tidak ditemukan. Install Python atau jalankan: python -m http.server 8000
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8000/"
py -m http.server 8000
pause
