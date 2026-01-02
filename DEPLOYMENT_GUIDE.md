# Baby Shower App - Production Deployment Guide

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

---

## Phase 5: Supabase Storage (Optional)

### 5.1 Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. New Bucket:
   - Name: `baby-shower-assets`
   - Public bucket: Yes
3. Upload theme assets (images, CSS)

### 5.2 Storage Policies

```sql
-- Allow public read access to assets
CREATE POLICY "Public assets access" ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'baby-shower-assets' );

-- Allow authenticated uploads (admin only)
CREATE POLICY "Admin uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'baby-shower-assets' AND
    auth.role() = 'authenticated'
  );
```

---

## Phase 6: Vercel Deployment (Frontend)

### 6.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 6.2 Environment Variables in Vercel

In Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Development |

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

---

## Monitoring

### Supabase Dashboard
- Monitor query performance
- Check for RLS policy violations
- Track API request counts

### Google Sheet
- Check for missing rows (indicates webhook failure)
- Review submission timing

### Error Logs
```sql
-- Check for recent errors
SELECT * FROM internal.submission_stats
ORDER BY last_updated DESC
LIMIT 10;
```

---

## Troubleshooting

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

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Database Webhooks**: https://supabase.com/docs/guides/database/webhooks
- **Google Apps Script**: https://developers.google.com/apps-script
