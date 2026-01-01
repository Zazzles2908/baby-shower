# Deployment Guide - Baby Shower API

**Last Updated**: January 1, 2025  
**Deployment Method**: GitHub Auto-Deploy (Vercel)
**Project**: [GitHub Repository](https://github.com/Zazzles2908/baby-shower)

---

## 🎯 Project Status

✅ **GitHub Connection**: Your Vercel project IS connected to GitHub  
✅ **Auto-Deploy**: Vercel automatically deploys on every `git push`  
✅ **Current Branch**: `main` (deploys to production)

**This means**: You deploy by pushing code to GitHub, NOT by drag-and-drop!

---

## 🚀 Quick Deploy (2 Steps)

### Step 1: Commit All Changes

```bash
cd /mnt/c/Project/Baby_Shower

# Add all the new files
git add .

# Commit with descriptive message
git commit -m "Add Vercel API Routes for all 5 features

- POST /api/guestbook - Guestbook with photo upload
- POST /api/pool - Baby pool predictions  
- POST /api/quiz - Emoji quiz with scoring
- POST /api/advice - Advice capsule
- POST /api/vote - Name voting
- Updated frontend to use new API endpoints
- Configured Supabase Storage for photos"
```

### Step 2: Push to GitHub

```bash
git push origin main
```

**That's it!** Vercel will automatically:
1. Detect the push
2. Start building (30-60 seconds)
3. Deploy to production
4. Send you an email when complete

---

## 📱 Monitor Deployment

### Check Progress in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on project: `baby-shower-qr-app`
3. Click "Deployments" tab
4. See your deployment building (orange indicator)
5. Wait for ✅ "Ready" status

### Check via CLI (Optional)

```bash
# Watch deployment progress
vercel --token=$VERCEL_TOKEN deploy --prod

# Or check status
vercel inspect baby-shower-qr-app
```

---

## ✅ Verify Deployment

### Test 1: Check API Health

Visit in browser or use curl:
```bash
curl https://baby-shower-qr-app.vercel.app/api
```

**Expected response:**
```json
{
  "result": "success",
  "message": "Baby Shower API is running",
  "endpoints": [
    "POST /api/guestbook",
    "POST /api/pool", 
    "POST /api/quiz",
    "POST /api/advice",
    "POST /api/vote"
  ],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Test 2: Test Guestbook Endpoint

```bash
curl -X POST https://baby-shower-qr-app.vercel.app/api/guestbook \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","relationship":"Friend","message":"Hello!"}'
```

**Expected response:**
```json
{
  "result": "success",
  "message": "Wish saved successfully!",
  "data": [...]
}
```

### Test 3: Full Browser Test

1. Open: https://baby-shower-qr-app.vercel.app
2. Try each feature
3. Verify data appears in Supabase

---

## 🔄 Making Updates (Future Changes)

**Whenever you change code:**

```bash
# Edit any file
code scripts/config.js

# Commit the change
git add scripts/config.js
git commit -m "Update baby names"

# Push to deploy automatically
git push origin main

# Vercel will auto-deploy within 1 minute
```

---

## 🆘 Troubleshooting

### Problem: Git push fails

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

### Problem: Vercel not deploying after push

1. Check Vercel dashboard → Settings → Git
   - Confirm GitHub connection is active
2. Check if deployment is paused:
   - Vercel dashboard → Deployments → Check status
3. Manually redeploy if needed:
   - Find last deployment → Click "Redeploy"

### Problem: Deployment failed

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - Build command errors
   - Missing files
3. Fix the issue → commit → push again

---

## ⚙️ Environment Variables Setup

### Check Current Environment Variables

In Vercel Dashboard:
1. Go to project → Settings → Environment Variables
2. Verify these are set:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_4_-bf5hda3a5Bb9enUmA0Q_jrKJf1K_"
SUPABASE_SERVICE_ROLE_KEY="sbp_b252cb398408d94032d11def62b6ed5b6a07bf00"
```

### Add Missing Variables

If any are missing:
1. Click "Add Environment Variable"
2. Add name, value, scope (Production)
3. Click Save
4. **CRITICAL**: Redeploy after adding variables
   - Deployments → Latest → Redeploy

---

## 📊 Deployment History

### View All Deployments

Vercel dashboard → baby-shower-qr-app → Deployments

Each deployment shows:
- Git commit message
- Commit hash
- Deploy time
- Status (Ready, Error, Building)
- Branch (main)

### Rollback if Needed

1. Find a previous working deployment
2. Click the "..." menu
3. Select "Redeploy"
4. Choose "Production" environment
5. Confirm

---

## 🎯 Verifying Deployment Success

### Check 1: Deployment Status

In Vercel dashboard:
- ✅ Ready = Success
- 🟠 Building = In progress
- ❌ Error = Failed

### Check 2: API Health

```bash
# Should return 200
curl -I https://baby-shower-qr-app.vercel.app/api

# Should return JSON
curl https://baby-shower-qr-app.vercel.app/api | jq .
```

### Check 3: Function Logs

Vercel dashboard → Functions → View logs
- Should see API requests
- No errors
- Response times < 2s

---

## 🌐 Production URL

Your app is available at:
**https://baby-shower-qr-app.vercel.app**

This URL:
- Never changes
- Always points to latest deployment
- Global CDN (fast everywhere)
- HTTPS included

---

## 🚫 What NOT To Do

❌ **Don't** manually upload files to Vercel dashboard  
❌ **Don't** disconnect GitHub integration  
❌ **Don't** change build settings (not needed for static site)  
❌ **Don't** use drag-and-drop (bypasses GitHub workflow)

---

## ✅ What TO Do

✅ **Do** commit changes regularly  
✅ **Do** push to GitHub to deploy  
✅ **Do** check deployment status after push  
✅ **Do** test after each deployment  
✅ **Do** use git for all changes

---

## 📖 Git Workflow Reminder

```bash
# Start new feature
$ git checkout -b feature/update-names

# Make changes
$ code scripts/config.js

# Stage changes
$ git add scripts/config.js

# Commit
$ git commit -m "Update baby names list"

# Push to GitHub
$ git push origin feature/update-names

# Merge to main (when ready)
$ git checkout main
$ git merge feature/update-names
$ git push origin main
# → Auto-deploys!

# Delete feature branch
$ git branch -d feature/update-names
```

---

## 🔔 Notifications

Vercel will email you when:
- Deployment starts
- Deployment succeeds
- Deployment fails

To enable:
1. Vercel dashboard → Settings → Notifications
2. Check "Deployment status"

---

## 🔐 Access Control

Your site is **public** by default (no auth required for guests).

To restrict access (not recommended for baby shower):
1. Set up Vercel Authentication in Settings
2. Or add simple password in frontend code

For your event, **public is best** - easy for guests!

---

## 🎯 Next Steps After Deployment

Once deployed:
1. Test all 5 features (see TESTING_VALIDATION_GUIDE.md)
2. Set up Google Sheets webhook (see below)
3. Test on mobile phone
4. Generate QR codes
5. Event day! 🎉

---

## 🔗 Setting Up Google Sheets Webhook

### Step 1: Create Google Apps Script

1. Go to https://script.google.com
2. Click "New Project"
3. Delete any existing code
4. Paste this code:

```javascript
// Webhook receiver for Supabase → Google Sheets
const SHEET_ID = '1so8AZUXenDuTMjgFxeT78beL8MjMMSYC';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetName = data.sheet;
    const rowData = data.data;
    
    // Get sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    
    // Get headers (first row)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].filter(h => h);
    
    // Create row array in header order
    const row = headers.map(header => rowData[header] || '');
    
    // Append row
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', message: 'Row added' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// For testing - GET request
doGet(function() {
  return ContentService
    .createTextOutput('Webhook service is running. Use POST to add data.')
    .setMimeType(ContentService.MimeType.TEXT);
});
```

5. **Important**: Save project
6. Deploy as Web App:
   - Click "Deploy" → "New deployment"
   - Select type: "Web app"
   - Description: "Supabase Webhook"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)
   - Click "Done"

