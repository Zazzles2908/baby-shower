# Environment Variables Reference - Baby Shower App

**Last Updated**: 2026-01-02  
**Version**: 1.0  
**Purpose**: Environment variables configuration reference

---

## Table of Contents

1. [Overview](#overview)
2. [Supabase Variables](#supabase-variables)
3. [Vercel Variables](#vercel-variables)
4. [Google Sheets Variables](#google-sheets-variables)
5. [Configuration Files](#configuration-files)
6. [Security Best Practices](#security-best-practices)

---

## Overview

The Baby Shower app uses environment variables for configuration. Variables are managed in:

1. **Supabase Dashboard** - For Edge Functions
2. **Vercel Dashboard** - For frontend
3. **`.env.local`** - For local development

---

## Supabase Variables

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Project URL | Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Anonymous public key | Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Settings > API > service_role (server-side only) |

### Setting in Supabase

1. Go to Supabase Dashboard > Settings > Edge Functions
2. Add environment variables:
   - `SUPABASE_URL`: `https://bkszmvfsfgvdwzacgmfz.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Example Values

```bash
SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM4MjU2MywiZXhwIjoyMDc5OTU4NTYzfQ.96o8NDg5cM8H8PRX3dVU9onPJJFGPnGGVlejcdQrNuU"
```

---

## Vercel Variables

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Settings > API |

### Setting in Vercel

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add variables for Production, Preview, and Development:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://bkszmvfsfgvdwzacgmfz.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_VERCEL_API_URL` | Vercel API fallback | Auto-detected |

---

## Google Sheets Variables

### Required Variable

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `GOOGLE_SHEETS_WEBHOOK_URL` | Apps Script Web App URL | Google Apps Script > Deploy > Web App URL |

### Example Value

```bash
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbxagzts6q60zPuUPCQMwnkyxUZmAatsoHFh8vvHjrA__f0PBMv89QYElKHabAlxF3CH-w/exec"
```

---

## Configuration Files

### scripts/config.js

The main configuration file for the frontend:

```javascript
const CONFIG = {
    // Supabase Configuration
    SUPABASE: {
        URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        PROJECT_REF: 'bkszmvfsfgvdwzacgmfz',
        REALTIME_ENABLED: true,
        CHANNEL: 'baby-shower-updates'
    },
    
    // Baby Names for Voting
    BABY_NAMES: ['Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella'],
    
    // Milestone Thresholds
    MILESTONES: {
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
    },
    
    // API Configuration
    API_BASE_URL: window.location.origin + '/api'
};
```

### .env.local

Local development environment file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Sheets
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
GOOGLE_SHEETS_SPREADSHEET_ID="1so8AZUXenDuTMjgFxeT78beL8MjMMSYC"
```

---

## Security Best Practices

### Do ✅

- Store sensitive keys in environment variables
- Use anon key for frontend (limited permissions)
- Rotate keys if compromised
- Use different keys for development and production

### Don't ❌

- Commit `.env.local` to git
- Expose service role key to frontend
- Hardcode keys in source files
- Share keys in chat or email

### .gitignore

Ensure `.env.local` is in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development

# Never commit these
*.key
*.pem
```

---

## Verification Commands

### Check Supabase Variables

```bash
# Test API connection
curl https://bkszmvfsfgvdwzacgmfz.supabase.co

# Expected response: JSON with project info
```

### Check Vercel Variables

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Verify variables are set for all environments
3. Click "Show Values" to verify

### Test API Calls

```bash
# Test with correct anon key
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test","message":"Test","relationship":"Friend"}'
```

---

## Troubleshooting

### "Supabase URL is required"

**Cause**: Environment variable not set in Vercel

**Solution**:
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Add `VITE_SUPABASE_URL` with your Supabase project URL
3. Redeploy the project

### API calls failing with 401

**Cause**: Invalid or missing API key

**Solution**:
1. Verify `VITE_SUPABASE_ANON_KEY` is correct
2. Check key hasn't expired
3. Ensure key is set in both Supabase and Vercel

### CORS errors

**Cause**: Missing CORS headers or wrong origin

**Solution**:
1. Verify Supabase project URL matches exactly
2. Check no typos in environment variables
3. Redeploy after making changes

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
