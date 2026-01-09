# Baby Shower App - Comprehensive E2E Testing Todo List

**Created:** 2026-01-09  
**Status:** Ready for Execution  
**Testing Framework:** Playwright with cross-browser support

---

## Executive Summary

This document provides a comprehensive, executable todo list for end-to-end testing of the Baby Shower application. The testing plan covers 7 core components (excluding Mom vs Dad Game which is on T-2 HOLD), with focus on critical user flows, edge cases, and integration points.

---

## Phase 0: Pre-Test Setup and Validation

### 0.1 Environment Configuration
- [ ] **Task:** Verify all environment variables are set in `.env.local`
  - **File:** `.env.local`
  - **Check:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - **Success Criteria:** All required env vars exist and are non-empty
- [ ] **Task:** Verify API keys for AI services
  - **Check:** `MINIMAX_API_KEY` for AI roasts in Pool and Advice
  - **Success Criteria:** API key is valid and has available credits
- [ ] **Task:** Run environment injection script
  - **Command:** `npm run inject:env`
  - **Success Criteria:** `inject-env.js` runs without errors

### 0.2 Infrastructure Verification
- [ ] **Task:** Verify local development server works
  - **Command:** `npm run dev &` (background)
  - **URL:** http://localhost:3000
  - **Success Criteria:** Server starts and serves index.html
- [ ] **Task:** Verify Supabase project is accessible
  - **Command:** Check project URL in browser
  - **Success Criteria:** Supabase dashboard loads correctly
- [ ] **Task:** Verify all Edge Functions are deployed
  - **Check:** Supabase Dashboard → Edge Functions
  - **Functions:** `guestbook`, `vote`, `pool`, `quiz`, `advice`, `game-session`, `game-scenario`, `game-vote`, `game-reveal`
  - **Success Criteria:** All 9 functions listed and active

### 0.3 Test Data Setup
- [ ] **Task:** Generate test data for isolation
  - **Command:** `npm run test:generate`
  - **Output:** `tests/e2e/fixtures/valid-test-data.json`
  - **Success Criteria:** Unique test data generated with timestamps
- [ ] **Task:** Verify test data generator functions
  - **Check:** `tests/e2e/data-generator.js` exports
  - **Functions:** `generateGuestbookData`, `generateVoteData`, `generatePoolData`, `generateQuizData`, `generateAdviceData`
  - **Success Criteria:** All functions export correctly and produce valid data

### 0.4 Browser Setup
- [ ] **Task:** Install Playwright browsers
  - **Command:** `npm run test:install`
  - **Browsers:** Chromium, Firefox, WebKit
  - **Success Criteria:** All 3 browsers installed without errors
- [ ] **Task:** Verify mobile browser emulators
  - **Check:** Playwright config includes `mobile-chrome` and `mobile-safari`
  - **Success Criteria:** Mobile profiles configured correctly

### 0.5 Database Prep
- [ ] **Task:** Clear previous test data
  - **Command:** `supabase_execute_sql` with cleanup queries
  - **Tables:** `baby_shower.guestbook`, `baby_shower.votes`, `baby_shower.pool_predictions`, `baby_shower.quiz_results`, `baby_shower.advice`
  - **Success Criteria:** Old test data removed (use `test_e2e_` prefix filter)
- [ ] **Task:** Verify database schema
  - **Command:** `supabase_list_tables` for `baby_shower` schema
  - **Success Criteria:** All expected tables exist with correct structure

---

## Phase 1: Landing Page Tests

### 1.1 Initial Load Tests
- [ ] **Task:** Verify page loads without console errors
  - **Test File:** `tests/e2e/baby-shower.test.js`
  - **Test:** `App loads without errors`
  - **Success Criteria:** Page title contains "Baby Shower", no critical console errors
- [ ] **Task:** Verify main container renders
  - **Selector:** `#app, .app, main`
  - **Success Criteria:** Main container visible within 5 seconds
- [ ] **Task:** Verify character/welcome section displays
  - **Selectors:** `.character`, `.welcome`, `[data-section="welcome"]`
  - **Success Criteria:** Welcome animation or character visible

### 1.2 Navigation Tests
- [ ] **Task:** Verify all activity cards are present
  - **Cards:** Guestbook, Baby Pool, Quiz, Advice, Voting, Mom vs Dad, Shoe Game
  - **Selector:** `.activity-card, .card, [data-activity]`
  - **Success Criteria:** All 7 activity cards visible
- [ ] **Task:** Test navigation to Guestbook section
  - **Action:** Click Guestbook card
  - **Success Criteria:** URL updates or section scrolls to view, form becomes visible
