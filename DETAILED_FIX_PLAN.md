# 🛠️ DETAILED FIX PLAN - Baby Shower App
**Date:** 2026-01-02  
**Estimated Time:** 6 hours  
**Status:** Ready to Execute

---

## 📋 Overview

This plan fixes all 10 critical issues identified in [`CRITICAL_ANALYSIS_2026-01-02.md`](CRITICAL_ANALYSIS_2026-01-02.md). Each phase has specific steps, verification commands, and rollback procedures.

---

## PHASE 1: Database Setup (CRITICAL - 60 minutes)

### Objective
Apply correct schema to Supabase database so Edge Functions can save data.

### Steps

#### Step 1.1: Check Current Database State
```sql
-- Run in Supabase SQL Editor
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'internal') 
ORDER BY table_schema, table_name;
```

**Expected Output:**
- If `public.submissions` exists → Check columns
- If `internal.event_archive` exists → Check columns
- If neither → Schema not applied

#### Step 1.2: Apply Schema File
**Action:** Execute [`backend/supabase-production-schema.sql`](backend/supabase-production-schema.sql:1) in Supabase SQL Editor

**What This Does:**
1. Creates `internal` schema
2. Creates `internal.event_archive` table
3. Creates `internal.handle_submission_migration()` function
4. Creates trigger on `public.submissions`
5. Creates indexes for performance
6. Enables RLS policies
7. Creates `internal.submission_stats` table
8. Creates views for common queries

#### Step 1.3: Verify Schema Applied
```sql
-- Check public.submissions exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'submissions'
ORDER BY ordinal_position;

-- Expected columns:
-- id (BIGINT)
-- created_at (TIMESTAMPTZ)
-- name (TEXT)
-- activity_type (TEXT)
-- activity_data (JSONB)
```

```sql
-- Check internal.event_archive exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'internal' AND table_name = 'event_archive'
ORDER BY ordinal_position;

-- Expected columns:
-- id, created_at, guest_name, activity_type, raw_data, processed_data, 
-- source_ip, user_agent, processing_time_ms
```

```sql
-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_submission_insert';

-- Expected: on_submission_insert, INSERT, submissions
```

#### Step 1.4: Test Trigger Function
```sql
-- Insert test record
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Test User',
    'guestbook',
    '{"name":"Test User","message":"Test message","relationship":"Friend"}'::jsonb
);

-- Check if it propagated to internal.event_archive
SELECT * FROM internal.event_archive 
WHERE guest_name = 'Test User' 
ORDER BY id DESC 
LIMIT 1;

-- Expected: One row with processed_data containing migrated_at timestamp
```

#### Step 1.5: Clean Up Test Data
```sql
-- Delete test records
DELETE FROM public.submissions WHERE name = 'Test User';
DELETE FROM internal.event_archive WHERE guest_name = 'Test User';
```

### Success Criteria
- ✅ `public.submissions` table exists with correct columns
- ✅ `internal.event_archive` table exists with correct columns
- ✅ `on_submission_insert` trigger exists
- ✅ Insert into `public.submissions` creates row in `internal.event_archive`

### Rollback
```sql
-- Drop everything
DROP TRIGGER IF EXISTS on_submission_insert ON public.submissions;
DROP FUNCTION IF EXISTS internal.handle_submission_migration();
DROP TABLE IF EXISTS internal.event_archive;
DROP TABLE IF EXISTS internal.submission_stats;
DROP VIEW IF EXISTS public.v_today_submissions;
DROP VIEW IF EXISTS public.v_activity_breakdown;
DROP SCHEMA IF EXISTS internal;
```

---

## PHASE 2: Fix Environment Variables (CRITICAL - 30 minutes)

### Objective
Ensure all code uses correct Supabase credentials.

### Steps

#### Step 2.1: Update scripts/config.js
**File:** [`scripts/config.js`](scripts/config.js:1)

**Change:**
```javascript
// BEFORE (WRONG):
ANON_KEY: 'sb_publishable_4_-bf5hda3a5Bb9enUmA0Q_jrKJf1K_'

// AFTER (CORRECT):
ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI'
```

#### Step 2.2: Create .env File for Vercel
**File:** `.env` (new file)

**Content:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI

# Vercel Configuration
VERCEL_API_TOKEN=XEg7kQ9CCZiZx3o4qeBoJplA
```

#### Step 2.3: Update .gitignore
**File:** [`.gitignore`](.gitignore:1)

**Add:**
```gitignore
# Environment variables
.env
.env.local
.env.production
```

### Success Criteria
- ✅ [`scripts/config.js`](scripts/config.js:9) has correct Supabase ANON_KEY
- ✅ `.env` file exists with correct values
- ✅ `.env` is in `.gitignore`

### Rollback
```bash
# Restore original config.js
git checkout scripts/config.js

# Remove .env
rm .env
```

---

## PHASE 3: Clean Up API Clients (CRITICAL - 60 minutes)

### Objective
Remove conflicting API clients and consolidate to single Supabase Edge Functions client.

### Steps

#### Step 3.1: Remove Vercel API Routes
```bash
# Delete entire api/ folder
rm -rf api/

# Verify
ls api/  # Should fail: No such file or directory
```

#### Step 3.2: Remove Wrong Supabase Client
```bash
# Delete scripts/supabase.js (wrong schema)
rm scripts/supabase.js

# Verify
ls scripts/supabase.js  # Should fail
```

#### Step 3.3: Remove Old API Client
```bash
# Delete scripts/api.js (Vercel client)
rm scripts/api.js

# Verify
ls scripts/api.js  # Should fail
```

#### Step 3.4: Rename api-supabase.js to api.js
```bash
# Rename the correct Supabase Edge Functions client
mv scripts/api-supabase.js scripts/api.js

# Verify
ls scripts/api.js  # Should exist
```

#### Step 3.5: Update Activity Scripts to Use New API

**Files to update:**
- [`scripts/guestbook.js`](scripts/guestbook.js:1)
- [`scripts/pool.js`](scripts/pool.js:1)
- [`scripts/quiz.js`](scripts/quiz.js:1)
- [`scripts/advice.js`](scripts/advice.js:1)
- [`scripts/voting.js`](scripts/voting.js:1)

**For each file, find and replace:**

**BEFORE:**
```javascript
// Old Vercel API call
const result = await submitToAPI('guestbook', data);
```

**AFTER:**
```javascript
// New Supabase Edge Functions call
import { submitGuestbook } from './api.js';

const result = await submitGuestbook(data);
```

### Success Criteria
- ✅ `api/` folder deleted
- ✅ `scripts/supabase.js` deleted
- ✅ `scripts/api.js` is the renamed `api-supabase.js`
- ✅ All activity scripts import from new `scripts/api.js`
- ✅ No references to Vercel API routes

### Rollback
```bash
# Restore everything
git checkout api/
git checkout scripts/

# Remove new api.js
rm scripts/api.js

# Restore api-supabase.js
git checkout scripts/api-supabase.js
```

---

## PHASE 4: Fix Frontend Script Loading (CRITICAL - 30 minutes)

### Objective
Fix [`index.html`](index.html:216-227) to load scripts in correct order.

### Steps

#### Step 4.1: Update index.html Script Loading
**File:** [`index.html`](index.html:216)

**BEFORE:**
```html
<script src="scripts/config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="scripts/supabase-client.js"></script>  <!-- ❌ Doesn't exist -->
<script src="scripts/api.js"></script>  <!-- ❌ Wrong file -->
<script src="scripts/supabase.js"></script>  <!-- ❌ Wrong schema -->
<script src="scripts/main.js"></script>
<script src="scripts/guestbook.js"></script>
<script src="scripts/pool.js"></script>
<script src="scripts/quiz.js"></script>
<script src="scripts/advice.js"></script>
<script src="scripts/voting.js"></script>
<script src="scripts/surprises.js"></script>
```

**AFTER:**
```html
<!-- Load Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Load configuration -->
<script src="scripts/config.js"></script>

<!-- Load API client (Supabase Edge Functions) -->
<script type="module" src="scripts/api.js"></script>

<!-- Load main application -->
<script src="scripts/main.js"></script>

