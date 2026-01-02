# Baby Shower Interactive Web App

A fun, interactive QR-code based web app for baby showers with multiple activities and milestone surprises.

**Live Site**: https://baby-shower-qr-app.vercel.app

## Features

- **Digital Guestbook** - Leave wishes and messages for baby (no photos)
- **Baby Pool** - Predict birth date, time, weight, and length with live stats
- **Emoji Pictionary** - Solve 5 baby-themed emoji puzzles with scoring
- **Advice Capsule** - Leave parenting advice or wishes for baby's 18th birthday
- **Name Voting** - Heart up to 3 baby names you like with real-time vote counts
- **Milestone Surprises** - Unlock fun surprises at 5, 10, 20, 25, and 50 submissions

## Technology Stack

- **Frontend**: Plain HTML/CSS/JavaScript (responsive, mobile-first)
- **Backend**: Vercel API Routes + Supabase
  - Supabase PostgreSQL (primary database)
  - Supabase Realtime (live updates)
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
│   ├── api.js             # API client for Vercel API routes
│   ├── main.js            # Core navigation and utilities
│   ├── guestbook.js       # Guestbook functionality
│   ├── pool.js            # Baby pool predictions
│   ├── quiz.js            # Emoji pictionary game
│   ├── advice.js          # Advice capsule
│   ├── voting.js          # Name voting system
│   ├── supabase-client.js # Supabase client with realtime
│   └── supabase.js        # Supabase utilities
├── api/                   # Vercel API routes (serverless)
│   ├── index.js          # Health check endpoint
│   ├── guestbook.js      # POST /api/guestbook
│   ├── pool.js           # POST /api/pool
│   ├── quiz.js           # POST /api/quiz
│   ├── advice.js         # POST /api/advice
│   └── vote.js           # POST /api/vote
├── backend/
│   ├── supabase-schema.sql     # Database schema for setup
│   ├── supabase-integration.md # Dual-write guide
│   └── supabase-check.sql      # Database validation queries
├── vercel.json            # Vercel deployment configuration
└── README.md              # This file
```

## Quick Start Guide

### 1. Verify Supabase Configuration

The app uses Supabase as the primary backend. Ensure your Supabase project is configured:

1. Project URL and anon key in environment variables
2. Tables created from `backend/supabase-schema.sql`
3. Row Level Security (RLS) policies configured

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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only
```

### 4. Customize Configuration

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
```

### 5. Generate QR Codes

1. Go to a QR code generator (e.g., https://www.qrcode-monkey.com)
2. Enter your Vercel deployment URL
3. Customize colors to match the farm theme (earthy tones)
4. Download and print for tables at the event

## Testing

### Local Testing

Open `index.html` directly in a browser. Note: API calls will only work if Supabase is configured.

### Full Test

1. Submit a guestbook entry
2. Submit a baby pool prediction
3. Complete the emoji quiz
4. Submit advice
5. Vote on names (test 3-vote limit)
6. Check Supabase dashboard for data

## Troubleshooting

### "Supabase URL is required"
- Ensure Supabase URL and anon key are in environment variables
- Check that the Supabase project is active

### Data Not Appearing
- Check browser console for JavaScript errors
- Verify Supabase project is active
- Review Vercel deployment logs

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
- Handles data storage efficiently

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
Supabase Realtime (live updates)
    ↓
All connected clients update automatically
```

## Performance

- **Load Time**: ~2-3 seconds on first visit
- **Database**: Indexes on timestamp columns for fast queries
- **Rate Limiting**: Supabase free tier handles 50+ concurrent guests easily

## Browser Support

- Chrome 70+, Safari 12+, Firefox 65+, Edge 79+
- iOS Safari 12+, Android Chrome 70+
- No JavaScript frameworks required

## Cost

- **Supabase**: Free tier (sufficient for baby shower)
- **Vercel**: Free tier (100GB bandwidth/month)
- **Total**: $0/month for typical usage

## Security

- No sensitive data stored (no emails, phone numbers, addresses)
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

---

**Last Updated**: 2026-01-01
**Version**: 2.1 - Bug fixes applied, photo upload removed
