# Baby Shower Interactive Web App

A fun, interactive QR-code based web app for baby showers with multiple activities and milestone surprises.

**Live Site**: https://baby-shower-qr-app.vercel.app

## Features

- **Digital Guestbook** - Leave wishes and optionally upload photos to Supabase Storage
- **Baby Pool** - Predict birth date, time, weight, and length with live stats
- **Emoji Pictionary** - Solve 5 baby-themed emoji puzzles with scoring
- **Advice Capsule** - Leave parenting advice or wishes for baby's 18th birthday
- **Name Voting** - Heart up to 3 baby names you like with real-time vote counts
- **Milestone Surprises** - Unlock fun surprises at 5, 10, 20, 25, and 50 submissions

## Technology Stack

- **Frontend**: Plain HTML/CSS/JavaScript (responsive, mobile-first)
- **Backend**: Vercel API Routes + Supabase
  - Supabase PostgreSQL (primary database)
  - Supabase Storage (photo uploads)
  - Google Sheets (automated backup via webhook)
- **Hosting**: Vercel (global edge network, including Sydney for Australian guests)

## Project Structure

```
Baby_Shower/
├── index.html              # Main application entry point
├── styles/
│   ├── main.css           # Farm theme styles (warm, rustic, earthy tones)
│   └── animations.css     # Confetti, milestone animations
├── scripts/
│   ├── config.js          # App configuration (milestones, baby names)
│   ├── api.js             # API client for Supabase
│   ├── main.js            # Core navigation and utilities
│   ├── guestbook.js       # Guestbook functionality
│   ├── pool.js            # Baby pool predictions
│   ├── quiz.js            # Emoji pictionary game
│   ├── advice.js          # Advice capsule
│   ├── voting.js          # Name voting system
│   └── surprises.js       # Milestone and celebration logic
├── backend/
│   ├── supabase-webhook/  # Google Apps Script for backup sync
│   │   └── Code.gs        # Webhook handler (deprecated GAS version archived)
│   ├── supabase-check.sql # Database validation queries
│   ├── supabase-schema.sql # Database schema for setup
│   └── supabase-integration.md # Optional dual-write guide
├── baby_content/          # Personal media (excluded from git)
└── vercel.json            # Vercel deployment configuration
```

## Quick Start Guide

### 1. Verify Supabase Configuration

The app uses Supabase as the primary backend. Ensure your Supabase project is configured:

1. Project URL and anon key in `scripts/config.js`
2. Tables created from `backend/supabase-schema.sql`
3. Storage bucket "guestbook-photos" created
4. Row Level Security (RLS) policies configured

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel --prod
```

### 3. Set Environment Variables in Vercel

In your Vercel project dashboard, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configure Google Sheets Backup (Optional)

If you want automated backup to Google Sheets:

1. Create a Google Sheet named "BabyShower2025"
2. Add tabs: `Guestbook`, `BabyPool`, `QuizAnswers`, `Advice`, `NameVotes`, `Milestones`
3. Copy `backend/supabase-webhook/Code.gs` to Google Apps Script
4. Deploy as Web App with "Anyone" access
5. Set up Supabase webhook to trigger the Google Apps Script URL

### 5. Customize Configuration

Edit `scripts/config.js`:

```javascript
// Baby names for voting
CONFIG.BABY_NAMES = ['Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella'];

// Milestone thresholds
CONFIG.MILESTONES = {
    GUESTBOOK_5: 5,
    GUESTBOOK_10: 10,
    // ... etc
};

// Quiz answers
CONFIG.QUIZ_ANSWERS = {
    puzzle1: 'Baby Shower',
    // ... etc
};
```

### 6. Generate QR Codes

1. Go to a QR code generator (e.g., https://www.qrcode-monkey.com)
2. Enter your Vercel deployment URL
3. Customize colors to match the farm theme (earthy tones)
4. Download and print for tables at the event

## Testing

### Local Testing

Open `index.html` directly in a browser. Note: API calls will only work if Supabase is configured.

### Full Test

1. Submit a guestbook entry (with and without photo)
2. Submit a baby pool prediction
3. Complete the emoji quiz
4. Submit advice
5. Vote on names (test 3-vote limit)
6. Check Supabase dashboard for data
7. Check Google Sheets (if backup is configured)

## Troubleshooting

### "Supabase URL is required"
- Ensure Supabase URL and anon key are in `scripts/config.js`
- Check that the Supabase project is active

### Photos Not Uploading
- Verify Supabase Storage bucket "guestbook-photos" exists
- Check bucket permissions (should be public for read access)
- Max file size: 5MB per photo

### Data Not Appearing in Google Sheets
- Verify webhook URL is set in Supabase
- Check Google Apps Script deployment has "Anyone" access
- Review Apps Script execution logs for errors

### Milestones Not Unlocking
- Check milestone thresholds in `scripts/config.js`
- Verify data is being saved to Supabase
- Check browser console for JavaScript errors

## Architecture Notes

### Why This Architecture?

**Supabase Primary:**
- Modern PostgreSQL database with real-time capabilities
- Built-in authentication and row-level security
- Excellent for learning modern backend development
- Handles photo storage efficiently

**Google Sheets Backup:**
- Provides familiar interface for non-technical users
- Easy data export to CSV/Excel
- Redundant backup ensures data is never lost
- Low cost (free tier is sufficient)

**Vercel Hosting:**
- Global edge network for fast load times
- Automatic HTTPS and SSL
- Git-based deployments
- Free tier adequate for event-scale traffic

### Data Flow

```
Guest submits form
    ↓
Frontend JavaScript (scripts/api.js)
    ↓
Vercel Edge Network (global CDN)
    ↓
Supabase PostgreSQL (primary storage)
    ↓
Supabase Storage (if photo uploaded)
    ↓
Supabase Webhook (async)
    ↓
Google Apps Script
    ↓
Google Sheets (backup)
```

## Performance

- **Load Time**: ~2-3 seconds on first visit
- **Image Optimization**: Automatic via Supabase CDN
- **Database**: Indexes on timestamp columns for fast queries
- **Rate Limiting**: Supabase free tier handles 50+ concurrent guests easily

## Browser Support

- Chrome 70+, Safari 12+, Firefox 65+, Edge 79+
- iOS Safari 12+, Android Chrome 70+
- No JavaScript frameworks required

## Cost

- **Supabase**: Free tier (sufficient for baby shower)
- **Vercel**: Free tier (100GB bandwidth/month)
- **Google Sheets/Drive**: Free
- **Total**: $0/month for typical usage

## Security

- No sensitive data stored (no emails, phone numbers, addresses)
- Photo uploads limited to 5MB to prevent abuse
- Supabase RLS policies prevent unauthorized access
- Public URL but not indexed by search engines

## Maintenance

Post-event, the app can be:
1. Left as-is for viewing memories
2. Exported to PDF (use browser print function)
3. Archived (download Supabase data)
4. Disabled (remove from Vercel)

## Support

For issues:
1. Check browser console for errors
2. Verify Supabase project is active
3. Review Vercel deployment logs
4. Test on multiple devices/browsers

## License

Personal use only. Not for redistribution or commercial use.