<!-- Load activity modules -->
<script src="scripts/guestbook.js"></script>
<script src="scripts/pool.js"></script>
<script src="scripts/quiz.js"></script>
<script src="scripts/advice.js"></script>
<script src="scripts/voting.js"></script>
<script src="scripts/surprises.js"></script>
```

**Key Changes:**
1. ✅ Removed non-existent `scripts/supabase-client.js`
2. ✅ Removed duplicate `scripts/api.js` (Vercel)
3. ✅ Removed `scripts/supabase.js` (wrong schema)
4. ✅ Added `type="module"` to `scripts/api.js` (ES6 modules)
5. ✅ Correct order: Supabase SDK → Config → API → Main → Activities

#### Step 4.2: Test in Browser
1. Open `index.html` in browser
2. Open DevTools Console (F12)
3. Check for errors:
   - ❌ "Failed to load resource: scripts/supabase-client.js" → Should NOT appear
   - ❌ "CONFIG is not defined" → Should NOT appear
   - ❌ "submitGuestbook is not defined" → Should NOT appear
4. Verify:
   - ✅ No 404 errors for scripts
   - ✅ CONFIG object is available in console
   - ✅ API functions are available

### Success Criteria
- ✅ No 404 errors in browser console
- ✅ All scripts load successfully
- ✅ CONFIG object is defined
- ✅ API functions are accessible

### Rollback
```bash
# Restore original index.html
git checkout index.html
```

---

## PHASE 5: Deploy Supabase Edge Functions (CRITICAL - 30 minutes)

### Objective
Deploy all 5 Supabase Edge Functions to production.

### Steps

#### Step 5.1: Install Supabase CLI (if not installed)
```bash
# Check if installed
supabase --version

# If not installed
npm install -g supabase
```

#### Step 5.2: Link to Supabase Project
```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref bkszmvfsfgvdwzacgmfz
```

#### Step 5.3: Deploy All Functions
```bash
# Deploy guestbook function
supabase functions deploy guestbook

# Deploy vote function
supabase functions deploy vote

# Deploy pool function
supabase functions deploy pool

# Deploy quiz function
supabase functions deploy quiz

# Deploy advice function
supabase functions deploy advice
```

#### Step 5.4: Verify Deployment
```bash
# List all functions
supabase functions list

# Expected output:
# guestbook
# vote
# pool
# quiz
# advice
```

#### Step 5.5: Test Each Function
```bash
# Test guestbook function
curl -X POST \
  https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Test message","relationship":"Friend"}'

# Expected response:
# {"success":true,"data":{"id":1,"name":"Test",...}}

# Repeat for other functions with appropriate payloads
```

### Success Criteria
- ✅ All 5 functions deployed
- ✅ `supabase functions list` shows all functions
- ✅ Each function responds to test requests
- ✅ Data is saved to `public.submissions`

### Rollback
```bash
# Delete specific function version
supabase functions delete guestbook --project-ref bkszmvfsfgvdwzacgmfz

# Repeat for other functions
```

---

## PHASE 6: Set Up Google Sheets Webhook (HIGH - 60 minutes)

### Objective
Configure Supabase webhook to send data to Google Sheets.

### Steps

#### Step 6.1: Deploy Google Apps Script
**Action:** Manual setup in Google Sheets

1. Open Google Sheet for event
2. Extensions > Apps Script
3. Delete any existing code
4. Paste content of [`backend/Code.gs`](backend/Code.gs:1)
5. Save (Ctrl+S)
6. Click "Deploy" > "New deployment"
7. Select type: "Web app"
8. Description: "Baby Shower Webhook"
9. Execute as: "Me"
10. Who has access: "Anyone" (required for Supabase webhooks)
11. Click "Deploy"
12. Copy the Web App URL

**Expected URL format:**
```
https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

#### Step 6.2: Create Webhook in Supabase
**Action:** Manual setup in Supabase Dashboard

1. Go to Supabase Dashboard
2. Project: bkszmvfsfgvdwzacgmfz
3. Database > Webhooks > New Webhook
4. Configure:
   - **Name:** Baby Shower Google Sheets
   - **Table:** internal.event_archive
   - **Events:** INSERT
   - **HTTP Method:** POST
   - **URL:** [Paste Google Script URL from Step 6.1]
   - **Headers:** 
     - Key: `Content-Type`
     - Value: `application/json`
5. Click "Create"

#### Step 6.3: Test Webhook
```sql
-- Insert test record in Supabase SQL Editor
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Webhook Test',
    'guestbook',
    '{"name":"Webhook Test","message":"Testing webhook","relationship":"Friend"}'::jsonb
);
```

**Verification:**
1. Check Google Sheet - new row should appear within 2 seconds
2. Row should contain:
   - ID
   - Timestamp
   - Guest Name: "Webhook Test"
   - Activity Type: "guestbook"
   - Raw Data: JSON string
   - Processed Data: JSON with migrated_at
   - Processing Time: number

