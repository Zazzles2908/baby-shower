# Edge Functions Environment Variables Configuration

## Summary

This document describes how to configure environment variables for Supabase Edge Functions.

**Status**: Supabase MCP doesn't support direct environment variable configuration. The following methods are available:

### Method 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd supabase
supabase link --project-ref bkszmvfsfgvdwzacgmfz

# Set environment variables using the .env file
supabase env set SUPABASE_URL "https://bkszmvfsfgvdwzacgmfz.supabase.co"
supabase env set SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
supabase env set MINIMAX_API_KEY "sk-cp-CXsYIoh2k9MIhmm4dRRCMioIKPuOLUAeWTisq2yad7C9EdYzvDWRo4pJsjyBRi85xC_UZFcBGLRGUOeQGKI-l0a8p8T8Jh0VxzHY_eLzQwEsrHjLAgG_SCI"
```

### Method 2: Supabase Dashboard (Manual)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the **Baby** project (bkszmvfsfgvdwzacgmfz)
3. Navigate to **Edge Functions** in the left sidebar
4. Click on each function and go to **Settings** → **Environment Variables**
5. Add the following variables:

#### For all Edge Functions:
| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://bkszmvfsfgvdwzacgmfz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM4MjU2MywiZXhwIjoyMDc5OTU4NTYzfQ.96o8NDg5cM8H8PRX3dVU9onPJJFGPnGGVlejcdQrNuU` |

#### For AI Roasts (advice function):
| Variable | Value |
|----------|-------|
| `MINIMAX_API_KEY` | `sk-cp-CXsYIoh2k9MIhmm4dRRCMioIKPuOLUAeWTisq2yad7C9EdYzvDWRo4pJsjyBRi85xC_UZFcBGLRGUOeQGKI-l0a8p8T8Jh0VxzHY_eLzQwEsrHjLAgG_SCI` |

### Method 3: Deploy with Environment Variables

```bash
# Deploy a specific function with environment variables
supabase functions deploy advice --project-ref bkszmvfsfgvdwzacgmfz \
  --env-vars supabase/functions/.env
```

## Environment Variables Reference

| Variable | Source | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | `.env.local` -> `NEXT_PUBLIC_SUPABASE_URL` | Supabase connection for Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` -> `SUPABASE_SERVICE_ROLE_KEY` | Admin access for database operations |
| `MINIMAX_API_KEY` | `.env.local` | AI roast generation |
| `Z_AI` | `.env.local` |备用AI API |
| `KIMI_CODING` | `.env.local` |备用AI API |
| `GOOGLE_SHEETS_ID` | `.env.local` | Google Sheets integration |

## Project Information

- **Project Name**: Baby
- **Project ID**: bkszmvfsfgvdwzacgmfz
- **Region**: us-east-1
- **Edge Functions Deployed**:
  - guestbook (v3)
  - vote (v2)
  - pool (v2)
  - quiz (v2)
  - advice (v2) - includes AI Roasts feature

## Files Generated

- [`supabase/functions/.env`](functions/.env) - Environment variables file for local development
- [`supabase/functions/advice/index.ts`](functions/advice/index.ts) - Updated with AI roast functionality

## Troubleshooting

If Edge Functions return errors about missing environment variables:

1. Verify variables are set in Supabase Dashboard
2. Redeploy the function after adding new variables
3. Check function logs in Supabase Dashboard → Edge Functions → Logs
