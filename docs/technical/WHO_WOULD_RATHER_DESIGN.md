# Technical Design Document: "Who Would Rather" Game

**Game Type:** Simplified Voting Game  
**Status:** Design Phase  
**Created:** 2026-01-04  
**Version:** 1.0  

---

## 🎯 Executive Summary

**Concept:** Replace the complex "Mom vs Dad: The Truth Revealed" game with a simplified, fast-paced voting game where guests immediately see real-time results after voting.

**Key Changes from Original:**
- ❌ No AI-generated scenarios (predefined questions)
- ❌ No reveal phase (results shown immediately)
- ❌ No perception gap analysis
- ❌ No admin authentication required
- ✅ 24 predefined "Who would rather" questions
- ✅ Instant real-time results
- ✅ Simple guest experience
- ✅ Mobile-first design

---

## 📊 Database Schema Design

### **Simplified Table Structure**

```sql
-- Main game sessions table (simplified)
CREATE TABLE baby_shower.who_would_rather_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'complete')),
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Questions table (predefined, no AI)
CREATE TABLE baby_shower.who_would_rather_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_number INTEGER UNIQUE NOT NULL,
    category VARCHAR(50), -- 'parenting', 'personality', 'daily_life'
    difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    is_active BOOLEAN DEFAULT TRUE
);

-- Votes table (simplified)
CREATE TABLE baby_shower.who_would_rather_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES baby_shower.who_would_rather_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_number, guest_name)
);

-- Results view (calculated, not stored)
CREATE VIEW baby_shower.who_would_rather_results AS
SELECT 
    v.session_id,
    v.question_number,
    COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) as mom_votes,
    COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) as dad_votes,
    COUNT(*) as total_votes,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END)::DECIMAL / COUNT(*) * 100), 1)
        ELSE 0 
    END as mom_percentage,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END)::DECIMAL / COUNT(*) * 100), 1)
        ELSE 0 
    END as dad_percentage,
    CASE 
        WHEN COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) > COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) THEN 'mom'
        WHEN COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) > COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) THEN 'dad'
        ELSE 'tie'
    END as winning_choice
FROM baby_shower.who_would_rather_votes v
GROUP BY v.session_id, v.question_number;
```

### **Predefined Questions Data**

```sql
-- Insert the 24 predefined questions
INSERT INTO baby_shower.who_would_rather_questions (question_text, question_number, category, difficulty) VALUES
('Who worries more?', 1, 'personality', 'easy'),
('Who wants more kids?', 2, 'parenting', 'medium'),
('Whose parents will feed you more?', 3, 'family', 'easy'),
('Who will be more nervous in labour?', 4, 'parenting', 'medium'),
('Who keeps track of appointments?', 5, 'daily_life', 'easy'),
('Who came up with the name?', 6, 'parenting', 'medium'),
('Who was the bigger baby at birth?', 7, 'personal_history', 'hard'),
('Who took long to potty train?', 8, 'personal_history', 'hard'),
('Who will change more diapers?', 9, 'parenting', 'medium'),
('Who will gag more changing diapers?', 10, 'parenting', 'easy'),
('Who will be the "good cop" parent?', 11, 'parenting', 'medium'),
('Who will be the more strict parent?', 12, 'parenting', 'medium'),
('Who will take more pictures and videos of the child?', 13, 'daily_life', 'easy'),
('Who will resemble the baby the most?', 14, 'family', 'medium'),
('Who will ramble at the baby?', 15, 'personality', 'easy'),
('Who will have an easier time letting baby cry?', 16, 'parenting', 'hard'),
('Who will have more patience (through newborn stage)?', 17, 'personality', 'medium'),
('Who will tell the story of the birds and the bees?', 18, 'parenting', 'hard'),
('Who will read more bedtime stories?', 19, 'daily_life', 'easy'),
('Who will fix the ouchies and boo-boos?', 20, 'parenting', 'medium'),
('Who will dress the child?', 21, 'daily_life', 'easy'),
('Who will play games with the child?', 22, 'daily_life', 'medium'),
('Who will be more excited for school events?', 23, 'parenting', 'medium'),
('Who will cry more at kindergarten drop-off?', 24, 'parenting', 'easy');
```

