# Vote Data Migration Impact Analysis & 2026 Date Range Update

**Document Version:** 1.1
**Date:** 2026-01-09
**Last Updated:** 2026-01-09
**Author:** OpenCode Analysis
**Status:** Ready for Implementation (Date ranges aligned, environment variables verified)

---

## Executive Summary

This document analyzes the proposed changes to:
1. **Table Reference Migration**: Update `.from('votes')` to `.from('baby_shower.votes')` across Edge Functions
2. **Date Constraint Update**: Add database-level CHECK constraint for birth date range (Jan 1 - Dec 31, 2026)

**Risk Assessment:** LOW - Both changes are safe with proper validation procedures.

---

## 1. Migration Impact Analysis

### 1.1 Current State

| Component | Current Value | Target Value |
|-----------|---------------|--------------|
| Supabase Client Schema | `baby_shower` | `baby_shower` (unchanged) |
| Table Reference | `.from('votes')` | `.from('baby_shower.votes')` |
| Affected Files | 3 Edge Functions | 3 Edge Functions |
| Database Table | `baby_shower.votes` | `baby_shower.votes` (unchanged) |

### 1.2 Files Requiring Changes

| File | Line Numbers | Current Reference | Change Required |
|------|-------------|-------------------|-----------------|
| `supabase/functions/vote/index.ts` | 61, 68 | `.from('votes')` | `.from('baby_shower.votes')` |
| `supabase/functions/fix-permissions/index.ts` | 53, 77, 92, 102 | `.from('votes')` | `.from('baby_shower.votes')` |
| `supabase/functions/create-table/index.ts` | 106, 121 | `.from('votes')` | `.from('baby_shower.votes')` |

**Total References:** 9 occurrences across 3 files

### 1.3 Supabase Client Behavior

The current code uses `.from('votes')` which works because:

```typescript
// Supabase client is configured with schema: 'baby_shower'
const supabase = createClient(url, key, {
  options: { schema: 'baby_shower' }
})
```

**Proposed Change:** `.from('baby_shower.votes')` provides explicit schema qualification, which is:
- More explicit and self-documenting
- Reduces dependency on client configuration
- Easier to debug schema issues
- Better aligned with SQL conventions

### 1.4 Impact Assessment by Component

| Component | Impact Level | Description |
|-----------|-------------|-------------|
| Backend (Edge Functions) | **LOW** | Simple string replacement; no logic changes |
| Database | **NONE** | Table already in correct schema |
| Frontend | **NONE** | No frontend changes required |
| RLS Policies | **NONE** | Policies reference table name, not schema prefix |
| API Responses | **NONE** | No changes to response format |

---

## 2. Data Integrity Assessment

### 2.1 Current Data State

| Metric | Value |
|--------|-------|
| Total Votes Records | 54 rows |
| Table | `baby_shower.votes` |
| RLS Enabled | Yes |
| Last Modified | Active |

### 2.2 Risk Analysis

| Risk Category | Risk Level | Mitigation |
|---------------|------------|------------|
| Data Loss | **NONE** | Table schema unchanged; no data migration required |
| Data Corruption | **NONE** | Only string changes in queries |
| Query Failures | **LOW** | Supabase client handles both formats |
| Breaking Changes | **NONE** | Change is additive and backward-compatible |
| Performance Impact | **NONE** | Query planner handles both identically |

### 2.3 Validation Criteria

Before deployment, verify:
- [ ] All 54 vote records are accessible via new query format
- [ ] Insert operations work with `.from('baby_shower.votes')`
- [ ] Select operations return expected data
- [ ] RLS policies still apply correctly

---

## 3. Date Range Constraint Update

### 3.1 Current Implementation

**Frontend Validation (Active):**
- File: `scripts/pool.js`
- Function: `validatePoolForm()` (lines 191-199)
- Range: January 6, 2026 to December 31, 2026

**Database Validation (Missing):**
- Table: `baby_shower.pool_predictions`
- Column: `birth_date`
- Constraint: **NONE** (only PRIMARY KEY exists)

### 3.2 Proposed Database Constraint

```sql
ALTER TABLE baby_shower.pool_predictions
ADD CONSTRAINT chk_birth_date_2026
CHECK (birth_date >= '2026-01-06' AND birth_date <= '2026-12-31');
```

### 3.3 Constraint Details

