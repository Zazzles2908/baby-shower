# Baby Shower QR App - Project Prompt

## Vision
Create an interactive Baby Shower web application where guests can scan a QR code to access a mobile-friendly website with multiple engagement activities during the event.

## Architecture Overview

### Frontend (Vercel Deployment)
- **URL**: https://baby-shower-qr-app.vercel.app
- **Tech Stack**: Vanilla HTML/CSS/JavaScript (no framework overhead)
- **Hosting**: Vercel (auto-deploys from GitHub repo `Zazzles2908/baby-shower`)
- **Repository**: GitHub repo connected to Vercel project linked to Michelle Huang's account

### Backend (Dual-Write Architecture)
1. **Primary**: Google Apps Script (free, unlimited for Google Sheets access)
   - Acts as the main API endpoint
   - Writes to Google Sheets (guestbook entries, predictions, quiz answers, advice)
   - Acts as proxy to Supabase for data consistency
   
2. **Secondary**: Supabase (PostgreSQL + Realtime)
   - **Project**: https://bkszmvfsfgvdwzacgmfz.supabase.co
   - **Tables**: Stored in `baby_shower` schema (private)
   - **Access**: Via RPC functions in `public` schema (PostgREST limitation workaround)
   - **Purpose**: Realtime updates, data backup, analytics

## Core Features

### 1. Guestbook (💌)
- Guest name and relationship
- Wish message for baby/parents
- Optional photo upload (stored in Google Drive)
- Data stored in Google Sheets + Supabase `baby_shower.submissions` table

### 2. Baby Pool (🎯)
- Guess baby's birth date, time, weight, length
- Leaderboard showing all predictions
- Stats showing pool participation count
- Data stored in Google Sheets + Supabase

### 3. Quiz (🧩)
- 5 puzzle questions for guests to answer
- Score calculation
- Data stored in Google Sheets + Supabase

### 4. Advice (💡)
- Guest advice categorized by type (pregnancy, parenting, labor, etc.)
- Data stored in Google Sheets + Supabase

### 5. Voting (🗳️)
- Vote on baby name suggestions
- Real-time vote counts across all connected clients
- Data stored in Google Sheets + Supabase

### 6. Gamification
- **Milestones**: Unlocks surprise animations at specific participation counts
- **Personal Progress**: Tracks individual guest's activities (localStorage)
- **Confetti**: Celebratory animations on successful submissions

## Technical Challenges & Solutions

### Challenge 1: Supabase Schema Access
**Problem**: PostgREST only exposes tables in `public` schema. Tables in `baby_shower` schema return 404.

**Solution**: Create RPC functions in `public` schema with `SECURITY DEFINER` to access `baby_shower` tables:
```sql
CREATE OR REPLACE FUNCTION insert_submission(
    p_name TEXT,
    p_activity_type TEXT,
    p_activity_data JSONB
) RETURNS void AS $$
BEGIN
    INSERT INTO baby_shower.submissions (name, activity_type, activity_data)
    VALUES (p_name, p_activity_type, p_activity_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Challenge 2: Response Structure Mismatch
**Problem**: `submitToBothBackends()` returned `{ result: 'success', results }` but `showSuccessModal()` expected `processedResponse.data.message`.

**Fix**: Updated `submitToBothBackends()` to include proper response structure:
```javascript
return { 
    result: 'success', 
    results,
    data: { message: googleSheets?.message || 'Thank you for your submission!' },
    milestones: results.googleSheets?.milestones || null
};
```

### Challenge 3: Error Handling
**Problem**: `error.message` threw "Cannot read properties of undefined (reading 'message')" when error object didn't have a `message` property.

**Fix**: Use optional chaining for safe error access:
```javascript
const message = error?.message || error?.error?.message || String(error) || 'Something went wrong';
```

### Challenge 4: Dual-Write Reliability
**Problem**: If one backend fails, entire submission fails.

**Solution**: Partial success handling - if Google Sheets succeeds, submission is considered successful even if Supabase fails:
```javascript
if (results.googleSheets || results.supabase) {
    return { result: 'success', results, data: { message: ... } };
}
throw new Error('All backends failed');
```

## Current Status

### Working ✅
- Git credentials configured (Name: Jazeel, Email: jajireen1@gmail.com)
- GitHub repo connected to Vercel (auto-deploy on push)
- Frontend error handling fixed
- Supabase RPC functions created and tested
- Google Apps Script backend with dual-write capability
- All form submissions returning success messages

### Pending ⏳
- Test guestbook submission to verify error is fixed
- Verify data appears in Supabase `baby_shower.submissions` table
- Confirm Vercel deployment completed (check URL)

## File Structure

```
c:/Project/Baby_Shower/
├── index.html              # Main HTML entry point
├── styles/
│   ├── main.css           # Core styles
│   └── animations.css     # Confetti, milestone animations
├── scripts/
│   ├── config.js          # API URLs, feature flags, milestones
│   ├── api.js             # API communication layer, dual-write logic
│   ├── main.js            # App initialization, form handlers, UI logic
│   ├── guestbook.js       # Guestbook-specific logic
│   ├── pool.js            # Baby pool logic
│   ├── quiz.js            # Quiz logic
│   ├── advice.js          # Advice logic
│   ├── voting.js          # Voting logic
│   ├── surprises.js       # Milestone/modal management
│   └── supabase-client.js # Supabase client, realtime subscriptions
├── backend/
│   ├── Code.gs            # Google Apps Script backend
│   ├── supabase-schema.sql # Database schema and RPC functions
│   └── supabase-integration.md
├── .vercelignore          # Exclude large media files from Vercel
├── DEPLOYMENT.md          # Deployment documentation
└── README.md
```

## Success Criteria

1. ✅ All Git commits use correct author (Jazeel / jajireen1@gmail.com)
2. ✅ All form submissions show success modal with message
3. ✅ Data appears in Google Sheets
4. ✅ Data appears in Supabase `baby_shower.submissions` table
5. ✅ Realtime updates work across connected clients
6. ✅ Vercel auto-deploys successfully on each push

## Next Steps for User

1. Visit https://baby-shower-qr-app.vercel.app to verify deployment
2. Test submitting a guestbook entry
3. Check Google Sheets for new entry
4. Check Supabase dashboard for new entry
5. If any issues persist, check Supabase logs via MCP tool

## Questions for Future Consideration

1. Should we add email notifications for new submissions?
2. Should we create an admin dashboard for viewing all data?
3. Should we export data to PDF/CSV for the parents?
4. Should we add a countdown timer to the event date?
5. Should we enable photo gallery view for uploaded photos?
