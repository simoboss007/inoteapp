@echo off
cd /d "%~dp0"
rmdir /s /q "C:\Users\SIMO\AppData\Local\Temp\eas-cli-nodejs" 2>nul
npx eas build -p android --profile preview
