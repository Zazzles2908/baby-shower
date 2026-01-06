@echo off
REM ============================================================================
REM Edge Functions Deployment Script - Fixed Security Implementation
REM 
REM Purpose: Deploy the refactored game-session and game-scenario functions
REM          with consistent security utilities pattern
REM 
REM Prerequisites:
REM 1. Docker Desktop must be running (for local Supabase)
REM 2. .env.local must contain SUPABASE_ACCESS_TOKEN
REM 3. Run from project root directory
REM 
REM Usage:
REM   deploy-edge-functions-fix.bat
REM 
REM What this script does:
REM 1. Sets SUPABASE_ACCESS_TOKEN from .env.local
REM 2. Deploys game-session Edge Function
REM 3. Deploys game-scenario Edge Function  
REM 4. Verifies deployment success
REM 5. Shows function status
REM ============================================================================

setlocal EnableDelayedExpansion

echo ============================================================================
echo Edge Functions Deployment - Security Fix
echo ============================================================================
echo.

REM Set working directory
cd /d "%~dp0"

REM Check if .env.local exists
if not exist ".env.local" (
    echo [ERROR] .env.local file not found!
    echo Please ensure .env.local exists in the project root with SUPABASE_ACCESS_TOKEN
    exit /b 1
)

REM Extract SUPABASE_ACCESS_TOKEN from .env.local
echo [INFO] Reading SUPABASE_ACCESS_TOKEN from .env.local...
for /f "usebackq tokens=1,2 delims==" %%a in (`findstr /b "SUPABASE_ACCESS_TOKEN=" .env.local`) do (
    if "%%a"=="SUPABASE_ACCESS_TOKEN" (
        set "SUPABASE_ACCESS_TOKEN=%%b"
        set "SUPABASE_ACCESS_TOKEN=!SUPABASE_ACCESS_TOKEN:"=!"
        echo [INFO] SUPABASE_ACCESS_TOKEN found and cleaned
        goto :token_found
    )
)

echo [ERROR] SUPABASE_ACCESS_TOKEN not found in .env.local
echo Please add SUPABASE_ACCESS_TOKEN="your_token_here" to .env.local
exit /b 1

:token_found

REM Set environment variable for Supabase CLI
setx SUPABASE_ACCESS_TOKEN "%SUPABASE_ACCESS_TOKEN%" >nul 2>&1
set "SUPABASE_ACCESS_TOKEN=%SUPABASE_ACCESS_TOKEN%"

echo.
echo [INFO] Starting deployment...
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Supabase CLI not found!
    echo Please install Supabase CLI: https://supabase.com/docs/guides/cli
    exit /b 1
)

REM Deploy game-session function
echo [STEP 1/3] Deploying game-session Edge Function...
echo ---------------------------------------------------------------------------
supabase functions deploy game-session --project-ref "$(findstr /b "SUPABASE_PROJECT_REF=" .env.local 2>nul | findstr "=" >nul && for /f "tokens=2 delims==" %%a in ('findstr /b "SUPABASE_PROJECT_REF=" .env.local') do @echo %%a')" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy game-session function
    echo Check the error messages above and try again
    exit /b 1
)
echo [SUCCESS] game-session function deployed
echo.

REM Deploy game-scenario function
echo [STEP 2/3] Deploying game-scenario Edge Function...
echo ---------------------------------------------------------------------------
supabase functions deploy game-scenario --project-ref "$(findstr /b "SUPABASE_PROJECT_REF=" .env.local 2>nul | findstr "=" >nul && for /f "tokens=2 delims==" %%a in ('findstr /b "SUPABASE_PROJECT_REF=" .env.local') do @echo %%a')" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy game-scenario function
    echo Check the error messages above and try again
    exit /b 1
)
echo [SUCCESS] game-scenario function deployed
echo.

REM Verify deployment
echo [STEP 3/3] Verifying deployment...
echo ---------------------------------------------------------------------------
supabase functions list 2>&1
echo.

REM Show recent logs for verification
echo [INFO] Checking recent logs for game-session...
supabase functions logs game-session --project-ref "$(findstr /b "SUPABASE_PROJECT_REF=" .env.local 2>nul | findstr "=" >nul && for /f "tokens=2 delims==" %%a in ('findstr /b "SUPABASE_PROJECT_REF=" .env.local') do @echo %%a')" --tail 5 2>&1
echo.

echo ============================================================================
echo Deployment Complete!
echo ============================================================================
echo.
echo Summary:
echo   - game-session: DEPLOYED (using security utilities pattern)
echo   - game-scenario: DEPLOYED (using security utilities pattern)
echo.
echo Next Steps:
echo   1. Test session creation: POST /game-session with action=create
echo   2. Test session joining: POST /game-session with action=join
echo   3. Test admin login: POST /game-session with action=admin_login
echo   4. Test scenario generation: POST /game-scenario
echo.
echo See docs/technical/EDGE_FUNCTIONS_FIX.md for testing checklist
echo ============================================================================

endlocal
exit /b 0
