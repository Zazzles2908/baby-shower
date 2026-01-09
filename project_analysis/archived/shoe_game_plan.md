# Shoe Game Strategic Plan

**Date:** January 9, 2026  
**Component:** Shoe Game (Who Would Rather)  
**Status:** Frontend-Only Implementation with Unused Database Schema

---

## 1. Current State Analysis

### 1.1 Implementation Overview

The Shoe Game was simplified to a **frontend-only** implementation on January 8, 2026. The previous `who-would-rather` Edge Function was deleted, and all game logic now resides in `scripts/who-would-rather.js` (287 lines).

**Current Architecture:**
- **Frontend:** Pure JavaScript with local state management
- **Backend:** None (no Edge Functions)
- **Database:** Tables exist but are completely unused
- **Persistence:** Session-only (data lost on page refresh)

### 1.2 Component Inventory

| Asset | Status | Notes |
|-------|--------|-------|
| `scripts/who-would-rather.js` | ✅ Active | Main game implementation |
| `baby_shower.who_would_rather_sessions` | ❌ Unused | 0 rows, not used |
| `baby_shower.who_would_rather_questions` | ❌ Unused | 24 rows, not used |
| `baby_shower.who_would_rather_votes` | ❌ Unused | 0 rows, not used |
| `docs/cleanup/migrations/20260104_who_would_rather_schema.sql` | ⚠️ Legacy | Migration exists |
| `supabase/functions/who-would-rather/` | 🗑️ Deleted | Removed Jan 8, 2026 |

### 1.3 Frontend Implementation Details

**Questions:**
- 19 predefined questions hardcoded in JavaScript (`scripts/who-would-rather.js:25-46`)
- Questions are stored in a simple array structure
- No category or difficulty metadata used

**State Management:**
```javascript
let state = {
    currentQuestion: 0,
    hasVoted: false,
    votes: []  // Stores {questionIndex, choice}
}
```

**Configuration:**
```javascript
CONFIG = window.ShoeGameConfig || {
    parentA: { name: 'Mom', avatar: '...' },
    parentB: { name: 'Dad', avatar: '...' },
    autoAdvanceDelay: 800
}
```

**Image Assets:**
| Asset | URL |
|-------|-----|
| Activity Card | `.../chibi_duo_highfive.png` |
| Parent A Avatar | `.../chibi_michelle_excited_red.png` |
| Parent B Avatar | `.../chibi_jazeel_eating.png` |

---

## 2. Identified Issues

### 2.1 Critical Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **Question Count Mismatch** | 🔴 Critical | Database has 24 questions, frontend uses 19 |
| **Unused Database Tables** | 🟠 High | 3 tables consuming storage, creating confusion |
| **No Persistence** | 🟠 High | Votes lost on page refresh |
| **No Real-time Sync** | 🟠 High | Multiple guests can't play together |

### 2.2 Important Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **Hardcoded Configuration** | 🟡 Medium | Parent names set via global, no UI to change |
| **No AI Integration** | 🟡 Medium | Could add personalized questions |
| **Incomplete Cleanup** | 🟡 Medium | Legacy migrations still present |
| **Missing Error Handling** | 🟡 Medium | No graceful fallbacks for failures |

### 2.3 Minor Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **No Analytics** | 🟢 Low | Can't track game engagement |
| **Single Session Only** | 🟢 Low | Only one game instance per page load |
| **No Results Export** | 🟢 Low | Results not shareable |

---

## 3. Strategic Options

### Option A: Maintain Frontend-Only (Status Quo)

**Approach:**
- Keep current implementation as-is
- Clean up unused database tables
- Sync question count (either direction)

**Pros:**
- Zero backend complexity
- Fast performance (no network latency)
- Works offline

**Cons:**
- No multiplayer support
- No persistent results
- Wasted database storage

**Effort:** Low (1-2 days)  
**Timeline:** Immediate

### Option B: Add Database Persistence

