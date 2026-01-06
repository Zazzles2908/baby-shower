# Baby Shower - Comprehensive Supabase Implementation Plan

**Generated:** 2026-01-06  
**Project Ref:** bkszmvfsfgvdwzacgmfz  
**Status:** Phase 1 - Current State Assessment Complete

---

## 🚨 CRITICAL ACTIONS (Do First)

| Priority | Action | Command |
|----------|--------|---------|
| 1 | Remove hardcoded credentials | Edit index.html lines 444-459 |
| 2 | Deploy missing lobby-join | `supabase functions deploy lobby-join` |
| 3 | Rotate service role key | Via Supabase Dashboard |
| 4 | Fix Z.AI_API_KEY naming | `supabase secrets unset "Z.AI_API_KEY"` then `set Z_AI_API_KEY` |
| 5 | Repair migration history | `supabase migration repair --status reverted <ids>` |

---

## Executive Summary

| Category | Status | Notes |
|----------|--------|-------|
| Secrets | ✅ 7 set | All API keys configured |
| Edge Functions | ⚠️ 14/15 deployed | lobby-join missing deployment |
| Database Schema | ⚠️ Migrations desynced | Local/Remote migration mismatch |
| Frontend Credentials | ❌ Hardcoded | index.html has inline anon key |
| Security | ⚠️ Needs Review | Service role key should be rotated |

---

## Phase 1: Verification Complete ✅

### 1.1 Secrets Inventory (All Set)
```
✅ KIMI_CODING_API_KEY
✅ MINIMAX_API_KEY  
✅ SUPABASE_ANON_KEY
✅ SUPABASE_DB_URL
✅ SUPABASE_SERVICE_ROLE_KEY (NEEDS ROTATION!)
✅ SUPABASE_URL
✅ Z.AI_API_KEY (note: uses dot, not underscore)
```

### 1.2 Edge Functions Status (14 Active, 1 Missing)
```
✅ advice                    (v16, ACTIVE)
✅ game-reveal               (v14, ACTIVE)
✅ game-session              (v13, ACTIVE)
✅ game-scenario             (v9, ACTIVE)
✅ game-start                (v4, ACTIVE)
✅ game-vote                 (v13, ACTIVE)
✅ guestbook                 (v14, ACTIVE)
✅ lobby-create              (v2, ACTIVE)
✅ lobby-status              (v5, ACTIVE)
✅ pool                      (v17, ACTIVE)
✅ quiz                      (v17, ACTIVE)
✅ setup                     (v1, ACTIVE)
✅ vote                      (v19, ACTIVE)
✅ who-would-rather          (v2, ACTIVE)
❌ lobby-join                (MISSING - exists in filesystem but not deployed)
```

### 1.3 Frontend Security Assessment
```
❌ CRITICAL: index.html lines 450-451
   - Hardcoded NEXT_PUBLIC_SUPABASE_URL
   - Hardcoded NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   ✅ Service role key NOT exposed (correct)
   ✅ No other credentials in HTML (good)
```

### 1.4 Database Migration Status
```
⚠️ MIGRATION DESYNC DETECTED
   Local migrations:  20260104_230301 + 5 unnamed 20260104 migrations
   Remote migrations: 20251231061105 through 20260104071307
   
   Action Required: Need to repair migration history and sync
```

---

## Phase 2: Critical Security Fixes

### 2.1 Remove Hardcoded Credentials from index.html

**File:** `index.html`
**Lines:** 444-459
**Issue:** Hardcoded Supabase URL and anon key inline in HTML

**Current (INSECURE):**
```html
<script>
    // Environment variables injected at build time by Vercel
    // Only public (anon) key is exposed to client - service role stays server-side!
    window.ENV = window.ENV || {};
    
    // These are injected from .env.local during Vercel build
    window.ENV.NEXT_PUBLIC_SUPABASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co';
    window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';
    
    // CRITICAL: Service role key is NEVER exposed to client!
    // Only accessed server-side in Edge Functions
    
    console.log('[ENV] Supabase URL configured:', window.ENV.NEXT_PUBLIC_SUPABASE_URL ? '***configured***' : 'missing');
    console.log('[ENV] Supabase Anon Key configured:', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***configured***' : 'missing');
    console.log('[ENV] Security: Service role key NOT exposed to client (as it should be)');
</script>
```

**Required (SECURE):**
```html
<!-- Environment variables injected at build time -->
<!-- The inject-env.js script will populate window.ENV during build -->
<!-- See inject-env.js for configuration -->
```

**Action Items:**
1. Edit index.html lines 444-459 to remove hardcoded values
2. Keep the `window.ENV` object initialization but make it empty:
   ```html
   <script>
       // Environment variables injected at build time by Vercel/inject-env.js
       // Only public (anon) key is exposed to client - service role stays server-side!
       window.ENV = window.ENV || {};
   </script>
   ```
