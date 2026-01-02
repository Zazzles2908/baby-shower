# Supabase Infrastructure Analysis Report
**Generated:** 2026-01-02
**Project:** Baby Shower App (bkszmvfsfgvdwzacgmfz)

---

## 1. Git Operations Summary

### Committed Changes
- **Commit Hash:** `436deca`
- **Branch:** main
- **Files Changed:** 10 files (1336 insertions, 14 deletions)
- **Status:** ✅ Successfully pushed to https://github.com/Zazzles2908/baby-shower.git

### Files in Commit:
1. `index.html` - Frontend updates
2. `scripts/advice.js` - Advice functionality
3. `scripts/api-supabase.js` - Supabase API client
4. `scripts/api.js` - API client
5. `scripts/main.js` - Main application logic
6. `scripts/voting.js` - Voting functionality
7. `styles/main.css` - Styling updates
8. `test-results/COMPREHENSIVE_QA_REPORT_2026-01-02.md`
9. `test-results/COMPREHENSIVE_QA_REPORT_2026-01-02_FINAL.md`
10. `test-results/PRODUCTION_QA_REPORT_2026-01-02.md`

---

## 2. Supabase Infrastructure Overview

### Project Details
| Property | Value |
|----------|-------|
| **Project ID** | bkszmvfsfgvdwzacgmfz |
| **Project Ref** | bkszmvfsfgvdwzacgmfz |
| **Region** | us-east-1 |
| **Status** | ACTIVE_HEALTHY |
| **PostgreSQL Version** | 17.6.1 |
| **Release Channel** | ga |

### Active Edge Functions (5 total)
| Function | Status | Version | Verify JWT |
|----------|--------|---------|------------|
| guestbook | ACTIVE | 5 | true |
| vote | ACTIVE | 4 | true |
| pool | ACTIVE | 4 | true |
| quiz | ACTIVE | 4 | true |
| advice | ACTIVE | 4 | true |

---

## 3. Current Schema Architecture (CRITICAL ISSUES IDENTIFIED)

### Problem: Dual Submissions Tables

The database contains TWO separate submissions tables with different schemas:

#### Table 1: `public.submissions` ✅ Active
| Column | Type | Data |
|--------|------|------|
| id | bigint | 57 rows |
| created_at | timestamptz | - |
| name | text | - |
| activity_type | text | guestbook, voting, baby_pool, quiz, advice, ai_roast |
| activity_data | jsonb | - |

**Current State:** 57 rows - This is WHERE Edge Functions are ACTUALLY writing data

#### Table 2: `baby_shower.submissions` ⚠️ Legacy/Inactive
| Column | Type | Data |
|--------|------|------|
| id | bigint | 95 rows |
| created_at | timestamptz | - |
| name | text | - |
| activity_type | text | - |
| activity_data | jsonb | - |
| message | text | nullable |
| advice_type | text | nullable |
| date_guess | date | nullable |
| time_guess | time | nullable |
| weight_guess | numeric | nullable |
| length_guess | integer | nullable |
| puzzle1-5 | text | nullable |
| score | integer | nullable |
| selected_names | text | nullable |
| photo_url | text | nullable |
| relationship | text | nullable |

**Current State:** 95 rows - Has DEPRECATED columns that don't exist in public.submissions

#### Table 3: `internal.event_archive` ✅ Trigger Target
| Column | Type |
|--------|------|
| id | bigint |
| created_at | timestamptz |
| guest_name | text |
| activity_type | text |
| raw_data | jsonb |
| processed_data | jsonb |
| source_ip | inet |
| user_agent | text |
| processing_time_ms | integer |

**Current State:** 93 rows - Data replicated from public.submissions via triggers

---

## 4. Root Cause Analysis

### The Architecture Mismatch

1. **`supabase-schema.sql`** (intended design):
   - Creates `baby_shower` schema
   - Single unified `submissions` table with `activity_data` JSONB
   - All data goes to `baby_shower.submissions`

2. **`supabase-production-schema.sql`** (actual implementation):
   - Uses `public.submissions` as primary table
   - Creates trigger to replicate to `internal.event_archive`
   - Intended for data firewall pattern

3. **Actual Deployment:**
   - Edge Functions use `.from('submissions')` without schema prefix
   - Supabase client defaults to `public` schema
   - `baby_shower.submissions` exists with legacy schema (from older deployment)
   - Both tables have data but `public.submissions` is the active one