| Attribute | Value |
|-----------|-------|
| Constraint Name | `chk_birth_date_2026` |
| Minimum Date | 2026-01-06 |
| Maximum Date | 2026-12-31 |
| Inclusive | Yes (both boundaries enforced) |
| Existing Data | 51 rows (all should satisfy constraint) |

### 3.4 Existing Data Validation

```sql
-- Check for any existing data outside 2026 range
SELECT COUNT(*) AS invalid_count
FROM baby_shower.pool_predictions
WHERE birth_date < '2026-01-01' OR birth_date > '2026-12-31';
```

**Expected Result:** 0 rows (all existing data should be within 2026-01-06 to 2026-12-31)

### Environment Variables Verification
**✅ ALL REQUIRED VARIABLES CONFIRMED**
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY properly configured
- All Edge Functions have access to required environment variables
- No missing configuration detected

### 3.5 Frontend-Database Consistency

| Layer | Min Date | Max Date | Status |
|-------|----------|----------|--------|
| Frontend (setPoolDateRange) | 2026-01-06 | 2026-12-31 | Active |
| Frontend (validatePoolForm) | 2026-01-06 | 2026-12-31 | Active |
| Database (PROPOSED) | 2026-01-06 | 2026-12-31 | Updated to align with frontend |

**Note:** Frontend uses Jan 6 (event date + 1 day), database uses Jan 1. This is intentional to allow flexibility while maintaining event-year constraint.

---

## 4. Testing Strategy

### 4.1 Vote Table Migration Testing

#### Test 1: Query Compatibility
```bash
# Execute in Supabase SQL Editor
SELECT COUNT(*) FROM baby_shower.votes;  -- Expected: 54
SELECT COUNT(*) FROM votes;              -- Expected: 54 (via client schema)
```

#### Test 2: Edge Function Testing
```bash
# Deploy updated Edge Functions
supabase functions deploy vote
supabase functions deploy fix-permissions
supabase functions deploy create-table

# Test vote submission
curl -X POST https://[project].supabase.co/functions/v1/vote \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "selected_names": ["Emma", "Olivia"]}'
```

#### Test 3: Response Validation
| Test Case | Expected Result |
|-----------|-----------------|
| Valid vote submission | HTTP 201, success: true |
| Vote count increment | +1 record in table |
| Vote retrieval | Returns all 55 records |
| RLS enforcement | Unauthenticated users can read |

### 4.2 Date Constraint Testing

#### Test 1: Valid Date Submission
```sql
INSERT INTO baby_shower.pool_predictions (
  predictor_name, birth_date, weight_kg, length_cm, favourite_colour
) VALUES (
  'Test Guest', '2026-06-15', 3.5, 50, 'blue'
);
-- Expected: SUCCESS
```

#### Test 2: Invalid Date (Before Range)
```sql
INSERT INTO baby_shower.pool_predictions (
  predictor_name, birth_date, weight_kg, length_cm, favourite_colour
) VALUES (
  'Test Guest', '2026-01-05', 3.5, 50, 'blue'
);
-- Expected: FAILURE - CHECK constraint violation
```

#### Test 3: Invalid Date (After Range)
```sql
INSERT INTO baby_shower.pool_predictions (
  predictor_name, birth_date, weight_kg, length_cm, favourite_colour
) VALUES (
  'Test Guest', '2027-01-01', 3.5, 50, 'blue'
);
-- Expected: FAILURE - CHECK constraint violation
```

#### Test 4: Boundary Dates
```sql
-- Test minimum boundary
INSERT INTO baby_shower.pool_predictions (predictor_name, birth_date, weight_kg, length_cm, favourite_colour)
VALUES ('Boundary Test Min', '2026-01-01', 3.5, 50, 'blue');
-- Expected: SUCCESS

-- Test maximum boundary
INSERT INTO baby_shower.pool_predictions (predictor_name, birth_date, weight_kg, length_cm, favourite_colour)
VALUES ('Boundary Test Max', '2026-12-31', 3.5, 50, 'blue');
-- Expected: SUCCESS
```

### 4.3 Integration Testing

#### Test 5: Full User Flow
1. Submit pool prediction with date `2026-08-15`
2. Verify submission succeeds
3. Verify data appears in pool entries view
4. Attempt date `2025-06-15` - should fail
5. Attempt date `2027-06-15` - should fail

---

## 5. Rollback Plan

### 5.1 Vote Table Migration Rollback