- [ ] **Task:** Test navigation to Baby Pool section
  - **Action:** Click Baby Pool card
  - **Success Criteria:** Prediction form becomes visible
- [ ] **Task:** Test navigation to Quiz section
  - **Action:** Click Quiz card
  - **Success Criteria:** Quiz questions become visible
- [ ] **Task:** Test navigation to Advice section
  - **Action:** Click Advice card
  - **Success Criteria:** Advice form becomes visible
- [ ] **Task:** Test navigation to Voting section
  - **Action:** Click Voting card
  - **Success Criteria:** Voting interface becomes visible
- [ ] **Task:** Test navigation to Shoe Game section (HIDDEN)
  - **Action:** Click Shoe Game card
  - **Success Criteria:** Question interface becomes visible
- [ ] **Task:** Test Mom vs Dad card visibility
  - **Note:** Card visible but not testable (T-2 HOLD)
  - **Success Criteria:** Card visible with "Coming Soon" or similar indicator

### 1.3 Responsive Design Tests
- [ ] **Task:** Test desktop layout (1280x720)
  - **Project:** `chromium`
  - **Check:** All cards visible, proper grid layout
  - **Success Criteria:** No horizontal scroll, all content visible
- [ ] **Task:** Test tablet layout (iPad Mini)
  - **Project:** `tablet`
  - **Check:** Cards stack or adjust, forms usable
  - **Success Criteria:** Touch targets minimum 44px, no content cutoff
- [ ] **Task:** Test mobile layout (Pixel 5)
  - **Project:** `mobile-chrome`
  - **Check:** Single column layout, scrollable
  - **Success Criteria:** All activity cards accessible, forms workable
- [ ] **Task:** Test mobile layout (iPhone 12)
  - **Project:** `mobile-safari`
  - **Check:** Safari-specific rendering
  - **Success Criteria:** No errors, all features functional

---

## Phase 2: Guestbook Component Tests

### 2.1 Form Rendering Tests
- [ ] **Task:** Verify Guestbook form fields exist
  - **Fields:** Name input, Message textarea, Relationship select
  - **Selectors:** `input[name="name"]`, `textarea[name="message"]`, `select[name="relationship"]`
  - **Success Criteria:** All 3 fields visible and enabled
- [ ] **Task:** Verify submit button exists
  - **Selector:** `button[type="submit"]:has-text("Sign")`
  - **Success Criteria:** Submit button visible and clickable
- [ ] **Task:** Verify existing entries display area
  - **Selector:** `.guestbook-entries, .entries-list, #guestbook-list`
  - **Success Criteria:** Empty state or list container visible

### 2.2 Form Validation Tests
- [ ] **Task:** Test empty name submission
  - **Action:** Leave name empty, fill message, submit
  - **Success Criteria:** Validation error displayed, form not submitted
- [ ] **Task:** Test empty message submission
  - **Action:** Fill name, leave message empty, submit
  - **Success Criteria:** Validation error displayed, form not submitted
- [ ] **Task:** Test name minimum length validation
  - **Action:** Submit 1-character name
  - **Success Criteria:** Error for minimum 2+ characters
- [ ] **Task:** Test message maximum length validation
  - **Action:** Submit 2000+ character message
  - **Success Criteria:** Error or truncation at limit
- [ ] **Task:** Test special character handling
  - **Action:** Submit name with emojis, message with special chars
  - **Success Criteria:** Special characters preserved and displayed correctly

### 2.3 Form Submission Tests
- [ ] **Task:** Test successful guestbook submission
  - **Data:** Use `generateGuestbookData()`
  - **Action:** Fill all fields, submit
  - **Success Criteria:** Success message shown, entry appears in list
- [ ] **Task:** Verify database entry created
  - **Check:** Query `baby_shower.guestbook` table
  - **Verify:** `testId` field matches submission
  - **Success Criteria:** New entry found with correct data
- [ ] **Task:** Test realtime update propagation
  - **Action:** Submit entry from another tab/session
  - **Success Criteria:** Entry appears without page refresh (Supabase subscription)

### 2.4 Entry Display Tests
- [ ] **Task:** Verify submitted entry displays correctly
  - **Check:** Name, message, relationship, timestamp
  - **Success Criteria:** All fields display as submitted
- [ ] **Task:** Test entry ordering
  - **Check:** Most recent entry at top
  - **Success Criteria:** Entries sorted by created_at DESC
- [ ] **Task:** Test entry count updates
  - **Action:** Submit 3 entries
  - **Success Criteria:** Entry count increases by 3

---

## Phase 3: Baby Pool Component Tests