**Approach:**
- Enable database storage for votes
- Use existing `who_would_rather_votes` table
- Add simple Edge Function for vote submission

**Pros:**
- Persistent results
- Analytics capability
- Minimal backend changes

**Cons:**
- Requires Edge Function deployment
- Still no real-time sync
- Adds complexity

**Effort:** Medium (3-5 days)  
**Timeline:** Next sprint

### Option C: Full Multiplayer Implementation

**Approach:**
- Implement complete backend with Supabase
- Enable real-time sync via subscriptions
- Use database for questions and votes
- Add AI question generation option

**Pros:**
- Full multiplayer support
- Persistent data
- Engaging guest experience
- Scalable architecture

**Cons:**
- High complexity
- Requires full schema implementation
- Longer development time

**Effort:** High (1-2 weeks)  
**Timeline:** Future feature

---

## 4. Recommended Configuration

### 4.1 Immediate Actions (This Sprint)

#### 4.1.1 Clean Up Unused Database Tables

**Recommendation:** Remove unused `who_would_rather_*` tables

**SQL:**
```sql
-- Drop unused tables
DROP TABLE IF EXISTS baby_shower.who_would_rather_votes;
DROP TABLE IF EXISTS baby_shower.who_would_rather_sessions;
DROP TABLE IF EXISTS baby_shower.who_would_rather_questions;
DROP VIEW IF EXISTS baby_shower.who_would_rather_results;

-- Remove migration reference
-- Delete: docs/cleanup/migrations/20260104_who_would_rather_schema.sql
-- Delete: docs/cleanup/migrations/add_submitted_by_to_who_would_rather_votes.sql
```

**Rationale:**
- Tables consume storage with no benefit
- Frontend implementation doesn't use them
- Reduces confusion for developers
- Simplifies database schema

**Risk:** Low - no active code references these tables

#### 4.1.2 Fix Question Count Mismatch

**Recommendation:** Add missing 5 questions to frontend

**Current Questions (19):**
1. It's 3 AM and the baby starts crying...
2. The diaper explosion reaches the ceiling...
3. [17 more questions...]

**Missing Questions (from database, need to add):**
- Question 20-24 from migration file

**Implementation:**
```javascript
const QUESTIONS = [
    "It's 3 AM and the baby starts crying uncontrollably...",
    "The diaper explosion reaches the ceiling...",
    // ... existing 19 ...
    // Add questions 20-24 here
];
```

**Rationale:**
- Aligns frontend with intended database design
- Provides more content for guests
- Future-proofs for potential database migration

**Effort:** Low (1-2 hours)

### 4.2 Short-Term Improvements (Next Sprint)

#### 4.2.1 Add Local Storage Persistence

**Recommendation:** Persist votes to localStorage for page refresh resilience

**Implementation:**
```javascript
function saveState() {
    localStorage.setItem('shoeGameState', JSON.stringify({
        currentQuestion: state.currentQuestion,
        votes: state.votes,
        guestName: state.guestName
    }));
}

function loadState() {
    const saved = localStorage.getItem('shoeGameState');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Check if saved within last 24 hours
        if (Date.now() - parsed.timestamp < 86400000) {
            state = { ...parsed, timestamp: undefined };
            return true;
        }
    }
    return false;
}
```

**Rationale:**
- Prevents data loss on accidental refresh
- Minimal code change
- Improves user experience

**Effort:** Medium (2-3 hours)

#### 4.2.2 Enhance Configuration System

**Recommendation:** Move configuration from global window object to structured config

**Implementation:**
```javascript
// In scripts/config.js
const SHOE_GAME_CONFIG = {
    parents: {
        parentA: {
            name: 'Mom',
            defaultAvatar: '.../chibi_michelle_excited_red.png',
            color: '#FFB6C1'
        },
        parentB: {
            name: 'Dad',
            defaultAvatar: '.../chibi_jazeel_eating.png',
            color: '#87CEEB'
        }
    },
    game: {
        autoAdvanceDelay: 800,
        enableAnimations: true,
        showResultsAfterEach: false
    },
    questions: {
        count: 24,
        categories: ['sleep', 'feeding', 'diapers', 'play', 'general']
    }
};
```

