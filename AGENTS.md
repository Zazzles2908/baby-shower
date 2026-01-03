# AGENTS.md - Baby Shower V2 Development Guide

**Purpose:** Single source of truth for design vision AND development practices. This document captures *why* we're building something AND *how* to build it correctly.

**Created:** 2026-01-03  
**Status:** Living Document (Design Intent + Technical Guidelines)

---

## 🎯 Design Vision (Read First)

**Core Philosophy:** Transform static digital greeting cards into an **interactive "digital living room"** where guests feel welcomed through character-based hospitality, not form-based transactions.

**Key Principles:**
- **Warmth over efficiency** - Every interaction should feel like a host greeting you
- **Character over components** - Users talk to hosts, not fill forms  
- **Motion serves emotion** - Animations must enhance feeling, not just decorate
- **Safety through architecture** - Data protection built into design, not just policies

**The Three Pillars:**
- **Soul (Frontend)** - Emotional layer: "Does this feel alive?"
- **System (Backend)** - Reliability layer: "Is this secure?"  
- **Brain (AI)** - Intelligence layer: "What's the right response?"

---

## 🛠️ Development Commands

### Development Server
```bash
npm run dev              # Start local server at http://localhost:3000
```

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test categories  
npm run test:frontend    # Frontend functionality tests
npm run test:api        # API integration tests
npm run test:db         # Database verification tests
npm run test:errors     # Error handling tests
npm run test:flow       # Data flow tests

# Run single test file
npx playwright test --config=tests/playwright.config.js tests/e2e/baby-shower.test.js

# Run tests with specific grep pattern
npx playwright test --config=tests/playwright.config.js --grep="guestbook"

# Browser-specific testing
npm run test:chromium   # Chrome only
npm run test:firefox    # Firefox only  
npm run test:webkit     # Safari only
npm run test:mobile     # Mobile browsers

# Debug and UI modes
npm run test:debug      # Run in debug mode
npm run test:ui         # Open Playwright UI
npm run test:headed     # Show browser during tests
```

### Deployment
```bash
npm run commit          # Custom commit script with validation
npm run push            # Push to main branch
npm run deploy          # Commit + push sequence
```

---

## 📋 Code Style Guidelines

### JavaScript Conventions
- **Frontend**: Vanilla ES6+ JavaScript, no frameworks
- **Backend**: TypeScript for Edge Functions (Deno runtime)
- **Module Pattern**: IIFE (Immediately Invoked Function Expression) for frontend scripts
- **Global Namespace**: Attach functions to `window` object (e.g., `window.API`, `window.CONFIG`)

### Naming Conventions
```javascript
// Variables: camelCase
const guestName = 'Test User';
let submissionCount = 0;

// Constants: UPPER_SNAKE_CASE  
const API_TIMEOUT = 30000;
const MAX_VOTES_PER_GUEST = 3;

// Functions: camelCase, descriptive
function validateGuestbookEntry(data) { }
async function fetchGuestbookEntries() { }

// CSS Classes: kebab-case
.guestbook-form { }
.character-mom { }

// File Names: kebab-case
scripts/guestbook.js
styles/animations.css
```

### Error Handling Pattern
```javascript
// Always use try-catch with specific error messages
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('API Error:', error.message);
  throw new Error(`Failed to fetch data: ${error.message}`);
}
```

### API Response Format
```javascript
// Success response
{
  success: true,
  data: { /* payload */ },
  message: 'Optional success message'
}

// Error response  
{
  success: false,
  error: 'Human-readable error message',
  details: { /* optional technical details */ }
}
```

### Frontend Script Structure
```javascript
/**
 * Baby Shower App - [Feature Name]
 * Brief description of what this script does
 */

(function() {
    'use strict';
    
    console.log('[Feature] loading...');
    
    // Private variables
    let privateVar = 'value';
    
    // Public API
    window.FEATURE = {
        init: initializeFeature,
        publicMethod: publicFunction
    };
    
    function initializeFeature() {
        // Initialization logic
    }
    
    function publicFunction() {
        // Public method implementation
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFeature);
    } else {
        initializeFeature();
    }
})();
```

### TypeScript Edge Functions

#### 🛡️ Security-First Pattern (Recommended)
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface RequestData {
  // Define your request structure
}

serve(async (req: Request) => {
  // Combine CORS and security headers
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // 1. Validate environment variables first
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    // 2. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. Parse and validate request body
    let body: RequestData
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // 4. Input validation using standardized function
    const validation = validateInput(body, {
      // Define your validation rules here
      fieldName: { 
        type: 'string', 
        required: true, 
        minLength: 1, 
        maxLength: 100 
      }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // 5. Your business logic here
    const result = await yourBusinessLogic(supabase, validation.sanitized)

    // 6. Return standardized success response
    return createSuccessResponse(result, 201)

  } catch (error) {
    console.error('Edge Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

async function yourBusinessLogic(supabase: any, data: any) {
  // Your implementation here
  return { message: 'Success', data }
}
```

