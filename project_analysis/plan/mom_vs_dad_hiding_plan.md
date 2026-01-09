# Mom vs Dad Hiding Plan
## Critical Implementation Guide for T-2 Hold Status

**Created:** 2026-01-09
**Last Updated:** 2026-01-09
**Status:** T-2 (On Hold - To Be Hidden - No current implementation timeline)
**Schema Compliance:** baby_shower namespace (R-3 satisfied)
**Implementation Note:** This component will be addressed on a later date. Current focus is on critical system fixes and core functionality.

---

## Executive Summary

This document outlines the comprehensive plan for hiding all Mom vs Dad game functionality while preserving the ability to reactivate when needed. The Mom vs Dad game consists of multiple layers:

- **Frontend:** UI components, JavaScript modules, CSS styles
- **Backend:** Edge Functions, database tables, RPC functions
- **Database:** game_sessions, game_scenarios, game_votes, game_answers, game_results, game_players

All database components are already in the `baby_shower` schema (R-3 satisfied), requiring no schema migration.

---

## 1. Mom vs Dad Components Inventory

### 1.1 Database Tables (baby_shower schema)

| Table | Status | Rows | Action Required |
|-------|--------|------|-----------------|
| `game_sessions` | ACTIVE | 31 | Preserve, add feature flag |
| `game_scenarios` | ACTIVE | 11 | Preserve, add feature flag |
| `game_votes` | ACTIVE | 13 | Preserve, add feature flag |
| `game_answers` | ACTIVE | 4 | Preserve, add feature flag |
| `game_results` | ACTIVE | 4 | Preserve, add feature flag |
| `game_players` | ACTIVE | 13 | Preserve, add feature flag |

**Archive Tables (already hidden):**
- `archive_mom_dad_lobbies` - No action needed
- `archive_mom_dad_players` - No action needed

### 1.2 Edge Functions

| Function | Status | Action Required |
|----------|--------|-----------------|
| `game-session` | ACTIVE | Feature flag, return 410 Gone |
| `game-scenario` | ACTIVE | Feature flag, return 410 Gone |
| `game-vote` | ACTIVE | Feature flag, return 410 Gone |
| `game-reveal` | ACTIVE | Feature flag, return 410 Gone |
| `game-start` | ACTIVE | Feature flag, return 410 Gone |
| `lobby-status` | ACTIVE | Feature flag, return 410 Gone |
| `lobby-create` | ACTIVE | Feature flag, return 410 Gone |
| `lobby-join` | ACTIVE | Feature flag, return 410 Gone |

### 1.3 Frontend Files

| File | Status | Action Required |
|------|--------|-----------------|
| `scripts/mom-vs-dad-simplified.js` | ACTIVE | Comment out, feature flag |
| `styles/mom-vs-dad-simplified.css` | ACTIVE | Comment out, feature flag |
| `scripts/game-init-enhanced.js` | ACTIVE | Conditional Mom vs Dad loading |
| `index.html` section | ACTIVE | Hide with CSS display:none |
| `scripts/config.js` | ACTIVE | Add feature flag |

### 1.4 Supporting Files

| File | Status | Action Required |
|------|--------|-----------------|
| `tests/mom-vs-dad-game.test.js` | ACTIVE | Mark as skipped |
| `tests/mom-vs-dad-game-verification.test.js` | ACTIVE | Mark as skipped |
| `docs/game-design/mom-vs-dad-GAME_DESIGN.md` | ACTIVE | Keep for reactivation |

---

## 2. Frontend Hiding Implementation

### 2.1 Feature Flag System

Add a global feature flag to `scripts/config.js`:

```javascript
// In scripts/config.js - Add or modify
window.FEATURE_FLAGS = window.FEATURE_FLAGS || {};
window.FEATURE_FLAGS.MOM_VS_DAD_ENABLED = false;  // T-2: Hide until further notice
window.FEATURE_FLAGS.MOM_VS_DAD_HIDDEN_AT = '2026-01-09T00:00:00Z';
window.FEATURE_FLAGS.MOM_VS_DAD_REASON = 'T-2 hold - feature deferred';
```

### 2.2 Index.html Section Hiding

Modify `index.html` to add hidden attribute:

```html
<!-- Mom vs Dad Game Section - T-2: HIDDEN -->
<section id="mom-vs-dad-section" class="hidden" data-hidden-reason="T-2 hold">
```

Add CSS rule:

```css
/* In styles/main.css */
section[data-hidden-reason="T-2 hold"],
#mom-vs-dad-section[data-hidden-reason="T-2 hold"] {
    display: none !important;
}
```

### 2.3 Script Loading Conditional

Modify `index.html` script loading:

