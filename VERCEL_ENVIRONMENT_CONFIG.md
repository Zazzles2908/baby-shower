# 🚨 CRITICAL: Environment Variables Configuration Required

**Issue:** The Baby Shower application cannot connect to Supabase because environment variables are not configured.

**Status:** Environment variables need to be configured in Vercel deployment settings.

---

## 🔧 **Required Environment Variables**

These must be configured in your Vercel project settings:

### 1. `VITE_SUPABASE_URL`
- **Value:** `https://bkszmvfsfgvdwzacgmfz.supabase.co`
- **Type:** Secret (masked)
- **Required:** ✅ Yes

### 2. `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI`
- **Type:** Secret (masked)
- **Required:** ✅ Yes

---

## 📋 **Step-by-Step Configuration**

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Or go directly to: https://vercel.com/jazeel-home/baby-shower-qr-app/settings/environment-variables

2. **Navigate to Environment Variables:**
   - Click on your project: **baby-shower-qr-app**
   - Go to **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add First Variable:**
   - **Variable name:** `VITE_SUPABASE_URL`
   - **Value:** `https://bkszmvfsfgvdwzacgmfz.supabase.co`
   - **Environment:** Select `Production` (and `Development` if you want)
   - Click **Add**

4. **Add Second Variable:**
   - **Variable name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI`
   - **Environment:** Select `Production` (and `Development` if you want)
   - Click **Add**

5. **Trigger Redeploy:**
   - Go to **Deployments** tab
   - Click the **...** menu on the latest deployment
   - Select **Redeploy**
   - Wait for deployment to complete

### Option 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd C:\Project\Baby_Shower

# Add environment variables
vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://bkszmvfsfgvdwzacgmfz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI

# Deploy with new environment variables
vercel --prod
```

### Option 3: GitHub Integration (Automatic)

If you have Vercel connected to GitHub, you can also configure environment variables through the Vercel GitHub app or by adding a `.env.local` file that Vercel will use during build.

**Note:** Vercel automatically loads variables from `.env.local` during build if it's in the project root.

---

## ✅ **Verification Steps**

After configuring environment variables, verify the fix:

### 1. **Check Browser Console:**
   - Open https://baby-shower-qr-app.vercel.app
   - Open Developer Console (F12)
   - Look for these messages:
     - ✅ `CONFIG ready! 10 names loaded`
     - ✅ `✅ Supabase connected successfully`
     - ❌ Should NOT see: `CRITICAL: Supabase environment variables not configured`

### 2. **Test Voting Feature:**
   - Click "Voting" activity card
   - Try selecting baby names
   - Should see vote counts loading without 404 errors

### 3. **Test Baby Pool Feature:**
   - Click "Baby Pool" activity card
   - Try submitting a prediction
   - Should successfully save to database

### 4. **Test Advice Feature:**
   - Click "Advice" activity card
   - Try clicking toggle buttons (Open Now vs 18th Birthday)
   - Try submitting advice
   - Should work without errors

---

## 🔍 **Troubleshooting**

### "CRITICAL: Supabase environment variables not configured"

**Cause:** Environment variables not set in Vercel.

**Solution:** Follow the configuration steps above.

### "Failed to load resource: 404" on vote counts

**Cause:** Voting Edge Function endpoint incorrect or not deployed.

**Solution:** 
1. Check Supabase Edge Functions are deployed
2. Verify the function URL matches the configuration
3. Check Supabase Dashboard for function status

### "ImageService is not defined"

**Cause:** Missing image service script.

**Solution:** This is a non-critical error. The app should still work.

### Still seeing errors after configuration

**Steps:**
1. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache:** Clear browser cache and cookies
3. **Redeploy:** Trigger a fresh deployment in Vercel
4. **Check logs:** View Vercel deployment logs for errors

---

## 📞 **Supabase Project Details**

**Project Name:** Baby  
**Project ID:** `bkszmvfsfgvdwzacgmfz`  
**Region:** us-east-1  
**Status:** ACTIVE_HEALTHY  
**Database Version:** PostgreSQL 17.6.1

**Supabase Dashboard:** https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz

---

## 🎯 **Expected Behavior After Fix**

Once environment variables are configured:

1. ✅ **No console errors** about missing Supabase configuration
2. ✅ **Voting** loads and displays vote counts correctly
3. ✅ **Baby Pool** allows predictions to be submitted
4. ✅ **Advice Capsule** toggle buttons and form work properly
5. ✅ **All 5 core features** functional and connected to database

---

## 📝 **Quick Reference Card**

**Copy and paste this to configure Vercel:**

```
VITE_SUPABASE_URL = https://bkszmvfsfgvdwzacgmfz.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI
```

**Vercel Settings URL:** https://vercel.com/jazeel-home/baby-shower-qr-app/settings/environment-variables

---

## 📚 **Related Documentation**

- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Supabase Documentation:** https://supabase.com/docs
- **Project README:** `README.md`
- **Architecture Guide:** `docs/technical/ARCHITECTURE.md`

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-04  
**Status:** Action Required - User must configure Vercel environment variables
