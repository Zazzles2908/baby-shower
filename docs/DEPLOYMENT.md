# Baby Shower App - Complete Deployment Guide

**Last Updated**: 2026-01-02  
**Version**: 3.0 (Consolidated)  
**Status**: Production Ready

---

## Table of Contents

1. [Quick Deploy Checklist](#quick-deploy-checklist)
2. [Project Status](#project-status)
3. [Phase 1: Supabase Setup](#phase-1-supabase-setup)
4. [Phase 2: Deploy Edge Functions](#phase-2-deploy-edge-functions)
5. [Phase 3: Google Sheets Integration](#phase-3-google-sheets-integration)
6. [Phase 4: Environment Configuration](#phase-4-environment-configuration)
7. [Phase 5: Vercel Deployment](#phase-5-vercel-deployment)
8. [Automated Deployment Workflow](#automated-deployment-workflow)
9. [Testing Checklist](#testing-checklist)
10. [Rollback Procedures](#rollback-procedures)
11. [Monitoring](#monitoring)
12. [Troubleshooting](#troubleshooting)
13. [Support](#support)

---

## Quick Deploy Checklist

- [ ] Supabase project created and configured
- [ ] Database schema applied (SQL migrations)
- [ ] Edge Functions deployed
- [ ] Google Sheets webhook configured
- [ ] Environment variables set
- [ ] RLS policies verified
- [ ] Storage bucket created
- [ ] Testing complete

---

## Project Status

### Current Status

✅ **GitHub Connection**: Vercel project IS connected to GitHub  
✅ **Auto-Deploy**: Vercel automatically deploys on every `git push`  
✅ **Current Branch**: `main` (deploys to production)

**This means**: You deploy by pushing code to GitHub, NOT by drag-and-drop!

### Component Status

| Component | Platform | URL/Endpoint | Status |
|-----------|----------|--------------|--------|
| Frontend | Vercel | https://baby-shower-v2.vercel.app | ✅ Active |
| API | Supabase Edge Functions | https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/ | ✅ Active |
| Database | Supabase PostgreSQL | Project: bkszmvfsfgvdwzacgmfz | ✅ Active |
| Export | Google Sheets | Webhook Configured | ✅ Active |

---

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://dashboard.supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `baby-shower-2024`
   - Database Password: Generate strong password
   - Region: Select closest to your guests (e.g., `us-west-1` for US, `ap-southeast-2` for Sydney)
4. Wait for project initialization (~2 minutes)

### 1.2 Apply Database Schema

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of [`backend/supabase-production-schema.sql`](backend/supabase-production-schema.sql)
3. Paste and run the entire script
4. Verify in Table Editor:
   - `public.submissions` table exists
   - `internal.event_archive` table exists
   - Views are visible

### 1.3 Enable Realtime (Optional)

1. Go to Database > Replication
2. Find `public.submissions` in Sources
3. Enable replication for INSERT events

---

## Phase 2: Deploy Edge Functions

### 2.1 Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd /path/to/baby-shower
supabase link --project-ref YOUR_PROJECT_REFERENCE

# Deploy all functions
supabase functions deploy guestbook
supabase functions deploy vote
supabase functions deploy pool
supabase functions deploy quiz
supabase functions deploy advice

# Or deploy all at once
supabase functions deploy --all
```

### 2.2 Manual Deployment (Dashboard)

1. Go to Supabase Dashboard > Edge Functions
2. Create new function for each:
   - `guestbook`
   - `vote`
   - `pool`
   - `quiz`
   - `advice`
3. Copy code from [`supabase/functions/`](supabase/functions/)
4. Deploy each function

### 2.3 Environment Variables

Set these in Supabase Dashboard > Settings > Edge Functions:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your project URL (e.g., `https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (from Settings > API) |

---

## Phase 3: Google Sheets Integration

### 3.1 Create Google Sheet

1. Create new Google Sheet
2. Rename first tab to `Archive`

### 3.2 Set Up Apps Script

1. Extensions > Apps Script
2. Copy code from [`backend/Code.gs`](backend/Code.gs)
3. Save (give it a name like "Baby Shower Webhook")
4. Deploy > New deployment
5. Select type: **Web app**
6. Execute as: **Me**
7. Access: **Anyone** (required for Supabase webhooks)
8. Click **Deploy**
9. Copy the **Web App URL**

### 3.3 Configure Database Webhook

1. Go to Supabase Dashboard > Database > Webhooks
2. Create New Webhook:
   - Name: `google-sheets-export`
   - Table: `internal.event_archive`
   - Events: `INSERT`
   - URL: Your Google Apps Script Web App URL
   - HTTP Method: `POST`
   - Headers:
     - `Content-Type`: `application/json`
3. Click **Save**

### 3.4 Test the Integration

1. Submit a test entry via the app
2. Check Google Sheet for new row (may take 1-2 seconds)
3. If no row appears:
   - Check Apps Script executions (Extensions > Apps Script > Executions)
   - Verify webhook URL is correct
   - Check Supabase logs for webhook errors

---

## Phase 4: Environment Configuration

### 4.1 Frontend Environment Variables

Create `.env.local` in project root:

```env
# Supabase Configuration (required for Edge Functions)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Vercel API (fallback - optional)
VITE_VERCEL_API_URL=https://your-vercel-app.vercel.app/api
```

### 4.2 Get Supabase Credentials

1. Go to Supabase Dashboard > Settings > API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4.3 Verify Configuration

**Check Current Environment Variables**

In Vercel Dashboard:
1. Go to project → Settings → Environment Variables
2. Verify these are set:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Phase 5: Vercel Deployment

### 5.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 5.2 Environment Variables in Vercel

In Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Development |

### 5.3 Verify Production URL

Your app is available at:
**https://baby-shower-v2.vercel.app**

This URL:
- Never changes
- Always points to latest deployment
- Global CDN (fast everywhere)
- HTTPS included

---

## Automated Deployment Workflow

### Using NPM Scripts

The project includes npm scripts for common deployment operations:

```bash
# Check current git status
npm run status

# Stage all changes
npm run add

# Commit with automated conventional message
npm run commit

# Push to trigger Vercel deployment
npm run push

# Full deploy (commit + push)
npm run deploy
```

### Manual Git Commands

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(scripts): add voting functionality"

# Push to trigger deployment
git push origin main
```

### Conventional Commit Format

The automated commit script uses [Conventional Commits](https://www.conventionalcommits.org):

- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `docs(scope): description` - Documentation changes
- `test(scope): description` - Test additions/modifications
- `refactor(scope): description` - Code refactoring
- `chore(scope): description` - Maintenance tasks

### Quick Deploy (2 Steps)

**Step 1: Commit All Changes**

```bash
cd /mnt/c/Project/Baby_Shower

# Add all the new files
git add .

# Commit with descriptive message
git commit -m "Update documentation and deployment configuration"
```

**Step 2: Push to GitHub**

```bash
git push origin main
```

**That's it!** Vercel will automatically:
1. Detect the push
2. Start building (30-60 seconds)
3. Deploy to production
4. Send you an email when complete

---

## Testing Checklist

### Database Layer
- [ ] Schema applied successfully
- [ ] Triggers created on `public.submissions`
- [ ] RLS policies allow INSERT/SELECT
- [ ] Internal schema receives data from triggers
- [ ] Performance indexes created

### Edge Functions
- [ ] All 5 functions deploy without errors
- [ ] Functions respond with correct status codes
- [ ] Input validation works (test invalid data)
- [ ] Error handling returns proper messages

### Google Sheets
- [ ] Apps Script deployed as web app
- [ ] Database webhook created
- [ ] Data appears in sheet within 2 seconds
- [ ] All fields populate correctly

### Frontend
- [ ] Submissions work on mobile
- [ ] Loading states display
- [ ] Error messages show to user
- [ ] Success confirmation appears

### API Verification Commands

**Test 1: Check API Health**

```bash
curl https://baby-shower-qr-app.vercel.app/api
```

Expected response:
```json
{
  "result": "success",
  "message": "Baby Shower API is running",
  "endpoints": ["POST /api/guestbook", ...]
}
```

**Test 2: Test Guestbook Endpoint**

```bash
curl -X POST https://baby-shower-qr-app.vercel.app/api/guestbook \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","relationship":"Friend","message":"Hello from test!"}'
```

Expected response:
```json
{
  "result": "success",
  "message": "Wish saved successfully!",
  "data": [...]
}
```

**Test 3: Test Each Edge Function**

```bash
# Test guestbook function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Health Check","message":"Test","relationship":"friend"}'
```

---

## Rollback Procedures

### Supabase Functions

```bash
# List previous deployments
supabase functions list

# Rollback to previous version
supabase functions restore guestbook --version 1
```

### Database

```sql
-- Disable trigger (stops data migration)
DROP TRIGGER IF EXISTS on_submission_insert ON public.submissions;

-- Re-enable when ready
CREATE TRIGGER on_submission_insert
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION internal.handle_submission_migration();
```

### Google Sheets

- Keep previous Apps Script version
- Deploy previous version from Deployments list

### Vercel Frontend

1. Go to https://vercel.com/baby-shower-qr-app/deployments
2. Find previous successful deployment
3. Click "..." menu on that deployment
4. Select "Promote to Production"

---

## Monitoring

### Supabase Dashboard

- Monitor query performance
- Check for RLS policy violations
- Track API request counts

### Vercel Analytics

- Track page views and API calls
- Monitor function execution time
- Set up error alerting

### Google Sheet

- Check for missing rows (indicates webhook failure)
- Review submission timing
- Monitor processing time column (< 100ms expected)

### Error Logs

```sql
-- Check for recent errors
SELECT * FROM internal.submission_stats
ORDER BY last_updated DESC
LIMIT 10;
```

---

## Troubleshooting

### Git Push Fails

```bash
# If you get authentication error:
# 1. Check git remote
$ git remote -v
# Should show: https://github.com/Zazzles2908/baby-shower.git

# 2. Check credentials
$ git config --global user.email  # Should be your GitHub email

# 3. Try logging in to GitHub CLI
$ gh auth login
```

### Vercel Not Deploying

1. Check GitHub → Repository → Settings → Webhooks
2. Verify Vercel webhook is active
3. Check Vercel project settings → Git Integration

### Edge Function Errors

```
Error: Missing environment variables
→ Check Supabase Settings > Edge Functions > Environment Variables

Error: Database error
→ Verify service role key is correct
→ Check RLS policies allow INSERT
```

### Google Sheets Not Receiving Data

```
1. Check Apps Script executions log
2. Verify webhook URL is correct in Supabase
3. Ensure webhook is pointing to internal.event_archive
4. Check Google Sheet permissions
```

### Frontend 404 Errors

```
→ Verify VITE_SUPABASE_URL is correct
→ Check function names match exactly
→ Ensure functions are deployed
```

### Problem: Vote counts showing 0

**Check**: Is this happening after the 2026-01-01 bug fix deployment?
- If before fix: Expected (bug existed)
- If after fix: Check that vote was submitted with array format

```sql
-- Verify activity_type is 'voting'
SELECT activity_type, COUNT(*) 
FROM public.submissions 
WHERE activity_type = 'voting';

-- Check vote data format
SELECT activity_data->'names' 
FROM public.submissions 
WHERE activity_type = 'voting'
LIMIT 1;
```

### Problem: Pool stats not updating

**Check**: Is this happening after the 2026-01-01 bug fix deployment?
- If before fix: Expected (bug existed - activity_type was 'pool' not 'baby_pool')
- If after fix: Should work correctly now

```sql
-- Verify activity_type is 'baby_pool'
SELECT DISTINCT activity_type 
FROM public.submissions 
WHERE activity_type LIKE '%pool%';
```

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Database Webhooks**: https://supabase.com/docs/guides/database/webhooks
- **Google Apps Script**: https://developers.google.com/apps-script
- **Vercel Docs**: https://vercel.com/docs

---

**Document Version**: 3.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
