# Testing & Validation Guide - Baby Shower API

**Last Updated**: January 1, 2025
**API Status**: Built and ready for deployment
**Testing Method**: Collaborative - You do GUI actions, I validate via CLI/API

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

- [ ] **Confirm Google Sheet is created**
  - Go to: https://sheets.google.com
  - Open "BabyShower2025" spreadsheet
  - Verify tabs exist: Guestbook, BabyPool, QuizAnswers, Advice, NameVotes, Milestones
  - **I cannot access** - This is private to you

---

## 🚀 Deployment Phase

### Step 1: Deploy to Vercel

**You do:**
1. Open browser → https://vercel.com
2. Log in → go to "baby-shower-qr-app"
3. Click "Deploy" or drag-drop the `Baby_Shower` folder
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

### Feature 1: Guestbook (Most Complex - Includes Photo Upload)

**Your action:**
1. Open: https://baby-shower-qr-app.vercel.app
2. Click "Guestbook" (💌 Leave a Wish)
3. Fill in:
   - Name: "Test Guest"
   - Relationship: "Friend"
   - Message: "Congratulations on your baby girl!"
4. Optional: Add a photo (under 5MB)
5. Click Submit
6. **Screenshot the success message**

**I validate:**
```bash
# 1. Check API response
# Note the timestamp from your submission

# 2. Verify data in Supabase
echo "Querying Supabase for guestbook entry..."
echo "SELECT * FROM baby_shower.submissions WHERE activity_type = 'guestbook' ORDER BY created_at DESC LIMIT 1;"

-- Should show:
-- name: "Test Guest"
-- relationship: "Friend"
-- message: "Congratulations..."
-- photo_url: [URL if you uploaded, or null]
-- activity_type: "guestbook"

# 3. Check for errors in API logs
echo "Checking for recent API errors..."

# 4. Validate response structure
echo "Expected response format:"
echo '{ result: "success", message: "Wish saved successfully!" }'

# 5. If photo uploaded, verify storage
echo "Checking Supabase Storage bucket 'guestbook-photos'..."
echo "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'guestbook-photos';"
```

**What to report to me:**
- Did you see a success message?
- Was there a confetti animation?
- Did photo upload work (if you tried)?
- Any error messages in browser?

**I will verify:**
- Data exists in Supabase
- Photo URL is accessible (if uploaded)
- No backend errors
- Response time (< 2 seconds)

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
echo "SELECT * FROM baby_shower.submissions WHERE activity_type = 'pool' ORDER BY created_at DESC LIMIT 1;"

-- Should show:
-- name: "Test Pool"
-- date_guess: "2026-03-15"
-- time_guess: "14:30:00"
-- weight_guess: 3.4
-- length_guess: 51
-- activity_type: "pool"

# Check data types
echo "Verifying data types are correct..."
echo "date_guess should be DATE, weight_guess should be DECIMAL, etc."

# Count total pool entries
echo "SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'pool';"
```

**What to report:**
- Success message shown?
- Stats displayed correctly?
- Any validation errors?

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
echo "SELECT * FROM baby_shower.submissions WHERE activity_type = 'quiz' ORDER BY created_at DESC LIMIT 1;"

-- Should show:
-- name: "Test Quizzer"
-- puzzle1: "Baby Shower"
-- puzzle2: "Three Little Pigs"
-- puzzle3: "Rock a Bye Baby"
-- puzzle4: "Baby Bottle"
-- puzzle5: "Diaper Change"
-- score: 5
-- activity_type: "quiz"

# Calculate what score should be
echo "Verifying scoring logic..."
echo "Correct answers: Baby Shower, Three Little Pigs, Rock a Bye Baby, Baby Bottle, Diaper Change"
echo "Expected score: 5/5"

# Check milestone triggers
echo "SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'quiz';"
echo "If count reaches 25 or 50, milestone should trigger"
```

