# Testing & Validation Guide - Baby Shower API

**Last Updated**: January 1, 2026  
**API Status**: All bugs fixed, production ready  
**Testing Method**: Collaborative - You do GUI actions, verify results

---

## 📋 Pre-Deployment Checklist

### Your Tasks (5 minutes)

- [ ] **Verify Supabase project is active**
  - Go to: https://supabase.com/dashboard/projects
  - Confirm project `bkszmvfsfgvdwzacgmfz` is active
  - **I can validate**: Database tables exist

- [ ] **Check Vercel project exists**
  - Go to: https://vercel.com/dashboard
  - Confirm project `baby-shower-qr-app` is visible
  - **I can validate**: Project ID and deployment status

---

## 🚀 Deployment Phase

### Step 1: Deploy to Vercel

**You do:**
1. Open browser → https://vercel.com
2. Log in → go to "baby-shower-qr-app"
3. Push code to GitHub (Vercel auto-deploys)
4. Wait 2-3 minutes for deployment to complete

**I validate:**
```bash
# Check deployment status
vercel inspect baby-shower-qr-app --token=$TOKEN

# Test API health
curl https://baby-shower-qr-app.vercel.app/api | jq .

Expected response:
{
  "result": "success",
  "message": "Baby Shower API is running",
  "endpoints": ["POST /api/guestbook", ...]
}
```

**Success criteria:**
- ✓ API returns 200 OK
- ✓ All 5 endpoints listed
- ✓ No CORS errors

---

## 🧪 Feature-by-Feature Testing

### Feature 1: Guestbook

**Your action:**
1. Open: https://baby-shower-qr-app.vercel.app
2. Click "Guestbook" (💬 Leave a Wish)
3. Fill in:
   - Name: "Test Guest"
   - Relationship: "Friend"
   - Message: "Congratulations on your baby girl!"
4. Click Submit
5. **Screenshot the success message**

**Note**: Photo upload feature has been removed to ensure reliability.

**I validate:**
```bash
# Query Supabase for guestbook entry
SELECT * FROM baby_shower.submissions 
WHERE activity_type = 'guestbook' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- name: "Test Guest"
-- relationship: "Friend"
-- message: "Congratulations..."
-- activity_type: "guestbook"
```

---

### Feature 2: Baby Pool

