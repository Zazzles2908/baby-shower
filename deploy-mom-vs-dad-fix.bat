@echo off
REM Deploy Mom vs Dad Game Lobby Fix - Windows Script

echo.
echo 🎮 Mom vs Dad Game Lobby Fix - Deployment Script
echo ==================================================
echo.

REM Check if SUPABASE_ACCESS_TOKEN is set
if "%SUPABASE_ACCESS_TOKEN%"=="" (
    echo ⚠️  SUPABASE_ACCESS_TOKEN not set in environment
    echo 📖 Reading from .env.local...

    if exist .env.local (
        for /f "tokens=2 delims==" %%a in ('findstr /C:"SUPABASE_ACCESS_TOKEN" .env.local') do (
            set SUPABASE_ACCESS_TOKEN=%%a
        )
        echo ✅ Token loaded from .env.local
    ) else (
        echo ❌ .env.local file not found
        echo.
        echo Please set SUPABASE_ACCESS_TOKEN manually:
        echo   set SUPABASE_ACCESS_TOKEN=sbp_...
        echo.
        exit /b 1
    )
)

echo.
echo 🔑 Supabase Access Token: %SUPABASE_ACCESS_TOKEN:~0,20%...
echo.

REM Test if token works
echo 🧪 Testing Supabase access...
supabase projects list >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase access failed. Token may be invalid or expired.
    echo.
    echo Please update your SUPABASE_ACCESS_TOKEN in .env.local
    exit /b 1
)
echo ✅ Supabase access verified
echo.

REM Deploy lobby-join function
echo 📦 Deploying lobby-join Edge Function...
supabase functions deploy lobby-join

if errorlevel 1 (
    echo.
    echo ❌ Deployment failed
    echo.
    echo Check error messages above for details.
    echo.
    exit /b 1
) else (
    echo.
    echo ✅ Successfully deployed lobby-join Edge Function!
    echo.
    echo 📝 What was deployed:
    echo   - supabase/functions/lobby-join/index.ts
    echo.
    echo 📝 Files modified:
    echo   - scripts/api-supabase.js (added gameJoin method)
    echo   - scripts/mom-vs-dad-simplified.js (fixed lobby entry)
    echo.
    echo 🎯 Next steps:
    echo   1. Open http://localhost:3000 (or your production URL)
    echo   2. Navigate to Mom vs Dad section
    echo   3. Click on any lobby card (Sunny Meadows, etc.)
    echo   4. Enter your name and click 'Join Lobby'
    echo   5. Verify you see waiting room with your player
    echo   6. Open incognito window to test multiplayer
    echo.
    echo 📚 Documentation: docs/technical/MOM_VS_DAD_LOBBY_FIX_SUMMARY.md
    echo.
)