### 3.1 Form Rendering Tests
- [ ] **Task:** Verify Pool form fields exist
  - **Fields:** Name, due date, gender, weight, length, color
  - **Selectors:** `#pool-name`, `#pool-date`, `input[name="gender"]`, `#pool-weight`, `#pool-length`, `.colour-option`
  - **Success Criteria:** All fields visible and enabled
- [ ] **Task:** Verify gender selection options
  - **Options:** Boy, Girl, Surprise
  - **Success Criteria:** 3 radio buttons present
- [ ] **Task:** Verify color selection options
  - **Expected:** Multiple color swatches
  - **Success Criteria:** At least 4 color options visible

### 3.2 Date Validation Tests
- [ ] **Task:** Test past date rejection
  - **Action:** Select date in 2020
  - **Success Criteria:** Error or date picker prevents selection
- [ ] **Task:** Test current date validation
  - **Action:** Select today's date
  - **Success Criteria:** Warning or error (baby should not be due today)
- [ ] **Task:** Test far future date validation
  - **Action:** Select date 10 years in future
  - **Success Criteria:** Error for unreasonable dates
- [ ] **Task:** Test valid date acceptance
  - **Action:** Select date 60 days from today
  - **Success Criteria:** Date accepted without error

### 3.3 Form Submission Tests
- [ ] **Task:** Test successful pool prediction submission
  - **Data:** Use `generatePoolData()`
  - **Action:** Fill all fields, submit
  - **Success Criteria:** Success message shown, prediction confirmed
- [ ] **Task:** Verify database entry created
  - **Check:** Query `baby_shower.pool_predictions` table
  - **Verify:** All fields match submission
  - **Success Criteria:** New prediction found with correct data

### 3.4 AI Integration Tests
- [ ] **Task:** Test AI roast generation (with mock)
  - **Setup:** Use `tests/ai-mocks/ai-integration.test.js`
  - **Action:** Submit valid prediction
  - **Success Criteria:** AI response received and displayed
- [ ] **Task:** Test AI failure fallback
  - **Setup:** Mock AI API to fail
  - **Action:** Submit prediction
  - **Success Criteria:** Default roast message shown, form still succeeds
- [ ] **Task:** Test AI timeout handling
  - **Setup:** Slow AI response (>10s)
  - **Action:** Submit prediction
  - **Success Criteria:** Timeout message, form succeeds without AI roast

### 3.5 Prediction Display Tests
- [ ] **Task:** Verify prediction summary displays
  - **Check:** Name, due date, gender, color, stats
  - **Success Criteria:** All details shown in summary card
- [ ] **Task:** Test prediction list updates
  - **Action:** Submit multiple predictions
  - **Success Criteria:** List shows all predictions, sorted by date

---

## Phase 4: Quiz Component Tests

### 4.1 Quiz Rendering Tests
- [ ] **Task:** Verify quiz questions display
  - **Selector:** `.question, [class*="question"]`
  - **Expected:** 5 questions for quiz
  - **Success Criteria:** All questions visible
- [ ] **Task:** Verify answer options render
  - **Selector:** `input[type="radio"]`, label options
  - **Expected:** 4 options per question
  - **Success Criteria:** Options A, B, C, D visible for each question
- [ ] **Task:** Verify submit/check button exists
  - **Selector:** `button:has-text("Submit"), button:has-text("Check")`
  - **Success Criteria:** Button visible and enabled

### 4.2 Answer Validation Tests
- [ ] **Task:** Test unanswered question submission
  - **Action:** Leave all questions blank, submit
  - **Success Criteria:** Error requesting answer for all questions
- [ ] **Task:** Test partial answer submission
  - **Action:** Answer 3 of 5 questions, submit
  - **Success Criteria:** Error or warning for unanswered questions
- [ ] **Task:** Test all answered submission
  - **Action:** Answer all questions, submit
  - **Success Criteria:** Form submits successfully

### 4.3 Scoring Tests
- [ ] **Task:** Test correct answer scoring
  - **Action:** Submit all correct answers
  - **Expected:** Score 5/5
  - **Success Criteria:** Perfect score displayed, milestone reached
- [ ] **Task:** Test partial scoring
  - **Action:** Answer 3 correctly out of 5
  - **Expected:** Score 3/5
  - **Success Criteria:** Correct score displayed with breakdown
- [ ] **Task:** Test zero score
  - **Action:** Answer all questions incorrectly
  - **Expected:** Score 0/5
  - **Success Criteria:** 0 score displayed with encouraging message

### 4.4 Milestone Tests
- [ ] **Task:** Test milestone achievement (5/5)
  - **Action:** Get perfect score
  - **Success Criteria:** Gold milestone, special animation
- [ ] **Task:** Test milestone achievement (4/5)
  - **Action:** Get 4 correct
  - **Success Criteria:** Silver milestone, animation
