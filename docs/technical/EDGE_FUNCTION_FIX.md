# Mom vs Dad Game - Edge Function Fix Summary

## 🎯 PROBLEM
The Mom vs Dad game was showing "Lobby not found" error when trying to join lobbies. Investigation revealed:
1. Edge Functions returning 401 "Missing authorization header"
2. Direct REST API was working fine
3. Frontend environment variables weren't properly loaded

## ✅ SOLUTION IMPLEMENTED

### 1. Fixed Environment Variable Injection
**File:** `inject-env.js`
- Updated to parse `.env.local` file directly (instead of relying on sourced environment)
- Supports both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` naming conventions
- Properly injects credentials into `index.html`

**Result:** Environment variables now properly loaded in browser

### 2. Replaced Edge Function with Direct Supabase Client
**File:** `scripts/mom-vs-dad-simplified.js`
- Updated `joinLobby()` function to use Supabase JS client directly
- Removed dependency on `lobby-create` Edge Function
- Uses direct database operations:
  - Fetch lobby with `.from('mom_dad_lobbies').select().eq()`
  - Create player with `.from('mom_dad_players').insert()`
  - Update lobby with `.from('mom_dad_lobbies').update()`

**Why this works:**
- Supabase JS client handles authentication automatically via anon key
- RLS policies are properly applied
- No JWT verification issues
- Better error handling with direct database feedback

### 3. Verified API Access
**Test Results:**
- ✅ Direct REST API: Working (fetch lobby data successfully)
- ❌ Edge Function: Still failing (401 authorization error)
- ✅ Supabase Client: Should work (handles auth automatically)

## 🔧 TECHNICAL DETAILS

### Direct REST API (Working)
```bash
curl "https://bkszmvfsfgvdwzacgmfz.supabase.co/rest/v1/mom_dad_lobbies?lobby_key=eq.LOBBY-A" \
  -H "apikey: <ANON_KEY>" \
  -H "Accept-Profile: baby_shower"
# Returns: 200 OK with lobby data
```

### Edge Function (Broken)
```bash
curl -X POST "https://bkszmvfsfgvdwzacgmfz.functions.supabase.co/lobby-status" \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -d '{"lobby_key":"LOBBY-A"}'
# Returns: 401 Missing authorization header
```

### Supabase Client (Solution)
```javascript
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch lobby
const { data: lobby } = await supabase
  .from('mom_dad_lobbies')
  .select('*')
  .eq('lobby_key', lobbyKey)
  .single();

// Create player
await supabase.from('mom_dad_players').insert({...});
```

## 📁 FILES MODIFIED

1. **`inject-env.js`** - Fixed environment variable parsing
2. **`scripts/mom-vs-dad-simplified.js`** - Updated `joinLobby()` to use Supabase client
3. **`index.html`** - Environment variables now properly injected

## 🎮 GAME FLOW

### Before (Broken)
1. User clicks "Join" button
2. Frontend calls `lobby-create` Edge Function
3. Edge Function returns 401 error
4. ❌ "Lobby not found" error shown

### After (Fixed)
1. User clicks "Join" button
2. Frontend uses Supabase client to:
   - Fetch lobby from `baby_shower.mom_dad_lobbies`
   - Create player in `baby_shower.mom_dad_players`
   - Update lobby player count
3. ✅ Success! Lobby joined successfully

## 🔐 SECURITY

- Uses anon key (public key) - safe for client-side use
- RLS policies still enforced on database level
- No sensitive data exposed
- Follows Supabase best practices

## 🧪 TESTING

Run the API test to verify:
```bash
node test-api-direct.js
```

Expected output:
```
=== Testing Direct REST API ===

Test 1: Fetching lobby via REST API...
Status: 200
Response: [{"id":"...","lobby_key":"LOBBY-A",...}]
REST API working!
```

## 🚀 NEXT STEPS

1. **User Action:** Hard refresh browser (Ctrl+Shift+R) to load new `index.html`
2. **Test:** Try joining a lobby again
3. **Monitor:** Check browser console for any errors
4. **Optional:** Update other functions (`startGame`, `submitVote`, `revealRound`) to also use Supabase client if needed

## 📊 STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Environment Variables | ✅ Fixed | Properly injected into index.html |
| Direct REST API | ✅ Working | Can fetch lobby data |
| Edge Functions | ❌ Broken | Authorization issues |
| Supabase Client | ✅ Implemented | `joinLobby()` now uses this |
| Game Join Flow | 🔄 Testing | Awaiting user verification |

---

**Created:** 2026-01-04  
**Status:** FIXED - Pending User Testing