#### 🤖 AI Integration Pattern
```typescript
// AI integration with timeout and error handling
async function handleAIRequest(prompt: string, apiKey: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('https://api.ai-provider.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'ai-model-name',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('AI API error:', response.status)
      throw new Error(`AI service returned status ${response.status}`)
    }

    const aiData = await response.json()
    return aiData.choices?.[0]?.message?.content || 'AI response unavailable'

  } catch (error) {
    console.error('AI request failed:', error)
    throw new Error('Failed to generate AI response')
  }
}
```

---

## 🛡️ Shared Security Utilities

Our Edge Functions use standardized security utilities located in `supabase/functions/_shared/security.ts`. Always import and use these functions for consistency and security.

### Environment Validation
```typescript
import { validateEnvironmentVariables } from '../_shared/security.ts'

// Validate required environment variables
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
], ['MINIMAX_API_KEY']) // optional vars

if (!envValidation.isValid) {
  console.error('Environment validation failed:', envValidation.errors)
  return createErrorResponse('Server configuration error', 500)
}
```

### Standardized Response Functions
```typescript
import { createErrorResponse, createSuccessResponse } from '../_shared/security.ts'

// Error response with security headers
return createErrorResponse('Validation failed', 400, validationErrors)

// Success response with security headers  
return createSuccessResponse(data, 201)
```

### Input Validation
```typescript
import { validateInput } from '../_shared/security.ts'

const validation = validateInput(requestBody, {
  name: { 
    type: 'string', 
    required: true, 
    minLength: 1, 
    maxLength: 100 
  },
  age: {
    type: 'number',
    required: false,
    min: 0,
    max: 120
  },
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}

// Use sanitized data
const sanitizedData = validation.sanitized
```

### Security & CORS Headers
```typescript
import { CORS_HEADERS, SECURITY_HEADERS } from '../_shared/security.ts'

// Combine headers for all responses
const headers = new Headers({
  ...CORS_HEADERS,
  ...SECURITY_HEADERS,
  'Content-Type': 'application/json',
})
```

---

## 🔧 Technical Standards

### Environment Variables
- Never commit sensitive data
- Use `window.ENV` for frontend environment variables
- Use `Deno.env.get()` for backend environment variables
- Always provide fallback values for development

### Security Requirements
- ** baby's name NEVER in code/commits** - Use environment variables only
- **RLS Policies** - All database tables must have Row Level Security enabled
- **Input Validation** - Validate all user inputs on both client and server
- **CORS Configuration** - Properly configured for cross-origin requests

### Performance Guidelines
- **API Timeout**: 30 seconds maximum
- **File Upload**: 5MB maximum, JPEG/PNG/GIF only
- **Mobile First**: All features must work on mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript

### Testing Standards
- **E2E Tests Required** for all new features
- **Test Data Generation** - Use existing data generators in `tests/e2e/data-generator.js`
- **Cross-Browser** - Test on Chromium, Firefox, WebKit
- **Mobile Testing** - Test on mobile Chrome and Safari
- **Error Scenarios** - Test network failures and invalid inputs

---

## 🚨 Common Pitfalls to Avoid

### Frontend Development
1. **Don't use ES6 modules in frontend scripts** - Use IIFE pattern instead
2. **Don't hardcode the baby's name** - Use environment variables
3. **Don't skip error handling** - Every async operation needs try-catch
4. **Don't forget mobile testing** - Mobile-first is required
5. **Don't commit sensitive data** - Use .env.local and never commit it

### Edge Function Development

