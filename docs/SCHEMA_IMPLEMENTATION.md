# Baby Shower Multi-Table Schema - Complete Implementation Guide

## Overview

This document describes the complete multi-table schema design for the Baby Shower app, including migration strategy, Edge Function requirements, and data models.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐     ┌───────────────┐     ┌─────────────────────────┐  │
│  │ Vercel App  │────▶│ Edge Functions│────▶│   public.submissions    │  │
│  └─────────────┘     └───────────────┘     │   (Raw Ingestion)       │  │
│                                             └───────────┬─────────────┘  │
│                                                         │                │
│                                                         ▼                │
│                                             ┌─────────────────────────┐  │
│                                             │  Database Trigger       │  │
│                                             │  internal.handle_       │  │
│                                             │  submission_migration   │  │
│                                             └───────────┬─────────────┘  │
│                                                         │                │
│                                                         ▼                │
│  ┌─────────────┐     ┌───────────────┐     ┌─────────────────────────┐  │
│  │ Realtime    │◀────│ baby_shower.* │◀────│   Processing Function   │  │
│  │ Subscriptions│     │ Tables        │     │   (Normalization)       │  │
│  └─────────────┘     └───────────────┘     └─────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Schema: baby_shower

### Table 1: guestbook

Stores guest wishes and messages.

```sql
CREATE TABLE baby_shower.guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    guest_name TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('family', 'friend', 'colleague', 'other')),
    message TEXT NOT NULL CHECK (length(message) >= 10 AND length(message) <= 500),
    submitted_by TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_guestbook_created_at` - Sort by creation time
- `idx_guestbook_guest_name` - Search by guest name
- `idx_guestbook_relationship` - Filter by relationship

**RLS Policies:**
- INSERT: Allow anonymous
- SELECT: Public read access

---

### Table 2: votes

Stores baby name votes with JSONB array of selected names.

```sql
CREATE TABLE baby_shower.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    voter_name TEXT NOT NULL,
    selected_names JSONB NOT NULL CHECK (jsonb_typeof(selected_names) = 'array'),
    submitted_by TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    CONSTRAINT valid_selected_names CHECK (
        jsonb_array_length(selected_names) >= 1 AND 
        jsonb_array_length(selected_names) <= 3
    )
);
```

**Indexes:**
- `idx_votes_created_at` - Sort by creation time
- `idx_votes_voter_name` - Search by voter name
- `idx_votes_gin_names` - GIN index for JSONB array queries

**RLS Policies:**
- INSERT: Allow anonymous
- SELECT: Public read access

---

### Table 3: pool_predictions

Stores baby pool predictions with physical attributes.

```sql
CREATE TABLE baby_shower.pool_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    predictor_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'surprise')),
    birth_date DATE NOT NULL,
    weight_kg NUMERIC(4,2) NOT NULL CHECK (weight_kg >= 2.0 AND weight_kg <= 6.0),
    length_cm INTEGER NOT NULL CHECK (length_cm >= 40 AND length_cm <= 60),
    hair_color TEXT,
    eye_color TEXT,
    personality TEXT,
    submitted_by TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_pool_predictions_created_at` - Sort by creation time
- `idx_pool_predictions_predictor_name` - Search by predictor name
- `idx_pool_predictions_birth_date` - Filter by predicted date
- `idx_pool_predictions_gender` - Filter by predicted gender

**RLS Policies:**
- INSERT: Allow anonymous
- SELECT: Public read access

---

### Table 4: quiz_results

Stores emoji pictionary quiz results with JSONB answers.

```sql
CREATE TABLE baby_shower.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    participant_name TEXT NOT NULL,
    answers JSONB NOT NULL CHECK (jsonb_typeof(answers) = 'array'),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
    submitted_by TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_quiz_results_created_at` - Sort by creation time
- `idx_quiz_results_participant_name` - Search by participant name
- `idx_quiz_results_score` - Sort by score for leaderboards

**RLS Policies:**
- INSERT: Allow anonymous
- SELECT: Public read access

---

