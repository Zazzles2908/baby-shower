# Deployment Guide - Baby Shower API

**Last Updated**: January 1, 2026  
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
git commit -m "Fix critical bugs for baby shower event

- Fix vote counting (store names as array instead of string)
- Fix pool stats (activity_type: 'baby_pool' to match client)
- Remove incomplete photo upload feature
- Update documentation (ARCHITECTURE.md, PLANS.md, README.md)
- Add input validation (maxlength attributes)"
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
  "timestamp": "2026-01-01T22:00:00.000Z"
}
```

### Test 2: Test Guestbook Endpoint

```bash
curl -X POST https://baby-shower-qr-app.vercel.app/api/guestbook \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","relationship":"Friend","message":"Hello from test!"}'
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
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM4MjU2MywiZXhwIjoyMDc5OTU4NTYzfQ.96o8NDg5cM8H8PRX3dVU9onPJJFGPnGGVlejcdQrNuU"
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

## 🎯 Next Steps After Deployment

Once deployed:
1. Test all 5 features
2. Test on mobile phone
3. Generate QR codes
4. Event day! 🎉

---

## ✅ Success Indicators

When everything works:

✅ `git push` → Vercel builds → Deploys in ~60 seconds  
✅ Visit app → All features work  
✅ Submit form → Data in Supabase in < 2 seconds  
✅ Milestones trigger correctly  
✅ No errors in logs  
✅ Vote counting works correctly (names stored as array)  
✅ Pool stats update correctly (activity_type: 'baby_pool')  

---

**Need help?** Check PLANS.md for feature status or ARCHITECTURE.md for system design.
