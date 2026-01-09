# Agent Allocation and Analysis for Baby Shower Components

This document allocates specialized agents to analyze each component of the baby shower application. Each agent is responsible for identifying and documenting the following aspects for their assigned component:

1. Each edge function
2. Schemas associated with it
3. Back-end scripts
4. Front-end scripts
5. Images
6. Storing of input data

---

## 1. Landing Page

**Responsible Agent:** explorer  
**Session ID:** ses-landing-page-analysis

### Edge Functions Associated with Landing Page
The landing page doesn't have dedicated edge functions, but it uses the following edge functions for activity submissions:

**Core Activity Edge Functions:**
- **`guestbook`** (`supabase/functions/guestbook/index.ts`) - Handles guestbook form submissions (name, relationship, message)
- **`pool`** (`supabase/functions/pool/index.ts`) - Handles baby pool predictions (birth date, time, weight, length, favorite color)
- **`quiz`** (`supabase/functions/quiz/index.ts`) - Handles quiz answers and scoring
- **`advice`** (`supabase/functions/advice/index.ts`) - Handles advice submissions with time capsule feature

**Supporting Edge Functions:**
- **`setup-game-database`** (`supabase/functions/setup-game-database/index.ts`) - Database initialization
- **`create-demo-sessions`** (`supabase/functions/create-demo-sessions/index.ts`) - Creates demo game sessions

**Security Shared Utilities:**
- **`_shared/security.ts`** - Common security functions (input validation, CORS headers, error responses)

### Database Schemas Used
**Primary Schema:** `baby_shower` namespace

**Key Tables:**
```sql
-- Core activity tables
baby_shower.submissions        -- Unified submissions table
baby_shower.guestbook          -- Guestbook entries
baby_shower.pool_predictions   -- Baby pool predictions
baby_shower.quiz_results       -- Quiz results and answers
baby_shower.advice             -- Advice/wisdom submissions
baby_shower.votes              -- Name voting data

-- Game-related tables (not directly on landing page)
baby_shower.game_sessions      -- Mom vs Dad game sessions
baby_shower.game_scenarios     -- AI-generated game scenarios
baby_shower.game_votes         -- Game votes
baby_shower.game_answers       -- Parent answers
baby_shower.game_results       -- Perception gap analysis
```

### Back-end Scripts Related to Landing Page Functionality
**API & Communication:**
- `scripts/api-supabase-enhanced.js` - Enhanced Supabase API client with retry logic
- `scripts/api-supabase.js` - Original Supabase API client
- `scripts/realtime-manager-enhanced.js` - Real-time subscription management

**Image Service:**
- `scripts/image-service-enhanced.js` - Enhanced image handling and optimization
- `scripts/image-service.js` - Original image service with hero image support

**Security:**
- `scripts/security.js` - Input sanitization and security utilities

**Configuration:**
- `scripts/config.js` - Global configuration including:
  - Anime character system (mom, dad, baby mascots)
  - Milestone thresholds
  - Quiz puzzles
  - Color options
  - Storage bucket configuration

### Front-end Scripts for Landing Page
**Core Application:**
- `scripts/main.js` - Main application controller with:
  - `initializeWelcomeName()` - Guest name collection
  - `navigateToSection()` - Section navigation
  - `handleGuestbookSubmit()`, `handlePoolSubmit()`, `handleQuizSubmit()`, `handleAdviceSubmit()` - Form handlers
  - `refreshStatsFromAPI()` - Stats loading
  - `checkMilestonesFromCache()` - Milestone checking

**Activity-Specific:**
- `scripts/guestbook.js` - Guestbook validation and data processing
- `scripts/pool.js` - Baby pool predictions
- `scripts/quiz.js` - Quiz logic
- `scripts/advice.js` - Advice form handling

**UI & Experience:**
- `scripts/ui-utils.js` - UI utility functions
- `scripts/surprises.js` - Milestone celebrations
- `scripts/anime-characters.js` - Character system
- `scripts/gallery.js` - Gallery and hero image loading

**Games:**
- `scripts/mom-vs-dad-simplified.js` - Mom vs Dad game
- `scripts/who-would-rather.js` - Shoe Game