```html
<!-- Activity Scripts - T-2: Conditional loading -->
<script>
    // Only load Mom vs Dad if feature is enabled
    if (window.FEATURE_FLAGS?.MOM_VS_DAD_ENABLED) {
        console.log('[T-2] Mom vs Dad enabled - loading scripts');
    } else {
        console.log('[T-2] Mom vs Dad disabled - scripts not loaded');
    }
</script>
<!-- Mom vs Dad scripts only load when enabled -->
<!-- <script src="scripts/mom-vs-dad-simplified.js"></script> -->
<!-- <script src="scripts/game-init-enhanced.js"></script> -->
```

### 2.4 Activity Card Hiding

The activity card for Mom vs Dad is controlled by the section visibility. Since it's not directly visible in the main activity grid, verify it's not accessible via navigation.

---

## 3. Backend Hiding Implementation

### 3.1 Edge Function Feature Flag Pattern

For each Edge Function, add a feature flag check at the top:

```typescript
// Example for game-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MOM_VS_DAD_ENABLED = Deno.env.get('MOM_VS_DAD_ENABLED') === 'true';

serve(async (req: Request) => {
    // T-2: Feature is on hold
    if (!MOM_VS_DAD_ENABLED) {
        console.log('[game-session] T-2: Mom vs Dad feature is hidden');
        return new Response(JSON.stringify({
            success: false,
            error: 'Feature temporarily unavailable',
            code: 'FEATURE_HIDDEN',
            hidden_at: '2026-01-09T00:00:00Z',
            reason: 'T-2 hold'
        }), {
            status: 410,  // Gone
            headers: {
                'Content-Type': 'application/json',
                'X-Feature-Status': 'hidden',
                'X-Feature-Hidden-At': '2026-01-09T00:00:00Z'
            }
        });
    }
    
    // ... rest of function
});
```

### 3.2 Environment Variable Control

Set the environment variable in Supabase:

```bash
# Via Supabase CLI or Dashboard
SUPABASE_SECRET_MOM_VS_DAD_ENABLED=false
```

### 3.3 All Edge Functions to Update

1. `supabase/functions/game-session/index.ts`
2. `supabase/functions/game-scenario/index.ts`
3. `supabase/functions/game-vote/index.ts`
4. `supabase/functions/game-reveal/index.ts`
5. `supabase/functions/game-start/index.ts`
6. `supabase/functions/lobby-status/index.ts`
7. `supabase/functions/lobby-create/index.ts`
8. `supabase/functions/lobby-join/index.ts`

---

## 4. Database Hiding Implementation

### 4.1 RLS Policy Updates

Add feature flag check to RLS policies. Since RLS can't check environment variables, add a `is_active` column check:

```sql
-- Add is_feature_active column to game_sessions if not exists
ALTER TABLE baby_shower.game_sessions 
ADD COLUMN IF NOT EXISTS is_feature_active BOOLEAN DEFAULT true;

-- Update RLS policies to check feature flag
CREATE POLICY "Feature hidden check" ON baby_shower.game_sessions
    FOR SELECT
    USING (is_feature_active = true OR is_feature_active IS NULL);

-- Set all current sessions to inactive
UPDATE baby_shower.game_sessions SET is_feature_active = false;
```

### 4.2 Data Preservation Strategy

All data is preserved but made inaccessible:

```sql
-- Data is preserved, not deleted
-- SELECT queries will return empty for hidden feature
-- INSERT/UPDATE operations blocked via RLS

-- To verify data is preserved (admin only):
SELECT id, session_code, mom_name, dad_name 
FROM baby_shower.game_sessions;

-- Data will show but feature flag prevents new operations
```

---

## 5. Implementation Checklist

### 5.1 Phase 1: Frontend (Priority: HIGH)

- [ ] Add feature flag to `scripts/config.js`
- [ ] Add CSS rule to hide section in `styles/main.css`
- [ ] Update `index.html` section with hidden attribute
- [ ] Comment out Mom vs Dad script loading in `index.html`
- [ ] Add conditional loading in activity navigation

### 5.2 Phase 2: Backend (Priority: HIGH)

- [ ] Add feature flag check to `game-session/index.ts`
- [ ] Add feature flag check to `game-scenario/index.ts`
- [ ] Add feature flag check to `game-vote/index.ts`
- [ ] Add feature flag check to `game-reveal/index.ts`
- [ ] Add feature flag check to `game-start/index.ts`
- [ ] Add feature flag check to `lobby-status/index.ts`
- [ ] Add feature flag check to `lobby-create/index.ts`
- [ ] Add feature flag check to `lobby-join/index.ts`
- [ ] Set `MOM_VS_DAD_ENABLED=false` in Supabase environment

### 5.3 Phase 3: Database (Priority: MEDIUM)

- [ ] Add `is_feature_active` column to `game_sessions`
- [ ] Update RLS policies to check feature flag
- [ ] Set all sessions to `is_feature_active = false`
- [ ] Verify data preservation

