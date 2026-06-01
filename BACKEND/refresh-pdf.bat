@echo off
echo ========================================
echo Refresh PDF Export Cache
echo ========================================
echo.

echo [1/4] Clearing Blade view cache...
php artisan view:clear

echo [2/4] Clearing application cache...
php artisan cache:clear

echo [3/4] Clearing config cache...
php artisan config:clear

echo [4/4] Deleting compiled views manually...
rmdir /s /q storage\framework\views
mkdir storage\framework\views
echo. > storage\framework\views\.gitignore

echo.
echo ========================================
echo Done! PDF cache cleared successfully.
echo Please restart your server (php artisan serve)
echo ========================================
pause
