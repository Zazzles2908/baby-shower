@echo off
REM Supabase CLI Environment Setup
REM Run this before using Supabase CLI commands
REM This script reads the token from .env.local

REM Read the token from .env.local
for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    if "%%a"=="SUPABASE_ACCESS_TOKEN" set "SUPABASE_TOKEN=%%b"
    if "%%a"==" SUPABASE_ACCESS_TOKEN" set "SUPABASE_TOKEN=%%b"
)

REM Remove quotes from token
set "SUPABASE_TOKEN=%SUPABASE_TOKEN:"=%"

if defined SUPABASE_TOKEN (
    setx SUPABASE_ACCESS_TOKEN "%SUPABASE_TOKEN%"
    echo ✅ Supabase token set from .env.local!
    echo Please restart your terminal/IDE to use the new token.
) else (
    echo ❌ Could not find SUPABASE_ACCESS_TOKEN in .env.local
    echo Please manually set the token:
    echo   setx SUPABASE_ACCESS_TOKEN "your-token-here"
)
echo.
echo For this session, run:
echo   set SUPABASE_ACCESS_TOKEN=%%SUPABASE_ACCESS_TOKEN%%