#### ❌ **BEFORE: Manual Error Handling (Inconsistent)**
```typescript
// ❌ Don't do this - inconsistent error responses
if (!response.ok) {
  return new Response(
    JSON.stringify({ error: 'Something went wrong' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

#### ✅ **AFTER: Standardized Error Responses**
```typescript
// ✅ Do this - consistent, secure error handling
if (!response.ok) {
  return createErrorResponse('Database operation failed', 500)
}
```

#### ❌ **BEFORE: Missing Security Headers**
```typescript
// ❌ Don't do this - missing security headers
const headers = new Headers({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
})
```

#### ✅ **AFTER: Complete Security Headers**
```typescript
// ✅ Do this - comprehensive security headers
const headers = new Headers({
  ...CORS_HEADERS,
  ...SECURITY_HEADERS,
  'Content-Type': 'application/json',
})
```

#### ❌ **BEFORE: Manual Environment Validation**
```typescript
// ❌ Don't do this - incomplete validation
if (!Deno.env.get('SUPABASE_URL')) {
  throw new Error('Missing SUPABASE_URL')
}
```

#### ✅ **AFTER: Standardized Environment Validation**
```typescript
// ✅ Do this - comprehensive environment validation
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
], ['MINIMAX_API_KEY'])

if (!envValidation.isValid) {
  console.error('Environment validation failed:', envValidation.errors)
  return createErrorResponse('Server configuration error', 500)
}
```

#### ❌ **BEFORE: Manual Input Validation**
```typescript
// ❌ Don't do this - incomplete validation
if (!body.name || body.name.length > 100) {
  return new Response(
    JSON.stringify({ error: 'Invalid name' }),
    { status: 400, headers }
  )
}
```

#### ✅ **AFTER: Standardized Input Validation**
```typescript
// ✅ Do this - comprehensive input validation
const validation = validateInput(body, {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}
```

#### ❌ **BEFORE: AI Integration Without Timeout**
```typescript
// ❌ Don't do this - no timeout protection
const response = await fetch('https://api.ai-provider.com/v1/chat', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
})
```

#### ✅ **AFTER: AI Integration with Timeout**
```typescript
// ✅ Do this - timeout protection for AI calls
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

const response = await fetch('https://api.ai-provider.com/v1/chat', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  signal: controller.signal,
})

clearTimeout(timeoutId)
```

### Edge Function Checklist
Before deploying any Edge Function, verify:
- [ ] Import all security utilities from `../_shared/security.ts`
- [ ] Use `validateEnvironmentVariables()` for all env vars
- [ ] Use `validateInput()` for all user input
- [ ] Use `createErrorResponse()` and `createSuccessResponse()`
- [ ] Include both `CORS_HEADERS` and `SECURITY_HEADERS`
- [ ] Add timeout protection for external API calls
- [ ] Log errors with `console.error()` for monitoring
- [ ] Test with invalid inputs and missing environment variables
- [ ] Verify CORS works from frontend origin

---

## 📚 Reference Documentation

- **Design Vision**: See original AGENTS.md for detailed character system and design philosophy
- **API Documentation**: `docs/reference/API.md`
- **Database Schema**: `docs/reference/SCHEMA.md`  
- **Testing Guide**: `docs/technical/TESTING.md`
- **Deployment Guide**: `docs/technical/DEPLOYMENT.md`
- **Project Analysis**: `docs/PROJECT_ANALYSIS_SUMMARY.md`
- **Game Design**: `docs/game-design/mom-vs-dad-GAME_DESIGN.md`

---

## 🎮 MOM VS DAD GAME - IMPLEMENTATION GUIDE

### Current System Status (2026-01-03)

**✅ PRODUCTION READY:**
- 5 Activities: Guestbook, Baby Pool, Quiz, Advice, Voting
- 5 Edge Functions: All working with AI integration
- Database: Normalized schema in `baby_shower` namespace
- Realtime: Supabase subscriptions for live updates
- AI: MiniMax API integrated in pool/advice functions
- Testing: Playwright E2E test suite configured

### Game Architecture Overview

**New Game:** "Mom vs Dad: The Truth Revealed" - 6th activity
**Core Loop:** Guess → Reveal → Roast
**Integration:** Uses existing `baby_shower` schema, extends with new tables

### Database Schema (New Tables)

**File:** `supabase/migrations/20260103_mom_vs_dad_game_schema.sql`

```sql
-- 5 new tables in baby_shower namespace (integrates with existing!)
CREATE TABLE baby_shower.game_sessions (
    -- Session management with 6-char guest code + 4-digit admin PIN
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'setup',  -- setup, voting, revealed, complete
    mom_name VARCHAR(100) NOT NULL,
    dad_name VARCHAR(100) NOT NULL,
    admin_code VARCHAR(10) NOT NULL,  -- 4-digit PIN for parents
    total_rounds INTEGER DEFAULT 5,
    current_round INTEGER DEFAULT 0
);

