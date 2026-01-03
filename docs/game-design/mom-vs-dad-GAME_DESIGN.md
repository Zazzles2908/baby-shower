# Game Design Document: Mom vs. Dad - The Truth Revealed

**Game Title:** "Mom vs. Dad: The Truth Revealed"  
**Status:** CONFIRMED  
**Priority:** HIGH  
**Estimated Implementation:** 2-3 weeks

---

## 🎯 Executive Summary

**Concept:** Digital evolution of the classic "Shoe Game" where guests predict who did what, and AI provides sassy commentary on perception vs. reality.

**Core Loop:** Guess → Reveal → Roast

**Key Features:**
- AI-generated scenario cards (Z.AI)
- Real-time voting with Tug-of-War visualization
- Admin controls for parents to lock answers
- Sassy AI roast commentary (Moonshot)
- Character-based visual feedback system

---

## 🎮 Game Flow Architecture

### **Phase 1: Setup & Authentication**

```
Admin View (Parents)                    Guest View (Attendees)
         │                                      │
         ├─→ Login with admin code ────────────┤
         │                                      │
         │                           ┌──────────▼──────────┐
         │                           │ Enter session code  │
         │                           │ Provide name        │
         │                           └──────────┬──────────┘
         │                                      │
         ▼                                      ▼
```

**Admin Roles:**
- Parent 1 (Mom)
- Parent 2 (Dad)  
- Shared admin panel

**Guest Roles:**
- Authenticated via session code
- Limited to voting actions

---

### **Phase 2: Scenario Generation (Z.AI)**

```
Game Session
     │
     ▼
┌─────────────────────────┐
│ Trigger Z.AI Generation │
│ Theme: Farm/Cozy/Couple │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Z.AI Output:            │
│ {                      │
│   "scenario": "...",    │
│   "mom_option": "...",  │
│   "dad_option": "...",  │
│   "intensity": 0.7      │
│ }                       │
└───────────┬─────────────┘
            │
            ▼
    Broadcast to all clients
```

**Z.AI Prompt Engineering:**
```markdown
Generate a funny "who would rather" scenario for a baby shower game.

Theme: Cozy barnyard / Farm aesthetic
Couple traits: [INJECT FROM USER PROFILE]

Requirements:
- Lighthearted and fun
- Relatable parenting/baby scenarios
- Farm/cozy theme integration
- No offensive content
- JSON format only

Output:
{
  "scenario": "Descriptive scenario text",
  "mom_option": "Option framed for Mom",
  "dad_option": "Option framed for Dad", 
  "intensity": 0.1-1.0 (funny/explicit level)
}
```

---

### **Phase 3: Voting Round (Real-time)**

```
All Clients
     │
     ▼
┌─────────────────────────┐
│ Scenario Card Display   │
│                         │
│    "It's 3 AM. Baby     │
│     explosion. Who is   │
│     retching? 😷"       │
│                         │
├─────────────────────────┤
│ [⬅️ MOM]  [DAD ➡️]       │
│      (Swipe Actions)    │
└───────────┬─────────────┘
            │
            ├─→ Guest swipes Left ──→ Vote: MOM
            │
            └─→ Guest swipes Right ──→ Vote: DAD
                       │
                       ▼
            ┌─────────────────────────┐
            │ Update Tug-of-War       │
            │                         │
            │ MOM ████████████░░ 60%  │
            │      ^                  │
            │      └─ Mom avatar      │
            │          grows & glows  │
            └─────────────────────────┘
                       │
                       ▼
            Broadcast vote count via Supabase Realtime
```

**Tug-of-War Visualization:**
- Dynamic progress bar
- Winning side avatar scales up (1.0x → 1.5x)
- Glowing border effect on leading avatar
- Particle trails on vote updates

---

### **Phase 4: Answer Locking (Admin)**