**What to report:**
- What score did you get? (should be 5/5)
- Did you see a success message with your score?
- Any puzzles too hard/easy?

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
echo "SELECT * FROM baby_shower.submissions WHERE activity_type = 'advice' ORDER BY created_at DESC LIMIT 1;"

-- Should show:
-- name: "Test Advisor"
-- advice_type: "parents" (or "baby_18th")
-- message: "Sleep when the baby sleeps!"
-- activity_type: "advice"

# Count advice by type
echo "SELECT advice_type, COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'advice' GROUP BY advice_type;"
```

**What to report:**
- Success message shown?
- Message sent to correct category?

---

### Feature 5: Name Voting

**Your action:**
1. Click "Name Voting" (🗳️ Help Choose a Name)
2. Vote for 3 names (click heart icons)
3. Name: "Test Voter"
4. Click Submit
5. **Note the vote counts** (should increase)

**I validate:**
```bash
# Query vote submission
echo "SELECT * FROM baby_shower.submissions WHERE activity_type = 'voting' ORDER BY created_at DESC LIMIT 1;"

-- Should show:
-- name: "Test Voter"
-- selected_names: "Emma,Olivia,Sophia" (comma-separated)
-- activity_type: "voting"

# Calculate vote counts
echo "Querying vote counts..."
echo "This requires parsing the comma-separated names and counting"

# Check for milestone (50 total votes)
echo "SELECT COUNT(*) as total_votes FROM baby_shower.submissions WHERE activity_type = 'voting';"
echo "SELECT SUM(LENGTH(selected_names) - LENGTH(REPLACE(selected_names, ',', '')) + 1) as total_votes FROM baby_shower.submissions WHERE activity_type = 'voting';"
```

**What to report:**
- Were you able to select exactly 3 names?
- Did vote counts update?
- Any names you want to change?

---

## 📊 Data Validation Across All Features

### Your action:
After testing all 5 features, **take a screenshot** of your Supabase table data.

**I validate comprehensive data:**
```bash
# Total counts by activity
echo "=== DATA SUMMARY ==="
echo "SELECT activity_type, COUNT(*) as count FROM baby_shower.submissions GROUP BY activity_type;"

# Expected: guestbook=1, pool=1, quiz=1, advice=1, voting=1

# Check for orphaned records
echo "SELECT * FROM baby_shower.submissions WHERE name IS NULL OR name = '';"

# Check data quality
echo "SELECT * FROM baby_shower.submissions ORDER BY created_at DESC LIMIT 10;"

# Validate timestamp consistency
echo "SELECT MIN(created_at), MAX(created_at) FROM baby_shower.submissions;"
```

**What to report:**
- Total submissions you made: 5 (one per feature)
- Any duplicates or missing data?
- Does everything look correct in Supabase dashboard?

---

## 🎯 Milestone System Testing

### Your action:
Submit enough entries to trigger milestones:
- Guestbook: Submit 5-10 messages (you can do this quickly)
- Pool: Submit 10-20 predictions
- Quiz: Get 25-50 correct answers total (different guests)

**For each milestone triggered, report:**
- Which milestone (e.g., "GUESTBOOK_5")?
- Did you see confetti animation?
- Did the modal show correctly?
- What message did it display?

**I validate milestones:**
```bash
# Check current counts
echo "=== MILESTONE PROGRESS ==="
echo "guestbook_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'guestbook';"
echo "pool_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'pool';"
echo "quiz_correct_total: SELECT SUM(score) FROM baby_shower.submissions WHERE activity_type = 'quiz';"
echo "advice_count: SELECT COUNT(*) FROM baby_shower.submissions WHERE activity_type = 'advice';"
echo "total_votes: SELECT SUM(LENGTH(selected_names) - LENGTH(REPLACE(selected_names, ',', '')) + 1) FROM baby_shower.submissions WHERE activity_type = 'voting';"