- [ ] **Task:** Test milestone achievement (3/5)
  - **Action:** Get 3 correct
  - **Success Criteria:** Bronze milestone, animation
- [ ] **Task:** Test milestone below threshold
  - **Action:** Get 2 or fewer correct
  - **Success Criteria:** No milestone, encouraging message

### 4.5 Database Tests
- [ ] **Task:** Verify quiz result stored in database
  - **Check:** Query `baby_shower.quiz_results` table
  - **Verify:** Score, answers, timestamp recorded
  - **Success Criteria:** Result found with correct data
- [ ] **Task:** Test leaderboard display
  - **Action:** Complete quiz
  - **Success Criteria:** Name appears in leaderboard

---

## Phase 5: Advice Component Tests

### 5.1 Form Rendering Tests
- [ ] **Task:** Verify Advice form fields exist
  - **Fields:** Name input, Advice textarea, Category select
  - **Selectors:** `#advice-name`, `#advice-message`, `select[name="category"]`
  - **Success Criteria:** All fields visible and enabled
- [ ] **Task:** Verify category options exist
  - **Categories:** general, pregnancy, parenting, baby-care, work-life
  - **Success Criteria:** All 5 categories available

### 5.2 Form Validation Tests
- [ ] **Task:** Test empty name submission
  - **Action:** Leave name empty, submit advice
  - **Success Criteria:** Validation error displayed
- [ ] **Task:** Test empty advice submission
  - **Action:** Fill name, leave advice empty, submit
  - **Success Criteria:** Validation error displayed
- [ ] **Task:** Test advice minimum length
  - **Action:** Submit 5-character advice
  - **Success Criteria:** Error requiring minimum 10+ characters
- [ ] **Task:** Test invalid category selection
  - **Action:** Select non-existent category
  - **Success Criteria:** Default category or error

### 5.3 Form Submission Tests
- [ ] **Task:** Test successful advice submission
  - **Data:** Use `generateAdviceData()`
  - **Action:** Fill all fields, submit
  - **Success Criteria:** Success animation shown, envelope appears
- [ ] **Task:** Verify database entry created
  - **Check:** Query `baby_shower.advice` table
  - **Verify:** All fields match submission
  - **Success Criteria:** New advice entry found with correct data

### 5.4 AI Integration Tests
- [ ] **Task:** Test AI roast generation (with mock)
  - **Setup:** Use mock AI response
  - **Action:** Submit advice
  - **Success Criteria:** AI response received and displayed
- [ ] **Task:** Test AI personalization
  - **Action:** Submit advice with specific content
  - **Success Criteria:** AI references submitted advice in roast

### 5.5 Display Tests
- [ ] **Task:** Verify advice cards display
  - **Action:** Submit multiple advices
  - **Success Cards:** Cards appear in list with name, advice, category badge
- [ ] **Task:** Test category filtering
  - **Action:** Click category filter
  - **Success Criteria:** Only advices from selected category shown
- [ ] **Task:** Test advice count per category
  - **Action:** Check category counts
  - **Success Criteria:** Counts match actual entries

---

## Phase 6: Voting Component Tests

### 6.1 Form Rendering Tests
- [ ] **Task:** Verify Voting form fields exist
  - **Fields:** Name inputs (dynamic), add/remove buttons
  - **Selectors:** `input[name*="name"]`, `.add-name-btn`, `.remove-btn`
  - **Success Criteria:** At least 1 name input visible, add button present
- [ ] **Task:** Verify vote submit button exists
  - **Selector:** `button:has-text("Vote"), button:has-text("Submit Vote")`
  - **Success Criteria:** Button visible and enabled

### 6.2 Form Validation Tests
- [ ] **Task:** Test empty name submission
  - **Action:** Submit with no names entered
  - **Success Criteria:** Error requiring at least 1 name
- [ ] **Task:** Test single name submission
  - **Action:** Add 1 name, submit
  - **Success Criteria:** Form submits successfully
- [ ] **Task:** Test multiple name submission
  - **Action:** Add 5 names, submit
  - **Success Criteria:** All names submitted, votes counted

### 6.3 Voting Submission Tests
- [ ] **Task:** Test successful vote submission
  - **Data:** Use `generateVoteData()`
  - **Action:** Add names, submit
  - **Success Criteria:** Success message shown, tally updates
- [ ] **Task:** Verify database entry created
  - **Check:** Query `baby_shower.votes` table
  - **Verify:** All names recorded
  - **Success Criteria:** New vote entry found with correct data

### 6.4 Tally Display Tests
- [ ] **Task:** Verify vote tally displays
  - **Check:** Name, vote count, percentage
  - **Success Criteria:** Tally shows all votes with counts
