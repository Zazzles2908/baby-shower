#!/bin/bash

# Mom vs Dad Game - Backend Deployment Script
# Run this to deploy the simplified lobby backend

echo "🚀 Deploying Mom vs Dad Game Backend..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📦 Step 1: Apply Database Migration"
echo "Running: supabase db push"
npx supabase db push

echo ""
echo "🔧 Step 2: Deploy Edge Functions"
echo ""

echo "Deploying lobby-create function..."
npx supabase functions deploy lobby-create

echo "Deploying lobby-status function..."
npx supabase functions deploy lobby-status

echo "Deploying game-start function..."
npx supabase functions deploy game-start

echo "Deploying game-vote function..."
npx supabase functions deploy game-vote

echo "Deploying game-reveal function..."
npx supabase functions deploy game-reveal

echo ""
echo "✅ Backend Deployment Complete!"
echo ""
echo "🧪 Test the API:"
echo ""
echo 'curl -X POST https://YOUR-PROJECT.functions.supabase.co/lobby-create \\'
echo '  -H "Authorization: Bearer YOUR-ANON-KEY" \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '\''{"lobby_key": "LOBBY-A", "player_name": "Test Player"}'\'''
echo ""

echo "📖 See docs/technical/MOM_VS_DAD_DEPLOYMENT.md for detailed instructions"