CREATE TABLE baby_shower.game_scenarios (
    -- AI-generated "who would rather" questions
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions,
    scenario_text TEXT NOT NULL,  -- "It's 3 AM. Baby explodes diaper..."
    mom_option TEXT NOT NULL,      -- "Mom would retch"
    dad_option TEXT NOT NULL,      -- "Dad would clean it up"
    intensity DECIMAL(3,2) DEFAULT 0.5,  -- Comedy level 0.1-1.0
    theme_tags TEXT[] DEFAULT '{}'  -- ['farm', 'funny', 'sleep']
);

CREATE TABLE baby_shower.game_votes (
    -- Guest votes (separate from name voting!)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES game_scenarios,
    guest_name VARCHAR(100) NOT NULL,
    vote_choice VARCHAR(10) CHECK (vote_choice IN ('mom', 'dad'))
);

CREATE TABLE baby_shower.game_answers (
    -- Parent's secret answers (locked before reveal!)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES game_scenarios,
    mom_answer VARCHAR(10),  -- 'mom' or 'dad'
    dad_answer VARCHAR(10),
    mom_locked BOOLEAN DEFAULT FALSE,
    dad_locked BOOLEAN DEFAULT FALSE,
    final_answer VARCHAR(10)  -- Consensus or coin flip
);

CREATE TABLE baby_shower.game_results (
    -- Perception gap + AI roast commentary
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES game_scenarios,
    mom_votes INTEGER DEFAULT 0,
    dad_votes INTEGER DEFAULT 0,
    mom_percentage DECIMAL(5,2),
    crowd_choice VARCHAR(10),  -- Who majority picked
    actual_choice VARCHAR(10),  -- Real answer
    perception_gap DECIMAL(5,2),  -- How wrong crowd was
    roast_commentary TEXT,  -- Moonshot AI generated
    particle_effect VARCHAR(20) DEFAULT 'confetti'
);
```

### Edge Functions to Build

**Pattern:** Follow existing Edge Function structure (Deno, TypeScript, CORS)

| Function | Purpose | AI Provider |
|----------|---------|-------------|
| `game-session` | Create/manage sessions, generate codes | None |
| `game-scenario` | Generate Z.AI scenarios | Z.AI (GLM-4.7) |
| `game-vote` | Submit votes, realtime sync | None |
| `game-reveal` | Generate Moonshot roasts | Moonshot (Kimi-K2) |

### AI Integration

**Existing (MiniMax):**
```typescript
// Already working in pool/advice functions
const roastResponse = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('MINIMAX_API_KEY')}` },
    body: JSON.stringify({ model: 'abab6.5s-chat', messages: [...] })
});
```

**New for Game:**

**Z.AI Scenario Generation:**
```typescript
// Generate funny "who would rather" scenarios
const scenarioResponse = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('Z_AI_API_KEY')}` },
    body: JSON.stringify({
        prompt: `Generate a funny baby shower scenario about ${mom_name} vs ${dad_name}. 
                 Theme: Farm/Cozy. Return JSON with scenario_text, mom_option, dad_option, intensity.`
    })
});
```

**Moonshot Roast Commentary:**
```typescript
// Generate sassy perception gap roasts
const roastResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('KIMI_API_KEY')}` },
    body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [{
            role: 'system',
            content: 'You are a sassy barnyard host roasting wrong predictions...'
        }, {
            role: 'user',
            content: `Crowd thought: ${mom_pct}% picked Mom. Reality: ${actual_answer}. 
                      Roast this perception gap!`
        }]
    })
});
```

### Frontend Implementation

**Pattern:** IIFE with global namespace (existing pattern)

```javascript
// New file: scripts/mom-vs-dad.js
(function() {
    'use strict';
    
    console.log('[MomVsDad] loading...');
    
    // State
    let currentSession = null;
    let currentScenario = null;
    
    // Public API
    window.MomVsDad = {
        init: initializeGame,
        joinSession: joinSession,
        submitVote: submitVote,
        lockAnswer: lockAnswer,
        adminLogin: adminLogin
    };
    
    function initializeGame() { ... }
    function joinSession(code, name) { ... }
    function submitVote(choice) { ... }  // 'mom' or 'dad'
    function lockAnswer(choice) { ... }  // Parents only
    function adminLogin(code) { ... }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
})();
```

### Realtime Events

**Channel:** `game_state`

```typescript
// Server → Client
{ type: 'scenario_new', payload: { scenario_id, text, options } }
{ type: 'vote_update', payload: { mom_votes, dad_votes, mom_pct, dad_pct } }
{ type: 'answer_locked', payload: { parent: 'mom' | 'dad' } }
{ type: 'reveal_trigger', payload: { scenario_id } }
{ type: 'result_reveal', payload: { votes, actual, roast, particles } }

// Client → Server
{ type: 'submit_vote', payload: { scenario_id, choice: 'mom' | 'dad' } }
{ type: 'lock_answer', payload: { scenario_id, choice: 'mom' | 'dad', admin_code } }
{ type: 'trigger_reveal', payload: { scenario_id, admin_code } }
```