### Data Flow Issues

```
Frontend App (baby-shower-qr-app.vercel.app)
    ↓
Vercel Edge Network
    ↓
Supabase Edge Functions (5 functions)
    ↓
Supabase Client (no schema prefix = public schema)
    ↓
public.submissions (57 rows) ← ACTIVE
    ↓
Trigger: on_submission_insert
    ↓
internal.event_archive (93 rows) ← ARCHIVE
```

**Missing:** Data should also flow to `baby_shower.submissions` per original design intention

---

## 5. Edge Function Analysis

### Current Implementation

All 5 Edge Functions follow the same pattern:

1. **Guestbook** (`guestbook/index.ts`):
   - Inserts: `activity_type: 'guestbook'`, `activity_data.message`, `activity_data.relationship`
   - Milestone tracking (50 submissions)

2. **Vote** (`vote/index.ts`):
   - GET: Returns vote counts with percentages
   - POST: Inserts `activity_type: 'voting'`, `activity_data.names[]`
   - Calculates totals server-side

3. **Pool** (`pool/index.ts`):
   - Inserts `activity_type: 'baby_pool'`
   - Generates AI roast via MiniMax API
   - Stores prediction, due_date, weight, length in activity_data

4. **Quiz** (`quiz/index.ts`):
   - Inserts `activity_type: 'quiz'`
   - Stores answers, score, total_questions in activity_data
   - Calculates percentage server-side

5. **Advice** (`advice/index.ts`):
   - Inserts `activity_type: 'advice'`
   - Supports AI roast feature (`activity_type: 'ai_roast'`)
   - Stores advice, category, is_approved in activity_data

### All Functions Use:
```typescript
.from('submissions')  // Defaults to public.submissions
.insert({
  activity_type: '...',
  name: '...',
  activity_data: { ... }
})
```

---

## 6. Multi-Table Schema Design Recommendation

### Recommended `baby_shower` Schema

```sql
-- Main schema
CREATE SCHEMA IF NOT EXISTS baby_shower;

-- 1. Guestbook entries
CREATE TABLE baby_shower.guestbook (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    relationship TEXT NOT NULL,
    photo_url TEXT
);

-- 2. Baby name votes
CREATE TABLE baby_shower.votes (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    voter_name TEXT,
    names TEXT[] NOT NULL  -- Array of voted names
);

-- 3. Baby pool predictions
CREATE TABLE baby_shower.pool_predictions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    guest_name TEXT NOT NULL,
    prediction TEXT NOT NULL,
    due_date DATE NOT NULL,
    weight_kg NUMERIC NOT NULL,
    length_cm INTEGER NOT NULL,
    roast TEXT  -- AI-generated roast
);

-- 4. Quiz results
CREATE TABLE baby_shower.quiz_results (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    participant_name TEXT,
    puzzle1_answer TEXT,
    puzzle2_answer TEXT,
    puzzle3_answer TEXT,
    puzzle4_answer TEXT,
    puzzle5_answer TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage NUMERIC
);

-- 5. Parenting advice
CREATE TABLE baby_shower.advice (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    advisor_name TEXT,
    advice_text TEXT NOT NULL,
    category TEXT NOT NULL,  -- general, naming, feeding, sleeping, safety, fun
    is_approved BOOLEAN DEFAULT FALSE,
    ai_generated BOOLEAN DEFAULT FALSE
);

-- 6. AI Roasts (separate from advice)
CREATE TABLE baby_shower.ai_roasts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    topic TEXT NOT NULL,
    generated_advice TEXT NOT NULL,
    roast_level TEXT  -- mild, medium, spicy
);
```

---

## 7. Edge Function Refactoring Plan

### Phase 1: Update Edge Functions to Use `baby_shower` Schema

**All 5 functions need schema prefix:**

```typescript
// BEFORE (current):
.from('submissions')

// AFTER (target):
.from('baby_shower.submissions')  // OR specific table
```

### Phase 2: Function-Specific Updates

| Function | Current Table | Target Table |
|----------|---------------|--------------|
| guestbook | submissions | baby_shower.guestbook |
| vote | submissions | baby_shower.votes |
| pool | submissions | baby_shower.pool_predictions |
| quiz | submissions | baby_shower.quiz_results |
| advice | submissions | baby_shower.advice |