#### Step 6.4: Clean Up Test Data
```sql
-- Delete test records
DELETE FROM public.submissions WHERE name = 'Webhook Test';
DELETE FROM internal.event_archive WHERE guest_name = 'Webhook Test';

-- Delete row from Google Sheet manually
```

### Success Criteria
- ✅ Google Apps Script deployed as Web App
- ✅ Webhook created in Supabase Dashboard
- ✅ Insert into database triggers webhook
- ✅ Google Sheet receives data within 2 seconds
- ✅ Data format is correct in Google Sheet

### Rollback
```bash
# Delete webhook in Supabase Dashboard
# (Manual action: Database > Webhooks > Delete)

# Delete Google Apps Script deployment
# (Manual action: Google Apps Script > Deploy > Manage deployments > Delete)
```

---

## PHASE 7: End-to-End Testing (HIGH - 60 minutes)

### Objective
Verify complete data flow from user submission to Google Sheets.

### Steps

#### Step 7.1: Run E2E Test Suite
```bash
# Install dependencies (if not installed)
npm install

# Run E2E tests
npm test

# Expected: All 19 tests pass
```

#### Step 7.2: Manual Browser Testing
**Test Each Activity:**

1. **Guestbook:**
   - Open app in browser
   - Click "Leave a Wish"
   - Fill: Name="Test User", Message="Test message", Relationship="Friend"
   - Click "Submit Wish"
   - Verify: Success modal appears
   - Check Supabase: `SELECT * FROM public.submissions WHERE name='Test User'`
   - Check Google Sheet: New row appears

2. **Vote:**
   - Click "Vote for Names"
   - Select 3 names
   - Click "Submit Votes"
   - Verify: Success modal appears
   - Check Supabase and Google Sheet

3. **Pool:**
   - Click "Guess Baby's Stats"
   - Fill: Name, Date, Time, Weight, Length
   - Click "Submit Prediction"
   - Verify: Success modal appears
   - Check Supabase and Google Sheet

4. **Quiz:**
   - Click "Baby Emoji Pictionary"
   - Fill: Name, 5 puzzle answers
   - Click "Submit Answers"
   - Verify: Success modal appears
   - Check Supabase and Google Sheet

5. **Advice:**
   - Click "Give Advice"
   - Fill: Name, Type="For Parents", Message="Test advice"
   - Click "Submit Advice"
   - Verify: Success modal appears
   - Check Supabase and Google Sheet

#### Step 7.3: Verify Data Flow
```sql
-- Count submissions by type
SELECT activity_type, COUNT(*) as count
FROM public.submissions
GROUP BY activity_type;

-- Verify internal archive matches
SELECT activity_type, COUNT(*) as count
FROM internal.event_archive
GROUP BY activity_type;

-- Both should have same counts
```

#### Step 7.4: Performance Testing
1. Submit 10 guestbook entries rapidly
2. Measure time from submit to Google Sheet appearance
3. **Target:** < 2 seconds end-to-end
4. Check for any timeouts or errors

### Success Criteria
- ✅ All 19 E2E tests pass
- ✅ All 5 activities work in browser
- ✅ Data appears in Supabase within 500ms
- ✅ Data appears in Google Sheet within 2 seconds
- ✅ `public.submissions` count matches `internal.event_archive` count
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

### Rollback
```bash
# Clean up test data
DELETE FROM public.submissions WHERE name LIKE 'Test%';
DELETE FROM internal.event_archive WHERE guest_name LIKE 'Test%';
```

---

## PHASE 8: Deploy to Vercel Production (HIGH - 30 minutes)

### Objective
Deploy fixed frontend to Vercel production.

### Steps

#### Step 8.1: Commit All Changes
```bash
# Check git status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix production issues - schema, API clients, env vars, frontend scripts

- Apply correct database schema to Supabase
- Remove conflicting API clients (Vercel routes, wrong Supabase client)
- Consolidate to single Supabase Edge Functions client
- Fix environment variables with correct Supabase credentials
- Fix frontend script loading order in index.html
- Deploy all 5 Supabase Edge Functions
- Set up Google Sheets webhook
- All E2E tests passing"

# Push to GitHub
git push origin main
```

