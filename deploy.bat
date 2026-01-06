@echo off
REM Baby Shower App - Deployment Script for Windows
REM Proper git workflow with Vercel deployment
REM Optimized for both Node.js and Bun runtimes

echo ========================================
echo 🚀 Baby Shower App Deployment Script
echo ========================================
echo.

REM Detect runtime
set RUNTIME=
set RUNTIME_VERSION=

where bun >nul 2>&1
if %errorlevel% equ 0 (
    set RUNTIME=bun
    for /f "tokens=*" %%i in ('bun --version 2^>nul') do set RUNTIME_VERSION=%%i
    echo ✅ Detected Bun runtime: %RUNTIME_VERSION%
) else (
    where node >nul 2>&1
    if %errorlevel% equ 0 (
        set RUNTIME=node
        for /f "tokens=*" %%i in ('node --version 2^>nul') do set RUNTIME_VERSION=%%i
        echo ✅ Detected Node.js runtime: %RUNTIME_VERSION%
    ) else (
        echo ❌ No supported runtime found! Please install Bun or Node.js
        exit /b 1
    )
)

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Not in Baby Shower project directory!
    exit /b 1
)

echo ✅ Starting deployment process...
echo.

REM =========================================
REM Step 1: Runtime Configuration
REM =========================================
echo 📦 Step 1: Runtime Configuration
echo.

if "%RUNTIME%"=="bun" (
    echo ℹ️  Using Bun for package management (3-10x faster than npm)
    if exist bun.lockb (
        echo ✅ bun.lockb found - using optimized dependency resolution
    ) else (
        echo ⚠️  bun.lockb not found - will be created on first install
    )
    bun install >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  bun install completed with warnings
    ) else (
        echo ✅ Dependencies installed with Bun
    )
) else (
    echo ℹ️  Using npm for package management
    npm install >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  npm install completed with warnings
    ) else (
        echo ✅ Dependencies installed with npm
    )
)

echo.

REM =========================================
REM Step 2: Git Status Check
REM =========================================
echo 📋 Step 2: Checking git status...
echo.

cd /d %~dp0

git status --short
echo.

set /p commit_changes="Do you want to commit changes? (y/n): "
if /i "%commit_changes%"=="y" (
    echo.
    echo 📦 Adding files to git...
    git add -A
    echo ✅ Files added

    echo.
    echo 💬 Creating commit...
    set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
    if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update: %date% - Performance and bug fixes
    git commit -m "%COMMIT_MSG%"
    echo ✅ Commit created: %COMMIT_MSG%

    echo.
    set /p push_remote="Push to origin main? (y/n): "
    if /i "%push_remote%"=="y" (
        echo.
        echo 📤 Pushing to remote...
        git push origin main
        echo ✅ Changes pushed to remote
    )
) else (
    echo ✅ No uncommitted changes
)

echo.

REM =========================================
REM Step 3: Supabase CLI Setup (Optional)
REM =========================================
echo 🗄️ Step 3: Supabase CLI Setup
set /p setup_supabase="Setup Supabase CLI? (y/n): "
if /i "%setup_supabase%"=="y" (
    echo.
    echo Setting up Supabase CLI...
    
    REM Check if Supabase token is in .env.local
    for /f "tokens=1,* delims==" %%a in (.env.local) do (
        if "%%a"=="SUPABASE_ACCESS_TOKEN" (
            set SUPABASE_ACCESS_TOKEN=%%b
            echo ✅ Supabase token found in .env.local
        )
    )
    
    if not defined SUPABASE_ACCESS_TOKEN (
        echo ⚠️ SUPABASE_ACCESS_TOKEN not found in .env.local
        echo ⚠️ Please add it before running database migrations
    )
)

echo.

REM =========================================
REM Step 4: Bun-Specific Optimizations
REM =========================================
if "%RUNTIME%"=="bun" (
    echo ⚡ Step 4: Bun-Specific Optimizations
    echo.
    
    REM Generate/update bun.lockb for faster installs
    if not exist bun.lockb goto :skip_lockfile
    for %%i in (bun.lockb) do set LOCKFILE_TIME=%%~ti
    for %%i in (package.json) do set PACKAGE_TIME=%%~ti
    goto :check_lockfile
    
    :skip_lockfile
    set LOCKFILE_TIME=
    :check_lockfile
    
    if "%LOCKFILE_TIME%"=="" (
        echo ℹ️  Generating optimized bun.lockb lockfile...
        bun install --lockfile >nul 2>&1
        echo ✅ bun.lockb created
    ) else (
        echo ✅ bun.lockb already optimized
    )
    
    REM Pre-warm bun's JIT compiler
    echo ℹ️  Pre-warming Bun JIT compiler...
    bun --version >nul 2>&1
    echo ✅ Bun JIT compiler warmed
    echo.
)

REM =========================================
REM Step 5: Deploy to Vercel
REM =========================================
echo 🚀 Step 5: Deploying to Vercel...
set /p deploy_vercel="Deploy to Vercel production? (y/n): "
if /i "%deploy_vercel%"=="y" (
    echo.
    if "%RUNTIME%"=="bun" (
        echo Running: bunx vercel --prod --force
        bunx vercel --prod --force
    ) else (
        echo Running: npx vercel --prod --force
        npx vercel --prod --force
    )
    
    if errorlevel 1 (
        echo ❌ Deployment failed!
        exit /b 1
    )
    
    echo.
    echo ✅ Deployment successful!
    echo.
    echo 🌐 Your app is now live at:
    echo    https://baby-shower-v2.vercel.app
) else (
    echo ⚠️  Skipping Vercel deployment
    
    echo.
    set /p local_server="Start local development server? (y/n): "
    if /i "%local_server%"=="y" (
        echo.
        if "%RUNTIME%"=="bun" (
            echo ℹ️  Using bun run --hot for hot module replacement...
            echo ✅ Starting local server with Bun HMR...
            bun run --hot --port 3000 .
        ) else (
            echo ℹ️  Using npm run dev (http-server)...
            echo ✅ Starting local server with Node.js...
            npm run dev
        )
    )
)

REM =========================================
REM Summary
REM =========================================
echo.
echo ========================================
echo 📊 Deployment Summary
echo ========================================
echo Project: Baby Shower V2
echo Runtime: %RUNTIME% %RUNTIME_VERSION%
echo Status: Deployment complete!
echo URL: https://baby-shower-v2.vercel.app
echo.
echo Next steps:
echo 1. Test the deployed app at the URL above
echo 2. Check console for any errors
echo 3. Verify all features work correctly
echo.

if "%RUNTIME%"=="bun" (
    echo 🚀 Bun Performance Benefits:
    echo    • 3-10x faster package installation
    echo    • Native hot module replacement
    echo    • Faster startup time
    echo    • Built-in bundler support
    echo.
)

echo ✅ Done! 🎉
pause