- [ ] **Task:** Test tally sorting
  - **Check:** Most votes at top
  - **Success Criteria:** Votes sorted by count DESC
- [ ] **Task:** Test percentage calculation
  - **Action:** Submit votes, check percentages
  - **Success Criteria:** Percentages sum to 100%, calculated correctly

### 6.5 Realtime Updates Tests
- [ ] **Task:** Test realtime vote updates
  - **Action:** Submit vote from another tab
  - **Success Criteria:** Tally updates without page refresh
- [ ] **Task:** Test concurrent vote submission
  - **Action:** Submit votes from 2 tabs simultaneously
  - **Success Criteria:** Both votes recorded, counts accurate

---

## Phase 7: Shoe Game Component Tests

### 7.1 Game Rendering Tests
- [ ] **Task:** Verify game interface displays
  - **Selector:** `.shoe-game, [data-game="shoe"]`
  - **Success Criteria:** Game container visible
- [ ] **Task:** Verify left/right shoe indicators
  - **Selectors:** `.shoe-left, .shoe-right, .left-shoe, .right-shoe`
  - **Success Criteria:** Both shoe positions visible
- [ ] **Task:** Verify question display
  - **Selector:** `.question-text, [data-question]`
  - **Success Criteria:** Current question visible

### 7.2 Game Flow Tests
- [ ] **Task:** Test question progression
  - **Action:** Tap left or right shoe
  - **Success Criteria:** Next question appears
- [ ] **Task:** Test question count
  - **Expected:** 10 questions in game
  - **Success Criteria:** All questions display in sequence
- [ ] **Task:** Test game completion
  - **Action:** Answer all questions
  - **Success Criteria:** Results screen appears

### 7.3 Answer Storage Tests
- [ ] **Task:** Test local answer storage
  - **Action:** Answer questions
  - **Check:** `sessionStorage` or `localStorage`
  - **Success Criteria:** Answers stored for result calculation
- [ ] **Task:** Test answer retrieval
  - **Action:** Complete game, check results
  - **Success Criteria:** All answers displayed in results

### 7.4 Results Display Tests
- [ ] **Task:** Verify results screen displays
  - **Selector:** `.results, .game-results`
  - **Success Criteria:** Results visible after all questions answered
- [ ] **Task:** Test play again functionality
  - **Action:** Click "Play Again"
  - **Success Criteria:** Game resets, questions start over

---

## Phase 8: API Endpoint Validation Tests

### 8.1 Guestbook API Tests
- [ ] **Task:** Test POST /guestbook endpoint
  - **Helper:** `GuestbookAPI.submitEntry()`
  - **Success Criteria:** 200 status, entry created in DB
- [ ] **Task:** Test GET /guestbook endpoint
  - **Helper:** `GuestbookAPI.getEntries()`
  - **Success Criteria:** 200 status, entries array returned
- [ ] **Task:** Test guestbook validation errors
  - **Action:** Send invalid data
  - **Success Criteria:** 400 status, error message returned

### 8.2 Vote API Tests
- [ ] **Task:** Test POST /vote endpoint
  - **Helper:** `VoteAPI.submitVote()`
  - **Success Criteria:** 200 status, vote recorded
- [ ] **Task:** Test GET /vote endpoint
  - **Helper:** `VoteAPI.getVotes()`
  - **Success Criteria:** 200 status, tally returned
- [ ] **Task:** Test empty names rejection
  - **Action:** Send empty names array
  - **Success Criteria:** 400 status, validation error

### 8.3 Pool API Tests
- [ ] **Task:** Test POST /pool endpoint
  - **Helper:** `PoolAPI.submitPrediction()`
  - - **Success Criteria:** 200 status, prediction recorded, AI roast returned
- [ ] **Task:** Test GET /pool endpoint
  - **Helper:** `PoolAPI.getPredictions()`
  - **Success Criteria:** 200 status, predictions array returned
- [ ] **Task:** Test past date rejection
  - **Action:** Send past due date
  - **Success Criteria:** 400 status, date validation error

### 8.4 Quiz API Tests
- [ ] **Task:** Test POST /quiz endpoint
  - **Helper:** `QuizAPI.submitAnswers()`
  - **Success Criteria:** 200 status, score calculated
- [ ] **Task:** Test GET /quiz leaderboard
  - **Helper:** `QuizAPI.getLeaderboard()`
  - **Success Criteria:** 200 status, leaderboard array returned

### 8.5 Advice API Tests
- [ ] **Task:** Test POST /advice endpoint
  - **Helper:** `AdviceAPI.submitAdvice()`
  - **Success Criteria:** 200 status, advice recorded, AI roast returned