### Phase 3: Trigger Migration Script

```sql
-- Migrate data from public.submissions to baby_shower schema

-- Guestbook data
INSERT INTO baby_shower.guestbook (name, message, relationship, photo_url)
SELECT 
    name,
    activity_data->>'message',
    activity_data->>'relationship',
    activity_data->>'photo_url'
FROM public.submissions
WHERE activity_type = 'guestbook';

-- Votes data
INSERT INTO baby_shower.votes (voter_name, names)
SELECT 
    name,
    activity_data->'names'
FROM public.submissions
WHERE activity_type = 'voting';

-- Pool predictions
INSERT INTO baby_shower.pool_predictions (guest_name, prediction, due_date, weight_kg, length_cm)
SELECT 
    name,
    activity_data->>'prediction',
    activity_data->>'due_date',
    (activity_data->>'weight')::NUMERIC,
    (activity_data->>'length')::INTEGER
FROM public.submissions
WHERE activity_type = 'baby_pool';

-- Quiz results
INSERT INTO baby_shower.quiz_results (participant_name, score, total_questions, percentage)
SELECT 
    name,
    activity_data->>'score',
    activity_data->>'total_questions',
    activity_data->>'percentage'
FROM public.submissions
WHERE activity_type = 'quiz';

-- Advice
INSERT INTO baby_shower.advice (advisor_name, advice_text, category, is_approved)
SELECT 
    name,
    activity_data->>'advice',
    activity_data->>'category',
    (activity_data->>'is_approved')::BOOLEAN
FROM public.submissions
WHERE activity_type = 'advice';
```

---

## 8. Request Flow Analysis

### Current Flow
```
https://baby-shower-qr-app.vercel.app/
    ↓ (User interacts with app)
Browser JavaScript (scripts/api-supabase.js)
    ↓ (POST /functions/v1/{function_name})
Vercel Edge Network
    ↓ (HTTPS request)
Supabase Edge Functions (us-east-1 region)
    ↓ (Supabase client, service_role key)
Supabase Database (public.submissions)
    ↓ (Trigger)
internal.event_archive
```

### Recommendations

1. **Reduce Latency:** Edge Functions already in us-east-1, matching database
2. **Add Health Check:** Create function health endpoint
3. **Monitor Logs:** Enable structured logging in all functions
4. **Rate Limiting:** Implement per-IP rate limiting in Edge Functions

---

## 9. Critical Findings Summary

### ✅ What's Working
1. Git commit/push workflow functional
2. All 5 Edge Functions deployed and active
3. Trigger replication to internal.event_archive working
4. Frontend API integration functional
5. RLS policies enabled on submissions tables

### ❌ Issues to Fix
1. **Schema Confusion:** Two submissions tables with different schemas
2. **Data Divergence:** baby_shower.submissions has deprecated columns
3. **Intent vs Reality:** baby_shower schema designed but not used by Edge Functions
4. **Missing Multi-Table Design:** Should have separate tables per activity type

### 🚨 Action Items (Priority)

**HIGH PRIORITY:**
1. [ ] Update Edge Functions to use `baby_shower` schema prefix
2. [ ] Create migration script to consolidate data
3. [ ] Deploy new multi-table schema to baby_shower

**MEDIUM PRIORITY:**
4. [ ] Add comprehensive logging to Edge Functions
5. [ ] Implement proper error handling in frontend API client
6. [ ] Add rate limiting to prevent abuse

**LOW PRIORITY:**
7. [ ] Document schema in README
8. [ ] Create deployment checklist
9. [ ] Add integration tests

---

## 10. Files Examined

### Database Schemas
- `backend/supabase-schema.sql` - Original baby_shower schema design
- `backend/supabase-production-schema.sql` - Production trigger-based design

### Edge Functions
- `supabase/functions/guestbook/index.ts`
- `supabase/functions/vote/index.ts`
- `supabase/functions/pool/index.ts`
- `supabase/functions/quiz/index.ts`
- `supabase/functions/advice/index.ts`

### Frontend API Clients
- `scripts/api-supabase.js` - Modern Supabase API client
- `scripts/api.js` - Legacy API client

---

**Report Generated:** 2026-01-02T21:36:00Z
**Analyst:** Infrastructure Analysis System