### Images Used in Landing Page
**Remote Images (Supabase Storage):**
All images are hosted at: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/`

**Partner Avatars (Hero Section):**
- Michelle: `Pictures/Michelle_Icon/asset_chibi_avatar_f.png`
- Jazeel: `Pictures/Jazeel_Icon/asset_chibi_avatar_m.png`
- Heart: `Pictures/Jazeel&Michelle_Icon/asset_chibi_heart.png`

**Activity Card Icons:**
- Guestbook: `Pictures/New Images/Michelle/chibi_michelle_excited_red.png`
- Baby Pool: `Pictures/New Images/Jazeel/chibi_jazeel_eating.png`
- Quiz: `Pictures/New Images/Jazeel/chibi_jazeel_confused.png`
- Advice: `Pictures/New Images/Michelle/chibi_michelle_sweet_smile.png`
- Shoe Game: `Pictures/New Images/Duo/chibi_duo_highfive.png`

**Baby Photos:**
- Baby Michelle: `Pictures/Michelle_Baby/chibi_michelle_1st_birthday.png`
- Baby Jazeel: `Pictures/Jazeel_Baby/chibi_jazeel_newborn_edit.png`

**Local Images (baby_content directory):**
- `baby_content/Pictures/New Images/Michelle/` - Michelle character images (9 PNG files)
- `baby_content/Pictures/New Images/Jazeel/` - Jazeel character images (9 PNG files)
- `baby_content/Pictures/New Images/Duo/` - Couple images (1 PNG: chibi_duo_highfive.png)

**Local Storage:**
- `guestbook-mobile-full.png` - Mobile layout screenshot
- `Screenshot 2026-01-08 215357.png` - Debug screenshot
- `Screenshot 2026-01-08 231001.png` - Debug screenshot

### How Input Data is Stored for Landing Page
**Guest Name Storage (Client-side):**
```javascript
// LocalStorage key: 'babyShowerGuestName'
localStorage.setItem(GUEST_NAME_KEY, name.trim());
```
- Stored in browser localStorage. Used to pre-fill all activity name fields. Persists across sessions.

**Personal Progress Storage (Client-side):**
```javascript
// LocalStorage key: 'babyShowerProgress'
{
  guestbook: 0,
  pool: 0,
  quiz: 0,
  advice: 0,
  votes: 0
}
```
Tracks individual guest's activity participation.

**Activity Submissions (Server-side):**
- Form data sent via POST to Edge Functions
- Validated and sanitized using `validateInput()` from `security.ts`
- Inserted into `baby_shower` schema tables using service role key
- Real-time updates via Supabase subscriptions

**Submission Data Flow:**
1. User fills form on landing page
2. Frontend validates using `UIUtils` or fallback
3. Data sent to Edge Function (e.g., `/functions/v1/guestbook`)
4. Edge function validates environment variables
5. Input validated using `validateInput()` with schema
6. Data inserted into Supabase database
7. Real-time subscription notifies other clients
8. Stats cache updated and UI refreshed

**Milestone Tracking:**
- Server-side: Count submissions per activity type
- Client-side: Check against thresholds in `CONFIG.MILESTONES`
- Triggers confetti celebration when thresholds reached

---

## 2. Guestbook

**Responsible Agent:** explorer  
**Session ID:** ses-guestbook-analysis

### Edge Functions Associated with Guestbook
**Primary Edge Function:**
- `supabase/functions/guestbook/index.ts` - Main guestbook submission handler

**Functionality:**
- Validates environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Accepts POST requests only
- Validates input fields: name (1-100 chars), message (1-1000 chars), relationship (1-50 chars)
- Inserts entries into `baby_shower.guestbook` table
- Tracks milestone at 50 entries
- Returns success response with entry ID and creation timestamp

### Database Schemas Used by Guestbook
**Primary Table:**
```
baby_shower.guestbook (
    id              bigint NOT NULL (auto-incrementing)
    guest_name      text NOT NULL
    relationship    text NOT NULL
    message         text NOT NULL
    submitted_by    text
    created_at      timestamp with time zone DEFAULT now()
)
```

**Indexes:**
- `idx_baby_shower_guestbook_created_at` (created_at DESC)
- `idx_baby_shower_guestbook_guest_name` (guest_name)
- `idx_guestbook_created_at` (created_at)

**Views:**
- `baby_shower.guestbook_entries` - View of guestbook submissions
- `public.guestbook_v` - Public view of guestbook entries

**RLS Policies:**
- RLS enabled on `baby_shower.guestbook`
- INSERT policy: "Allow guestbook inserts for all" (WITH CHECK true)
- SELECT policy: "Allow guestbook reads for all" (USING true)

**Note:** There are two schema definitions found:
- Older schema (`20250102_multi_table_schema.sql`): Uses UUID primary key with additional tracking fields
- Current schema (`20260106102803_remote_schema.sql`): Uses bigint auto-increment ID

### Backend Scripts Related to Guestbook Functionality
**Core Backend Script:**
- `scripts/guestbook.js` - Frontend validation and utilities (not backend)

**Backend API Integration:**
- `scripts/api-supabase.js:239` - `submitGuestbook(data)` function
  - Sends POST request to `guestbook` Edge Function
  - Sends: `{ name, message, relationship }`

- `scripts/api-supabase.js:366` - `getAllGuestbook()` function
  - Retrieves guestbook entries via `queryBabyShowerSubmissions({ activityType: 'guestbook' })`

**Enhanced API:**
- `scripts/api-supabase-enhanced.js:217` - Alternative submitGuestbook implementation

**Test Scripts:**
- `scripts/tests/test-guestbook-error.js` - Test script for guestbook error handling
- `tests/guestbook-test.json` - Test data fixture

### Frontend Scripts for the Guestbook
**Main Frontend Script:**
- `scripts/guestbook.js` - Guestbook feature module with functions:
  - `initializeGuestbook()` - Initialize guestbook functionality
  - `validateGuestbookForm(form)` - Client-side form validation
  - `getGuestbookFormData(form)` - Extract and sanitize form data
  - `resetGuestbookForm(form)` - Reset form after submission
  - `getGuestbookSuccessMessage(name)` - Generate success messages
  - `getGuestbookProgress()` - Get user's submission count
  - `checkGuestbookMilestone(count)` - Check milestone triggers (5, 10, 20)
  - `getGuestbookMilestoneMessage(count)` - Get milestone celebration messages
  - Exposed as `window.Guestbook` global object

**Main Application Script:**
- `scripts/main.js:711` - `handleGuestbookSubmit(event)` function
  - Handles form submission event
  - Validates form using UIUtils or fallback
  - Calls `submitGuestbook(data, photoFile)`
  - Updates personal progress

- `scripts/main.js:1368` - `submitGuestbook(data, photoFile)` function
  - Wrapper that calls `window.API.submitGuestbook()`

**Form Configuration:**
- Form ID: `guestbook-form`
- Fields:
  - `guestbook-name` (text, required, 1-100 chars)
  - `guestbook-relationship` (select, required, options: Friend, Family, Colleague, Auntie, Uncle, Other)
  - `guestbook-message` (textarea, required, 10-500 chars)
  - `guestbook-photo` (file input, optional)

### Images Used in Guestbook
**Decoration Images:**
- Farm theme decoration: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Theme/chibi_farm_animals.png`
- Win chibi: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel&Michelle_Icon/asset_chibi_win.png`
- Think chibi: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel&Michelle_Icon/asset_chibi_think.png`
- Heart chibi: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel&Michelle_Icon/asset_chibi_heart.png`

**CSS Background Image:**
- Inline SVG hearts pattern in `styles/main.css:590-595`
- Used as card background for guestbook section

**Screenshot:**
- `guestbook-mobile-full.png` - Screenshot of mobile guestbook view

### How Input Data is Stored for Guestbook
**Data Flow:**

1. **User Input:** User fills form in `index.html:162-184`
   - Name, relationship, message fields
   - Optional photo upload

2. **Client-Side Validation:** `scripts/guestbook.js:16-47`
   - Validates all required fields
   - Checks message length (10-500 chars)
   - Sanitizes input data

3. **Submission:** `scripts/main.js:711-750`
   - `handleGuestbookSubmit()` prevents default form submission
   - Extracts form data using FormData API
   - Calls `submitGuestbook()` with sanitized data

4. **API Call:** `scripts/api-supabase.js:239-250`
   - POST request to `/functions/v1/guestbook`
   - Body: `{ name, message, relationship }` (all trimmed)

5. **Edge Function Processing:** `supabase/functions/guestbook/index.ts`
   - Validates environment variables
   - Parses JSON request body
   - Validates input using `validateInput()`
   - Sanitizes data with validation.sanitized
   - Counts current entries for milestone check

6. **Database Insert:** `supabase/functions/guestbook/index.ts:96-105`
   ```sql
   INSERT INTO baby_shower.guestbook (
     guest_name,
     relationship,
     message,
     submitted_by
   ) VALUES ($1, $2, $3, $4)
   RETURNING *
   ```

7. **Storage Location:**
   - Primary: `baby_shower.guestbook` table
   - Backup/View: `baby_shower.guestbook_entries` view
   - Public access: `public.guestbook_v` view

8. **Milestone Tracking:**
   - Current count checked before insert
   - Milestone triggered at 50 entries
   - Returns milestone info in response

**Note:** The guestbook form also includes a photo upload field (`guestbook-photo`), but the photo upload functionality appears to reference a storage bucket (`guestbook-photos` in `scripts/config.js:315`) rather than the database table itself.

---

## 3. Baby Pool

**Responsible Agent:** explorer  
**Session ID:** ses-baby-pool-analysis

### Edge Functions Associated with Baby Pool
**Primary Function:** `supabase/functions/pool/index.ts`
- Handles pool prediction submissions
- Validates input data
- Stores predictions in `baby_shower.pool_predictions` table
- Generates AI roasts using MiniMax API
- Calculates averages and milestone detection (50 submissions)
- Uses `baby_shower.pool_predictions` table for data storage

**Security Utilities:** `supabase/functions/_shared/security.ts`
- `validateEnvironmentVariables()` - Validates required env vars
- `createErrorResponse()` - Standardized error responses
- `createSuccessResponse()` - Standardized success responses
- `validateInput()` - Input validation function
- `CORS_HEADERS` and `SECURITY_HEADERS` - HTTP headers

### Database Schemas Used by Baby Pool
**Table:** `baby_shower.pool_predictions`

**Schema Definition (from `supabase/migrations/20250102_multi_table_schema.sql`):**
```sql
CREATE TABLE IF NOT EXISTS baby_shower.pool_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Predictor Information
    predictor_name TEXT NOT NULL CHECK (length(predictor_name) >= 2 AND length(predictor_name) <= 100),

    -- Prediction Details
    gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'surprise')),
    birth_date DATE NOT NULL CHECK (birth_date >= '2024-01-01' AND birth_date <= '2025-12-31'),
    weight_kg NUMERIC(4,2) NOT NULL CHECK (weight_kg >= 2.0 AND weight_kg <= 6.0),
    length_cm INTEGER NOT NULL CHECK (length_cm >= 40 AND length_cm <= 60),
    hair_color TEXT CHECK (hair_color IS NULL OR length(hair_color) <= 50),
    eye_color TEXT CHECK (eye_color IS NULL OR length(eye_color) <= 50),
    personality TEXT CHECK (personality IS NULL OR length(personality) <= 200),

    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,

    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_pool_predictions_created_at` - Created at descending
- `idx_pool_predictions_predictor_name` - Predictor name
- `idx_pool_predictions_birth_date` - Birth date
- `idx_pool_predictions_gender` - Gender

**RLS Policies:**
- INSERT: Allowed for anon, authenticated users
- SELECT: Allowed for anon, authenticated users

**Realtime:** Added to `baby_shower_realtime` publication

### Backend Scripts Related to Baby Pool Functionality
**Edge Function:** `supabase/functions/pool/index.ts`
- Main backend handler for pool predictions
- Uses Deno runtime (TypeScript)
- AI roast generation via MiniMax API (`MINIMAX_API_KEY`)
- Input validation with `validateInput()`
- Calculates averages from existing predictions

**API Client:** `scripts/api-supabase.js`
- `submitPool(data)` - Submits pool prediction
- `getSubmissions(activityType)` - Fetches submissions including pool
- Uses Edge Function URL: `/functions/v1/pool`

**API Client (Enhanced):** `scripts/api-supabase-enhanced.js`
- Production-ready Supabase client
- Retry logic and error handling
- Realtime subscription support for pool changes

**Configuration:** `scripts/config.js`
- `FAVOURITE_COLOUR_OPTIONS` - Color selection options for pool form

### Frontend Scripts for the Baby Pool
**Main Pool Script:** `scripts/pool.js`
- `initializePool()` - Initializes pool-specific functionality
- `setPoolDateRange()` - Sets date picker range (2026-01-06 to 2026-12-31)
- `initializeFavouriteColourGrid()` - Creates color selection grid
- `selectFavouriteColour()` - Handles color selection
- `loadPoolStats()` - Loads and displays pool statistics
- `displayPoolStats()` - Renders statistics
- `validatePoolForm()` - Validates pool form inputs
- `getPoolFormData()` - Extracts form data for backend
- `resetPoolForm()` - Resets form after submission
- `getPoolSuccessMessage()` - Generates success message
- `displayRoast()` - Shows AI-generated roast
- Exposed as `window.Pool` global object

**Main Application Script:**
- `scripts/main.js`
- `handlePoolSubmit()` - Handles pool form submission
- `submitPool(data)` - Calls API to submit prediction
- `loadPoolStats()` - Loads pool statistics
- Activity ticker integration for pool activities

**Styles:**
- `styles/main.css` - Contains `.activity-card[data-section="pool"]` styling
- `styles/cute-enhancements.css` - Visual enhancements
- `styles/animations.css` - Animations for pool interactions

### Images Used in the Baby Pool
**Card Icon (Activity Selection):**
- URL: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Jazeel/chibi_jazeel_eating.png`
- Alt: "Baby Pool"
- Size: 80px × 100px max