- [ ] **Task:** Test GET /advice endpoint
  - **Helper:** `AdviceAPI.getAdvice()`
  - **Success Criteria:** 200 status, advices array returned
- [ ] **Task:** Test advice validation
  - **Action:** Send empty advice text
  - **Success Criteria:** 400 status, validation error

---

## Phase 9: Database Integrity Tests

### 9.1 Schema Validation Tests
- [ ] **Task:** Verify guestbook table schema
  - **Command:** `supabase_execute_sql` with DESCRIBE
  - **Columns:** id, name, message, relationship, created_at, testId
  - **Success Criteria:** All columns exist with correct types
- [ ] **Task:** Verify votes table schema
  - **Columns:** id, names (array), created_at, testId
  - **Success Criteria:** Schema matches expected structure
- [ ] **Task:** Verify pool_predictions table schema
  - **Columns:** id, name, prediction, dueDate, gender, weight, length, color, created_at, testId
  - **Success Criteria:** All prediction fields present
- [ ] **Task:** Verify quiz_results table schema
  - **Columns:** id, name, answers (array), score, total, created_at, testId
  - **Success Criteria:** Quiz result fields present
- [ ] **Task:** Verify advice table schema
  - **Columns:** id, name, advice, category, created_at, testId
  - **Success Criteria:** Advice fields present

### 9.2 RLS Policy Tests
- [ ] **Task:** Verify guestbook RLS enabled
  - **Check:** Supabase Dashboard → Authentication → Policies
  - **Success Criteria:** RLS enabled, policies configured
- [ ] **Task:** Test public read access
  - **Action:** Query guestbook without auth
  - **Success Criteria:** Read succeeds (anon key)
- [ ] **Task:** Test public insert access
  - **Action:** Insert guestbook entry without auth
  - **Success Criteria:** Insert succeeds (anon key)

### 9.3 Data Integrity Tests
- [ ] **Task:** Test unique constraint on entries
  - **Action:** Submit entries with same testId
  - **Success Criteria:** Only 1 entry created (id unique)
- [ ] **Task:** Test timestamp auto-population
  - **Action:** Insert entry without created_at
  - **Success Criteria:** created_at auto-set to current time
- [ ] **Task:** Test foreign key relationships
  - **Action:** Check related tables
  - **Success Criteria:** No orphan records

### 9.4 Performance Tests
- [ ] **Task:** Test query performance (<100ms)
  - **Action:** Query each table
  - **Success Criteria:** All queries complete in under 100ms
- [ ] **Task:** Test bulk insert performance
  - **Action:** Insert 100 entries
  - **Success Criteria:** Bulk insert completes in under 1 second

---

## Phase 10: AI Integration Verification Tests

### 10.1 MiniMax API Tests
- [ ] **Task:** Verify MiniMax API key configured
  - **Check:** `window.ENV.MINIMAX_API_KEY` defined
  - **Success Criteria:** Key present and non-empty
- [ ] **Task:** Test MiniMax API connectivity
  - **Action:** Make test call to MiniMax
  - **Success Criteria:** API responds without auth errors
- [ ] **Task:** Test MiniMax response format
  - **Action:** Call MiniMax for pool prediction
  - **Success Criteria:** Response matches expected schema

### 10.2 AI Response Handling Tests
- [ ] **Task:** Test valid AI response parsing
  - **Action:** Submit pool prediction
  - **Success Criteria:** AI response parsed and displayed
- [ ] **Task:** Test malformed AI response
  - **Action:** Mock malformed response
  - **Success Criteria:** Error caught, fallback displayed
- [ ] **Task:** Test AI timeout (10s)
  - **Action:** Submit advice with slow AI
  - **Success Criteria:** Timeout triggers fallback after 10s
- [ ] **Task:** Test AI rate limiting
  - **Action:** Submit many requests quickly
  - **Success Criteria:** Rate limit handled gracefully

### 10.3 AI Content Tests
- [ ] **Task:** Test pool AI roast appropriateness
  - **Action:** Submit pool prediction
  - **Content:** Roast should be celebratory, not offensive
  - **Success Criteria:** Appropriate content, no policy violations
- [ ] **Task:** Test advice AI roast appropriateness
  - **Action:** Submit advice
  - **Content:** Should be encouraging, not critical
  - **Success Criteria:** Positive/encouraging content
- [ ] **Task:** Test AI doesn't expose sensitive data
  - **Action:** Check AI responses for leaked info
  - **Success Criteria:** No internal paths, keys, or user data in AI output

---

## Phase 11: Cross-Browser and Mobile Testing

