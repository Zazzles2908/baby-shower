# Mom vs Dad Game - Edge Functions Implementation

**Status**: ✅ Complete  
**Created**: 2026-01-03  
**Version**: 1.0

---

## Overview

The Mom vs Dad game is the 6th activity for the Baby Shower app, featuring:
- Interactive "who would rather" scenarios
- AI-generated questions using Z.AI (GLM-4.7)
- Live voting with realtime updates
- Moonshot AI roast commentary
- Admin panel for game management

## Edge Functions

### 1. `game-session` - Session Management

**Purpose**: Create and manage game sessions

**Methods**:
- `POST` - Create session, join session, update status, admin login
- `GET` - Retrieve session by code

**Endpoints**:

#### Create Session
```bash
POST /game-session
Content-Type: application/json

{
  "action": "create",
  "mom_name": "Sarah",
  "dad_name": "Mike",
  "total_rounds": 5,
  "createdBy": "Host Name"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "session_code": "ABC123",
    "admin_code": "5678",
    "mom_name": "Sarah",
    "dad_name": "Mike",
    "status": "setup",
    "current_round": 0,
    "total_rounds": 5,
    "created_at": "2026-01-03T10:00:00Z"
  }
}
```

#### Get Session
```bash
GET /game-session?code=ABC123
```

#### Admin Login
```bash
POST /game-session
Content-Type: application/json

{
  "action": "admin_login",
  "session_code": "ABC123",
  "admin_code": "5678"
}
```

#### Update Session Status
```bash
POST /game-session
Content-Type: application/json

{
  "action": "update",
  "session_code": "ABC123",
  "admin_code": "5678",
  "status": "voting",
  "current_round": 1
}
```

**Status Values**: `setup` → `voting` → `revealed` → `complete`

---

### 2. `game-scenario` - AI Scenario Generation

**Purpose**: Generate funny "who would rather" scenarios using Z.AI

**Methods**:
- `POST` - Generate new scenario
- `GET` - Get current scenario

**Endpoints**:

#### Generate Scenario
```bash
POST /game-scenario
Content-Type: application/json

{
  "session_id": "uuid",
  "mom_name": "Sarah",
  "dad_name": "Mike",
  "theme": "funny"  // optional: general, farm, funny, sleep, feeding, messy, emotional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario_id": "uuid",
    "scenario_text": "It's 3 AM and the baby has a dirty diaper...",
    "mom_option": "Sarah would handle it with grace",
    "dad_option": "Mike would figure it out",
    "intensity": 0.7
  },
  "ai_generated": true
}
```

#### Get Current Scenario
```bash
GET /game-scenario?session_id=uuid
```

**AI Providers**: Z.AI (primary) → OpenRouter GLM-4 (fallback)

---

### 3. `game-vote` - Vote Submission

**Purpose**: Submit guest votes and lock parent answers

**Methods**:
- `POST` - Submit vote, lock answer
- `GET` - Get vote counts

**Endpoints**:

#### Submit Vote
```bash
POST /game-vote
Content-Type: application/json

{
  "scenario_id": "uuid",
  "guest_name": "Guest Name",
  "vote_choice": "mom"  // or "dad"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "vote_counts": {
      "mom_votes": 5,
      "dad_votes": 3,
      "mom_pct": 62,
      "dad_pct": 38,
      "total_votes": 8
    },
    "your_vote": {
      "scenario_id": "uuid",
      "guest_name": "Guest Name",
      "choice": "mom"
    }
  }
}
```

#### Lock Parent Answer (Admin)
```bash
POST /game-vote
Content-Type: application/json

{
  "scenario_id": "uuid",
  "parent": "mom",  // or "dad"
  "answer": "mom",  // or "dad"
  "admin_code": "5678"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "locked": true,
    "both_locked": true,
    "mom_locked": true,
    "dad_locked": true,
    "mom_answer": "mom",
    "dad_answer": "dad"
  }
}
```

#### Get Vote Counts
```bash
GET /game-vote?scenario_id=uuid
```

---

### 4. `game-reveal` - Results & AI Roasts

**Purpose**: Reveal results with Moonshot AI roast commentary

**Methods**:
- `POST` - Trigger reveal (admin)
- `GET` - Get reveal status and results

**Endpoints**:

#### Trigger Reveal (Admin)
```bash
POST /game-reveal
Content-Type: application/json

{
  "scenario_id": "uuid",
  "admin_code": "5678"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "roast_commentary": "😅 Oops! 62% were SO wrong about Sarah!",
    "perception_gap": 12.5,
    "vote_comparison": {
      "mom_votes": 5,
      "dad_votes": 3,
      "mom_percentage": 62,
      "dad_percentage": 38,
      "total_votes": 8,
      "crowd_choice": "mom",
      "actual_choice": "dad"
    },
    "particle_effect": "confetti",
    "result_id": "uuid"
  }
}
```

