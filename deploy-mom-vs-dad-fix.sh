#!/bin/bash

# Deploy Mom vs Dad Game Lobby Fix
# This script deploys the new lobby-join Edge Function

set -e  # Exit on error

echo "🎮 Mom vs Dad Game Lobby Fix - Deployment Script"
echo "=================================================="
echo ""

# Check if Supabase access token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set in environment"
    echo "📖 Reading from .env.local..."
    if [ -f .env.local ]; then
        export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d'"' -f2)
        echo "✅ Token loaded from .env.local"
    else
        echo "❌ .env.local file not found"
        echo ""
        echo "Please set SUPABASE_ACCESS_TOKEN manually:"
        echo "  export SUPABASE_ACCESS_TOKEN='sbp_...'"
        echo ""
        exit 1
    fi
fi

echo "🔑 Supabase Access Token: ${SUPABASE_ACCESS_TOKEN:0:20}..."
echo ""

# Test if token works
echo "🧪 Testing Supabase access..."
supabase projects list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Supabase access failed. Token may be invalid or expired."
    echo ""
    echo "Please update your SUPABASE_ACCESS_TOKEN in .env.local"
    exit 1
fi
echo "✅ Supabase access verified"
echo ""

# Deploy lobby-join function
echo "📦 Deploying lobby-join Edge Function..."
supabase functions deploy lobby-join

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deployed lobby-join Edge Function!"
    echo ""
    echo "📝 What was deployed:"
    echo "  - supabase/functions/lobby-join/index.ts"
    echo ""
    echo "📝 Files modified:"
    echo "  - scripts/api-supabase.js (added gameJoin method)"
    echo "  - scripts/mom-vs-dad-simplified.js (fixed lobby entry)"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Open http://localhost:3000 (or your production URL)"
    echo "  2. Navigate to Mom vs Dad section"
    echo "  3. Click on any lobby card (Sunny Meadows, etc.)"
    echo "  4. Enter your name and click 'Join Lobby'"
    echo "  5. Verify you see waiting room with your player"
    echo "  6. Open incognito window to test multiplayer"
    echo ""
    echo "📚 Documentation: docs/technical/MOM_VS_DAD_LOBBY_FIX_SUMMARY.md"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Check the error messages above for details."
    echo ""
    exit 1
fi