```
Admin Panel
     │
     ▼
┌─────────────────────────┐
│ Current Scenario        │
│                        │
│ "It's 3 AM. Baby       │
│  explosion..."         │
│                        │
├─────────────────────────┤
│ Current Vote Tally     │
│                        │
│ MOM ████████░░ 50%     │
│ DAD ████████░░ 50%     │
│                        │
├─────────────────────────┤
│ Secret Answer Lock     │
│                        │
│ 🔒 [LOCK ANSWER]       │
│                        │
│ After locking:         │
│ ✓ Mom locked in: DAD   │
│ ✓ Dad locked in: DAD   │
│                        │
│ [🟢 REVEAL RESULTS]    │
└─────────────────────────┘
```

**Locking Mechanism:**
- Parents independently lock their answer
- Both must lock before reveal can trigger
- Visual feedback shows "locked" status
- Prevent changes after locking

---

### **Phase 5: The Reveal & Roast**

```
Result Screen
     │
     ├─→ Comparison Display
     │   
     │   ┌─────────────────────────┐
     │   │ CROWD THOUGHT          │     REALITY
     │   │                        │
     │   │ MOM ████████████ 70%   │     DAD ████ 100%
     │   │      ^                 │          ^
     │   │   Chibi F grows        │       Chibi M wins
     │   │                        │
     │   └────────────────────────┘
     │
     └─→ AI Roast Generation (Moonshot)
     
     ┌─────────────────────────────────────────┐
     │ PERCEPTION GAP DETECTED! 🎯            │
     │                                         │
     │ "Yikes. 70% of you thought [Mom] was    │
     │  the chef? Have you tasted her toast?   │
     │  Clearly, [Dad] is the unsung culinary  │
     │  hero of this barnyard. 🐓"             │
     └─────────────────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────┐
     │ Particle Effects        │
     │                         │
     │ ✅ Correct voters:      │
     │    asset_chibi_win.png  │
     │    confetti burst       │
     │                         │
     │ ❌ Wrong voters:        │
     │    asset_chibi_think.png│
     │    confused animation   │
     └─────────────────────────┘
```

**Moonshot Roast Prompt:**
```markdown
You are the sassy "Dad" character from a cozy barnyard baby shower game.

PERCEPTION GAP ANALYSIS:
- Crowd prediction: {mom_pct}% chose Mom
- Reality: {actual_answer} was correct
- Scenario: {scenario_text}

Your Task:
Generate a funny, light-hearted roast that:
1. Mocks the crowd's wrong perception
2. Celebrates the correct answer
3. Stays family-friendly
4. Uses barnyard/farm humor
5. Includes the names {mom_name} and {dad_name}

Tone: Sassy, witty, warm - like a fun uncle

Output JSON:
{
  "commentary": "Roast text here",
  "intensity": 0.8,
  "emojis": ["🦆", "🐓"],
  "particle_trigger": "confetti"
}
```

---

## 📊 Database Schema

### **Table: game_sessions**
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL, -- Session code for guests
  status VARCHAR(20) DEFAULT 'setup', -- setup, voting, reveal, complete
  current_scenario_id UUID REFERENCES game_scenarios(id),
  mom_name VARCHAR(100) NOT NULL,
  dad_name VARCHAR(100) NOT NULL,
  admin_code VARCHAR(10) NOT NULL, -- For parent access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### **Table: game_scenarios**