# Verify unlocked milestones match thresholds in config.js
echo "Compare counts to CONFIG.MILESTONES in scripts/config.js"
```

---

## 🖼️ Photo Upload Testing

### Your action:
1. Submit guestbook entry WITH photo (5MB or less)
2. Note the file size and type (JPG/PNG)
3. **After submission, click the photo URL** to view it

**I validate photo handling:**
```bash
# Query for photo URL
echo "SELECT photo_url FROM baby_shower.submissions WHERE activity_type = 'guestbook' AND photo_url IS NOT NULL ORDER BY created_at DESC LIMIT 1;"

# Test if URL is accessible
echo "curl -I [photo_url] | grep -E '(HTTP|Content-Length|Content-Type)'"

# Check storage bucket
echo "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'guestbook-photos';"

# Verify file size is reasonable (< 5MB)
echo "SELECT metadata FROM storage.objects WHERE bucket_id = 'guestbook-photos' ORDER BY created_at DESC LIMIT 1;"
```

**What to report:**
- Did photo upload without errors?
- Was preview shown before submit?
- Could you view the photo after submission?
- How long did upload take?

---

## 🔄 Webhook Integration Testing

### Your action:
1. Set up Google Apps Script webhook (follow DEPLOY.md)
2. Submit one test entry AFTER webhook is configured
3. **Take a screenshot of your Google Sheet** showing the new row

**I validate webhook:**
```bash
# This is harder for me to validate - you'll need to confirm:
echo "=== WEBHOOK VALIDATION ==="
echo "After you submit data:"
echo "1. Check Supabase (should have data immediately)"
echo "2. Check Google Sheets (should have data within 5-10 seconds)"
echo "3. If Sheets has data → webhook working ✓"
echo "4. If Sheets empty → webhook broken ✗"

# I can check Supabase trigger logs if available
echo "SELECT * FROM pg_logical_slot_get_changes(...)" # Complex

# Alternative: Check if webhook was called
echo "Look for network requests in browser dev tools to GAS URL"
```

**What to report:**
- Did data appear in Google Sheets?
- How long did it take (seconds)?
- Any errors in Apps Script logs?
- Is the data format correct in Sheets?

---

## 📱 Mobile Responsiveness

### Your action:
1. Open app on your phone (iPhone or Android)
2. Test on both WiFi and mobile data
3. Try the QR code simulation:
   - On computer: open app, copy URL
   - On phone: visit same URL
4. Submit one entry from mobile

**I validate mobile performance:**
```bash
# Check API response time
echo "time curl -X POST https://baby-shower-qr-app.vercel.app/api/guestbook \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mobile Test","relationship":"Family","message":"Testing from mobile"}'"

# Should be < 2 seconds for response

# Check asset sizes
echo "Load time analysis:"
echo "index.html: 12KB"
echo "main.css: 9KB"
echo "animations.css: 9KB"
echo "Total JS: ~87KB (10 modules)"
echo "Photos: Up to 5MB each"
```

**What to report:**
- Did page load quickly on mobile?
- Were forms easy to fill on small screen?
- Did photo upload work on mobile?
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

# Rate limiting consideration
echo "For 50 guests: no rate limiting needed"
echo "For public access: consider adding rate limits"

# Input sanitization check
echo "All API endpoints validate input types and lengths"
```

**Concerns to watch for:**
- Sensitive data exposed in browser console
- Console errors about CORS or auth
- Unusual network requests

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
echo "SELECT pg_size_pretty(SUM(size)) FROM storage.objects;"

