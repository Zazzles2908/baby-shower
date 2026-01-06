# Edge Functions Security Fix - Testing Checklist

**Purpose:** Verify that `game-session` and `game-scenario` functions work correctly after refactoring to use security utilities pattern.

**Files Modified:**
- `supabase/functions/game-session/index.ts`
- `supabase/functions/game-scenario/index.ts`

**Reference Implementation:**
- `supabase/functions/game-vote/index.ts` (already uses security utilities)

---

## Pre-Deployment Checklist

- [ ] Docker Desktop is running
- [ ] `.env.local` contains `SUPABASE_ACCESS_TOKEN`
- [ ] `.env.local` contains `SUPABASE_PROJECT_REF`
- [ ] Database migration `20260103_mom_vs_dad_game_schema.sql` has been applied
- [ ] `baby_shower.game_sessions` table exists
- [ ] `baby_shower.game_scenarios` table exists

---

## Deployment

- [ ] Run `deploy-edge-functions-fix.bat` (Windows) or `./deploy-edge-functions-fix.sh` (Unix/WSL)
- [ ] Verify deployment success in terminal output
- [ ] Check `supabase functions list` shows both functions
- [ ] Verify no deployment errors

---

## Testing Environment

**Base URL:** `https://[project-ref].supabase.co/functions/v1/`

**Headers for all requests:**
```json
{
  "Content-Type": "application/json"
}
```

---

## Game Session Function Tests

**Function Endpoint:** `POST /game-session`

### Test 1: Create Session ✅

