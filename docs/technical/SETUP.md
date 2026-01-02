# Initial Setup Guide - Baby Shower App

**Last Updated**: 2026-01-02  
**Version**: 1.0  
**Purpose**: Initial setup instructions for the Baby Shower application

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Google Sheets Integration](#google-sheets-integration)
4. [Environment Variables](#environment-variables)
5. [Supabase Storage](#supabase-storage)
6. [Initial Configuration](#initial-configuration)
7. [QR Code Generation](#qr-code-generation)
8. [Verification](#verification)

---

## Prerequisites

Before starting, ensure you have:

- Node.js >= 18.0.0
- Git configured with remote repository
- Vercel CLI (`npm i -g vercel`) or web dashboard access
- GitHub personal access token (for MCP operations)
- Supabase account

---

## Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://dashboard.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `baby-shower-2024`
   - **Database Password**: Generate strong password
   - **Region**: Select closest to your guests
     - `ap-southeast-2` for Sydney/Australian guests
     - `us-west-1` for US guests
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

## Google Sheets Integration

### 1.1 Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click "New" → "Google Sheets" → "Blank spreadsheet"
3. Rename the sheet to "Archive"

### 1.2 Open Apps Script Editor

1. In the Google Sheet, go to **Extensions** → **Apps Script**
2. This opens the Google Apps Script editor in a new tab

### 1.3 Paste the Webhook Code

1. Copy the contents of [`backend/Code.gs`](backend/Code.gs)
2. Paste it into the Apps Script editor (replacing any existing code)
3. Click the disk icon or press `Ctrl+S` to save

### 1.4 Deploy as Web App

1. Click the **Deploy** button (top right) → **New deployment**
2. Click the gear icon next to "Select type" → **Web app**
3. Configure:
   - **Name**: "Supabase Webhook"
   - **Description**: Version 1.0
   - **Execute as**: Me (your Google account)
   - **Access**: Anyone, even anonymous (REQUIRED for Supabase webhooks)
4. Click **Deploy**
5. Copy the **Web App URL** (format: `https://script.google.com/macros/s/.../exec`)
6. Click "Done"

### 1.5 Authorize the Script

- First-time deployment requires authorization
- Click "Authorize access" → select your Google account
- Click "Advanced" → "Go to (Script Name) (unsafe)" → "Done"
- This is safe - it's your own script

### 1.6 Create Supabase Database Webhook

1. Go to [supabase.com](https://supabase.com) → "Sign In"
2. Navigate to project: `bkszmvfsfgvdwzacgmfz`
3. In left sidebar: **Database** → **Webhooks**
4. Click **New Webhook**
5. Configure:
   - **Name**: "Google Sheets Webhook"
   - **Table**: `internal.event_archive`
   - **Events**: ✓ INSERT (only)
   - **Webhook URL**: Paste the Google Apps Script Web App URL
   - **HTTP Method**: POST
   - **Headers**:
     - Key: `Content-Type`
     - Value: `application/json`
6. Click **Save**

---

## Environment Variables

### Frontend Environment Variables

Create `.env.local` in project root:

```env
# Supabase Configuration (required for Edge Functions)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Vercel API (fallback - optional)
VITE_VERCEL_API_URL=https://your-vercel-app.vercel.app/api

# Google Sheets Webhook (for data export)
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

### Get Supabase Credentials

1. Go to Supabase Dashboard > Settings > API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Vercel Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Development |

---

## Supabase Storage

### Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. New Bucket:
   - Name: `baby-shower-assets`
   - Public bucket: Yes
3. Upload theme assets (images, CSS)

### Storage Policies

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

## Initial Configuration

### Customize Configuration

Edit [`scripts/config.js`](scripts/config.js):

```javascript
// Baby names for voting
CONFIG.BABY_NAMES = ['Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella'];

// Milestone thresholds
CONFIG.MILESTONES = {
    GUESTBOOK_5: 5,
    GUESTBOOK_10: 10,
    GUESTBOOK_20: 20,
    POOL_10: 10,
    POOL_20: 20,
    QUIZ_25: 25,
    QUIZ_50: 50,
    ADVICE_10: 10,
    ADVICE_20: 20,
    VOTES_50: 50
};
```

### Milestone Configuration

The app includes milestone celebrations at specific thresholds:

| Milestone | Threshold | Description |
|-----------|-----------|-------------|
| `GUESTBOOK_5` | 5 guestbook entries | First milestone |
| `GUESTBOOK_10` | 10 guestbook entries | Second milestone |
| `GUESTBOOK_20` | 20 guestbook entries | Third milestone |
| `POOL_10` | 10 pool predictions | Pool milestone |
| `POOL_20` | 20 pool predictions | Pool milestone 2 |
| `QUIZ_25` | 25 correct quiz answers | Quiz milestone |
| `QUIZ_50` | 50 correct quiz answers | Quiz milestone 2 |
| `ADVICE_10` | 10 advice entries | Advice milestone |
| `ADVICE_20` | 20 advice entries | Advice milestone 2 |
| `VOTES_50` | 50 total votes | Voting milestone |

---

## QR Code Generation

1. Go to a QR code generator (e.g., https://www.qrcode-monkey.com)
2. Enter your Vercel deployment URL: `https://baby-shower-qr-app.vercel.app`
3. Customize colors to match the farm theme (earthy tones):
   - Primary: #8B4513 (Saddle Brown)
   - Secondary: #D2691E (Chocolate)
   - Accent: #FFA500 (Orange)
4. Download and print for tables at the event

**QR Code Best Practices**:
- Size: At least 2x2 inches for easy scanning
- Color contrast: Ensure dark QR code on light background
- Error correction: Set to High (30%) for better scanning
- Test: Scan with phone camera before printing

---

## Verification

### Quick Verification Checklist

- [ ] Supabase project created and configured
- [ ] Database schema applied successfully
- [ ] All tables and views exist
- [ ] Triggers created on `public.submissions`
- [ ] RLS policies configured
- [ ] Google Sheet created and Apps Script deployed
- [ ] Database webhook created in Supabase
- [ ] Environment variables set in Vercel
- [ ] Frontend configuration updated
- [ ] QR codes generated and tested

### Test Data Submission

After setup, test with a sample submission:

```bash
# Test guestbook submission
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Setup Test","message":"Testing setup completed!","relationship":"Developer"}'
```

### Verify Data Flow

1. **Check Supabase**: Query `public.submissions` for new record
2. **Check Internal Archive**: Verify trigger created record in `internal.event_archive`
3. **Check Google Sheet**: New row should appear in "Archive" tab

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Google Apps Script**: https://developers.google.com/apps-script
- **Vercel Docs**: https://vercel.com/docs

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
