# 🏗️ Baby Shower App - System Architecture

**Last Updated**: 2026-01-02  
**Version**: 3.0 (Production-Ready with Three-Stage Pipeline)  
**Status**: Production Ready - All Systems Operational

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Database Architecture](#database-architecture)
4. [Data Flow](#data-flow)
5. [API Endpoints](#api-endpoints)
6. [Security Implementation](#security-implementation)
7. [Hosting & Deployment](#hosting--deployment)
8. [Views and Aggregations](#views-and-aggregations)
9. [Testing Verification](#testing-verification)
10. [Deployment Status](#deployment-status)
11. [Quick Reference](#quick-reference)

---

## System Overview

This document describes the complete production architecture of the Baby Shower QR App, featuring a three-stage data pipeline with Supabase Edge Functions, dual-schema design, and Google Sheets integration.

---

## Core Architecture

### Three-Stage Data Pipeline Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                           │
│  - HTML/CSS/JavaScript (Vanilla JS)                                │
│  - API calls to Supabase Edge Functions                            │
└─────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS POST
┌─────────────────────────────▼───────────────────────────────────────┐
│                  Supabase Edge Functions (Deno)                     │
│  - 5 endpoints: /functions/v1/{guestbook,vote,pool,quiz,advice}    │
│  - Validation, sanitization, rate limiting                         │
│  - Direct SQL insert to public.submissions                         │
└─────────────────────────────┬───────────────────────────────────────┘
                               │ INSERT
┌─────────────────────────────▼───────────────────────────────────────┐
│                    Supabase PostgreSQL                              │
│  ┌────────────────────┐     ┌────────────────────────────────────┐  │
│  │  public.submissions│ ───▶│  internal.event_archive (Trigger)  │  │
│  │  (Hot - Realtime)  │     │  (Cold - Immutable Backup)         │  │
│  └────────────────────┘     └────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ Database Webhook POST
┌─────────────────────────────▼───────────────────────────────────────┐
│                   Google Apps Script                               │
│  - doPost(e) webhook handler                                       │
│  - Parses JSON, appends row to Google Sheet                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture

### Dual-Schema Design

#### Public Schema (Hot Layer)

**Table**: `public.submissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Auto-increment primary key |
| `created_at` | TIMESTAMPTZ | UTC timestamp of submission |
| `name` | TEXT | Guest name (not activity-specific) |
| `activity_type` | TEXT | Activity identifier |
| `activity_data` | JSONB | Activity-specific payload |

**Activity Types**:

| activity_type | Description | Example Data |
|---------------|-------------|--------------|
| `guestbook` | Wish messages | `{name, message, relationship}` |
| `baby_pool` | Birth predictions | `{name, guess}` |
| `quiz` | Emoji puzzle answers | `{answers}` |
| `advice` | Parenting advice | `{message}` |
| `voting` | Name votes | `{names}` |

#### Internal Schema (Cold Layer)

**Table**: `internal.event_archive`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Mirrors public.submissions.id |
| `created_at` | TIMESTAMPTZ | Mirrors public.submissions.created_at |
| `guest_name` | TEXT | Mirrors public.submissions.name |
| `activity_type` | TEXT | Mirrors public.submissions.activity_type |
| `raw_data` | JSONB | Original activity_data |
| `processed_data` | JSONB | Enhanced with migration metadata |

**Indexes**:
- `idx_internal_activity_type` on `activity_type`
- `idx_internal_created_at` on `created_at DESC`
- `idx_internal_guest_name` on `guest_name`

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION internal.handle_submission_migration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO internal.event_archive (id, created_at, guest_name, activity_type, raw_data, processed_data)
    VALUES (NEW.id, NEW.created_at, NEW.name, NEW.activity_type, NEW.activity_data, 
            NEW.activity_data || jsonb_build_object('migrated_at', NOW()::TEXT));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_submission_insert
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION internal.handle_submission_migration();
```

---

## Data Flow

### Complete Submission Flow

```
1. User Interaction
   ├─ Fills form (guestbook, vote, pool, quiz, advice)
   └─ Clicks "Submit"

2. Frontend (scripts/supabase.js)
   ├─ Validates input (max lengths, required fields)
   ├─ Constructs JSON payload
   └─ Fetch POST to: https://<project-ref>.supabase.co/functions/v1/<activity>

3. Supabase Edge Function
   ├─ Receives request
   ├─ Validates CORS + content-type
   ├─ Sanitizes inputs (trim, length limits)
   ├─ Prepares parameterized INSERT
   └─ Executes: INSERT INTO public.submissions...

4. Database Trigger (Automatic)
   ├─ Fires AFTER INSERT on public.submissions
   ├─ Executes handle_submission_migration()
   ├─ Inserts row into internal.event_archive
   └─ Adds migration metadata to processed_data

5. Database Webhook (Automatic)
   ├─ Supabase detects INSERT on internal.event_archive
   ├─ Sends POST request to Google Apps Script URL
   └─ Includes full row data in JSON payload

6. Google Apps Script
   ├─ Receives doPost(e) request
   ├─ Parses JSON payload
   ├─ Extracts activity-specific fields
   └─ Appends row to Google Sheet

Total Time: < 2 seconds end-to-end
```

---

## API Endpoints

### Supabase Edge Functions

| Endpoint | Method | Activity | Status |
|----------|--------|----------|--------|
| `/functions/v1/guestbook` | POST | Guest messages | ✅ Production |
| `/functions/v1/vote` | POST | Name votes | ✅ Production |
| `/functions/v1/pool` | POST | Birth predictions | ✅ Production |
| `/functions/v1/quiz` | POST | Emoji quiz answers | ✅ Production |
| `/functions/v1/advice` | POST | Parenting advice | ✅ Production |

### Request/Response Format

**Request**:
```json
{
  "name": "Guest Name",
  "activity_type": "guestbook",
  "activity_data": {
    "name": "Guest Name",
    "message": "Happy Baby Shower!",
    "relationship": "Friend"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Submission received",
  "data": {
    "id": 42,
    "created_at": "2026-01-02T00:15:00Z"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Validation failed: name is required"
}
```

---

## Security Implementation

### Row Level Security (RLS)

| Table | Operation | Policy | Conditions |
|-------|-----------|--------|------------|
| `public.submissions` | INSERT | Allow | authenticated OR anon |
| `public.submissions` | SELECT | Allow | Public (no auth) |
| `public.submissions` | UPDATE | Deny | All contexts |
| `public.submissions` | DELETE | Deny | All contexts |
| `internal.event_archive` | ALL | Allow | Service role only |
| `internal.event_archive` | ALL | Deny | All other contexts |

### Input Validation

| Field | Validation |
|-------|------------|
| `name` | Max 100 chars, trim whitespace |
| `message` | Max 1000 chars, trim whitespace |
| `names` (vote) | Array, max 3 entries |
| `guess` (pool) | Date format validation |
| `relationship` | Max 50 chars, optional |

---

## Hosting & Deployment

### Platform Matrix

| Component | Platform | URL/Config |
|-----------|----------|------------|
| Frontend | Vercel | https://baby-shower-v2.vercel.app |
| API | Supabase Edge | https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/ |
| Database | Supabase Pro | Project: bkszmvfsfgvdwzacgmfz, Region: Sydney |
| Export | Google Sheets | Webhook via Google Apps Script |

### Environment Variables

```env
# Supabase Configuration (already configured in .env.local)
SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Views and Aggregations

### Today's Submissions View

```sql
CREATE OR REPLACE VIEW public.v_today_submissions AS
SELECT activity_type, COUNT(*) as count, MAX(created_at) as last_submission
FROM public.submissions
WHERE created_at >= CURRENT_DATE
GROUP BY activity_type;
```

### Activity Breakdown View

```sql
CREATE OR REPLACE VIEW public.v_activity_breakdown AS
SELECT 
    activity_type,
    COUNT(*) as total_submissions,
    COUNT(DISTINCT name) as unique_guests,
    MIN(created_at) as first_submission,
    MAX(created_at) as last_submission
FROM public.submissions
GROUP BY activity_type;
```

---

## Testing Verification (2026-01-02)

### E2E Test Results

| Activity | Test ID | Status | Propagation |
|----------|---------|--------|-------------|
| Guestbook | 35 | ✅ PASS | → Internal ✅ |
| Vote | 36 | ✅ PASS | → Internal ✅ |
| Pool | 37 | ✅ PASS | → Internal ✅ |
| Quiz | 38 | ✅ PASS | → Internal ✅ |
| Advice | 39 | ✅ PASS | → Internal ✅ |

**Verified**: All 5 activities successfully insert to `public.submissions` and automatically propagate to `internal.event_archive` via trigger.

---

## Deployment Status

### Overall: PRODUCTION READY ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | Dual-schema with trigger |
| Edge Functions | ✅ Deployed | 5/5 functions operational |
| RLS Policies | ✅ Enforced | Read-only public, restricted internal |
| Google Sheets | ✅ Active | Webhook receiving data |
| Frontend Integration | ✅ Working | Supabase API client active |
| Trigger Pipeline | ✅ Verified | E2E tests passed |

---

## Quick Reference

### Supabase MCP Queries

```sql
-- Get all guestbook messages
SELECT name, activity_data->>'message' as message, created_at
FROM public.submissions
WHERE activity_type = 'guestbook'
ORDER BY created_at DESC;

-- Get vote leaderboard
SELECT 
    jsonb_array_elements_text(activity_data->'names') as name,
    COUNT(*) as votes
FROM public.submissions
WHERE activity_type = 'vote'
GROUP BY name
ORDER BY votes DESC;

-- Get today's activity summary
SELECT * FROM public.v_today_submissions;

-- Verify internal archive (should mirror public)
SELECT COUNT(*) as public_count FROM public.submissions;
SELECT COUNT(*) as internal_count FROM internal.event_archive;
```

---

**Document Version**: 3.0  
**Last Updated**: 2026-01-02 00:15 UTC  
**Maintained By**: Development Team  
**Status**: Production Ready - No Known Issues