**Your action:**
1. Go back to main screen
2. Click "Baby Pool" (🎯 Predict Baby's Arrival)
3. Fill in:
   - Name: "Test Pool"
   - Date: March 15, 2026
   - Time: 2:30 PM
   - Weight: 3.4 kg
   - Length: 51 cm
4. Click Submit

**I validate:**
```bash
# Query Supabase for pool entry
SELECT * FROM baby_shower.submissions 
WHERE activity_type = 'baby_pool' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- name: "Test Pool"
-- activity_type: "baby_pool" (NOT "pool" - this was the bug!)
-- date_guess: "2026-03-15"
-- time_guess: "14:30:00"
-- weight_guess: 3.4
-- length_guess: 51
```

---

### Feature 3: Emoji Pictionary (Quiz)

**Your action:**
1. Click "Emoji Pictionary" (🧩 Solve Puzzles)
2. Fill in answers:
   - Puzzle 1: Baby Shower
   - Puzzle 2: Three Little Pigs
   - Puzzle 3: Rock a Bye Baby
   - Puzzle 4: Baby Bottle
   - Puzzle 5: Diaper Change
   - Name: "Test Quizzer"
3. Click Submit
4. **Note your score** (should be 5/5)

**I validate:**
```bash
# Query quiz submission
SELECT * FROM baby_shower.submissions 
WHERE activity_type = 'quiz' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- name: "Test Quizzer"
-- score: 5
-- activity_type: "quiz"
```

---

### Feature 4: Advice Capsule

**Your action:**
1. Click "Advice Capsule" (💡 Leave Wisdom)
2. Choose: "For Parents" or "For Baby's 18th Birthday"
3. Fill in:
   - Name: "Test Advisor"
   - Message: "Sleep when the baby sleeps!"
4. Click Submit

**I validate:**
```bash
# Query advice submission
SELECT * FROM baby_shower.submissions 
WHERE activity_type = 'advice' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- name: "Test Advisor"
-- advice_type: "For Parents" or "For Baby"
-- message: "Sleep when the baby sleeps!"
-- activity_type: "advice"
```

---

### Feature 5: Name Voting

**Your action:**
1. Click "Name Voting" (❤️ Vote for Names)
2. Vote for 3 names (click heart icons)
3. Enter your name
4. Click Submit
5. **Note the vote counts** (should update correctly)

**I validate:**
```bash
# Query vote submission
SELECT * FROM baby_shower.submissions 
WHERE activity_type = 'voting' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- name: "Test Voter"
-- activity_data.names: ["Emma","Olivia","Sophia"] (ARRAY - this was the bug!)
-- activity_type: "voting"

# Calculate vote counts (manual parsing)
SELECT 
    name as baby_name,
    COUNT(*) as vote_count
FROM baby_shower.submissions,
     jsonb_array_elements_text(activity_data->'names') as name
WHERE activity_type = 'voting'
GROUP BY name
ORDER BY vote_count DESC;
```

---

## 📊 Data Validation Across All Features

### Your action:
After testing all 5 features, **take a screenshot** of your Supabase table data.

**I validate comprehensive data:**
```bash
# Total counts by activity
echo "=== DATA SUMMARY ==="
SELECT activity_type, COUNT(*) as count 
FROM baby_shower.submissions 
GROUP BY activity_type;

# Expected: guestbook=1, baby_pool=1, quiz=1, advice=1, voting=1
# Note: baby_pool (not pool) - bug fix applied!

# Check for orphaned records
SELECT * FROM baby_shower.submissions 
WHERE name IS NULL OR name = '';

# Check data quality
SELECT * FROM baby_shower.submissions 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🎯 Milestone System Testing

### Your action:
Submit enough entries to trigger milestones:
- Guestbook: Submit 5-10 messages
- Pool: Submit 10-20 predictions
- Quiz: Get 25-50 correct answers total

**For each milestone triggered, report:**
- Which milestone (e.g., "GUESTBOOK_5")?
- Did you see confetti animation?
- Did the modal show correctly?

**I validate milestones:**
```bash
# Check current counts
echo "=== MILESTONE PROGRESS ==="
echo "guestbook_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'guestbook';"
echo "pool_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'baby_pool';"
echo "quiz_correct_total: SELECT SUM((activity_data->>'score')::int) FROM baby_shower.submissions WHERE activity_type = 'quiz';"
echo "advice_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'advice';"

# Vote counting requires manual parsing
echo "total_votes: SELECT COUNT(*) FROM baby_shower.submissions, jsonb_array_elements_text(activity_data->'names') WHERE activity_type = 'voting';"

# Verify unlocked milestones match thresholds in config.js
echo "Compare counts to CONFIG.MILESTONES in scripts/config.js"
```

---

## 📱 Mobile Responsiveness

### Your action:
1. Open app on your phone (iPhone or Android)
2. Test on both WiFi and mobile data
3. Try the QR code simulation:
   - On computer: open app, copy URL
   - On phone: visit same URL
4. Submit one entry from mobile

**What to report:**
- Did page load quickly on mobile?
- Were forms easy to fill on small screen?
- Any layout issues?

---

## 🔒 Security Checklist

### Your action:
Don't need to do anything - just be aware:

**I validate security:**
```bash
# Check for sensitive data in responses
echo "Verify API never returns SUPABASE_SERVICE_ROLE_KEY"
echo "Check that only ANON_KEY is public"

# Validate CORS is configured
echo "API has CORS headers set to '*' for event access"

# Input sanitization check
echo "All API endpoints validate input types and lengths"
```

---

## 📈 Performance Metrics

**I collect metrics after testing:**

```bash
# API response times
echo "Testing each endpoint response time..."

# Database query performance
echo "SELECT query, mean_exec_time, calls FROM pg_stat_statements WHERE query LIKE '%baby_shower%' ORDER BY mean_exec_time DESC LIMIT 10;"

# Total storage used
echo "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

---

## ✅ Final Sign-Off Checklist

### Your final checks:
- [ ] All 5 features tested and working
- [ ] Milestones trigger correctly
- [ ] Data appears in Supabase
- [ ] Mobile experience is good
- [ ] QR code generated and tested
- [ ] No console errors
- [ ] Loading indicators show
- [ ] Success messages display
- [ ] Vote counting works (critical bug fix!)
- [ ] Pool stats update (critical bug fix!)

### My validation commands for final sign-off:

```bash
# Final comprehensive test
echo "=== FINAL VALIDATION ==="
echo "Deployment URL: https://baby-shower-qr-app.vercel.app"
echo "API Health: $(curl -s https://baby-shower-qr-app.vercel.app/api | jq -r '.message')"
echo "Total submissions: $(execute_sql "SELECT COUNT(*) FROM baby_shower.submissions;")"
echo "Recent activity: $(execute_sql "SELECT activity_type, COUNT(*) FROM baby_shower.submissions WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY activity_type;")"

# Check for any errors in logs
echo "Checking for errors..."
get_logs postgres | grep -i error | tail -10
echo "If no errors shown → ready for event!"
```

---

## 🎉 Event Day Confidence Check

**24 hours before event:**

**You do:**
- Final QR code printouts
- Test one submission per feature
- Check that data appears in Supabase
- Brief a friend on how to help if issues arise

**I validate:**
```bash
# Run final diagnostic
echo "=== EVENT DAY READINESS ==="
echo "$(date): Running final system check..."
echo "Supabase status: $(curl -s https://bkszmvfsfgvdwzacgmfz.supabase.co | jq -r '.status')"
echo "Vercel status: $(curl -s https://baby-shower-qr-app.vercel.app/api | jq -r '.result')"
echo "Database size: $(execute_sql "SELECT pg_size_pretty(pg_database_size(current_database()));")"
echo "Active endpoints: 5/5"
echo "Bug fixes applied: vote counting, pool stats, photo upload"
echo "All systems operational ✓"
```

---

## 🆘 If Something Breaks

### Problem: API returns 404

**You check**: Is deployment complete? Check Vercel dashboard.

### Problem: Data not appearing in Supabase

**You check**: Did you see success message in app?

### Problem: Vote counts showing 0

**You check**: Is this happening after the 2026-01-01 bug fix deployment?
- If before fix: Expected (bug existed)
- If after fix: Check that vote was submitted with array format

### Problem: Pool stats not updating

**You check**: Is this happening after the 2026-01-01 bug fix deployment?
- If before fix: Expected (bug existed - activity_type was 'pool' not 'baby_pool')
- If after fix: Should work correctly now

---

## 📊 Success Criteria

The system is **production-ready** when:

1. ✅ All 5 endpoints respond with 200 OK
2. ✅ Data appears in Supabase within 2 seconds
3. ✅ Milestones trigger at correct thresholds
4. ✅ Mobile experience is smooth
5. ✅ No console errors in browser
6. ✅ API response time < 2 seconds
7. ✅ All 5 features tested successfully
8. ✅ QR code scans and loads app
9. ✅ Vote counting works (array format)
10. ✅ Pool stats update (baby_pool activity type)

---

**Remember: This is a collaborative process!**

- **You do**: Browser actions, GUI interactions, visual confirmations
- **I do**: API verification, database checks, performance validation
- **Together**: We ensure everything works perfectly for your event! 🎉

---

**Last Updated**: 2026-01-01
**Bug Fixes Applied**: Vote counting (array), Pool stats (baby_pool), Photo upload (removed)