#### Step 8.2: Deploy to Vercel
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Expected output:
# > Production: https://baby-shower-qr-app.vercel.app [copied]
# > Deployed in 15s
```

#### Step 8.3: Verify Production Deployment
1. Open production URL: `https://baby-shower-qr-app.vercel.app`
2. Check for errors in browser console
3. Test one submission (guestbook)
4. Verify data appears in Supabase
5. Verify data appears in Google Sheet

### Success Criteria
- ✅ Changes committed and pushed to GitHub
- ✅ Deployed to Vercel production
- ✅ Production URL loads without errors
- ✅ Test submission works in production
- ✅ Data flows to Google Sheet in production

### Rollback
```bash
# Rollback to previous commit
git revert HEAD
git push origin main

# Redeploy previous version
vercel --prod
```

---

## PHASE 9: Clean Up Legacy Files (LOW - 30 minutes)

### Objective
Remove deprecated and backup files to reduce confusion.

### Steps

#### Step 9.1: Remove Deprecated Files
```bash
# Delete API backup folder
rm -rf api_backup/

# Delete deprecated Google Script
rm backend/Code.gs.deprecated

# Delete config backup
rm scripts/config.js.backup

# Delete archive files
rm baby-shower-v2-archive-20260101.tar.gz
```

#### Step 9.2: Update .gitignore
**File:** [`.gitignore`](.gitignore:1)

**Add:**
```gitignore
# Archives
*.tar.gz
*.zip

# Deprecated files
*.deprecated
*_backup

# Backup folders
*_backup/
```

#### Step 9.3: Commit Cleanup
```bash
git add .
git commit -m "Remove deprecated and backup files"
git push origin main
```

### Success Criteria
- ✅ No deprecated files in repository
- ✅ No backup files in repository
- ✅ No archive files in repository
- ✅ `.gitignore` prevents future accumulation

### Rollback
```bash
# Restore deleted files
git checkout api_backup/
git checkout backend/Code.gs.deprecated
git checkout scripts/config.js.backup
git checkout baby-shower-v2-archive-20260101.tar.gz
```

---

## 📊 Summary

| Phase | Time | Criticality | Dependencies |
|--------|-------|-------------|---------------|
| 1. Database Setup | 60 min | 🔴 CRITICAL | None |
| 2. Fix Environment Variables | 30 min | 🔴 CRITICAL | None |
| 3. Clean Up API Clients | 60 min | 🔴 CRITICAL | Phase 2 |
| 4. Fix Frontend Scripts | 30 min | 🔴 CRITICAL | Phase 3 |
| 5. Deploy Edge Functions | 30 min | 🔴 CRITICAL | Phase 1 |
| 6. Set Up Webhook | 60 min | 🟠 HIGH | Phase 5 |
| 7. E2E Testing | 60 min | 🟠 HIGH | Phase 6 |
| 8. Deploy to Vercel | 30 min | 🟠 HIGH | Phase 7 |
| 9. Clean Up Legacy | 30 min | 🟡 LOW | Phase 8 |

**Total Time:** 6 hours  
**Critical Path:** Phases 1-5 (3.5 hours)  
**Can Ship After:** Phase 7 (5 hours)

---

## ✅ Final Success Criteria

After completing all phases:

1. ✅ **Database Schema Applied** - `public.submissions` and `internal.event_archive` exist with correct columns
2. ✅ **Trigger Working** - Insert into `public.submissions` creates row in `internal.event_archive`
3. ✅ **Edge Functions Deployed** - All 5 functions respond correctly
4. ✅ **Frontend Fixed** - Scripts load in correct order, no 404 errors
5. ✅ **Environment Variables Correct** - All APIs use valid Supabase credentials
6. ✅ **API Clients Consolidated** - Single Supabase Edge Functions client
7. ✅ **Webhook Configured** - Google Sheets receives data automatically
8. ✅ **E2E Tests Passing** - All 19 tests pass
9. ✅ **Deployed to Production** - Live on Vercel with working submissions
10. ✅ **Data Flow Verified** - User submission → Google Sheet < 2 seconds

---

## 🚀 Ready to Execute?

I'm ready to execute this plan phase by phase. Each phase will be verified before proceeding to the next.

**Shall I start with Phase 1 (Database Setup)?**

---

**Document Version:** 1.0  
**Created:** 2026-01-02  
**Status:** Ready to Execute