### Game Flow States

```javascript
// States: setup → voting → revealed → complete
const GAME_STATES = {
    SETUP: 'setup',      // Configuring session
    VOTING: 'voting',    // Guests submitting votes
    REVEALED: 'revealed', // Results shown, roasts delivered
    COMPLETE: 'complete'  // Game finished
};

// Round progression
const gameSession = {
    status: GAME_STATES.SETUP,
    currentRound: 0,
    totalRounds: 5,
    scenarios: [],
    results: []
};
```

### Visual Feedback System

**Chibi Avatar Animations:**
```javascript
// Vote comes in
if (vote === 'mom') {
    momChibi.bounce(0.2);  // Small bounce
    momChibi.glow('gold', 2000);  // Gold glow for 2s
    tugOfWarBar.animateTo(60, 40);  // Update bar
}

// Reveal
if (guestVote === actualAnswer) {
    particles.confetti('green');  // Correct vote!
    chibiWin.celebrate();  // Victory animation
} else {
    chibiThink.confused();  // Head scratch animation
}

// Perception gap detected
if (perceptionGap > 50) {
    // Major gap! Big roast coming
    moonshotRoast.show(gapAnalysis);
    particles.rainbow();  // Dramatic effect
}
```

### Admin Panel

**Access:** 4-digit PIN authentication  
**Features:**
- View current vote tally (live updates)
- Lock in answer (mom/dad)
- See partner's lock status
- Trigger reveal when both locked
- View round results and roasts

### Implementation Phases

**Phase 1: Database & Backend (2-3 days)**
- [ ] Apply migration: `supabase/migrations/20260103_mom_vs_dad_game_schema.sql`
- [ ] Create `game-session` Edge Function
- [ ] Create `game-scenario` Edge Function (Z.AI)
- [ ] Create `game-vote` Edge Function
- [ ] Create `game-reveal` Edge Function (Moonshot)

**Phase 2: Frontend (3-4 days)**
- [ ] Create `scripts/mom-vs-dad.js`
- [ ] Build session join screen
- [ ] Build voting interface (swipe Left/Right)
- [ ] Implement Tug-of-War animation
- [ ] Build admin panel (4-digit PIN)
- [ ] Create result reveal screen
- [ ] Add chibi avatar animations

**Phase 3: Integration & Testing (2-3 days)**
- [ ] Connect frontend to Edge Functions
- [ ] Implement Supabase realtime
- [ ] Test AI scenario quality
- [ ] Test roast appropriateness
- [ ] E2E test suite with Playwright
- [ ] Cross-browser testing

**Phase 4: Polish & Deploy (1-2 days)**
- [ ] Performance optimization
- [ ] Error handling
- [ ] Documentation
- [ ] Deploy to Vercel

### Key Implementation Notes

1. **Reuse Existing Patterns:**
   - IIFE pattern for all frontend scripts
   - Global namespace (`window.MomVsDad`)
   - CORS headers in all Edge Functions
   - Try-catch error handling
   - Realtime subscriptions via Supabase

2. **AI Provider Keys:**
   - Z.AI: `Z_AI_API_KEY` (scenario generation)
   - Moonshot: `KIMI_API_KEY` (roast commentary)
   - MiniMax: `MINIMAX_API_KEY` (already configured, pool/advice)

3. **Database:**
   - Uses existing `baby_shower` namespace
   - Follows existing RLS patterns
   - UUID primary keys
   - TIMESTAMPTZ timestamps

4. **Testing:**
   - Use existing Playwright configuration
   - Test data generator in `tests/e2e/data-generator.js`
   - Follow existing test patterns

### Files to Create/Modify

**New Files:**
- `supabase/functions/game-session/index.ts`
- `supabase/functions/game-scenario/index.ts`
- `supabase/functions/game-vote/index.ts`
- `supabase/functions/game-reveal/index.ts`
- `scripts/mom-vs-dad.js`
- Update `index.html` to include game section

**Modify Files:**
- `scripts/config.js` - Add game configuration
- `styles/main.css` - Add game-specific styles
- `styles/animations.css` - Add game animations

---

**Document Version: 3.0**  
**Purpose: Complete Development Guide with Game Implementation**  
**Read this before implementing Mom vs Dad game features**