**Section Decorations:**
- Top Center: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Jazeel/app_hero_chibi.png`
- Bottom Left: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Baby/chibi_michelle_garden.png`
- Bottom Right: `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Baby/chibi_jazeel_dad_couch_edit.png`

**Storage Path Pattern:** `baby-shower-pictures/Pictures/[Category]/[filename]`

### How Input Data is Stored for the Baby Pool
**Data Flow:**
1. **Frontend Collection** (`scripts/pool.js`):
   - Form fields: name, date, time, weight, length, favourite colour
   - Validates inputs client-side
   - Packages data for API submission

2. **API Submission** (`scripts/api-supabase.js`):
   - Calls Edge Function: `POST /functions/v1/pool`
   - Request body:
     ```javascript
     {
       name: string,
       prediction: string,  // "Date: YYYY-MM-DD, Time: HH:mm, Weight: X.Xkg, Length: XXcm"
       dueDate: string,     // YYYY-MM-DD format
       weight: number,      // kg
       length: number,      // cm
       hair_color: string,  // optional
       eye_color: string,   // optional
       favourite_colour: string
     }
     ```

3. **Edge Function Processing** (`supabase/functions/pool/index.ts`):
   - Validates environment variables
   - Parses and validates request body
   - Validates date is within 2026
   - Calculates averages for AI roast generation
   - Checks for milestone (50 submissions)
   - Inserts into database using service role (bypasses RLS)