### 11.1 Desktop Browser Tests
- [ ] **Task:** Test in Chromium
  - **Project:** `chromium`
  - **Scope:** All 6 components (excluding Mom vs Dad)
  - **Success Criteria:** All tests pass in Chrome
- [ ] **Task:** Test in Firefox
  - **Project:** `firefox`
  - **Scope:** All 6 components
  - **Success Criteria:** All tests pass in Firefox
- [ ] **Task:** Test in WebKit (Safari)
  - **Project:** `webkit`
  - **Scope:** All 6 components
  - **Success Criteria:** All tests pass in Safari

### 11.2 Mobile Browser Tests
- [ ] **Task:** Test in Mobile Chrome (Pixel 5)
  - **Project:** `mobile-chrome`
  - **Scope:** Landing page, all forms submit successfully
  - **Success Criteria:** Touch interactions work, forms usable
- [ ] **Task:** Test in Mobile Safari (iPhone 12)
  - **Project:** `mobile-safari`
  - **Scope:** Landing page, all forms submit successfully
  - **Success Criteria:** iOS-specific features work, no errors

### 11.3 Tablet Tests
- [ ] **Task:** Test in iPad Mini
  - **Project:** `tablet`
  - **Scope:** Landing page, responsive layout
  - **Success Criteria:** Grid adjusts, all features accessible

### 11.4 Device-Specific Tests
- [ ] **Task:** Test touch interactions
  - **Mobile:** Tap, swipe on activity cards
  - **Success Criteria:** Touch events register correctly
- [ ] **Task:** Test virtual keyboard
  - **Mobile:** Tap text inputs
  - **Success Criteria:** Keyboard appears, doesn't cover form
- [ ] **Task:** Test viewport meta tag
  - **Check:** `<meta name="viewport">`
  - **Success Criteria:** Proper mobile scaling enabled

---

## Phase 12: Performance and Error Handling Tests

### 12.1 Performance Tests
- [ ] **Task:** Measure page load time
  - **Metric:** First Contentful Paint < 1s
  - **Tool:** Playwright trace
  - **Success Criteria:** FCP under 1 second
- [ ] **Task:** Measure time to interactive
  - **Metric:** TTI < 2s
  - **Success Criteria:** App interactive under 2 seconds
- [ ] **Task:** Measure API response times
  - **Metric:** Edge Function response < 2s
  - **Success Criteria:** All APIs respond within 2 seconds
- [ ] **Task:** Test concurrent requests
  - **Action:** Submit 10 simultaneous requests
  - **Success Criteria:** All complete without race conditions

### 12.2 Error Handling Tests
- [ ] **Task:** Test network disconnection
  - **Action:** Block network, submit form
  - **Success Criteria:** Error message shown, form can be retried
- [ ] **Task:** Test API timeout (30s)
  - **Action:** Mock slow API response
  - **Success Criteria:** Timeout error after 30s
- [ ] **Task:** Test 500 server error
  - **Action:** Mock 500 response
  - **Success Criteria:** User-friendly error displayed
- [ ] **Task:** Test 404 endpoint not found
  - **Action:** Mock 404 response
  - **Success Criteria:** Error message, no crash

### 12.3 Form Error Recovery Tests
- [ ] **Task:** Test form reset after error
  - **Action:** Submit invalid data, fix, resubmit
  - **Success Criteria:** Form resets, new submission works
- [ ] **Task:** Test partial form save
  - **Action:** Fill form partially, refresh, return
  - **Success Criteria:** Data preserved (if sessionStorage used)
- [ ] **Task:** Test concurrent form submission
  - **Action:** Submit same form twice quickly
  - **Success Criteria:** Both submissions processed, no duplicates

### 12.4 Security Error Tests
- [ ] **Task:** Test SQL injection prevention
  - **Action:** Submit `' OR '1'='1` in form fields
  - **Success Criteria:** Input sanitized, no DB errors
- [ ] **Task:** Test XSS prevention
  - **Action:** Submit `<script>alert('xss')</script>`
  - **Success Criteria:** Script not executed, content escaped
- [ ] **Task:** Test API key exposure
  - **Action:** Check network requests
  - **Success Criteria:** No API keys in client-side requests

---

## Phase 13: Cleanup and Reporting

### 13.1 Test Data Cleanup
- [ ] **Task:** Remove test entries from guestbook
  - **Command:** `DELETE FROM baby_shower.guestbook WHERE testId LIKE 'test_e2e_%'`
  - **Success Criteria:** Test entries removed
- [ ] **Task:** Remove test predictions from pool
  - **Command:** `DELETE FROM baby_shower.pool_predictions WHERE testId LIKE 'test_e2e_%'`
  - **Success Criteria:** Test predictions removed