**Rationale:**
- Centralized configuration
- Easier customization
- Type safety with IDE support

**Effort:** Medium (1 day)

### 4.3 Future Enhancements (Backlog)

#### 4.3.1 AI-Powered Question Generation

**Integration:** Use Z.AI (GLM-4.7) for dynamic questions

**Edge Function:** `game-scenario` (already exists for Mom vs Dad)

**Implementation:**
```typescript
async function generateCustomQuestions(parents) {
    const prompt = `Generate 5 funny "who would rather" questions for a baby shower
                    about ${parents.parentA} vs ${parents.parentB}.
                    Format: JSON array of strings.`;

    // Call Z.AI API with Z_AI_API_KEY
    // Fallback to default questions if API unavailable
}
```

**Rationale:**
- Personalized questions based on parent names
- More engaging than static questions
- Reuses existing AI infrastructure

**Effort:** Medium (3-5 days)

#### 4.3.2 Results Sharing

**Implementation:**
- Generate shareable results page
- Export as image or link
- Save to gallery

**Rationale:**
- Social sharing increases engagement
- Memories for parents

**Effort:** Medium (2-3 days)

---

## 5. Implementation Timeline

### Phase 1: Cleanup (Week 1)

| Task | Effort | Priority | Owner |
|------|--------|----------|-------|
| Remove unused database tables | 2 hours | P1 | Database |
| Delete legacy migration files | 1 hour | P1 | Backend |
| Add missing 5 questions to frontend | 2 hours | P1 | Frontend |
| Update AGENTS.md documentation | 1 hour | P2 | Docs |

**Total Phase 1 Effort:** 6-8 hours

### Phase 2: Enhancement (Week 2)

| Task | Effort | Priority | Owner |
|------|--------|----------|-------|
| Add localStorage persistence | 4 hours | P2 | Frontend |
| Enhance configuration system | 1 day | P2 | Frontend |
| Add error handling | 4 hours | P2 | Frontend |
| Write unit tests | 4 hours | P3 | QA |

**Total Phase 2 Effort:** 2-3 days

### Phase 3: Future (Backlog)

| Task | Effort | Priority | Dependencies |
|------|--------|----------|--------------|
| AI question generation | 1 week | P3 | Z.AI API key |
| Multiplayer sync | 2 weeks | P3 | Backend, Realtime |
| Results sharing | 3 days | P3 | UI, Backend |
| Analytics dashboard | 1 week | P4 | Backend, UI |

---

## 6. Configuration Specifications

### 6.1 Required Environment Variables

**For Current Implementation:** None required

**For AI Features (Future):**
```bash
Z_AI_API_KEY=glm-4.7-api-key  # For question generation
```

### 6.2 Database Schema (Current State)

**After Cleanup:**
```
No Shoe Game tables (removed)
```

### 6.3 Frontend Configuration

**In `scripts/config.js`:**
```javascript
const CONFIG = {
    // ... existing config ...
    
    shoeGame: {
        parents: {
            parentA: {
                name: 'Mom',
                avatar: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Michelle/chibi_michelle_excited_red.png',
                color: '#e74c3c'
            },
            parentB: {
                name: 'Dad',
                avatar: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Jazeel/chibi_jazeel_eating.png',
                color: '#3498db'
            }
        },
        game: {
            autoAdvanceDelay: 800,
            totalQuestions: 24,
            enableAnimations: true
        },
        images: {
            cardIcon: '.../chibi_duo_highfive.png'
        }
    }
};
```

### 6.4 Image Assets

| Asset | Path | Dimensions |
|-------|------|------------|
| Card Icon | `Pictures/New Images/Duo/chibi_duo_highfive.png` | 80x100px |
| Parent A Default | `Pictures/New Images/Michelle/chibi_michelle_excited_red.png` | Variable |
| Parent B Default | `Pictures/New Images/Jazeel/chibi_jazeel_eating.png` | Variable |