### **Indexes and Performance**

```sql
-- Performance indexes
CREATE INDEX idx_who_would_sessions_code ON baby_shower.who_would_rather_sessions(session_code);
CREATE INDEX idx_who_would_sessions_status ON baby_shower.who_would_rather_sessions(status);
CREATE INDEX idx_who_would_votes_session_question ON baby_shower.who_would_rather_votes(session_id, question_number);
CREATE INDEX idx_who_would_votes_guest ON baby_shower.who_would_rather_votes(session_id, question_number, guest_name);

-- Row Level Security
ALTER TABLE baby_shower.who_would_rather_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.who_would_rather_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.who_would_rather_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can read sessions" ON baby_shower.who_would_rather_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON baby_shower.who_would_rather_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update active sessions" ON baby_shower.who_would_rather_sessions FOR UPDATE USING (status = 'active');

CREATE POLICY "Public can read questions" ON baby_shower.who_would_rather_questions FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can submit votes" ON baby_shower.who_would_rather_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read vote results" ON baby_shower.who_wower.who_would_rather_votes FOR SELECT USING (true);
```

---

## 🔧 Edge Functions Design

### **API Endpoints**

#### 1. Create Game Session
```typescript
// POST /who-would-rather/create-session
// Request:
{
  "guest_name": "Test User"  // Creator name
}

// Response:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "session_code": "ABC123",
    "current_question": 1,
    "total_questions": 24
  }
}
```

#### 2. Get Current Question
```typescript
// GET /who-would-rather/current-question/:session_code
// Response:
{
  "success": true,
  "data": {
    "question_number": 1,
    "question_text": "Who worries more?",
    "category": "personality",
    "has_voted": false,
    "guest_vote": null
  }
}
```

#### 3. Submit Vote
```typescript
// POST /who-would-rather/vote
// Request:
{
  "session_code": "ABC123",
  "guest_name": "Test User",
  "question_number": 1,
  "vote_choice": "mom"  // or "dad"
}

// Response:
{
  "success": true,
  "data": {
    "vote_id": "uuid",
    "results": {
      "mom_votes": 5,
      "dad_votes": 3,
      "mom_percentage": 62.5,
      "dad_percentage": 37.5,
      "winning_choice": "mom"
    }
  }
}
```

#### 4. Get Question Results
```typescript
// GET /who-would-rather/results/:session_code/:question_number
// Response:
{
  "success": true,
  "data": {
    "question_number": 1,
    "question_text": "Who worries more?",
    "results": {
      "mom_votes": 5,
      "dad_votes": 3,
      "mom_percentage": 62.5,
      "dad_percentage": 37.5,
      "winning_choice": "mom",
      "total_votes": 8
    },
    "user_vote": "mom"
  }
}
```

#### 5. Next Question
```typescript
// POST /who-would-rather/next-question
// Request:
{
  "session_code": "ABC123"
}

// Response:
{
  "success": true,
  "data": {
    "question_number": 2,
    "question_text": "Who wants more kids?",
    "is_complete": false
  }
}
```

### **Edge Function Implementation**