3. Ensure `.env.local` has correct values (do NOT commit this file!)
4. Run `node inject-env.js` locally to inject credentials
5. On Vercel: Set environment variables in project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://bkszmvfsfgvdwzacgmfz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Get from Supabase Dashboard → Settings → API

**IMPORTANT:** The hardcoded values in index.html were committed directly, bypassing the inject-env.js script. This should not happen again - all credential changes should go through `.env.local` + `inject-env.js`.

### 2.2 Rotate Service Role Key

**Reason:** Current key has been in logs and potentially exposed

**Steps:**
1. Go to Supabase Dashboard → Settings → API
2. Regenerate `service_role` secret key
3. Update Supabase secrets:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="new_key_here"
   ```
4. **DO NOT** commit new key to any files
5. Store new key securely (1Password, etc.)

### 2.3 Fix Z.AI_API_KEY Naming Inconsistency

**Current Secret Name:** `Z.AI_API_KEY` (with dot)  
**Expected by Code:** `Z_AI_API_KEY` (with underscore)

**Action:**
```bash
# Rename the secret
supabase secrets unset "Z.AI_API_KEY"
supabase secrets set Z_AI_API_KEY="your_zai_api_key_here"
```

---

## Phase 3: Edge Functions Deployment

### 3.1 Deploy Missing Function

```bash
# Deploy lobby-join function
supabase functions deploy lobby-join
```

### 3.2 Verify All Functions

```bash
# List all functions and verify status
supabase functions list

# Expected: 15 functions all showing ACTIVE
# Verify lobby-join now appears
```

### 3.3 Test Function Connectivity

```bash
# Test each core function
supabase functions logs game-session --limit 10
supabase functions logs game-scenario --limit 10
supabase functions logs game-vote --limit 10
supabase functions logs game-reveal --limit 10
supabase functions logs lobby-join --limit 10
```

---

## Phase 4: Database Schema Synchronization

### 4.1 Repair Migration History

**Problem:** Local and remote migration histories are desynced

**Solution:**
```bash
# Repair migration history (mark remote migrations as applied locally)
supabase migration repair --status reverted \
    20251231061105 \
    20251231061842 \
    20260102004949 \
    20260102043725 \
    20260102043821 \
    20260102143332 \
    20260102220002 \
    20260102220114 \
    20260103114006 \
    20260103123527 \
    20260103130636 \
    20260103145510 \
    20260103194202 \
    20260103213646 \
    20260103223445 \
    20260103223500 \
    20260103223557 \
    20260104 \
    20260104071256 \
    20260104071307
```

### 4.2 Pull Remote Schema

```bash
# Update local migrations to match remote
supabase db pull
```

### 4.3 Push Local Migrations

```bash
# Push local migrations to remote (dry run first)
supabase db push --dry-run

# If dry run looks good, execute
supabase db push
```

### 4.4 Verify Schema

```sql
-- Check that game tables exist and are empty
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'baby_shower' 
ORDER BY table_name;

-- Expected tables:
-- ✅ game_sessions (should be empty)
-- ✅ game_votes (should be empty)  
-- ✅ game_scenarios (should be empty)
-- ✅ game_answers (should be empty)
-- ✅ game_results (should be empty)

-- Check deprecated tables exist (for reference)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'baby_shower' 
AND table_name LIKE 'mom_dad%';
```

---

## Phase 5: Secret Configuration Verification

### 5.1 Set All Required Secrets

```bash
# Core Supabase (verify current values)
supabase secrets list

# AI APIs (verify they exist)
supabase secrets list | grep -E "MINIMAX|Z.AI|KIMI"