4. **Database Storage** (`baby_shower.pool_predictions`):
   - Stores: predictor_name, birth_date, prediction, weight_kg, length_cm, hair_color, eye_color, favourite_colour, submitted_by
   - AI roast generated asynchronously (wrapped in try/catch, never blocks submission)

5. **Response:**
   - Returns inserted record ID and details
   - Includes AI roast if generated
   - Includes milestone info if applicable

**Milestone Detection:**
- Triggers at 50 submissions
- Message: "🎉 We hit 50 submissions! Cake time!"

**AI Roast Generation:**
- Uses MiniMax API (`MINIMAX_API_KEY`)
- Compares prediction to community averages
- Generates witty, family-friendly roast (<100 characters)
- Stored in `baby_shower.ai_roasts` table (optional, commented out)
- Does not block submission if AI fails

---

## 4. Baby Quiz

**Responsible Agent:** explorer  
**Session ID:** ses-baby-quiz-analysis

### Edge Functions Associated with Baby Quiz
**Primary Edge Function:**
- **`supabase/functions/quiz/index.ts`** - Main quiz submission handler
  - Handles POST requests for quiz submissions
  - Validates environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  - Accepts quiz data: participant name, 5 puzzle answers, score, total questions
  - Uses `insert_quiz_result` RPC function for database insertion
  - Returns success response with score details and milestone information

