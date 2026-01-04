# 🚀 Supabase CLI Setup & Deployment Guide

## Step 1: Install Supabase CLI

```bash
# Install globally
npm install -g supabase

# Or use npx (no install needed)
npx supabase --version
```

## Step 2: Login to Supabase

```bash
# Run login command
npx supabase login

# This will:
# 1. Open a browser to supabase.com
# 2. You need to log in with your Supabase account
# 3. Generate an access token
# 4. Copy the token and paste it back in the terminal
```

**Important:** You'll need access to your Supabase account (email/password or SSO).

## Step 3: Link to Your Project

```bash
cd supabase

# Link to your project
npx supabase link --project-ref bkszmvfsfgvdwzacgmfz

# This will:
# 1. Connect to your project
# 2. Download project configuration
# 3. Set up local development environment
```

## Step 4: Deploy All Functions

```bash
# Deploy all functions at once
npx supabase functions deploy --project-ref bkszmvfsfgvdwzacgmfz

# Or deploy individual functions
npx supabase functions deploy guestbook --project-ref bkszmvfsfgvdwzacgmfz
npx supabase functions deploy vote --project-ref bkszmvfsfgvdwzacgmfz
npx supabase functions deploy pool --project-ref bkszmvfsfgvdwzacgmfz
npx supabase functions deploy quiz --project-ref bkszmvfsfgvdwzacgmfz
npx supabase functions deploy advice --project-ref bkszmvfsfgvdwzacgmfz
```

## Step 5: Verify Deployment

```bash
# List deployed functions
npx supabase functions list --project-ref bkszmvfsfgvdwzacgmfz

# Test vote function
curl -X POST "https://bkszmvfsfgvdwzacgmfz.functions.supabase.co/vote" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"selected_names": ["Test Name"]}'

# Should return: {"success":true,"data":{...}}
```

---

## Alternative: Manual Deployment via Dashboard

If you can't use the CLI:

1. Go to: https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz
2. Click **Edge Functions** in the left sidebar
3. For each of these functions:
   - `guestbook` → Click → Click **Deploy**
   - `vote` → Click → Click **Deploy**
   - `pool` → Click → Click **Deploy**
   - `quiz` → Click → Click **Deploy**
   - `advice` → Click → Click **Deploy**

---

## Troubleshooting

### "Unauthorized" Error
- Run `npx supabase login` to get a new access token
- Make sure you're logged into the correct Supabase account

### "Project not found" Error
- Verify the project ID: `bkszmvfsfgvdwzacgmfz`
- Check that the project exists in your Supabase account

### Functions still return 404 after deployment
- Wait 1-2 minutes for propagation
- Clear browser cache
- Check Supabase status at https://status.supabase.com

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npx supabase login` | Authenticate with Supabase |
| `npx supabase link --project-ref PROJECT_ID` | Link to project |
| `npx supabase functions deploy FUNCTION_NAME` | Deploy a function |
| `npx supabase functions list` | List all functions |
| `npx supabase functions delete FUNCTION_NAME` | Delete a function |

---

**Your Project ID:** `bkszmvfsfgvdwzacgmfz`  
**Functions to deploy:** guestbook, vote, pool, quiz, advice