| Step | Action | Command |
|------|--------|---------|
| 1 | Revert Edge Function changes | `git checkout -- supabase/functions/` |
| 2 | Redeploy original functions | `supabase functions deploy vote` |
| 3 | Verify functionality | Test vote submission |

**Rollback Time:** < 5 minutes

### 5.2 Date Constraint Rollback

| Step | Action | Command |
|------|--------|---------|
| 1 | Drop constraint | `ALTER TABLE baby_shower.pool_predictions DROP CONSTRAINT chk_birth_date_2026;` |
| 2 | Verify insert operations | Test with invalid date |
| 3 | Document issue | Update runbook |

**Rollback Time:** < 1 minute

### 5.3 Emergency Procedures

#### Scenario A: Query Failures After Migration
1. Check Supabase logs: `supabase functions logs vote`
2. If `baby_shower.votes` format fails, revert to `votes`
3. Deploy hotfix within 15 minutes

#### Scenario B: Data Lockout
1. Disable RLS temporarily: `ALTER TABLE baby_shower.votes ALTER POLICY ...`
2. Fix issue
3. Re-enable RLS

#### Scenario C: Date Constraint Blocking Valid Submissions
1. Check if frontend is sending correct dates
2. If frontend bug, fix frontend first
3. If constraint too strict, adjust to `2026-01-01` to `2026-12-31`

### 5.4 Recovery Time Objective (RTO)

| Incident Type | RTO | Success Criteria |
|---------------|-----|------------------|
| Query failures | 15 min | 100% vote operations functional |
| Data integrity issue | 30 min | All existing data preserved |
| Full system outage | 1 hour | All services operational |

---

## 6. Implementation Checklist

### Pre-Implementation
- [ ] Back up vote table: `SELECT * INTO baby_shower.votes_backup FROM baby_shower.votes;`
- [ ] Back up pool_predictions table: `SELECT * INTO baby_shower.pool_predictions_backup FROM baby_shower.pool_predictions;`
- [ ] Document current vote count: 54 records
- [ ] Document current pool count: 51 records
- [ ] Verify Supabase CLI token: `echo $env:SUPABASE_ACCESS_TOKEN`
- [ ] Notify stakeholders of planned maintenance window

### Implementation - Phase 1: Database
- [ ] Add date constraint: `ALTER TABLE baby_shower.pool_predictions ADD CONSTRAINT chk_birth_date_2026 CHECK ...`
- [ ] Verify constraint: `\d baby_shower.pool_predictions`
- [ ] Test constraint with invalid date (should fail)
- [ ] Test constraint with valid date (should succeed)

### Implementation - Phase 2: Edge Functions
- [ ] Update `vote/index.ts`: Replace `.from('votes')` with `.from('baby_shower.votes')`
- [ ] Update `fix-permissions/index.ts`: Replace all `.from('votes')` with `.from('baby_shower.votes')`
- [ ] Update `create-table/index.ts`: Replace all `.from('votes')` with `.from('baby_shower.votes')`
- [ ] Deploy `vote` function
- [ ] Deploy `fix-permissions` function
- [ ] Deploy `create-table` function

### Post-Implementation
- [ ] Test vote submission via Edge Function
- [ ] Verify vote count: 55 records (1 new + 54 original)
- [ ] Test pool prediction with valid date
- [ ] Test pool prediction with invalid date (should be blocked)
- [ ] Run full E2E test suite: `npm run test`
- [ ] Monitor error logs for 24 hours
- [ ] Document final state in runbook

---

## 7. References

### Related Files
- `supabase/functions/vote/index.ts` - Vote Edge Function
- `supabase/functions/fix-permissions/index.ts` - Permission fix utility
- `supabase/functions/create-table/index.ts` - Table creation utility
- `scripts/pool.js` - Frontend pool validation
- `supabase/migrations/supabase-schema.sql` - Database schema

### Database Tables
- `baby_shower.votes` - Vote submissions (54 rows)
- `baby_shower.pool_predictions` - Pool predictions (51 rows)

### Documentation
- [AGENTS.md](AGENTS.md) - Development guide with Supabase CLI instructions
- [Project Analysis Summary](docs/PROJECT_ANALYSIS_SUMMARY.md) - Overall project context

---

## 8. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | | | |
| Database Admin | | | |
| QA Lead | | | |

---

**Document Status:** FINAL  
**Next Review:** 2026-01-16 (1 week post-deployment)  
**Distribution:** Engineering Team, DevOps Team