**Function Details:**
- Location: `C:\Project\Baby_Shower\supabase\functions\quiz\index.ts`
- Lines: 159 total
- Interface: `QuizRequest` with optional puzzle1-5 fields and required score/totalQuestions
- Validation: Comprehensive input validation using `validateInput` function
- Security: CORS headers and security headers applied

### Database Schemas Used by Baby Quiz
**Primary Table:**
- **`baby_shower.quiz_results`**

**Table Schema:**
```sql
CREATE TABLE IF NOT EXISTS baby_shower.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    participant_name TEXT NOT NULL CHECK (length >= 2 AND length <= 100),
    answers JSONB NOT NULL CHECK (jsonb_typeof = 'array'),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
    total_questions INTEGER DEFAULT 5,
    percentage INTEGER,
    submitted_by TEXT CHECK (length >= 2 OR NULL),
    puzzle1 TEXT,
    puzzle2 TEXT,
    puzzle3 TEXT,
    puzzle4 TEXT,
    puzzle5 TEXT,
    source_ip INET,
    user_agent TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);
```

**Supporting Functions:**
- **`baby_shower.insert_quiz_result`** - RPC function for inserting quiz results (bypasses RLS)
- **`baby_shower.sync_quiz_answers`** - Trigger function for syncing individual puzzle columns with JSONB answers
- **`public.get_quiz_results()`** - View function for retrieving quiz results
- **`public.quiz_results_v`** - SQL view for quiz results

**Indexes:**
- `idx_quiz_results_answers` - GIN index on answers JSONB column
- `idx_quiz_results_created_at` - B-tree index on created_at
- `idx_quiz_results_score_created` - Compound index on score DESC, created_at DESC

**RLS Policy:**
- Row Level Security enabled
- Policy: "Enable all for all users" (SELECT, INSERT, UPDATE, DELETE)

### Backend Scripts Related to Baby Quiz Functionality
**Configuration File:**
- **`scripts/config.js`** (lines 302-313)
  - Defines `QUIZ_PUZZLES` configuration with 10 puzzles:
    - puzzle1: 👶🎂🕯️ → "Birthday Cake"
    - puzzle2: 🍼👶 → "Baby Bottle"
    - puzzle3: 👶🐘 → "Baby Elephant"
    - puzzle4: 👶🧸 → "Teddy Bear"
    - puzzle5: 👶🩲 → "Diaper"
    - puzzle6-10: Additional puzzles defined

**API Integration:**
- **`scripts/api-supabase.js`** (lines 136, 310-380, 531-553)
  - `submitQuiz()` - Submits quiz answers to Edge Function
  - `getQuizResults()` - Retrieves quiz results via `queryBabyShowerSubmissions`
  - Realtime subscription channel: `quiz-changes` with filter `activity_type=eq.quiz`

**API Enhanced:**
- **`scripts/api-supabase-enhanced.js`** (lines 289-333)
  - Enhanced quiz submission with additional validation

**Main Application Logic:**
- **`scripts/main.js`** (comprehensive quiz integration)
  - Quiz form handling in `handleQuizSubmit()` function
  - Stats tracking: `quiz_count` variable
  - Milestone tracking: `QUIZ_25` and `QUIZ_50` thresholds
  - Activity navigation: 'quiz' section handling
  - Social sharing templates for quiz completion