```typescript
// supabase/functions/who-would-rather/index.ts
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

// Predefined questions cache
const PREDEFINED_QUESTIONS = [
  "Who worries more?",
  "Who wants more kids?",
  "Whose parents will feed you more?",
  // ... all 24 questions
];

serve(async (req: Request) => {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    // Validate environment
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      return createErrorResponse('Server configuration error', 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const url = new URL(req.url)
    const path = url.pathname

    // Route handling
    switch (path) {
      case '/who-would-rather/create-session':
        return await createSession(supabase, req)
      case '/who-would-rather/current-question':
        return await getCurrentQuestion(supabase, req)
      case '/who-would-rather/vote':
        return await submitVote(supabase, req)
      case '/who-would-rather/results':
        return await getResults(supabase, req)
      case '/who-would-rather/next-question':
        return await nextQuestion(supabase, req)
      default:
        return createErrorResponse('Endpoint not found', 404)
    }

  } catch (error) {
    console.error('Who Would Rather error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

async function createSession(supabase: any, req: Request) {
  const body = await req.json()
  
  const validation = validateInput(body, {
    guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  // Generate unique session code
  const sessionCode = generateSessionCode()
  
  const { data: session, error } = await supabase
    .from('who_would_rather_sessions')
    .insert({
      session_code: sessionCode,
      status: 'active',
      current_question_index: 0,
      total_questions: 24
    })
    .select()
    .single()

  if (error) {
    console.error('Session creation error:', error)
    return createErrorResponse('Failed to create session', 500)
  }

  return createSuccessResponse({
    session_id: session.id,
    session_code: session.session_code,
    current_question: 1,
    total_questions: 24
  })
}

async function submitVote(supabase: any, req: Request) {
  const body = await req.json()
  
  const validation = validateInput(body, {
    session_code: { type: 'string', required: true, pattern: /^[A-Z0-9]{6}$/ },
    guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    question_number: { type: 'number', required: true, min: 1, max: 24 },
    vote_choice: { type: 'string', required: true, pattern: /^(mom|dad)$/ }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code, guest_name, question_number, vote_choice } = validation.sanitized

  // Get session
  const { data: session } = await supabase
    .from('who_would_rather_sessions')
    .select('id, status')
    .eq('session_code', session_code)
    .single()

  if (!session) {
    return createErrorResponse('Session not found', 404)
  }

  if (session.status !== 'active') {
    return createErrorResponse('Session is not active', 400)
  }

  // Submit vote (upsert to handle re-votes)
  const { error: voteError } = await supabase
    .from('who_would_rather_votes')
    .upsert({
      session_id: session.id,
      question_number,
      guest_name,
      vote_choice
    }, {
      onConflict: 'session_id,question_number,guest_name'
    })

  if (voteError) {
    console.error('Vote submission error:', voteError)
    return createErrorResponse('Failed to submit vote', 500)
  }

  // Get updated results
  const { data: results } = await supabase
    .from('who_would_rather_results')
    .select('*')
    .eq('session_id', session.id)
    .eq('question_number', question_number)
    .single()

  return createSuccessResponse({
    vote_id: 'generated_uuid', // Would return actual UUID
    results: results || {
      mom_votes: 0,
      dad_votes: 0,
      mom_percentage: 0,
      dad_percentage: 0,
      winning_choice: 'tie'
    }
  })
}

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

---

## 🎨 Frontend Architecture

### **Component Structure**

```javascript
// scripts/who-would-rather.js
(function() {
    'use strict';
    
    console.log('[WhoWouldRather] loading...');
    
    // State management
    const GameState = {
        session: null,
        currentQuestion: null,
        userVote: null,
        results: null,
        isLoading: false
    };
    
    // UI Components
    const UI = {
        container: null,
        questionCard: null,
        voteButtons: null,
        resultsPanel: null,
        progressBar: null,
        navigation: null
    };
    
    // Public API
    window.WhoWouldRather = {
        init: initializeGame,
        createSession: createSession,
        joinSession: joinSession,
        submitVote: submitVote,
        nextQuestion: nextQuestion,
        resetGame: resetGame
    };
    
    function initializeGame() {
        setupUI();
        setupEventListeners();
        checkExistingSession();
    }
    
    function setupUI() {
        UI.container = document.getElementById('who-would-rather-container');
        if (!UI.container) return;
        
        UI.container.innerHTML = `
            <div class="who-would-rather-game">
                <div class="game-header">
                    <h2>Who Would Rather...?</h2>
                    <div class="session-info">
                        <span class="session-code"></span>
                        <span class="question-counter"></span>
                    </div>
                </div>
                
                <div class="question-card">
                    <div class="question-text"></div>
                    <div class="question-category"></div>
                </div>
                
                <div class="vote-section">
                    <button class="vote-btn vote-mom" data-choice="mom">
                        <div class="vote-icon">👩</div>
                        <div class="vote-label">Mom</div>
                    </button>
                    
                    <div class="vs-divider">VS</div>
                    
                    <button class="vote-btn vote-dad" data-choice="dad">
                        <div class="vote-icon">👨</div>
                        <div class="vote-label">Dad</div>
                    </button>
                </div>
                
                <div class="results-panel" style="display: none;">
                    <div class="results-header">Live Results</div>
                    <div class="results-content">
                        <div class="vote-bar">
                            <div class="mom-bar">
                                <div class="vote-count mom-count">0</div>
                                <div class="vote-percentage mom-percentage">0%</div>
                            </div>
                            <div class="dad-bar">
                                <div class="vote-count dad-count">0</div>
                                <div class="vote-percentage dad-percentage">0%</div>
                            </div>
                        </div>
                        <div class="winning-indicator">
                            <span class="winner-text"></span>
                        </div>
                    </div>
                </div>
                
                <div class="navigation">
                    <button class="btn btn-secondary prev-btn" disabled>Previous</button>
                    <button class="btn btn-primary next-btn" disabled>Next Question</button>
                </div>
            </div>
        `;
        
        // Cache UI elements
        UI.questionCard = UI.container.querySelector('.question-card');
        UI.voteButtons = UI.container.querySelectorAll('.vote-btn');
        UI.resultsPanel = UI.container.querySelector('.results-panel');
        UI.progressBar = UI.container.querySelector('.progress-bar');
        UI.navigation = UI.container.querySelector('.navigation');
    }
    
    async function createSession(guestName) {
        try {
            GameState.isLoading = true;
            showLoading();
            
            const response = await fetch(`${window.CONFIG.API_URL}/who-would-rather/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guest_name: guestName })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create session');
            }
            
            GameState.session = result.data;
            localStorage.setItem('who_would_session', JSON.stringify(GameState.session));
            
            // Start with first question
            await loadQuestion(1);
            
        } catch (error) {
            console.error('Create session error:', error);
            showError('Failed to create game session');
        } finally {
            GameState.isLoading = false;
            hideLoading();
        }
    }
    
    async function submitVote(choice) {
        if (!GameState.session || !GameState.currentQuestion) return;
        
        try {
            GameState.isLoading = true;
            
            const response = await fetch(`${window.CONFIG.API_URL}/who-would-rather/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_code: GameState.session.session_code,
                    guest_name: getCurrentUserName(),
                    question_number: GameState.currentQuestion.question_number,
                    vote_choice: choice
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to submit vote');
            }
            
            GameState.userVote = choice;
            GameState.results = result.data.results;
            
            // Update UI
            updateVoteButtons(choice);
            showResults(result.data.results);
            enableNavigation();
            
        } catch (error) {
            console.error('Submit vote error:', error);
            showError('Failed to submit vote');
        } finally {
            GameState.isLoading = false;
        }
    }
    
    function showResults(results) {
        UI.resultsPanel.style.display = 'block';
        
        const momCount = UI.resultsPanel.querySelector('.mom-count');
        const dadCount = UI.resultsPanel.querySelector('.dad-count');
        const momPercentage = UI.resultsPanel.querySelector('.mom-percentage');
        const dadPercentage = UI.resultsPanel.querySelector('.dad-percentage');
        const winnerText = UI.resultsPanel.querySelector('.winner-text');
        
        momCount.textContent = results.mom_votes;
        dadCount.textContent = results.dad_votes;
        momPercentage.textContent = `${results.mom_percentage}%`;
        dadPercentage.textContent = `${results.dad_percentage}%`;
        
        // Update bar widths
        const momBar = UI.resultsPanel.querySelector('.mom-bar');
        const dadBar = UI.resultsPanel.querySelector('.dad-bar');
        momBar.style.width = `${results.mom_percentage}%`;
        dadBar.style.width = `${results.dad_percentage}%`;
        
        // Show winner
        if (results.winning_choice === 'mom') {
            winnerText.textContent = '👩 Mom is winning!';
            momBar.classList.add('winner');
            dadBar.classList.remove('winner');
        } else if (results.winning_choice === 'dad') {
            winnerText.textContent = '👨 Dad is winning!';
            dadBar.classList.add('winner');
            momBar.classList.remove('winner');
        } else {
            winnerText.textContent = "It's a tie!";
            momBar.classList.add('winner');
            dadBar.classList.add('winner');
        }
        
        // Add animation
        UI.resultsPanel.classList.add('show');
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
    
})();
```

### **CSS Styling**

```css
/* styles/who-would-rather.css */
.who-would-rather-game {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--bg-secondary, #ffffff);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.game-header {
    text-align: center;
    margin-bottom: 2rem;
}

.game-header h2 {
    color: var(--primary-color, #ff6b6b);
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.session-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
}

.question-card {
    background: var(--bg-primary, #f8f9fa);
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    margin-bottom: 2rem;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.question-text {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin-bottom: 0.5rem;
}

.question-category {
    font-size: 0.8rem;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.vote-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
}

.vote-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 2rem;
    border: 3px solid var(--border-color, #e0e0e0);
    border-radius: 15px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
}

.vote-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.vote-btn.voted {
    border-color: var(--primary-color, #ff6b6b);
    background: var(--primary-light, #ffe0e0);
}

.vote-btn.vote-mom.voted {
    border-color: #ff9ff3;
    background: #fff0fe;
}

.vote-btn.vote-dad.voted {
    border-color: #74b9ff;
    background: #e3f2fd;
}

.vote-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.vote-label {
    font-weight: 600;
    font-size: 1.1rem;
}

.vs-divider {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--text-secondary, #666);
    background: var(--bg-primary, #f8f9fa);
    padding: 0.5rem 1rem;
    border-radius: 50px;
    min-width: 60px;
    text-align: center;
}

.results-panel {
    background: var(--bg-primary, #f8f9fa);
    border-radius: 15px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}

.results-panel.show {
    opacity: 1;
    transform: translateY(0);
}

.results-header {
    text-align: center;
    font-weight: 600;
    color: var(--primary-color, #ff6b6b);
    margin-bottom: 1rem;
}

.vote-bar {
    display: flex;
    height: 40px;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 1rem;
    background: var(--bg-secondary, #ffffff);
    border: 2px solid var(--border-color, #e0e0e0);
}

.mom-bar, .dad-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    transition: all 0.5s ease;
    position: relative;
    min-width: 40px;
}

.mom-bar {
    background: linear-gradient(135deg, #ff9ff3, #ff6b9d);
    color: white;
}

.dad-bar {
    background: linear-gradient(135deg, #74b9ff, #0984e3);
    color: white;
}

.mom-bar.winner, .dad-bar.winner {
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5);
}

.vote-count {
    font-weight: 700;
    font-size: 1.1rem;
}

.vote-percentage {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-left: 0.5rem;
}

.winning-indicator {
    text-align: center;
    font-weight: 600;
    color: var(--text-primary, #333);
}

.navigation {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--primary-color, #ff6b6b);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #ff5252;
    transform: translateY(-1px);
}

.btn-secondary {
    background: var(--bg-primary, #f8f9fa);
    color: var(--text-primary, #333);
    border: 2px solid var(--border-color, #e0e0e0);
}

.btn-secondary:hover:not(:disabled) {
    background: var(--bg-secondary, #ffffff);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .who-would-rather-game {
        padding: 1rem;
        margin: 1rem;
    }
    
    .vote-section {
        flex-direction: column;
        gap: 1rem;
    }
    
    .vs-divider {
        transform: rotate(90deg);
    }
    
    .question-text {
        font-size: 1.2rem;
    }
    
    .vote-btn {
        min-width: 100px;
        padding: 1rem 1.5rem;
    }
}

/* Animations */
@keyframes bounce {
    0%, 20%, 60%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    80% { transform: translateY(-5px); }
}

.vote-btn:hover .vote-icon {
    animation: bounce 1s ease infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.vote-btn.voted {
    animation: pulse 0.5s ease;
}
```

---

## 🔄 Real-time Updates

### **Supabase Realtime Configuration**

```typescript
// Real-time subscription for vote updates
function subscribeToVoteUpdates(sessionCode, questionNumber) {
    const channel = supabase
        .channel(`who-would-rather:${sessionCode}:${questionNumber}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'baby_shower',
                table: 'who_would_rather_votes',
                filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
                // New vote received, refresh results
                refreshCurrentResults();
            }
        )
        .subscribe();
    
    return channel;
}

// Refresh results without page reload
async function refreshCurrentResults() {
    if (!GameState.session || !GameState.currentQuestion) return;
    
    try {
        const response = await fetch(
            `${window.CONFIG.API_URL}/who-would-rather/results/${GameState.session.session_code}/${GameState.currentQuestion.question_number}`
        );
        
        const result = await response.json();
        
        if (result.success) {
            GameState.results = result.data.results;
            updateResultsDisplay(GameState.results);
        }
    } catch (error) {
        console.error('Refresh results error:', error);
    }
}
```

---

## 🚀 Migration Strategy

### **Phase 1: Database Migration (Zero Downtime)**

```sql
-- 1. Create new tables alongside existing ones
-- (Tables created above - no impact on existing game)

-- 2. Migrate any active sessions (optional)
-- Since old game requires admin setup, we can safely ignore active sessions

-- 3. Verify data integrity
SELECT COUNT(*) as new_sessions FROM baby_shower.who_would_rather_sessions;
SELECT COUNT(*) as predefined_questions FROM baby_shower.who_would_rather_questions WHERE is_active = true;
```

### **Phase 2: Backend Deployment**

```bash
# Deploy new Edge Functions
supabase functions deploy who-would-rather

# Test new endpoints
curl -X POST https://your-project.supabase.co/functions/v1/who-would-rather/create-session \
  -H "Content-Type: application/json" \
  -d '{"guest_name": "Test User"}'
```

### **Phase 3: Frontend Integration**

```javascript
// Feature flag approach
const USE_NEW_GAME = window.location.search.includes('new-game=true');

if (USE_NEW_GAME) {
    // Load new game
    loadScript('/scripts/who-would-rather.js');
} else {
    // Keep old game for rollback
    loadScript('/scripts/mom-vs-dad.js');
}
```

### **Phase 4: Rollback Plan**

```bash
# Immediate rollback commands
# 1. Revert to old game
sed -i 's/who-would-rather/mom-vs-dad/g' index.html

# 2. Disable new Edge Functions
supabase functions delete who-would-rather

# 3. Keep database tables (no harm in keeping them)
# Can be cleaned up later if needed
```

---

## 📋 Implementation Phases

### **Phase 1: Database & Backend (2 days)**

**Day 1: Database Setup**
- [ ] Create migration file with new table structure
- [ ] Insert 24 predefined questions
- [ ] Set up RLS policies and indexes
- [ ] Test database queries and performance

**Day 2: Edge Functions**
- [ ] Create `who-would-rather` Edge Function
- [ ] Implement all 5 API endpoints
- [ ] Add input validation and error handling
- [ ] Test with Postman/curl

### **Phase 2: Frontend Core (3 days)**

**Day 3: Core UI Structure**
- [ ] Create `who-would-rather.js` script
- [ ] Build main game container and components
- [ ] Implement state management
- [ ] Add basic CSS styling

**Day 4: Game Logic**
- [ ] Connect to Edge Functions
- [ ] Implement vote submission
- [ ] Add results display
- [ ] Create navigation between questions

**Day 5: Real-time Integration**
- [ ] Set up Supabase realtime subscriptions
- [ ] Implement live vote updates
- [ ] Add loading states and error handling
- [ ] Test complete game flow

### **Phase 3: UI/UX Polish (2 days)**

**Day 6: Visual Enhancements**
- [ ] Add animations and transitions
- [ ] Implement mobile-responsive design
- [ ] Create particle effects for winners
- [ ] Add sound effects (optional)

**Day 7: User Experience**
- [ ] Add progress indicators
- [ ] Implement smooth question transitions
- [ ] Add keyboard navigation support
- [ ] Optimize for touch devices

### **Phase 4: Testing & QA (2 days)**

**Day 8: Testing**
- [ ] Write Playwright E2E tests
- [ ] Test on multiple devices/browsers
- [ ] Performance testing with many concurrent users
- [ ] Accessibility testing

**Day 9: Deployment & Monitoring**
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing
- [ ] Monitor performance metrics
- [ ] Create deployment documentation

---

## 🧪 Testing Strategy

### **E2E Test Scenarios**

```javascript
// tests/e2e/who-would-rather.test.js
test.describe('Who Would Rather Game', () => {
    test('complete game flow', async ({ page }) => {
        // 1. Create session
        await page.goto('/?game=who-would-rather');
        await page.fill('[name="guest_name"]', 'Test User');
        await page.click('[data-action="create-session"]');
        
        // 2. Verify session created
        await expect(page.locator('.session-code')).toBeVisible();
        
        // 3. Submit vote
        await page.click('[data-choice="mom"]');
        
        // 4. Verify results shown
        await expect(page.locator('.results-panel')).toBeVisible();
        await expect(page.locator('.mom-percentage')).toContainText('%');
        
        // 5. Navigate to next question
        await page.click('[data-action="next-question"]');
        await expect(page.locator('.question-number')).toContainText('2');
    });
    
    test('real-time updates', async ({ browser }) => {
        // Create two browser contexts
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();
        
        // Both join same session
        const sessionCode = await createSession(page1);
        await joinSession(page2, sessionCode);
        
        // Vote from page1
        await page1.click('[data-choice="mom"]');
        
        // Verify page2 sees updated results
        await expect(page2.locator('.mom-count')).toContainText('1');
    });
});
```

### **Performance Benchmarks**

- **Page Load Time**: < 2 seconds
- **Vote Submission**: < 500ms
- **Results Update**: < 200ms
- **Concurrent Users**: Support 50+ simultaneous players
- **Mobile Performance**: 60 FPS animations

---

## 📊 Success Metrics

### **User Experience Metrics**
- **Game Completion Rate**: > 80% of started games completed
- **Average Session Duration**: 5-10 minutes (24 questions)
- **Vote Submission Time**: < 30 seconds per question
- **Error Rate**: < 1% of votes fail

### **Technical Metrics**
- **API Response Time**: < 200ms average
- **Database Query Time**: < 50ms average
- **Real-time Latency**: < 100ms average
- **Uptime**: > 99.9% availability

### **User Satisfaction**
- **Mobile Usability**: > 90% satisfaction rate
- **Loading Performance**: > 85% satisfaction rate
- **Overall Experience**: > 4.5/5 average rating

---

## 🎯 Key Benefits of Simplified Design

### **For Users**
- **Faster Setup**: No admin authentication required
- **Immediate Gratification**: See results instantly
- **Simpler Interface**: No complex navigation
- **Mobile Optimized**: Touch-friendly voting

### **For Developers**
- **Reduced Complexity**: No AI integration needed
- **Faster Development**: Predefined content
- **Lower Maintenance**: Simpler database schema
- **Better Performance**: Fewer API calls

### **For Hosts**
- **Zero Configuration**: Start playing immediately
- **Flexible Gameplay**: Play any number of questions
- **Real-time Engagement**: See live results
- **Easy Management**: No admin panel needed

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Estimated Timeline:** 9 days  
**Priority:** HIGH  
**Risk Level:** LOW (simplified design, no external dependencies)**