# If any missing, set them:
supabase secrets set MINIMAX_API_KEY="your_minimax_key"
supabase secrets set Z_AI_API_KEY="your_zai_key"  # Note: underscore
supabase secrets set KIMI_API_KEY="your_kimi_key"
```

### 5.2 Secret Reference Table

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| SUPABASE_URL | Core config | ✅ Set |
| SUPABASE_ANON_KEY | Public client | ✅ Set |
| SUPABASE_SERVICE_ROLE_KEY | Server-side admin | ⚠️ Needs rotation |
| SUPABASE_DB_URL | Database connection | ✅ Set |
| MINIMAX_API_KEY | AI roasts (pool, advice) | ✅ Set |
| Z_AI_API_KEY | Game scenario generation | ⚠️ Check name |
| KIMI_API_KEY | Game roast commentary | ✅ Set |

---

## Phase 6: Testing & QA

### 6.1 Frontend Tests

**Test 1: Credential Loading**
```javascript
// Browser console check
console.log('ENV URL:', window.ENV.NEXT_PUBLIC_SUPABASE_URL);
console.log('ENV Key:', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***set***' : 'missing');
// Expected: Both should be set after fix
```

**Test 2: Supabase Client Initialization**
```javascript
// Browser console
const supabase = window.supabase;
console.log('Supabase client:', supabase ? 'initialized' : 'failed');
// Expected: initialized
```

**Test 3: Mom vs Dad Game Flow**
1. Navigate to "Mom vs Dad" activity
2. Select a demo lobby (LOBBY-A, LOBBY-B, etc.)
3. Enter guest name
4. Verify "Waiting for game to start" message
5. Check browser console for `[MomVsDad]` logs

**Expected Console Output:**
```
[GameInit] Initializing game system...
[MomVsDad] loading...
[MomVsDad] initialized successfully
[MomVsDad] Connecting to lobby: LOBBY-A
[LobbyJoin] Success: {lobby_code: "LOBBY-A", ...}
```

### 6.2 API Tests

**Test 4: game-session Function**
```bash
# Test via curl (replace with actual values)
curl -X POST 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/game-session' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "list_lobbies"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"code": "LOBBY-A", "status": "waiting", ...},
    {"code": "LOBBY-B", "status": "waiting", ...}
  ]
}
```

**Test 5: lobby-join Function**
```bash
curl -X POST 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/lobby-join' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"lobby_code": "LOBBY-A", "guest_name": "Test Guest"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "lobby_code": "LOBBY-A",
    "status": "waiting",
    "player_count": 1
  }
}
```

### 6.3 Database Tests

**Test 6: Verify Game Tables**
```sql
-- Check game_sessions has demo data
SELECT * FROM baby_shower.game_sessions;

-- Expected: 4 rows (LOBBY-A, LOBBY-B, LOBBY-C, LOBBY-D)
```

**Test 7: Verify RLS Policies**
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'baby_shower';

-- Expected: All baby_shower tables should have rowsecurity = true
```

### 6.4 Edge Function Logs Check

```bash
# Check for errors in the last 24 hours
supabase functions logs game-session --since 24h | grep -i error
supabase functions logs game-vote --since 24h | grep -i error
supabase functions logs lobby-join --since 24h | grep -i error
```

**Expected:** No errors found (or minimal expected errors)

---

## Phase 7: Final Verification Checklist

### 7.1 Security Checklist
- [ ] No hardcoded credentials in index.html
- [ ] Service role key rotated
- [ ] Z.AI_API_KEY renamed to Z_AI_API_KEY
- [ ] No API keys in git history
- [ ] RLS enabled on all tables

### 7.2 Deployment Checklist
- [ ] All 15 Edge Functions deployed and ACTIVE
- [ ] Database migrations synced
- [ ] All secrets set correctly
- [ ] Frontend can connect to Supabase

### 7.3 Functionality Checklist
- [ ] Demo lobby selection works
- [ ] Lobby joining works
- [ ] Waiting room displays correctly
- [ ] Game flow can be tested (manual)
- [ ] No console errors in browser

### 7.4 Documentation Checklist
- [ ] Update AGENTS.md with new commands
- [ ] Document any issues found
- [ ] Update runbooks if needed

---

## Command Quick Reference

```bash
# Status checks
supabase status
supabase secrets list
supabase functions list
supabase migration list --linked

# Deployment
supabase functions deploy lobby-join
supabase functions deploy --all

# Database
supabase db push
supabase db pull
supabase migration repair --status reverted <migration_ids>

# Logs
supabase functions logs <function-name>
supabase functions logs <function-name> --since 24h

# Secrets
supabase secrets set KEY="value"
supabase secrets unset KEY
```

---

## Known Issues & Workarounds

### Issue 1: Migration History Desync
**Status:** Identified - Requires Phase 4 action
**Impact:** Cannot push local migrations without repair

### Issue 2: Z.AI_API_KEY Naming
**Status:** Identified - Requires Phase 2.3 action
**Impact:** Function may fail to find API key

### Issue 3: Service Role Key Exposure
**Status:** Identified - Requires Phase 2.2 action
**Impact:** Potential security risk if key was accessed

### Issue 4: Hardcoded Frontend Credentials
**Status:** Identified - Requires Phase 2.1 action
**Impact:** Credentials in HTML source

---

## Next Steps

1. **IMMEDIATE:** Remove hardcoded credentials from index.html
2. **HIGH:** Rotate service role key
3. **HIGH:** Deploy lobby-join function
4. **MEDIUM:** Repair migration history and sync database
5. **MEDIUM:** Fix Z.AI_API_KEY naming
6. **LOW:** Run full test suite
7. **LOW:** Commit and push changes

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-06