### Frontend Scripts for Baby Quiz
**Primary Quiz Script:**
- **`scripts/quiz.js`** (209 lines)
  - Core functions exported:
    - `initializeQuiz()` - Quiz initialization
    - `validateQuizForm()` - Form validation
    - `getQuizFormData()` - Extract form data
    - `calculateQuizScore()` - Score calculation (0-5 scale)
    - `resetQuizForm()` - Reset form
    - `getQuizSuccessMessage()` - Success messages based on score
    - `getQuizProgress()` - Personal progress tracking
    - `checkQuizMilestone()` - Milestone checking
    - `getQuizMilestoneMessage()` - Milestone messages
    - `getQuizBadge()` - Badge emoji based on score

**Main Application Script:**
- **`scripts/main.js`** (extensive quiz integration)
  - Quiz form event listener setup
  - Real-time score display updates
  - Social sharing functionality for quiz results
  - Progress tracking and milestone celebration

**Frontend UI Components:**
- **`index.html`** (quiz section, lines 244-290)
  - Quiz section container with back button
  - Decorations using Michelle chibi images
  - 5 puzzle inputs with emoji displays:
    - 🍼🚿🐘 (puzzle1)
    - 🐺🐷🐷 (puzzle2)
    - 🌙⭐👶 (puzzle3)
    - 🍼🧴 (puzzle4)
    - 👶🩲 (puzzle5)

### Images Used in Baby Quiz
**Quiz-Specific Images:**
- **No dedicated quiz image files exist**
- Quiz uses CSS-generated SVG background pattern
- CSS Reference: `styles/main.css` (line 606-611)
- SVG Background: Question mark pattern (`?`) with playful styling

**Decoration Images Used in Quiz Section:**
- Michelle chibi images from Supabase storage:
  - `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/img1_chibi.png`
  - `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/img2_chibi.png`
  - `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Baby/chibi_michelle_sisters.png`

**CSS Background:**
```css
.activity-card[data-section="quiz"] .card-background-image {
    opacity: 0.32;
    background-size: cover;
    background-position: center;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ctext x='40' y='50' font-family='Arial' font-size='35' fill='%23F4E4BC' text-anchor='middle' font-weight='bold'%3E%3F%3C/text%3E%3C/svg%3E");
}
```

### How Input Data is Stored for Baby Quiz
**Data Flow:**
1. **User Input Collection:**
   - Form collects: participant name, 5 puzzle answers
   - Frontend validation ensures all fields are filled
   - Score calculated by comparing answers to `CONFIG.QUIZ_PUZZLES` answers

2. **Submission to Edge Function:**
   - Data sent via POST to `/functions/v1/quiz`
   - Payload structure:
     ```json
     {
       "name": "Participant Name",
       "puzzle1": "Birthday Cake",
       "puzzle2": "Baby Bottle",
       "puzzle3": "Baby Elephant",
       "puzzle4": "Teddy Bear",
       "puzzle5": "Diaper",
       "score": 5,
       "totalQuestions": 5
     }
     ```

3. **Edge Function Processing:**
   - Validates input using `validateInput()`
   - Calculates percentage: `(score / totalQuestions) * 100`
   - Uses RPC `insert_quiz_result` to bypass RLS

4. **Database Storage:**
   - Data stored in `baby_shower.quiz_results` table
   - Individual puzzle answers stored in both:
     - JSONB `answers` field: `{"puzzle1": "Birthday Cake", ...}`
     - Individual TEXT columns: `puzzle1`, `puzzle2`, etc.
   - Score and percentage calculated and stored
   - Auto-generated UUID and timestamp

5. **Realtime Updates:**
   - Supabase subscription on `quiz-changes` channel
   - Filters: `activity_type=eq.quiz`
   - Enables live scoreboard updates

6. **Data Retrieval:**
   - `get_quiz_results()` view function for reading quiz data
   - Results ordered by `created_at DESC`
   - Supports filtering and aggregation for leaderboards

**Security Considerations:**
- Input sanitization via `validateInput()`
- Security headers applied (CORS, security headers)
- Service role key used server-side (not exposed to client)
- Name length validation (2-100 characters)
- Answers validation (must be object with 5 puzzles)

---

## 5. Advice

**Responsible Agent:** explorer  
**Session ID:** ses-advice-analysis

### Edge Functions Associated with Advice
| File | Purpose |
|------|---------|
| `supabase/functions/advice/index.ts` | Main Edge Function - Handles advice submissions, validation, and AI roast generation |
| `supabase/functions/test-advice/index.ts` | Test Edge Function - Simple RPC test for advice insertion |

### Main Edge Function (`advice/index.ts`)
**Key Functions:**
- `handleAIRoast()` - Generates AI-powered roast commentary using MiniMax API
- Validates environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Supports two delivery methods: "For Parents" (general) and "For Baby" (fun/time capsule)
- AI roast feature uses `MINIMAX_API_KEY` for generating witty commentary

**API Endpoint:** `POST /functions/v1/advice`

**Request Fields:**
```typescript
{
  name?: string,      // Advice giver name
  advice?: string,    // Advice text
  message?: string,   // Alternative field for advice text
  category?: string,  // Delivery option
  adviceType?: string // Alternative field for delivery option
}
```