### Step 2: Configure Supabase Webhook

1. Go to https://supabase.com
2. Select project: `bkszmvfsfgvdwzacgmfz`
3. Click "Database" → "Webhooks"
4. Click "Add Webhook"

**Webhook Settings:**
- **Name**: `sync_to_sheets_guestbook`
- **Table**: `baby_shower.submissions`
- **Events**: ✅ INSERT
- **Type**: HTTP Request
- **URL**: Paste your GAS Web App URL from Step 1
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (adjust for each sheet):
  ```json
  {
    "sheet": "Guestbook",
    "data": {
      "Timestamp": "{{timestamp}}",
      "Name": "{{record.name}}",
      "Relationship": "{{record.relationship}}",
      "Message": "{{record.message}}",
      "PhotoURL": "{{record.photo_url}}"
    }
  }
  ```
5. Click "Create Webhook"

### Step 3: Add Webhooks for Other Tables

Repeat Step 2 for each sheet, changing the **sheet** name and **data** fields:

**BabyPool webhook:**
```json
{
  "sheet": "BabyPool",
  "data": {
    "Timestamp": "{{timestamp}}",
    "Name": "{{record.name}}",
    "DateGuess": "{{record.date_guess}}",
    "TimeGuess": "{{record.time_guess}}",
    "WeightGuess": "{{record.weight_guess}}",
    "LengthGuess": "{{record.length_guess}}"
  }
}
```

