@echo off
call npm install
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
echo.
echo FIREWATCH static deployment is ready in dist\
echo Upload the CONTENTS of dist\ to your web-host directory.
