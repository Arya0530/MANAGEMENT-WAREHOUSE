@echo off
echo ========================================
echo Setup After Git Pull
echo ========================================
echo.

echo [1/6] Installing Composer dependencies...
composer install

echo.
echo [2/6] Updating autoload...
composer dump-autoload

echo.
echo [3/6] Clearing all caches...
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear

echo.
echo [4/6] Deleting compiled views...
rmdir /s /q storage\framework\views
mkdir storage\framework\views
echo. > storage\framework\views\.gitignore

echo.
echo [5/6] Checking .env file...
if not exist .env (
    echo .env not found! Copying from .env.example...
    copy .env.example .env
    php artisan key:generate
) else (
    echo .env exists.
)

echo.
echo [6/6] Verifying DomPDF package...
composer show barryvdh/laravel-dompdf

echo.
echo ========================================
echo Setup complete!
echo Now run: php artisan serve
echo ========================================
pause