**Storage Bucket:** `baby-shower-pictures`  
**Base URL:** `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/`

---

## 7. Dependencies

### 7.1 Internal Dependencies

| Dependency | Type | Usage |
|------------|------|-------|
| `scripts/main.js` | Script | Game initialization |
| `styles/main.css` | Styles | Game styling |
| `styles/animations.css` | Styles | Vote animations |
| `index.html` | HTML | Game container |

### 7.2 External Dependencies

| Dependency | Version | Usage |
|------------|---------|-------|
| Supabase JS | ^2.x | Storage images |
| None | - | No backend dependencies (current) |

### 7.3 Cross-Component Dependencies

| Component | Relationship |
|-----------|--------------|
| Mom vs Dad Game | Similar architecture, potential code sharing |
| Config System | Shared configuration patterns |
| Anime Characters | Avatar display system |

---

## 8. Success Criteria

### 8.1 Functional Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Game loads successfully | 100% | No console errors |
| All 24 questions display | 24/24 | Question count verification |
| Vote recording works | 100% | Click events functional |
| Auto-advance works | 100% | 800ms delay applied |
| Results display correctly | 100% | Percentage calculations |

### 8.2 Performance Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Initial load time | < 500ms | Lighthouse |
| Question rendering | < 100ms | Chrome DevTools |
| Vote response time | < 50ms | Animation start |
| Memory usage | < 10MB | Chrome Task Manager |

### 8.3 Quality Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| No unused database tables | 0 tables | Schema verification |
| Code coverage | > 70% | Jest/Puppeteer tests |
| Lint errors | 0 | ESLint |
| TypeScript errors | 0 | tsc --noEmit |

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database cleanup breaks something | Low | High | Verify no FK constraints |
| Question addition causes UI issues | Low | Medium | Test on mobile/desktop |
| localStorage fails on private browsing | Medium | Low | Add fallback to memory-only |
| AI API key not configured | High | Low | Graceful fallback to defaults |

### 9.1 Rollback Plan

**Database Changes:**
```sql
-- If cleanup causes issues, recreate tables
CREATE TABLE baby_shower.who_would_rather_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    difficulty INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Changes:**
- Revert to 19 questions in `who-would-rather.js`
- Remove localStorage logic

---

## 10. Action Items

### Immediate (This Week)

- [ ] **DB-001:** Drop unused `who_would_rather_*` tables
- [ ] **DB-002:** Delete legacy migration files
- [ ] **FE-001:** Add 5 missing questions to frontend
- [ ] **FE-002:** Update `scripts/who-would-rather.js` to use 24 questions
- [ ] **DOC-001:** Update AGENTS.md to reflect cleanup

### Short-Term (Next Sprint)

- [ ] **FE-003:** Add localStorage persistence
- [ ] **FE-004:** Enhance configuration system
- [ ] **FE-005:** Add error boundaries
- [ ] **TEST-001:** Write unit tests for vote logic

### Future (Backlog)

- [ ] **AI-001:** Implement AI question generation
- [ ] **FE-006:** Add results sharing
- [ ] **FE-007:** Add guest name tracking
- [ ] **BE-001:** Consider multiplayer support

---

## 11. References

| Document | Location | Purpose |
|----------|----------|---------|
| AGENTS.md | `C:\Project\Baby_Shower\AGENTS.md` | Project standards |
| agent_allocation.md | `C:\Project\Baby_Shower\agent_allocation.md` | Component analysis |
| qa_analysis_report.md | `C:\Project\Baby_Shower\qa_analysis_report.md` | QA findings |
| who-would-rather.js | `scripts/who-would-rather.js` | Main implementation |
| Schema migration | `docs/cleanup/migrations/` | Legacy schema |

---

**Plan Version:** 1.0  
**Created:** January 9, 2026  
**Next Review:** January 16, 2026