### Database Schemas Used by Advice
### Main Table: `baby_shower.advice`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key (auto-increment) |
| `advice_giver` | TEXT | Name of person giving advice |
| `advice_text` | TEXT | The actual advice message |
| `delivery_option` | TEXT | Category: 'general', 'fun', 'ai_roast', 'immediate' |
| `is_approved` | BOOLEAN | Approval status (default: false) |
| `ai_generated` | BOOLEAN | Whether content was AI-generated (default: false) |
| `submitted_by` | TEXT | Tracking field for submission source |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### Database Functions (RPC)
| Function | Schema | Purpose |
|----------|--------|---------|
| `baby_shower.insert_advice` | baby_shower | Inserts advice with submitted_by tracking |
| `public.get_advice_entries` | public | Retrieves all advice entries |
| `public.insert_advice_entry` | public | Simple advice insertion |

### Views
| View | Schema | Purpose |
|------|--------|---------|
| `baby_shower.advice_entries` | baby_shower | Aggregated advice from submissions |
| `public.advice_v` | public | Public-facing advice view |

### Indexes
- `idx_advice_created_at` - Index on `created_at` for sorting

### Security
- RLS (Row Level Security) enabled on `baby_shower.advice`
- Policy: "Enable all for all users" (full access)

### Backend Scripts Related to Advice Functionality
**No dedicated backend scripts found.** All backend logic is contained within the Edge Functions.

The Edge Function handles:
- Input validation and sanitization
- AI integration (MiniMax API for roasts)
- Database operations (Supabase client with service role)
- Error handling and response formatting

### Frontend Scripts for Advice
### Main Files
| File | Key Functions |
|------|---------------|
| `scripts/advice.js` | `initializeAdvice()`, `setupAdviceToggle()`, `validateAdviceForm()`, `getAdviceFormData()`, `triggerEnvelopeSuccess()`, `triggerCapsuleSuccess()`, `getParentingTip()` |
| `scripts/main.js:1417-1431` | `submitAdvice()` - Maps form data to API format |
| `scripts/api-supabase-enhanced.js:308-320` | `submitAdvice()` - Makes API call to Edge Function |

### Advice.js Public API
```javascript
window.Advice = {
    init: initializeAdvice,
    validateAdviceForm: validateAdviceForm,
    getAdviceFormData: getAdviceFormData,
    resetAdviceForm: resetAdviceForm,
    getAdviceSuccessMessage: getAdviceSuccessMessage,
    getAdviceProgress: getAdviceProgress,
    checkAdviceMilestone: checkAdviceMilestone,
    getAdviceMilestoneMessage: getAdviceMilestoneMessage,
    getParentingTip: getParentingTip
}
```

### Frontend API Flow
```
index.html (advice-form)
    ↓ submit
main.js submitAdvice()
    ↓
api-supabase-enhanced.js submitAdvice()
    ↓ POST /functions/v1/advice
advice Edge Function
    ↓ INSERT
baby_shower.advice table
```

### Images Used in Advice
### No dedicated advice-specific images found in local directories.

**Visual Elements Used:**
| Element | Type | Source |
|---------|------|--------|
| Card Icon | External URL | `chibi_michelle_sweet_smile.png` from Supabase Storage |
| Hero Icon | Emoji | 📜 (Unicode) |
| Toggle Icons | Emojis | 📬 (envelope), 🏺 (time capsule) |
| Success Icons | Emojis | 📬 (envelope seal), 🏺 (capsule bury) |

**Card Icon URL:**
```
https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Michelle/chibi_michelle_sweet_smile.png
```

### How Input Data is Stored for Advice
### Data Flow

1. **User Input (index.html)**
   - Form ID: `advice-form`
   - Fields: `advice-name`, `advice-type`, `advice-message`

2. **Frontend Processing (scripts/advice.js)**
   - Validates form (2-500 characters)
   - Gets form data via `getAdviceFormData()`
   - Triggers success animations based on delivery type

3. **API Submission (scripts/main.js + api-supabase-enhanced.js)**
   ```javascript
   submitAdvice({
       name: data.name,
       category: categoryMap[adviceType],  // 'For Parents' → 'general', 'For Baby' → 'fun'
       advice: data.message
   })
   ```

4. **Edge Function Processing (supabase/functions/advice/index.ts)**
   - Normalizes category/adviceType fields
   - Maps frontend values to database values:
     - "For Parents" / "parents" / "general" → "general"
     - "For Baby" / "baby" / "fun" → "fun"
     - "18th birthday" / "time capsule" → "fun"
   - Validates advice text (min 2 chars, max 2000 chars)
   - Calls MiniMax API if `ai_roast` category