### Table 5: advice

Stores parenting advice and time capsule messages.

```sql
CREATE TABLE baby_shower.advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    advice_giver TEXT NOT NULL,
    advice_text TEXT NOT NULL CHECK (length(advice_text) >= 10 AND length(advice_text) <= 500),
    delivery_option TEXT NOT NULL CHECK (delivery_option IN ('immediate', 'time_capsule')),
    submitted_by TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_advice_created_at` - Sort by creation time
- `idx_advice_advice_giver` - Search by advice giver name
- `idx_advice_delivery_option` - Filter by delivery type

**RLS Policies:**
- INSERT: Allow anonymous
- SELECT: Public read access

---

### Table 6: ai_roasts

Stores AI-generated roasts for pool predictions.

```sql
CREATE TABLE baby_shower.ai_roasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    prediction_id UUID NOT NULL REFERENCES baby_shower.pool_predictions(id) ON DELETE CASCADE,
    roast_text TEXT NOT NULL CHECK (length(roast_text) >= 10 AND length(roast_text) <= 500),
    roast_type TEXT NOT NULL CHECK (roast_type IN ('funny', 'witty', 'savory')),
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ai_model_version TEXT DEFAULT 'gpt-4',
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generated', 'failed'))
);
```

**Indexes:**
- `idx_ai_roasts_created_at` - Sort by creation time
- `idx_ai_roasts_prediction_id` - Join with pool_predictions
- `idx_ai_roasts_roast_type` - Filter by roast type

**RLS Policies:**
- INSERT: Service role only
- SELECT: Public read access

---

## Migration Strategy

### Phase 1: Create Schema
1. Run `20250102_multi_table_schema.sql` in Supabase SQL Editor
2. Verify tables created with RLS enabled
3. Verify indexes created
4. Verify publication `baby_shower_realtime` created

### Phase 2: Migrate Data
1. Run `20250102_data_migration.sql` in Supabase SQL Editor
2. Verify record counts match source tables
3. Test data integrity

### Phase 3: Update Edge Functions
1. Modify Edge Functions to write to `baby_shower.*` tables
2. Update frontend API calls to use new table references
3. Test end-to-end functionality

### Phase 4: Deprecate Legacy Tables
1. Remove trigger from `public.submissions`
2. Archive or drop `baby_shower.submissions` if exists
3. Update documentation

---

## Edge Function Refactoring Requirements

### Current Architecture
All submissions go through a single Edge Function that writes to `public.submissions`.

### Required Changes

#### 1. submit-guestbook Function

**Current:**
```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES ($1, 'guestbook', $2::jsonb);
```

**New:**
```sql
INSERT INTO baby_shower.guestbook (guest_name, relationship, message, submitted_by, source_ip, user_agent)
VALUES ($1, $2, $3, $1, $4, $5);
```

#### 2. submit-vote Function

**Current:**
```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES ($1, 'voting', $2::jsonb);
```

**New:**
```sql
INSERT INTO baby_shower.votes (voter_name, selected_names, submitted_by, source_ip, user_agent)
VALUES ($1, $2::jsonb, $1, $3, $4);
```

#### 3. submit-pool Function

**Current:**
```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES ($1, 'baby_pool', $2::jsonb);
```

**New:**
```sql
INSERT INTO baby_shower.pool_predictions (predictor_name, gender, birth_date, weight_kg, length_cm, hair_color, eye_color, personality, submitted_by, source_ip, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $1, $9, $10);
```

#### 4. submit-quiz Function

**Current:**
```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES ($1, 'quiz', $2::jsonb);
```

**New:**
```sql
INSERT INTO baby_shower.quiz_results (participant_name, answers, score, submitted_by, source_ip, user_agent)
VALUES ($1, $2::jsonb, $3, $1, $4, $5);
```

#### 5. submit-advice Function

**Current:**
```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES ($1, 'advice', $2::jsonb);
```

**New:**
```sql
INSERT INTO baby_shower.advice (advice_giver, advice_text, delivery_option, submitted_by, source_ip, user_agent)
VALUES ($1, $2, $3, $1, $4, $5);
```

