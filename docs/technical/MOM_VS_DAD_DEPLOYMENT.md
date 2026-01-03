# 🚀 Mom vs Dad Simplified Game - Deployment Checklist

## ✅ Frontend Deployment Complete

**Production URL:** https://baby-shower-qr-app.vercel.app

**Status:** ✅ LIVE

### Frontend Files Deployed:
- ✅ `scripts/mom-vs-dad-simplified.js` - Complete game logic
- ✅ `styles/mom-vs-dad-simplified.css` - Game styling
- ✅ `index.html` - Updated game section
- ✅ `styles/main.css` - Background fix applied

### What's Fixed:
- ✅ No background image overlays
- ✅ No scrolling issues
- ✅ Clean lobby selection with 4 cards
- ✅ Michelle LEFT, Jazeel RIGHT in game
- ✅ Simple tap-to-play flow

---

## 📋 Backend Deployment Required

### Step 1: Apply Database Migration

Run these commands in your terminal:

```bash
# Navigate to project
cd C:\Project\Baby_Shower

# Login to Supabase
npx supabase login

# Link your project (get ID from Supabase dashboard)
npx supabase link --project YOUR-PROJECT-ID

# Apply migration
npx supabase db push
```

**Expected Output:**
- Creates `mom_dad_lobbies` table
- Creates `mom_dad_players` table  
- Creates `mom_dad_game_sessions` table
- Inserts 4 lobby records
- Applies RLS policies

**Manual SQL Alternative:**
If CLI fails, run this SQL in Supabase SQL Editor:
```sql
-- See file: supabase/migrations/20260104_simplified_lobby_schema.sql
-- Copy and execute the entire contents
```

### Step 2: Deploy Edge Functions

```bash
# Deploy each function
npx supabase functions deploy lobby-create
npx supabase functions deploy lobby-status
npx supabase functions deploy game-start
npx supabase functions deploy game-vote
npx supabase functions deploy game-reveal
```

**Or deploy all at once:**
```bash
npx supabase functions deploy --project-ref YOUR-PROJECT-ID
```

### Step 3: Verify Deployment

Test the backend:

```bash
# Test lobby creation
curl -X POST https://YOUR-PROJECT.functions.supabase.co/lobby-create \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"lobby_key": "LOBBY-A", "player_name": "Test Guest"}'
```

**Expected Response:**
```json
{
  "lobby": {...},
  "players": [...],
  "current_player_id": "uuid...",
  "is_admin": true
}
```

---

## 🎮 Game Features Now Available

### ✅ Completed Features
1. **Lobby Selection** - 4 lobbies (Sunny Meadows, Cozy Barn, 星光谷, 月光屋)
2. **Player Names** - Simple name prompt, no accounts needed
3. **Waiting Room** - See who's in lobby
4. **Admin Auto-assign** - First player = admin
5. **Game Settings** - Rounds (3/5/7/10), Intensity (Mild/Medium/Spicy)
6. **Question Display** - Clean, centered, readable
7. **Voting** - Tap Michelle (left) or Jazeel (right)
8. **Results** - Vote counts, winner display
9. **Play Again** - Quick restart option

### ⏳ Pending Backend (Step 2-3 above)
- Real-time updates between players
- AI opponent integration
- AI scenario generation
- AI roast commentary
- Persistent game state

### 🏠 Current Mode: Simulated
The frontend works in **simulated mode** without backend:
- Lobby selection works
- Joining works (locally)
- Game play works (sample questions)
- Results display works

**With backend:** Full multiplayer with real-time sync

---

## 🔧 Manual Testing Checklist

### Before Backend Deployment:
1. Open https://baby-shower-qr-app.vercel.app
2. Tap "Mom vs Dad" activity card
3. ✅ Verify: No background decorations
4. ✅ Verify: See 4 lobby cards
5. ✅ Verify: Can tap a lobby
6. ✅ Verify: Prompts for name
7. ✅ Verify: Shows waiting room
8. ✅ Verify: "Start Game" button (if first player)
9. ✅ Verify: Game screen loads
10. ✅ Verify: Michelle on LEFT, Jazeel on RIGHT
11. ✅ Verify: Can tap to vote
12. ✅ Verify: Results display

### After Backend Deployment:
13. ✅ Multiple players can join same lobby
14. ✅ Real-time player list updates
15. ✅ Admin can start game
16. ✅ All players see same question
17. ✅ Vote counts update in real-time
18. ✅ Results reveal when all vote
19. ✅ AI players join if lobby not full

---

## 📁 Files Created/Modified

### New Files Created:
- `supabase/migrations/20260104_simplified_lobby_schema.sql`
- `supabase/functions/lobby-create/index.ts`
- `supabase/functions/lobby-status/index.ts`
- `supabase/functions/game-start/index.ts`
- `supabase/functions/game-vote/index.ts`
- `supabase/functions/game-reveal/index.ts`
- `scripts/mom-vs-dad-simplified.js`
- `styles/mom-vs-dad-simplified.css`

### Documentation Created:
- `docs/technical/MOM_VS_DAD_ANALYSIS.md`
- `docs/technical/MOM_VS_DAD_SIMPLIFIED_ARCHITECTURE.md`
- `docs/technical/MOM_VS_DAD_SIMPLIFIED_UI.md`
- `docs/technical/MOM_VS_DAD_COMPREHENSIVE_PLAN.md`

### Files Modified:
- `index.html` - Updated game section, removed old scripts
- `scripts/main.js` - Updated script reference
- `styles/main.css` - Added background fix

---

## 🎯 Expected User Experience

### Quick Tour:
1. **Tap "Mom vs Dad"** → See 4 lobby options
2. **Tap any lobby** → Enter your name
3. **Wait for friends** → See who joins
4. **Admin starts** → Game begins
5. **Read question** → Vote for Mom or Dad
6. **See results** → Find out who's right
7. **Play again** → Same or new lobby

### Time to Play: ~2-3 minutes
### Total Taps: 8-10

---

## 🚨 Troubleshooting

### "Section decorations still showing"
- **Fix:** Hard refresh (Ctrl+F5)
- **Cause:** Browser cache

### "Game not loading"
- **Fix:** Check console for errors (F12)
- **Cause:** Missing backend (works in simulated mode)

### "Can't start game"
- **Fix:** Need 2+ players in lobby
- **Cause:** Admin-only action

### "Votes not syncing"
- **Fix:** Deploy Edge Functions (Step 2-3)
- **Cause:** Backend not deployed

---

## 📞 Next Steps

1. **Apply database migration** (5 min)
2. **Deploy Edge Functions** (10 min)
3. **Test with 2+ devices** (15 min)
4. **Party!** 🎉

---

**Document Version:** 1.0  
**Created:** January 4, 2026  
**Frontend Status:** ✅ DEPLOYED  
**Backend Status:** ⏳ PENDING DEPLOYMENT

**Production URL:** https://baby-shower-qr-app.vercel.app
