# Google Sheets Webhook Integration - Setup Guide

## Overview
This guide details the steps to complete the Supabase → Google Sheets webhook integration for the Baby Shower app.

## Current System Status
- ✅ Database schema applied
- ✅ 5 Edge Functions deployed
- ✅ Trigger working (data migrates from `public.submissions` to `internal.event_archive`)
- ⏳ Webhook to Google Sheets NOT configured

## Architecture
```
Frontend → Edge Functions → public.submissions → internal.event_archive → Google Sheets
```

---

## Step 1: Create Google Sheet with Apps Script

### 1.1 Create New Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com)
2. Click "New" → "Google Sheets" → "Blank spreadsheet"
3. Rename the sheet to "Archive" (or any name you prefer)

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
   - **Name**: "Supabase Webhook" (or any descriptive name)
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

---

## Step 2: Create Supabase Database Webhook

### 2.1 Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) → "Sign In"
2. Navigate to project: `bkszmvfsfgvdwzacgmfz`

### 2.2 Create Webhook
1. In left sidebar: **Database** → **Webhooks**
2. Click **New Webhook**
3. Configure:
   - **Name**: "Google Sheets Webhook"
   - **Table**: `internal.event_archive`
   - **Events**: ✓ INSERT (only)
   - **Webhook URL**: Paste the Google Apps Script Web App URL
   - **HTTP Method**: POST
   - **Headers**:
     - Key: `Content-Type`
     - Value: `application/json`
4. Click **Save**

### 2.3 Verify Webhook Creation
- The webhook should appear in the list with status "Enabled"
- Click on it to see configuration details

---

## Step 3: Test the Integration

### 3.1 Test with Guestbook Submission
Submit test data via the guestbook Edge Function:

```bash
# Using curl (example)
curl -X POST 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Guest",
    "message": "Hello from webhook test!",
    "relationship": "friend"
  }'
```

### 3.2 Verify Data Flow
1. **Check Supabase**: Query `internal.event_archive` for new records
2. **Check Google Sheet**: New row should appear in the "Archive" sheet
3. **Check Columns**: Should see:
   - ID
   - Timestamp
   - Guest Name
   - Activity Type
   - Activity Data (formatted)
   - Processed Data (JSON)
   - Processing Time (ms)

### 3.3 Test All Activity Types
Submit test data for each activity:

| Activity Type | Test Data |
|---------------|-----------|
| Guestbook | `{"name":"Test","message":"Hello!","relationship":"friend"}` |
| Vote | `{"names":["Alice","Bob"],"voteCount":2}` |
| Pool | `{"name":"Test Pool","prediction":"2026-02-15","dueDate":"2026-02-15"}` |
| Quiz | `{"answers":[1,2,3],"score":3,"totalQuestions":3}` |
| Advice | `{"advice":"Test advice","category":"general"}` |

---

## Expected Webhook Payload Format

Supabase will send this JSON to your Google Apps Script:

```json
{
  "event": {
    "type": "INSERT",
    "table": "internal.event_archive",
    "record": {
      "id": 48,
      "created_at": "2026-01-02T02:59:53.94691+00",
      "guest_name": "Test Guest",
      "activity_type": "guestbook",
      "raw_data": {
        "name": "Test Guest",
        "message": "Hello from test!",
        "relationship": "friend"
      },
      "processed_data": {
        "guest_name": "Test Guest",
        "message": "Hello from test!",
        "relationship": "friend",
        "migrated_at": "2026-01-02T02:59:53.94691+00"
      },
      "processing_time_ms": 5
    }
  }
}
```

---

## Google Sheet Expected Columns

| Column | Description | Example |
|--------|-------------|---------|
| ID | Record ID from event_archive | 48 |
| Timestamp | Creation time | 2026-01-02 02:59:53 |
| Guest Name | Name from submission | Test Guest |
| Activity Type | Type of activity | guestbook |
| Activity Data | Formatted activity data | Guest: Test Guest \| Message: ... |
| Processed Data | JSON of processed data | `{"guest_name":"Test Guest",...}` |
| Processing Time (ms) | Migration time | 5 |

---

## Troubleshooting

### Webhook Not Firing
1. Check webhook is enabled in Supabase Dashboard
2. Verify URL is correct (no extra spaces)
3. Check Supabase logs: **Logs** → **API**

### Data Not Appearing in Google Sheets
1. Open Google Apps Script editor → **View** → **Logs**
2. Check for error messages
3. Run `testWebhook()` function manually to test

### Authentication Errors
1. Re-deploy the web app with updated permissions
2. Ensure "Access: Anyone, even anonymous" is selected

### Rate Limiting
- Google Apps Script has quotas (e.g., 30 executions/minute)
- For high-volume apps, consider batching

---

## Related Files
- [`backend/Code.gs`](backend/Code.gs) - Google Apps Script webhook receiver
- [`backend/supabase-production-schema.sql`](backend/supabase-production-schema.sql) - Database schema
- [`.env.local`](.env.local) - Contains SHEET_ID=`1so8AZUXenDuTMjgFxeT78beL8MjMMSYC`

---

## Notes
- The webhook fires on EVERY INSERT to `internal.event_archive`
- Each Edge Function submission triggers this flow
- Data is immutable once archived (no UPDATE/DELETE on submissions)
