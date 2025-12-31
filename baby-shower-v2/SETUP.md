# Baby Shower App v2 - Setup Guide

## Architecture Overview
**Supabase-Primary with Sheets Backup**: Frontend → Supabase → Google Sheets (automated)

---

## Step 1: Install Vercel CLI & Create Project

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to your Vercel account
vercel login

# Create new project (when prompted)
# - Link to existing GitHub repo or create new
# - Project name: baby-shower-v2
# - Framework: Next.js
```

---

## Step 2: Initialize Next.js Project

```bash
# In the baby-shower-v2 directory
npm install

# Start local dev server
npm run dev

# Test Vercel local dev (simulates production environment)
vercel dev
```

---

## Step 3: Set Up Supabase

1. **Go to Supabase dashboard**: https://app.supabase.com
2. **Create new project**: `baby-shower-2026-v2`
3. **Copy credentials** from Project Settings → API

---

## Step 4: Configure Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Google Sheets
GOOGLE_SHEETS_ID="your-sheets-id"
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Set same variables in Vercel dashboard:
```bash
# Link project
vercel link

# Pull env vars from Vercel
vercel env pull .env.local

# Or set them manually
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GOOGLE_SHEETS_ID production
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production
```

---

## Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Or link GitHub for auto-deploy on push
# Go to Vercel dashboard → Project → Git → Connect GitHub
```

---

## Testing Local Development

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Vercel dev (simulates production)
vercel dev

# Your app will be at: http://localhost:3000
# API routes at: http://localhost:3000/api/*
```

---

## Troubleshooting

**If `vercel dev` doesn't work:**
```bash
# Install dependencies first
npm install

# Try again
vercel dev --debug
```

**If environment variables aren't loading:**
```bash
# Pull from Vercel
vercel env pull .env.local

# Or manually create .env.local file
```

**If Supabase connection fails:**
- Check URL and keys in Supabase dashboard
- Ensure Row Level Security (RLS) policies allow inserts
- Check network tab for CORS errors