### 5.4 Phase 4: Testing & Verification (Priority: MEDIUM)

- [ ] Verify frontend section is hidden
- [ ] Verify Edge Functions return 410 Gone
- [ ] Verify database queries return empty results
- [ ] Update test files to skip Mom vs Dad tests
- [ ] Document reactivation steps

---

## 6. Reactivation Plan

### 6.1 Quick Reactivation (Reverse Steps)

When ready to reactivate Mom vs Dad, perform in reverse order:

1. **Database:** Set `is_feature_active = true` for sessions
2. **Backend:** Set `MOM_VS_DAD_ENABLED=true` in Supabase
3. **Backend:** Remove feature flag checks from Edge Functions (or set flag to true)
4. **Frontend:** Set `window.FEATURE_FLAGS.MOM_VS_DAD_ENABLED = true`
5. **Frontend:** Uncomment script loading in `index.html`
6. **Frontend:** Remove CSS hiding rule

### 6.2 Reactivation Timeline

Estimated time to reactivate: **5-10 minutes** (all steps reversible)

### 6.3 Reactivation Checklist

- [ ] Set `MOM_VS_DAD_ENABLED=true` in Supabase
- [ ] Update `window.FEATURE_FLAGS.MOM_VS_DAD_ENABLED = true` in config.js
- [ ] Uncomment script loading in `index.html`
- [ ] Remove `data-hidden-reason` attribute from section
- [ ] Remove or comment out CSS hiding rule
- [ ] Update test files to enable Mom vs Dad tests
- [ ] Verify all Edge Functions work correctly
- [ ] Test complete game flow

---

## 7. Schema Compliance Verification

### 7.1 Current State

All Mom vs Dad tables are correctly in `baby_shower` schema:

```sql
-- Verify tables are in correct schema
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'game_%'
ORDER BY table_schema, table_name;
```

**Expected Output:**
```
 baby_shower | game_sessions
 baby_shower | game_scenarios
 baby_shower | game_votes
 baby_shower | game_answers
 baby_shower | game_results
 baby_shower | game_players
```

### 7.2 RPC Functions

Verify RPC functions are also in baby_shower schema:

```sql
-- Check for RPC functions
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_name LIKE '%game%'
ORDER BY routine_schema, routine_name;
```

### 7.3 No Migration Required

Since R-3 is satisfied (everything already in baby_shower schema), no database migration is needed for hiding.

---

## 8. Security Considerations

### 8.1 Data Exposure Prevention

The hiding implementation prevents data exposure through:

1. **RLS Policies:** Block SELECT when feature is inactive
2. **Edge Functions:** Return 410 Gone when feature is inactive
3. **Frontend:** Section hidden with CSS, scripts not loaded

### 8.2 Access Control

- No authentication changes required
- Existing RLS policies remain in place
- Feature flag is server-side controlled via environment variable

### 8.3 Audit Trail

All hiding actions are logged:

```typescript
console.log('[T-2] Mom vs Dad feature hidden at:', new Date().toISOString());
console.log('[T-2] Reason: T-2 hold - feature deferred');
```

---

## 9. Rollback Plan

### 9.1 Emergency Rollback

If hiding causes issues, rollback immediately:

1. Set `MOM_VS_DAD_ENABLED=true` in Supabase
2. Remove CSS hiding rule temporarily
3. Data is preserved, no rollback needed

### 9.2 Rollback Verification

```sql
-- Verify data integrity after rollback
SELECT COUNT(*) FROM baby_shower.game_sessions;
SELECT COUNT(*) FROM baby_shower.game_votes;
```

---

## 10. Documentation References

### 10.1 Related Documents

- `AGENTS.md` - Project guidelines and security rules
- `docs/game-design/mom-vs-dad-GAME_DESIGN.md` - Game design documentation
- `supabase/migrations/20260103_mom_vs_dad_game_schema.sql` - Original schema
- `supabase/migrations/20260108_mom_vs_dad_game_tables.sql` - Demo sessions

### 10.2 External References

- Supabase RLS Documentation
- Edge Functions Security Guide

---

## 11. Implementation Sign-off

| Phase | Status | Owner | Notes |
|-------|--------|-------|-------|
| Frontend | DEFERRED | Frontend Dev | Feature flag + CSS hiding - To be implemented later |
| Backend | DEFERRED | Backend Dev | Environment variable + feature flag - To be implemented later |
| Database | DEFERRED | DBA | RLS policies + is_feature_active column - To be implemented later |
| Testing | DEFERRED | QA | Verify hiding + reactivation - To be implemented later |

**Deferral Reason:** T-2 hold status - Mom vs Dad functionality is on hold and will be addressed on a later date. Current priority is critical system fixes and core functionality implementation.

---

**Document Version:** 1.0  
**Created:** 2026-01-09  
**Last Updated:** 2026-01-09  
**Status:** Ready for Implementation