**Request:**
```json
{
  "action": "create",
  "mom_name": "Sarah",
  "dad_name": "Mike",
  "total_rounds": 5
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "session_code": "ABC123",
    "admin_code": "5678",
    "mom_name": "Sarah",
    "dad_name": "Mike",
    "status": "setup",
    "current_round": 0,
    "total_rounds": 5,
    "created_at": "2026-01-06T..."
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Response includes unique `session_code` (6 chars, no I, 1, O, 0)
- [ ] Response includes unique `admin_code` (4 digits)
- [ ] Status is "setup"
- [ ] Security headers present in response

### Test 2: Get Session ✅

**Request:** `GET /game-session?code=ABC123`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-here",
    "session_code": "ABC123",
    "mom_name": "Sarah",
    "dad_name": "Mike",
    "status": "setup",
    "current_round": 0,
    "total_rounds": 5,
    "created_at": "2026-01-06T..."
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Returns session data for valid code
- [ ] Case insensitive (abc123 should work)

### Test 3: Join Session ✅

**Request:**
```json
{
  "action": "join",
  "session_code": "ABC123",
  "guest_name": "Grandma Jones"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to the game, Grandma Jones!",
  "data": {
    "session_code": "ABC123",
    "mom_name": "Sarah",
    "dad_name": "Mike",
    "status": "setup",
    "current_round": 0,
    "total_rounds": 5
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Can join session in "setup" status
- [ ] Message includes guest name

### Test 4: Admin Login ✅

**Request:**
```json
{
  "action": "admin_login",
  "session_code": "ABC123",
  "admin_code": "5678"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "session_id": "uuid-here",
    "session_code": "ABC123",
    "mom_name": "Sarah",
    "dad_name": "Mike",
    "status": "setup",
    "current_round": 0,
    "total_rounds": 5
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Returns session data with correct admin code
- [ ] Returns 401 with wrong admin code

### Test 5: Update Session Status ✅

**Request:**
```json
{
  "action": "update",
  "session_code": "ABC123",
  "admin_code": "5678",
  "status": "voting",
  "current_round": 1
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Session updated successfully",
  "data": {
    "session_code": "ABC123",
    "status": "voting",
    "current_round": 1,
    "total_rounds": 5
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Status changes to "voting"
- [ ] Current round updates to 1
- [ ] Cannot update without correct admin code

### Test 6: Error Handling ✅

**Test Invalid JSON:**
- Request: `POST /game-session` with invalid JSON body
- Expected: `400 Bad Request` with "Invalid JSON in request body"

**Test Missing Action:**
- Request: `POST /game-session` with `{}`
- Expected: `400 Bad Request` with "Action is required"

**Test Invalid Action:**
- Request: `POST /game-session` with `{"action": "invalid"}`
- Expected: `400 Bad Request` with "Invalid action. Must be create, join, admin_login, or update"

**Test Session Not Found:**
- Request: `GET /game-session?code=NOTEXIST`
- Expected: `404 Not Found` with "Session not found"

**Test Invalid Admin Code:**
- Request: `{"action": "admin_login", "session_code": "ABC123", "admin_code": "0000"}`
- Expected: `401 Unauthorized` with "Invalid admin code"

**Test Missing Required Fields:**
- Request: `{"action": "create"}` (no mom_name/dad_name)
- Expected: `400 Bad Request` with validation errors

**Test Invalid Input Length:**
- Request: `{"action": "create", "mom_name": "", "dad_name": "Mike"}`
- Expected: `400 Bad Request` with validation errors

**Verification:**
- [ ] All error responses include security headers
- [ ] All error responses follow standardized format
- [ ] Validation errors include specific field issues

---

## Game Scenario Function Tests

**Function Endpoint:** `POST /game-scenario`

### Test 1: Generate Scenario ✅

**Request:**
```json
{
  "session_id": "uuid-from-create-session",
  "mom_name": "Sarah",
  "dad_name": "Mike",
  "theme": "funny"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "scenario_id": "uuid-here",
    "scenario_text": "It's 3 AM and the baby...",
    "mom_option": "Sarah would...",
    "dad_option": "Mike would...",
    "intensity": 0.7
  },
  "ai_generated": true,
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Response includes unique scenario_id
- [ ] Scenario text is generated (not empty)
- [ ] Intensity is between 0.1 and 1.0
- [ ] AI generated flag is true

### Test 2: Get Current Scenario ✅

**Request:** `GET /game-scenario?session_id=uuid-from-create-session`

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scenario_id": "uuid-here",
    "scenario_text": "It's 3 AM and the baby...",
    "mom_option": "Sarah would...",
    "dad_option": "Mike would...",
    "intensity": 0.7,
    "created_at": "2026-01-06T..."
  },
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Returns most recent scenario for session
- [ ] Returns null data if no scenario exists

### Test 3: Fallback Scenario ✅

**Request (without AI keys or if AI fails):**
```json
{
  "session_id": "uuid-from-create-session",
  "mom_name": "Sarah",
  "dad_name": "Mike"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "scenario_id": "uuid-here",
    "scenario_text": "It's 3 AM and the baby has a dirty diaper...",
    "mom_option": "Sarah would gently clean it up...",
    "dad_option": "Mike would make a dramatic production...",
    "intensity": 0.6
  },
  "ai_generated": false,
  "timestamp": "2026-01-06T..."
}
```

**Verification:**
- [ ] Falls back to default scenario if AI unavailable
- [ ] AI generated flag is false

### Test 4: Error Handling ✅

**Test Missing session_id:**
- Request: `POST /game-scenario` with `{}`
- Expected: `400 Bad Request` with "session_id is required"

**Test Invalid Theme:**
- Request: `{"session_id": "uuid", "theme": "invalid_theme"}`
- Expected: `400 Bad Request` with validation error

**Test Empty Names:**
- Request: `{"session_id": "uuid", "mom_name": "", "dad_name": "Mike"}`
- Expected: `400 Bad Request` with validation errors

**Verification:**
- [ ] All error responses include security headers
- [ ] Error messages are user-friendly
- [ ] Validation catches all edge cases

---

## Security Headers Verification

For all responses, verify these headers are present:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, apikey
Access-Control-Max-Age: 86400
```

**Quick Test:** Use curl to check headers:
```bash
curl -I -X POST https://[project-ref].supabase.co/functions/v1/game-session \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "mom_name": "Test", "dad_name": "User"}'
```

---

## Environment Variable Validation

Test that the functions properly validate environment variables:

1. **Remove temporarily:** Comment out SUPABASE_URL in `.env.local`
2. **Deploy function:** Redeploy to test
3. **Make request:** Should return `500 Server configuration error`
4. **Restore:** Uncomment SUPABASE_URL
5. **Redeploy:** Restore normal operation

**Verification:**
- [ ] Functions fail gracefully with missing env vars
- [ ] Error message is "Server configuration error" (not exposing env var names)

---

## Load Testing (Optional)

For production readiness, test with multiple concurrent requests:

1. **Create 10 sessions simultaneously**
2. **Join 50 guests to same session**
3. **Generate scenarios for multiple sessions**
4. **Verify no race conditions or errors**

**Tools:** Use Postman Runner or Apache Bench (`ab`)

---

## Integration Testing

Test the complete game flow:

1. **Create Session** → Save `session_code` and `admin_code`
2. **Admin Login** → Verify admin access
3. **Update Status** → Set to "voting"
4. **Join Session** → Add 3 guest names
5. **Generate Scenario** → Create first scenario
6. **Get Scenario** → Verify scenario returned
7. **Update Status** → Set to "revealed"
8. **End Session** → Set to "complete"

**Verification:**
- [ ] All steps complete without errors
- [ ] Data persists correctly between calls
- [ ] Status transitions work properly

---

## Rollback Plan

If issues are discovered:

1. **Identify last working deployment:**
   ```bash
   supabase functions list --linked
   ```

2. **Restore previous version:**
   ```bash
   git checkout [previous-working-commit] supabase/functions/game-session/index.ts
   git checkout [previous-working-commit] supabase/functions/game-scenario/index.ts
   supabase functions deploy game-session
   supabase functions deploy game-scenario
   ```

3. **Verify rollback:**
   Repeat critical test cases above

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test sessions (run in Supabase SQL Editor)
DELETE FROM baby_shower.game_scenarios 
WHERE session_id IN (
  SELECT id FROM baby_shower.game_sessions 
  WHERE created_at > '2026-01-06' 
  AND mom_name IN ('Test', 'Sarah', 'MomName')
);

DELETE FROM baby_shower.game_sessions 
WHERE created_at > '2026-01-06'
AND mom_name IN ('Test', 'Sarah', 'MomName');
```

---

## Documentation Updates

After testing, update relevant documentation:

- [ ] Update `docs/technical/EDGE_FUNCTIONS.md` if exists
- [ ] Add testing notes to `AGENTS.md`
- [ ] Update README if deployment process changed
- [ ] Document any edge cases discovered

---

## Sign-off Checklist

**Developer:**
- [ ] All refactored code reviewed
- [ ] Unit tests pass (if existing)
- [ ] Integration tests pass
- [ ] Security headers verified
- [ ] Error handling verified
- [ ] Documentation updated

**Reviewer:**
- [ ] Code review completed
- [ ] Security review completed
- [ ] Testing verification signed off

---

## References

- **Original Issue:** GitHub Issue #XXX (Edge Functions Consistency)
- **Reference Implementation:** `supabase/functions/game-vote/index.ts`
- **Security Utilities:** `supabase/functions/_shared/security.ts`
- **Deployment Script:** `deploy-edge-functions-fix.sh` / `.bat`
- **Migration File:** `supabase/migrations/20260103_mom_vs_dad_game_schema.sql`

---

**Last Updated:** 2026-01-06  
**Tested By:** ___________________  
**Date:** ___________________  
**Status:** 🟡 Ready for Testing / 🟢 Passed / 🔴 Failed