- [ ] **Task:** Remove test votes from voting
  - **Command:** `DELETE FROM baby_shower.votes WHERE testId LIKE 'test_e2e_%'`
  - **Success Criteria:** Test votes removed
- [ ] **Task:** Remove test quiz results
  - **Command:** `DELETE FROM baby_shower.quiz_results WHERE testId LIKE 'test_e2e_%'`
  - **Success Criteria:** Test results removed
- [ ] **Task:** Remove test advice entries
  - **Command:** `DELETE FROM baby_shower.advice WHERE testId LIKE 'test_e2e_%'`
  - **Success Criteria:** Test advice removed

### 13.2 Test Report Generation
- [ ] **Task:** Generate HTML test report
  - **Command:** `npm run test:report`
  - **Output:** `test-results/html-report/index.html`
  - **Success Criteria:** Report opens without errors
- [ ] **Task:** Generate JSON test results
  - **Output:** `test-results/test-results.json`
  - **Success Criteria:** JSON file contains all test results
- [ ] **Task:** Generate JUnit XML report
  - **Output:** `test-results/test-results.xml`
  - **Success Criteria:** XML file valid, CI-compatible
- [ ] **Task:** Check test coverage summary
  - **Report:** HTML report coverage section
  - **Success Criteria:** Coverage > 80% for all components

### 13.3 Results Documentation
- [ ] **Task:** Document failed tests
  - **File:** `tests/TEST_RESULTS.md`
  - **Content:** List all failures with screenshots and stack traces
  - **Success Criteria:** Document created with all failures
- [ ] **Task:** Document performance metrics
  - **File:** `tests/PERFORMANCE_RESULTS.md`
  - **Content:** Load times, API response times, resource usage
  - **Success Criteria:** Performance baseline established
- [ ] **Task:** Document browser compatibility
  - **File:** `tests/BROWSER_RESULTS.md`
  - **Content:** Pass/fail for each browser
  - **Success Criteria:** Browser matrix documented

### 13.4 Cleanup Test Artifacts
- [ ] **Task:** Clear test screenshots
  - **Command:** `rm -rf test-results/**/*.{png,jpg}`
  - **Success Criteria:** Screenshots removed (keeping reports)
- [ ] **Task:** Clear test traces
  - **Command:** `rm -rf test-results/**/trace.zip`
  - **Success Criteria:** Traces removed (keeping reports)
- [ ] **Task:** Clear auth state
  - **Command:** `rm -rf tests/e2e/.auth/state.json`
  - **Success Criteria:** Auth state cleared for fresh runs
- [ ] **Task:** Verify clean state
  - **Action:** Run `npm test` on clean directory
  - **Success Criteria:** Tests run without leftover state

---

## Test Execution Commands

### Quick Run (Critical Tests Only)
```bash
npm test
```

### Run by Category
```bash
npm run test:frontend    # Frontend tests only
npm run test:api         # API integration tests
npm run test:db          # Database tests
npm run test:errors      # Error handling tests
npm run test:flow        # Data flow tests
```

### Run by Browser
```bash
npm run test:chromium    # Chrome only
npm run test:firefox     # Firefox only
npm run test:webkit      # Safari only
npm run test:mobile      # Mobile browsers
```

### Debug and UI Modes
```bash
npm run test:ui          # Open Playwright UI
npm run test:headed      # Show browser during tests
npm run test:debug       # Debug mode with pause
```

### Generate Reports
```bash
npm run test:report      # Open HTML report
```

---

## Success Criteria Summary

### Minimum Passing Requirements
- All critical user flows working: 100%
- All form submissions successful: 100%
- All API endpoints returning 200: 100%
- No console errors on page load: 100%
- Mobile responsiveness verified: 100%

### Performance Requirements
- Page load time < 1s: FCP
- Time to interactive < 2s: TTI
- API response time < 2s: All endpoints
- Test suite execution < 30min: Full suite

### Quality Requirements
- Test coverage > 80%: All components
- Cross-browser compatibility: 3/3 browsers
- Mobile compatibility: 2/2 devices
- Zero security vulnerabilities: Critical/High

---

## Notes and Exclusions

### T-2 HOLD (Do Not Test)
- **Mom vs Dad Game:** Card visible but not testable
- **Reason:** Game in development, may cause test failures
- **Unblock:** Will be tested after T-2 hold lifted

### Future Test Additions
- Mom vs Dad Game E2E tests (after T-2 lift)
- Load testing with 100+ concurrent users
- Accessibility testing (WCAG 2.1 AA)
- Security penetration testing
- Internationalization testing

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-09  
**Next Review:** After Mom vs Dad T-2 hold lifted