#### Get Reveal Status
```bash
GET /game-reveal?scenario_id=uuid
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scenario_id": "uuid",
    "is_revealed": true,
    "both_parents_locked": true,
    "session_status": "revealed",
    "result": {
      "roast_commentary": "😅 Oops! 62% were SO wrong about Sarah!",
      "perception_gap": 12.5,
      "vote_comparison": { ... },
      "particle_effect": "confetti"
    }
  }
}
```

---

## Game Flow

```
1. CREATE SESSION (Host)
   ↓
2. GENERATE SCENARIOS (AI)
   ↓
3. GUESTS JOIN & VOTE (Voting Phase)
   ↓
4. PARENTS LOCK ANSWERS (Admin Panel)
   ↓
5. TRIGGER REVEAL (Admin Panel)
   ↓
6. AI ROAST COMMENTARY
   ↓
7. NEXT ROUND or COMPLETE
```

---

## Environment Variables

```bash
# Required for all functions
POSTGRES_URL=postgresql://...
SUPABASE_DB_URL=postgresql://...
DATABASE_URL=postgresql://...

# Optional - AI Features
Z.AI_API_KEY=your_z_ai_key           # Scenario generation (primary)
OPENROUTER_API_KEY=your_key          # Scenario generation (fallback)
MINIMAX_API_KEY=your_key             # Roast commentary (primary)
KIMI_CODING_API_KEY=your_key         # Roast commentary (fallback)
```

---

## Database Schema

Uses 5 tables in `baby_shower` namespace:

1. **game_sessions** - Session management
2. **game_scenarios** - AI-generated questions
3. **game_votes** - Guest votes
4. **game_answers** - Parent's secret answers
5. **game_results** - Results with AI roasts

See: `supabase/migrations/20260103_mom_vs_dad_game_schema.sql`

---

## Realtime Events

**Channel**: `game_state` (via Supabase Realtime)

**Event Types**:
- `scenario_new` - New scenario generated
- `vote_update` - Vote counts changed
- `answer_locked` - Parent locked answer
- `reveal_trigger` - Reveal triggered
- `result_reveal` - Results revealed with roast

---

## Testing

Run the test suite:

```bash
# Browser console
MomVsDadTests.runIntegrationTests()

# Or manually test endpoints
npx playwright test tests/mom-vs-dad-game.test.js
```

See: `tests/mom-vs-dad-game.test.js`

---

## Frontend Integration

```javascript
// Initialize game
window.MomVsDad = {
  init: initializeGame,
  joinSession: joinSession,
  submitVote: submitVote,
  lockAnswer: lockAnswer,
  adminLogin: adminLogin
}

// Create session
const session = await fetch('/game-session', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    mom_name: 'Sarah',
    dad_name: 'Mike'
  })
})
```

---

## Error Handling

All functions return consistent error format:

```json
{
  "error": "Human-readable error message",
  "details": { "field": "validation error" }
}
```

**Common Errors**:
- `400` - Validation failed / Invalid request
- `401` - Invalid admin PIN
- `404` - Session/Scenario not found
- `405` - Method not allowed
- `500` - Internal server error

---

## Performance Notes

- **Timeout**: 10s for AI operations
- **Database**: Direct Postgres connection (faster than HTTP)
- **AI Fallback**: Automatic fallback if primary provider fails
- **Rate Limiting**: None (per-event basis)

---

## Security

- **Admin PIN**: 4-digit numeric code
- **Session Code**: 6-character alphanumeric
- **Input Validation**: All inputs sanitized
- **CORS**: Open access for demo (restrict in production)

---

## Files Created

```
supabase/functions/
├── game-session/
│   ├── config.toml
│   └── index.ts          (611 lines)
├── game-scenario/
│   ├── config.toml
│   └── index.ts          (391 lines)
├── game-vote/
│   ├── config.toml
│   └── index.ts          (526 lines)
└── game-reveal/
    ├── config.toml
    └── index.ts          (718 lines)

tests/
└── mom-vs-dad-game.test.js

docs/
└── MOM_VS_DAD_GAME.md    (this file)
```

---

**Next Steps**:
1. Apply database migration: `supabase/migrations/20260103_mom_vs_dad_game_schema.sql`
2. Deploy Edge Functions
3. Build frontend integration
4. Test with Playwright
5. Deploy to production