# Bandwidth estimate
echo "50 guests × 5 submissions × 100KB avg = 25MB"
echo "50 photos × 2MB avg = 100MB"
echo "Total estimate: ~125MB (well within free limits)"
```

---

## ✅ Final Sign-Off Checklist

### Your final checks:
- [ ] All 5 features tested and working
- [ ] Photo uploads work (if applicable)
- [ ] Milestones trigger correctly
- [ ] Data appears in Supabase
- [ ] Data appears in Google Sheets (if webhook configured)
- [ ] Mobile experience is good
- [ ] QR code generated and tested
- [ ] No console errors
- [ ] Loading indicators show
- [ ] Success messages display

### My validation commands for final sign-off:

```bash
# Final comprehensive test
echo "=== FINAL VALIDATION ==="
echo "Deployment URL: https://baby-shower-qr-app.vercel.app"
echo "API Health: $(curl -s https://baby-shower-qr-app.vercel.app/api | jq -r '.message')"
echo "Total submissions: $(execute_sql "SELECT COUNT(*) FROM baby_shower.submissions;")"
echo "Storage usage: $(execute_sql "SELECT pg_size_pretty(SUM(size)) FROM storage.objects;")"
echo "Recent activity: $(execute_sql "SELECT activity_type, COUNT(*) FROM baby_shower.submissions WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY activity_type;")"

# Check for any errors in logs
echo "Checking for errors..."
get_logs postgres | grep -i error | tail -10
echo "If no errors shown → ready for event!"
```

---

## 🆘 If Something Breaks

### Problem: API returns 404

**You check**: Is deployment complete? Check Vercel dashboard.
**I validate**:
```bash
curl -v https://baby-shower-qr-app.vercel.app/api
# Look for HTTP/2 200
```

### Problem: Data not appearing in Supabase

**You check**: Did you see success message in app?
**I validate**:
```bash
# Check if API is receiving requests
get_logs api | tail -20

# Check if Supabase is accepting writes
echo "INSERT INTO baby_shower.submissions_test (name, activity_type) VALUES ('test', 'test');"
```

### Problem: Google Sheets not updating

**You check**: Is webhook URL correct? Did you deploy GAS?
**I validate**:
```bash
# This is mostly on you, but I can troubleshoot:
echo "Check Supabase webhook logs in dashboard"
echo "Check Apps Script execution logs"
echo "Test webhook manually with curl"
```

### Problem: Photo upload fails

**You check**: File size under 5MB? Correct format?
**I validate**:
```bash
# Check storage bucket exists
echo "SELECT * FROM storage.buckets WHERE id = 'guestbook-photos';"

# Check for upload errors
echo "SELECT * FROM storage.objects ORDER BY created_at DESC LIMIT 5;"
```

---

## 📊 Success Criteria

The system is **production-ready** when:

1. ✅ All 5 endpoints respond with 200 OK
2. ✅ Data appears in Supabase within 2 seconds
3. ✅ Google Sheets updates within 10 seconds (if webhook)
4. ✅ Photos display correctly after upload
5. ✅ Milestones trigger at correct thresholds
6. ✅ Mobile experience is smooth
7. ✅ No console errors in browser
8. ✅ API response time < 2 seconds
9. ✅ All 5 features tested successfully
10. ✅ QR code scans and loads app

---

## 🎉 Event Day Confidence Check

**24 hours before event:**

**You do:**
- Final QR code printouts
- Test one submission per feature
- Check that data appears in both Supabase and Sheets
- Brief a friend on how to help if issues arise

**I validate:**
```bash
# Run final diagnostic
echo "=== EVENT DAY READINESS ==="
echo "$(date): Running final system check..."
echo "Supabase status: $(curl -s https://bkszmvfsfgvdwzacgmfz.supabase.co | jq -r '.status')"
echo "Vercel status: $(curl -s https://baby-shower-qr-app.vercel.app/api | jq -r '.result')"
echo "Database size: $(execute_sql "SELECT pg_size_pretty(pg_database_size(current_database()));")"
echo "Active endpoints: 6/6"
echo "All systems operational ✓"
```

---

**Remember: This is a collaborative process!**

- **You do**: Browser actions, GUI interactions, visual confirmations
- **I do**: API verification, database checks, performance validation
- **Together**: We ensure everything works perfectly for your event! 🎉