```sql
CREATE TABLE game_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  scenario_text TEXT NOT NULL,
  mom_option TEXT NOT NULL,
  dad_option TEXT NOT NULL,
  intensity DECIMAL(3,2) DEFAULT 0.5,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Table: game_votes**
```sql
CREATE TABLE game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES game_scenarios(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id), -- Or guest session
  guest_name VARCHAR(100) NOT NULL,
  vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('mom', 'dad')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, guest_id)
);
```

### **Table: game_answers**
```sql
CREATE TABLE game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES game_scenarios(id) ON DELETE CASCADE,
  mom_answer VARCHAR(10) CHECK (mom_answer IN ('mom', 'dad')),
  dad_answer VARCHAR(10) CHECK (dad_answer IN ('mom', 'dad')),
  mom_locked_at TIMESTAMP WITH TIME ZONE,
  dad_locked_at TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMP WITH TIME ZONE,
  roast_commentary TEXT, -- AI-generated
  roast_provider VARCHAR(20) DEFAULT 'moonshot'
);
```

---

## 🔄 Realtime Channel: game_state

### **Events Broadcast:**

| Event | Direction | Payload |
|-------|-----------|---------|
| `scenario_new` | Server → Client | New scenario data |
| `vote_update` | Server → Client | Updated vote counts |
| `answer_locked` | Server → Client | Admin locked answer |
| `reveal_trigger` | Server → Client | Trigger reveal animation |
| `result_reveal` | Server → Client | Vote comparison + AI roast |
| `round_complete` | Server → Client | Next round准备 |
| `game_complete` | Server → Client | Final scores celebration |

### **Client → Server Actions:**

| Action | Payload |
|--------|---------|
| `submit_vote` | `{ scenario_id, choice: 'mom'|'dad' }` |
| `lock_answer` | `{ scenario_id, choice: 'mom'|'dad', admin_code }` |
| `trigger_reveal` | `{ scenario_id, admin_code }` |
| `next_round` | `{ session_id, admin_code }` |

---

## 🎨 Visual Feedback System

### **Asset Requirements:**

| Asset | Usage | Animation |
|-------|-------|-----------|
| `asset_chibi_avatar_f.png` | Mom's chibi avatar | Bounce + Glow when winning |
| `asset_chibi_avatar_m.png` | Dad's chibi avatar | Bounce + Glow when winning |
| `asset_chibi_win.png` | Victory celebration | Confetti burst for correct voters |
| `asset_chibi_think.png` | Confusion | Head scratch for wrong voters |

### **Animation Triggers:**

```
Vote Comes In
     │
     ▼
┌─────────────────────────┐
│ Determine Vote Choice   │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │             │
  Vote: MOM     Vote: DAD
     │             │
     ▼             ▼
┌─────────┐   ┌─────────┐
│ Mom     │   │ Dad     │
│ Avatar  │   │ Avatar  │
│ Bounce! │   │ Bounce! │
│ Glow++  │   │ Glow++  │
└─────────┘   └─────────┘
```

**Particle Effects:**
- **Correct Guess**: Green confetti burst from `asset_chibi_win.png`
- **Wrong Guess**: Gray question marks + `asset_chibi_think.png` animation
- **Tie**: Both avatars pulse gently
- **Landslide**: Winner gets rainbow particles

---

## 🔐 Security & RLS Policies

### **Row Level Security:**

```sql
-- Game sessions: Public read, authenticated create
CREATE POLICY "Public can read sessions" 
ON game_sessions FOR SELECT USING (true);

CREATE POLICY "Admins can update" 
ON game_sessions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE session_id = game_sessions.id)
);

-- Votes: Guests can create, public read
CREATE POLICY "Anyone can submit votes" 
ON game_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read votes" 
ON game_votes FOR SELECT USING (true);

-- Answers: Only admins can see locked answers before reveal
CREATE POLICY "Admins can manage answers" 
ON game_answers FOR ALL USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE session_id IN (
    SELECT session_id FROM game_scenarios WHERE id = game_answers.scenario_id
  ))
);
```

---

## 🧪 Testing Strategy

### **Unit Tests:**
- Z.AI prompt generation quality
- Moonshot roast appropriateness
- Vote counting accuracy
- Admin authentication flow

### **Integration Tests:**
- End-to-end game round flow
- Realtime sync accuracy
- Role-based access control

### **E2E Tests (Playwright):**
- Guest voting experience
- Admin panel functionality
- Animation timing verification
- Cross-device responsiveness

---

## 📈 Implementation Phases

### **Phase 1: Foundation (Tasks 6-7)**
- Database schema setup
- RLS policies
- Basic API structure

### **Phase 2: Core Logic (Tasks 8-10)**
- Z.AI scenario generation
- Moonshot roast generation
- Voting with realtime sync

### **Phase 3: UI/UX (Tasks 11-13)**
- Admin panel
- Guest voting interface
- Visual feedback system

### **Phase 4: Polish (Tasks 14-15)**
- Session management
- End-to-end testing
- Performance optimization

---

**Document Version:** 1.0  
**Created:** 2026-01-03  
**Status:** Ready for Implementation  
**Priority:** HIGH