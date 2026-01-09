# QA Analysis Report - Baby Shower Components

## Executive Summary

This Quality Assurance analysis reviews the Baby Shower application components based on the documentation in `agent_allocation.md` and cross-references with actual codebase implementation. The analysis identifies **3 broken components**, **4 unnecessary/obsolete components**, and **3 missing components or features** that require attention.

The codebase shows signs of ongoing refactoring with incomplete migrations, particularly around the Mom vs Dad game system. Several Edge Functions have been updated to use the new `game_*` table schema, but some functions still contain references to deprecated table names (`mom_dad_*`) in comments and parameters.

---

## 1. Broken Components

### 1.1 Empty `setup-demo-sessions` Directory

**Location:** `C:\Project\Baby_Shower\supabase\functions\setup-demo-sessions\`

**Issue:** The directory exists but contains no files. Running `ls -la` shows:
```
total 8
drwxr-xr-x 1 Jazeel-Home 197121 0 Jan  8 11:58 .
drwxr-xr-x 1 Jazeel-Home 197121 0 Jan  9 00:56 ..
```

**Impact:**
- Leftover empty directory from incomplete refactoring
- May cause confusion during deployment or code review
- The actual demo session creation is handled by `create-demo-sessions/index.ts`

**Evidence:** Directory was created/modified on Jan 8 but never populated with the function code.

**Recommendation:** Remove the empty `setup-demo-sessions` directory.

---

### 1.2 Incomplete Schema Migration in `lobby-join`

**Location:** `C:\Project\Baby_Shower\supabase\functions\lobby-join\index.ts`

**Issue:** The function uses outdated parameter naming and contains misleading comments. Key problems:

1. **Parameter name inconsistency** (Line 23, 73):
   ```typescript
   interface JoinSessionRequest {
     lobby_key: string  // Should be session_code per new schema
   }
   ```

2. **Dead code for LOBBY format detection** (Lines 90-94):
   ```typescript
   const lobbyMatch = normalizedLobbyKey.match(/^LOBBY-([A-D])$/)
   if (lobbyMatch) {
     normalizedLobbyKey = lobbyMatch[1]  // Converts LOBBY-A → A
   ```

3. **Comment references deprecated schema** (Lines 83-94):
   ```
   console.log('[lobby-join] Detected LOBBY format:', normalizedLobbyKey)
   ```

**Impact:**
- The LOBBY format detection converts "LOBBY-A" to just "A", which won't match `session_code` values that are 6-character alphanumeric codes
- This causes join failures for guests using LOBBY format codes

**Evidence:** The `create-demo-sessions` function creates sessions with 6-character codes like "LOBBY-A", not single letters.

**Recommendation:** Update `lobby-join` to:
1. Accept `session_code` as parameter name
2. Remove LOBBY format conversion code
3. Update all comments to reflect current schema

---

### 1.3 Vote Function Table Reference

**Location:** `C:\Project\Baby_Shower\supabase\functions\vote\index.ts`

**Issue:** The function inserts into `votes` table without schema prefix:

**Line 61:**
```typescript
.from('votes')
```

**Expected (per schema documentation):**
```typescript
.from('baby_shower.votes')
```

**Impact:**
- Data may be going to wrong table (public.votes vs baby_shower.votes)
- Inconsistent with other Edge Functions that use `baby_shower.*` prefix
- May cause data isolation issues

**Evidence:** AGENTS.md schema definition shows table should be `baby_shower.votes`.

**Recommendation:** Update line 61 to use `.from('baby_shower.votes')` and verify data is stored in correct schema.

---

## 2. Unnecessary Components

### 2.1 Deprecated `who-would-rather` Database Tables

**Location:** `C:\Project\Baby_Shower\supabase\migrations\20260104_who_would_rather_schema.sql`
**Tables:** `baby_shower.who_would_rather_sessions`, `baby_shower.who_would_rather_questions`, `baby_shower.who_would_rather_votes`

**Status:** These tables exist in the database but are completely unused:

| Table | Rows | Usage |
|-------|------|-------|
| `who_would_rather_sessions` | 0 | Not used - frontend is session-only |
| `who_would_rather_questions` | 24 | Not used - frontend has 19 hardcoded questions |
| `who_would_rather_votes` | 0 | Not used - votes stored in JavaScript state |

**Evidence from frontend** (`scripts/who-would-rather.js`):
```javascript
const QUESTIONS = [
  "It's 3 AM and the baby starts crying...",
  // ... 19 questions hardcoded
]

// All votes stored in local JavaScript state
let state = {
  currentQuestion: 0,
  votes: []
}
```

**Impact:**
- Wastes database storage
- Creates confusion about data persistence expectations
- Dead code that may be accidentally used

**Recommendation:** Either:
1. Remove the tables and migrations if truly deprecated
2. Or update frontend to use database persistence

---

### 2.2 Duplicate Demo Session Functions

**Issue:** Two functions exist with similar purposes:

| Function | Status | Purpose |
|----------|--------|---------|
| `create-demo-sessions/index.ts` | ✅ Active | Creates LOBBY-A through LOBBY-D sessions |
| `setup-demo-sessions/` | ❌ Empty directory | Was supposed to do same thing |

**Evidence:** `create-demo-sessions/index.ts` successfully creates 4 demo sessions:
```typescript
const demoSessions = [
  { session_code: 'LOBBY-A', admin_code: '1111', ... },
  { session_code: 'LOBBY-B', admin_code: '2222', ... },
  { session_code: 'LOBBY-C', admin_code: '3333', ... },
  { session_code: 'LOBBY-D', admin_code: '4444', ... },
]
```

**Impact:**
- The empty `setup-demo-sessions` directory is a duplicate/leftover
- Creates confusion about which function to use

**Recommendation:** Delete the empty `setup-demo-sessions` directory.

---

### 2.3 Deprecated `public.submissions` Table

**Location:** `C:\Project\Baby_Shower\supabase\migrations\supabase-production-schema.sql`

**Status:** Table was renamed to `public.submissions_DEPRECATED` per AGENTS.md cleanup log.

**Evidence:**
```
-- AGENTS.md Section "CLEANUP COMPLETED (2026-01-08)":
1. ✅ Renamed `public.submissions` → `public.submissions_DEPRECATED`
```

**Current Status:** The deprecated table still exists in the schema dump but is marked as deprecated. All new code uses `baby_shower.submissions`.

**Impact:**
- Dead table consuming storage
- Potential confusion if old code references it
- Should be cleaned up in next migration

**Recommendation:** Schedule removal of `public.submissions_DEPRECATED` table.

---

### 2.4 Orphaned Test/Debug Scripts

**Location:** `C:\Project\Baby_Shower\scripts\tests\`

**Issue:** Multiple test scripts may not be maintained or used:

| File | Purpose |
|------|---------|
| `test-guestbook-error.js` | Guestbook error handling test |
| `test-http-call.js` | HTTP call testing |
| `test-supabase-js.js` | Supabase client testing |
| `test-direct-call.js` | Direct API testing |
| `test-functions.js` | Edge Function testing |
| `test-validation-demo.js` | Validation demonstration |
| `test-vote-fixes.js` | Vote fixes testing |
| `test-voting-debug.js` | Vote debugging |
| `test-game-api.js` | Game API testing |
| `test-edge.js` | Edge runtime testing |
| `test-edge-function.js` | Edge Function testing |

**Impact:**
- 11+ test scripts with unknown maintenance status
- May contain outdated testing patterns
- Creates noise in the codebase

**Recommendation:** Consolidate into the existing test framework in `tests/e2e/` directory.

---

## 3. Missing Components

### 3.1 Missing RPC Function Documentation

**Issue:** AGENTS.md references several RPC functions used by the game but the actual function definitions may be incomplete or missing:

| RPC Function | Referenced In | Status |
|--------------|---------------|--------|
| `get_session_details` | `game-session/index.ts:87` | ✅ Exists |
| `insert_quiz_result` | `quiz/index.ts:78` | ✅ Exists |
| `baby_shower.generate_session_code` | `lobby-create/index.ts:115` | ⚠️ Unverified |
| `baby_shower.calculate_vote_stats` | `lobby-status/index.ts:118` | ⚠️ Unverified |
| `insert_advice` | `advice/index.ts` | ⚠️ Unverified |

**Impact:**
- Functions like `generate_session_code` and `calculate_vote_stats` are called but SQL definitions not verified
- Runtime errors may occur if functions don't exist

**Evidence:** Code calls RPC functions:
```typescript
const { data: sessionCode, error: codeError } = await supabase
  .rpc('baby_shower.generate_session_code')  // Where is this defined?
```

**Recommendation:** Verify all RPC functions exist in the database migrations.

---

### 3.2 AI API Key Configuration Missing

**Issue:** Multiple Edge Functions reference AI API keys that may not be configured:

| API Key | Used In | Purpose |
|---------|---------|---------|
| `Z_AI_API_KEY` | `game-start/index.ts`, `game-scenario/index.ts` | Scenario generation |
| `KIMI_API_KEY` | `game-reveal/index.ts` | Roast commentary |
| `MINIMAX_API_KEY` | `pool/index.ts`, `advice/index.ts` | AI roasts |

**Current Status:** Code gracefully falls back when keys are missing:
```typescript
const zaiApiKey = Deno.env.get('Z_AI_API_KEY')
if (zaiApiKey) {
  // Try AI generation
} else {
  console.log('Game Start - No Z.AI API key configured, using fallback scenarios')
  scenarios = generateFallbackScenarios(...)
}
```

**Impact:**
- Game scenarios always use fallback templates (less personalized)
- AI roast commentary unavailable
- Reduced "wow factor" for Mom vs Dad game

**Recommendation:** Configure AI API keys in Supabase environment variables:
- `Z_AI_API_KEY` for scenario generation
- `KIMI_API_KEY` for Moonshot AI roasts

---

### 3.3 Question Count Mismatch - Shoe Game

**Issue:** Database table has 24 questions but frontend uses 19:

| Source | Question Count |
|--------|----------------|
| `baby_shower.who_would_rather_questions` table | 24 questions |
| `scripts/who-would-rather.js` hardcoded array | 19 questions |

**Frontend code** (`scripts/who-would-rather.js` lines 25-46):
```javascript
const QUESTIONS = [
  "It's 3 AM and the baby starts crying uncontrollably...",
  "The diaper explosion reaches the ceiling...",
  // Only 19 questions defined
]
```

**Database table** (from migration):
- `who_would_rather_questions` - 24 rows (fully populated)

**Impact:**
- 5 database questions are never used
- If database was the source of truth, 5 questions would be missing from UI
- Inconsistent state between database and frontend

**Recommendation:** Either:
1. Update frontend to use database questions
2. Remove unused database questions
3. Document why frontend uses hardcoded questions

---

## Recommendations

### Priority 1 (Critical - Fix Immediately)

1. **Remove empty `setup-demo-sessions` directory**
   - Delete `C:\Project\Baby_Shower\supabase\functions\setup-demo-sessions\`

2. **Fix `lobby-join` function**
   - Update parameter name from `lobby_key` to `session_code`
   - Remove LOBBY format conversion code
   - Update all comments to match new schema

3. **Fix `vote` function table reference**
   - Change `.from('votes')` to `.from('baby_shower.votes')`

### Priority 2 (Important - Next Sprint)

4. **Verify RPC functions exist**
   - Check `baby_shower.generate_session_code` definition
   - Check `baby_shower.calculate_vote_stats` definition
   - Add to migrations if missing

5. **Clean up deprecated tables**
   - Remove `public.submissions_DEPRECATED`
   - Decide fate of `who_would_rather_*` tables

6. **Configure AI API keys**
   - Add `Z_AI_API_KEY` to Supabase environment
   - Add `KIMI_API_KEY` to Supabase environment

### Priority 3 (Nice to Have)

7. **Consolidate test scripts**
   - Move useful tests to `tests/e2e/`
   - Remove or archive unused test files

8. **Resolve question count mismatch**
   - Either sync frontend to database (24 questions)
   - Or document why 19 hardcoded questions are used

9. **Update documentation**
   - Ensure AGENTS.md reflects current state
   - Document AI API key configuration requirements

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Broken Components | 3 |
| Unnecessary Components | 4 |
| Missing Components | 3 |
| Total Issues | 10 |

**Overall Assessment:** The codebase shows active development with some cleanup debt. The core activities (guestbook, pool, quiz, advice) are well-implemented. The Mom vs Dad game has undergone schema migration but has some incomplete refactoring. Addressing these issues will improve code quality and reduce confusion.
