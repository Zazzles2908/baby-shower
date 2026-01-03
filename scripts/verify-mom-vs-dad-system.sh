#!/bin/bash

# Mom vs Dad Game - Complete System Verification
# Run this script to verify the entire system is operational

echo "=========================================="
echo "🎮 MOM VS DAD GAME - SYSTEM VERIFICATION"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check result
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "1️⃣  CHECKING DATABASE STATE..."
echo "------------------------------------------"

# Check if lobbies exist
echo "   Checking for mom_dad_lobbies table..."
LOBBY_COUNT=$(cd "C:\Project\Baby_Shower" && export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812" && supabase db query "SELECT COUNT(*) FROM baby_shower.mom_dad_lobbies" 2>/dev/null | grep -o '[0-9]\+' | head -1)

if [ ! -z "$LOBBY_COUNT" ] && [ "$LOBBY_COUNT" -ge 4 ]; then
    check_result 0 "Found $LOBBY_COUNT lobbies (expected: 4)"
    echo "   Lobbies:"
    supabase db query "SELECT lobby_key, lobby_name, status FROM baby_shower.mom_dad_lobbies ORDER BY lobby_key" 2>/dev/null
else
    check_result 1 "Lobbies not found or count incorrect (found: $LOBBY_COUNT)"
fi

echo ""
echo "2️⃣  CHECKING EDGE FUNCTIONS..."
echo "------------------------------------------"

# Check required functions
FUNCTIONS=("lobby-create" "lobby-status" "game-start" "game-vote" "game-reveal")

for func in "${FUNCTIONS[@]}"; do
    STATUS=$(cd "C:\Project\Baby_Shower" && export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812" && supabase functions list 2>/dev/null | grep -c "$func")
    if [ "$STATUS" -gt 0 ]; then
        check_result 0 "$func: DEPLOYED"
    else
        check_result 1 "$func: NOT FOUND"
    fi
done

echo ""
echo "3️⃣  CHECKING FRONTEND DEPLOYMENT..."
echo "------------------------------------------"

# Check if frontend is deployed (should have latest mom-vs-dad-simplified.js)
cd "C:\Project\Baby_Shower"
LAST_COMMIT=$(git log -1 --oneline --format="%H")
LAST_COMMIT_DATE=$(git log -1 --format="%ci" --date=short)
LAST_COMMIT_MSG=$(git log -1 --oneline --format="%s")

echo "   Last commit: $LAST_COMMIT"
echo "   Date: $LAST_COMMIT_DATE"
echo "   Message: $LAST_COMMIT_MSG"

# Check if there are local changes
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -eq 0 ]; then
    check_result 0 "No uncommitted changes (code is synced)"
else
    check_result 1 "Found $UNCOMMITTED uncommitted changes"
fi

echo ""
echo "4️⃣  QUICK API TEST..."
echo "------------------------------------------"

# Test a simple API call (this might fail due to auth, but should not 404)
echo "   Testing Supabase connection..."
CONN_TEST=$(supabase projects list 2>&1)
if echo "$CONN_TEST" | grep -q "bkszmvfsfgvdwzacgmfz"; then
    check_result 0 "Supabase project accessible"
else
    check_result 1 "Supabase connection issue"
fi

echo ""
echo "5️⃣  SUMMARY..."
echo "------------------------------------------"

# Final assessment
DB_READY=$(cd "C:\Project\Baby_Shower" && export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812" && supabase db query "SELECT COUNT(*) FROM baby_shower.mom_dad_lobbies" 2>/dev/null | grep -o '[0-9]\+' | head -1)
FUNCS_READY=0

for func in "${FUNCTIONS[@]}"; do
    STATUS=$(cd "C:\Project\Baby_Shower" && export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812" && supabase functions list 2>/dev/null | grep -c "$func")
    if [ "$STATUS" -gt 0 ]; then
        ((FUNCS_READY++))
    fi
done

echo "   Database: $([ ! -z "$DB_READY" ] && [ "$DB_READY" -ge 4 ] && echo "READY" || echo "NOT READY")"
echo "   Edge Functions: $FUNCS_READY/5 deployed"
echo "   Frontend: $([ "$UNCOMMITTED" -eq 0 ] && echo "SYNCED" || echo "HAS UNCOMMITTED CHANGES")"

echo ""
if [ ! -z "$DB_READY" ] && [ "$DB_READY" -ge 4 ] && [ "$FUNCS_READY" -eq 5 ] && [ "$UNCOMMITTED" -eq 0 ]; then
    echo -e "${GREEN}🎉 SYSTEM IS OPERATIONAL!${NC}"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "   1. Go to: https://baby-shower-qr-app.vercel.app"
    echo "   2. Tap 'Mom vs Dad' activity"
    echo "   3. Select a lobby"
    echo "   4. Enter your name"
    echo "   5. Should successfully join (NO ERROR!)"
    echo ""
    echo "✅ Game should now work end-to-end!"
else
    echo -e "${YELLOW}⚠️  SOME ISSUES DETECTED${NC}"
    echo ""
    echo "📋 ACTIONS NEEDED:"
    if [ -z "$DB_READY" ] || [ "$DB_READY" -lt 4 ]; then
        echo "   - Apply database migration"
    fi
    if [ "$FUNCS_READY" -lt 5 ]; then
        echo "   - Deploy missing Edge Functions"
    fi
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "   - Commit and deploy frontend changes"
    fi
fi

echo ""
echo "=========================================="
echo "Verification complete at: $(date)"
echo "=========================================="