5. **Database Storage (baby_shower.advice)**
   ```sql
   INSERT INTO baby_shower.advice (
       advice_giver,      -- From 'name' field
       advice_text,       -- Sanitized message (max 2000 chars)
       delivery_option,   -- Mapped category
       submitted_by,      -- Same as advice_giver
       ai_generated,      -- true only for AI roast
       is_approved        -- false by default
   ) VALUES (...)
   ```

### Storage Locations
| Data | Location | Access |
|------|----------|--------|
| Advice submissions | `baby_shower.advice` table | Full RLS access |
| Milestone tracking | `CONFIG.MILESTONES` in scripts | In-memory |
| Parenting tips | `scripts/advice.js:280-294` | Hardcoded array |

### Delivery Options
| Frontend Value | Database Value | Purpose |
|----------------|----------------|---------|
| "For Parents" | "general" | Immediate sharing with parents |
| "For Baby" | "fun" | Time capsule for 18th birthday |
| "AI Roast" | "ai_roast" | AI-generated witty commentary |

---

## 6. The Shoe Game

**Responsible Agent:** explorer  
**Session ID:** ses-shoe-game-analysis

### Edge Functions Associated with the Shoe Game
**Status: NONE** - The Shoe Game (also known as "Who Would Rather") does NOT use any Edge Functions. According to the AGENTS.md documentation (section "Deprecated Components", dated 2026-01-08), the shoe game was simplified to **frontend-only** as of January 8, 2026.

The `who-would-rather` Edge Function was **DELETED** from the Supabase project.

### Database Schemas Used by the Shoe Game
**Primary Tables (defined in `docs/cleanup/migrations/20260104_who_would_rather_schema.sql`):**

| Table Name | Columns | Status |
|------------|---------|--------|
| `baby_shower.who_would_rather_sessions` | id, session_code, status, current_question_index, total_questions, created_at, completed_at, created_by | **EXISTS** (0 rows) |
| `baby_shower.who_would_rather_questions` | id, question_text, question_number (1-24), category, difficulty, is_active, created_at | **EXISTS** (24 rows) |
| `baby_shower.who_would_rather_votes` | id, session_id, question_number, guest_name, vote_choice, voted_at, submitted_by | **EXISTS** (0 rows) |

**Views:**
- `baby_shower.who_would_rather_results` - Real-time calculated voting results

**Migration applied:**
- `add_submitted_by_to_who_would_rather_votes.sql` - Adds `submitted_by` column to track which guest submitted votes

**Note:** These tables exist but are **NOT USED** by the current frontend-only implementation. The frontend stores all data in local JavaScript state.

### Backend Scripts Related to Shoe Game Functionality
**Status: NONE** - There are no active backend scripts for the shoe game.

**Historical (deprecated):**
- The old database schema and migrations exist in `docs/cleanup/migrations/` but are no longer actively used
- No Edge Functions exist for shoe game operations

### Frontend Scripts for the Shoe Game
**Primary Implementation File:**
- **`scripts/who-would-rather.js`** (287 lines)

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `init()` | Initialize the game, find container element |
| `render()` | Render current question or results |
| `renderQuestion()` | Display voting interface for current question |
| `renderResults()` | Show final voting results with percentages |
| `vote(choice)` | Record vote for parentA or parentB |
| `restart()` | Reset game to initial state |
| `backToActivities()` | Return to main activities menu |
| `configure(config)` | Update parent names and avatars dynamically |

**Configuration:**
```javascript
CONFIG = window.ShoeGameConfig || {
    parentA: { name: 'Mom', avatar: '' },
    parentB: { name: 'Dad', avatar: '' },
    autoAdvanceDelay: 800
}
```

**Questions Array:** 19 predefined questions hardcoded in JavaScript (lines 25-46)

### Images Used in the Shoe Game
**Avatar Images (hosted on Supabase Storage):**

| Parent | Default Avatar URL |
|--------|-------------------|
| Parent A (Mom) | `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Michelle/chibi_michelle_excited_red.png` |
| Parent B (Dad) | `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Jazeel/chibi_jazeel_eating.png` |

**Activity Card Icon:**
- `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Duo/chibi_duo_highfive.png`

**All images are hosted externally on Supabase Storage, not in the project repository.**

### How Input Data is Stored for the Shoe Game
**Current Implementation (Frontend-Only):**

| Data Type | Storage Method | Details |
|-----------|---------------|---------|
| Questions | Hardcoded JavaScript array | 19 questions in `scripts/who-would-rather.js` (lines 25-46) |
| Votes | Local JavaScript state | Stored in `state.votes` array in memory |
| Session Progress | Local JavaScript state | `state.currentQuestion`, `state.hasVoted` |
| Parent Names | `window.ShoeGameConfig` | Configurable via global window object |
| Results | Calculated locally | Percentages computed in `renderResults()` function |

**Data Flow:**
1. User taps parent avatar to vote
2. Vote is stored in `state.votes` array
3. After 800ms delay, auto-advance to next question
4. At end (question 19), calculate and display results
5. All data is **session-only** - lost on page refresh

**No backend persistence occurs.** The database tables exist but are empty and unused.