**QuizAnswers webhook:**
```json
{
  "sheet": "QuizAnswers",
  "data": {
    "Timestamp": "{{timestamp}}",
    "Name": "{{record.name}}",
    "Puzzle1": "{{record.puzzle1}}",
    "Puzzle2": "{{record.puzzle2}}",
    "Puzzle3": "{{record.puzzle3}}",
    "Puzzle4": "{{record.puzzle4}}",
    "Puzzle5": "{{record.puzzle5}}",
    "Score": "{{record.score}}"
  }
}
```

**Advice webhook:**
```json
{
  "sheet": "Advice",
  "data": {
    "Timestamp": "{{timestamp}}",
    "Name": "{{record.name}}",
    "AdviceType": "{{record.advice_type}}",
    "Message": "{{record.message}}"
  }
}
```

**NameVotes webhook:**
```json
{
  "sheet": "NameVotes",
  "data": {
    "Timestamp": "{{timestamp}}",
    "Name": "{{record.name}}",
    "SelectedNames": "{{record.selected_names}}"
  }
}
```

### Step 4: Test Webhook

1. Deploy your app (git push if not already deployed)
2. Submit a guestbook entry
3. Check:
   - ✅ Supabase has data (immediate)
   - ✅ Google Sheets has data (within 5-10 seconds)
4. If Sheets is empty after 30 seconds, check:
   - Vercel Functions logs (for API errors)
   - Supabase webhook logs (for webhook errors)
   - Apps Script execution logs (for GAS errors)

---

## 📊 Verification After Deployment

Once deployed and webhook configured, verify:

```bash
# Quick verification commands I can run:

# 1. Check API is responding
echo "curl -s https://baby-shower-qr-app.vercel.app/api | jq '.message'"

# 2. Check Supabase has data
echo "SELECT COUNT(*) FROM baby_shower.submissions;"

# 3. Check recent submissions
echo "SELECT * FROM baby_shower.submissions ORDER BY created_at DESC LIMIT 5;"

# 4. Check storage
echo "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'guestbook-photos';"
```

---

## 🆘 Common Issues

### Issue: Deployment not triggered on push
**Solution**: Check Vercel → Settings → Git → Confirm "Automatically deploy on push" is enabled

### Issue: Build failing
**Solution**: Check build logs in Vercel dashboard → Look for missing environment variables or syntax errors

### Issue: API returns 404
**Solution**: Verify `api/` directory is in project root → Check it has 6 files (index.js, guestbook.js, etc.)

### Issue: Supabase connection refused
**Solution**: Verify environment variables in Vercel → Ensure SUPABASE_SERVICE_ROLE_KEY is correct

### Issue: Webhook not syncing to Sheets
**Solution**: 
1. Test webhook URL manually with curl
2. Check Apps Script logs for errors
3. Verify sheet names match exactly
4. Ensure sheet has correct headers in row 1

---

## 🎉 Success Indicators

When everything works:

✅ `git push` → Vercel builds → Deploys in ~60 seconds  
✅ Visit app → All features work  
✅ Submit form → Data in Supabase in < 2 seconds  
✅ Data appears in Google Sheets in < 10 seconds  
✅ Photos upload and display  
✅ Milestones trigger correctly  
✅ No errors in logs  

---

**Need help?** Check TESTING_VALIDATION_GUIDE.md for detailed validation steps!