---

## Realtime Subscriptions

### Frontend Changes Required

#### Activity Ticker (main.js)

**Current:**
```javascript
.channel('public:submissions')
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, callback)
```

**New:**
```javascript
// Subscribe to each table individually
.channel('baby_shower:guestbook')
.on('postgres_changes', { event: 'INSERT', schema: 'baby_shower', table: 'guestbook' }, callback)

.channel('baby_shower:votes')
.on('postgres_changes', { event: 'INSERT', schema: 'baby_shower', table: 'votes' }, callback)

.channel('baby_shower:pool_predictions')
.on('postgres_changes', { event: 'INSERT', schema: 'baby_shower', table: 'pool_predictions' }, callback)

.channel('baby_shower:quiz_results')
.on('postgres_changes', { event: 'INSERT', schema: 'baby_shower', table: 'quiz_results' }, callback)

.channel('baby_shower:advice')
.on('postgres_changes', { event: 'INSERT', schema: 'baby_shower', table: 'advice' }, callback)
```

---

## Verification Checklist

### After Running Schema Migration
- [ ] RLS enabled on all 6 tables
- [ ] Policies created for each table
- [ ] Indexes created for frequently queried columns
- [ ] Publication `baby_shower_realtime` created
- [ ] All tables added to publication
- [ ] Permissions granted to anon/authenticated roles

### After Running Data Migration
- [ ] Guestbook: Count matches `public.submissions WHERE activity_type = 'guestbook'`
- [ ] Votes: Count matches `public.submissions WHERE activity_type = 'voting'`
- [ ] Pool Predictions: Count matches `public.submissions WHERE activity_type IN ('baby_pool', 'pool')`
- [ ] Quiz Results: Count matches `public.submissions WHERE activity_type = 'quiz'`
- [ ] Advice: Count matches `public.submissions WHERE activity_type = 'advice'`

### After Edge Function Updates
- [ ] Guestbook submissions work
- [ ] Vote submissions work
- [ ] Pool prediction submissions work
- [ ] Quiz result submissions work
- [ ] Advice submissions work
- [ ] Realtime updates trigger on new submissions
- [ ] Activity ticker updates correctly

---

## Rollback Procedure

If issues occur, rollback using:

```sql
-- Disable RLS on baby_shower tables
ALTER TABLE baby_shower.guestbook DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.pool_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.quiz_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.advice DISABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.ai_roasts DISABLE ROW LEVEL SECURITY;

-- Drop baby_shower tables
DROP TABLE IF EXISTS baby_shower.guestbook CASCADE;
DROP TABLE IF EXISTS baby_shower.votes CASCADE;
DROP TABLE IF EXISTS baby_shower.pool_predictions CASCADE;
DROP TABLE IF EXISTS baby_shower.quiz_results CASCADE;
DROP TABLE IF EXISTS baby_shower.advice CASCADE;
DROP TABLE IF EXISTS baby_shower.ai_roasts CASCADE;

-- Drop publication
DROP PUBLICATION IF EXISTS baby_shower_realtime;
```

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20250102_multi_table_schema.sql` | Creates 6 normalized tables with RLS, indexes, and realtime |
| `supabase/migrations/20250102_data_migration.sql` | Migrates existing data from public.submissions |
| `docs/SCHEMA_IMPLEMENTATION.md` | This documentation file |

---

## Execution Commands

```bash
# Option 1: Supabase Dashboard SQL Editor
# Copy and paste contents of migrations in order:
# 1. 20250102_multi_table_schema.sql
# 2. 20250102_data_migration.sql

# Option 2: Supabase CLI
supabase db push --project-ref bkszmvfsfgvdwzacgmfz

# Option 3: psql
psql "postgresql://[user]:[password]@[host]:5432/postgres" -f 20250102_multi_table_schema.sql
psql "postgresql://[user]:[password]@[host]:5432/postgres" -f 20250102_data_migration.sql
```
