# Baby Shower App v2.0 - Supabase Primary Architecture

**Architecture**: Supabase (primary) → Webhook → Edge Function → Google Sheets (backup)

**Uses Existing Supabase Project**: `bkszmvfsfgvdwzacgmfz` (no new project needed)

## Stack
- **Frontend**: Next.js 14 (Pages Router)
- **Backend**: Vercel API Routes + Supabase
- **Storage**: Existing Supabase PostgreSQL (primary), Google Sheets (automated backup)
- **Hosting**: Vercel

## Data Flow
1. User submits form → Frontend calls Vercel API route
2. API route inserts directly to Supabase `baby_shower.submissions` table → Returns success
3. Supabase Webhook triggers Edge Function (on INSERT)
4. Edge Function syncs data to Google Sheets (read-only backup)

## Project Structure
```
├── app/
│   ├── api/           # API routes (replaces GAS)
│   ├── components/    # React components
│   ├── lib/          # Supabase client, utils
│   └── pages/        # Next.js pages
├── supabase/
│   └── functions/    # Edge Functions
├── vercel.json       # Vercel config
└── .env.local        # Local environment variables
```

## Development Setup

### Prerequisites
- Node.js 18+
- Vercel CLI: `npm i -g vercel`
- Supabase account with Pro plan

### Setup Steps
1. `git clone <repo>`
2. `cd baby-shower-v2`
3. `npm install`
4. `vercel link` (connect to Vercel project)
5. Copy `.env.local.example` to `.env.local`
6. Fill in Supabase credentials
7. `npm run dev`

### Deploy to Production
```bash
vercel --prod
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GOOGLE_SHEETS_ID=your-sheets-id
GOOGLE_SERVICE_ACCOUNT_JSON=your-service-account-json
```

## Features
- ✅ Guestbook with real-time updates
- ✅ Baby pool predictions
- ✅ Baby name voting
- ✅ Advice submission
- ✅ Quiz with scoring
- ✅ Photo uploads to Supabase storage
- ✅ Automated backup to Google Sheets
- ✅ Milestone celebrations
- ✅ Real-time stats via WebSockets