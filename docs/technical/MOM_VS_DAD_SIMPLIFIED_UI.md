# Mom vs Dad Game - Simplified UI Design

**Status:** DESIGN SPECIFICATION
**Created:** 2026-01-04
**Priority:** CRITICAL
**Goal:** Clean, simple lobby-based UI without scrolling issues

---

## 📋 Design Philosophy

**Core Principle:** "Tap and Play" - Maximum simplicity, minimal friction

**Key Design Decisions:**
1. **No complex entry flow** - 4-lobby card selection, tap to join
2. **No background images** - Clean solid colors only
3. **Vertical flow only** - No horizontal scrolling, no overlapping content
4. **Admin panel hidden** - Only visible to lobby creator
5. **Mobile-first** - Touch targets 48px+, simple gestures

---

## 🎨 Screen 1: Lobby Selection

### Wireframe Description

```
┌─────────────────────────────┐
│                             │
│      Mom vs Dad             │
│       🎮 Game               │
│                             │
│   Choose Your Lobby:        │
│                             │
│   ┌────────────┐ ┌─────────┐ │
│   │ Lobby A    │ │ Lobby B │ │
│   │ 🟢 OPEN    │ │ 🟢 OPEN │ │
│   │ 0/8        │ │ 0/8     │ │
│   └────────────┘ └─────────┘ │
│                             │
│   ┌────────────┐ ┌─────────┐ │
│   │ Lobby C    │ │ Lobby D │ │
│   │ 🟢 OPEN    │ │ 🟢 OPEN │ │
│   │ 0/8        │ │ 0/8     │ │
│   └────────────┘ └─────────┘ │
│                             │
└─────────────────────────────┘
```

### HTML Structure

```html
<section id="mom-vs-dad-lobbies" class="mvd-section active">
    <div class="mvd-header">
        <h1>🎮 Mom vs Dad</h1>
        <p>Choose a lobby to join</p>
    </div>

    <div class="lobbies-grid">
        <!-- 4 Lobby Cards -->
        <button class="lobby-card" data-lobby="A" data-players="0" data-max="8">
            <div class="lobby-status">🟢 OPEN</div>
            <div class="lobby-title">Lobby A</div>
            <div class="lobby-count">0/8 players</div>
        </button>

        <button class="lobby-card" data-lobby="B" data-players="0" data-max="8">
            <div class="lobby-status">🟢 OPEN</div>
            <div class="lobby-title">Lobby B</div>
            <div class="lobby-count">0/8 players</div>
        </button>

        <button class="lobby-card" data-lobby="C" data-players="0" data-max="8">
            <div class="lobby-status">🟢 OPEN</div>
            <div class="lobby-title">Lobby C</div>
            <div class="lobby-count">0/8 players</div>
        </button>

        <button class="lobby-card" data-lobby="D" data-players="0" data-max="8">
            <div class="lobby-status">🟢 OPEN</div>
            <div class="lobby-title">Lobby D</div>
            <div class="lobby-count">0/8 players</div>
        </button>
    </div>

    <!-- Join Modal -->
    <div id="join-modal" class="modal-overlay hidden">
        <div class="modal-content">
            <h2>Join Lobby A</h2>
            <input type="text" id="player-name" placeholder="Enter your name" maxlength="20" />
            <div class="modal-actions">
                <button id="join-cancel" class="btn-secondary">Cancel</button>
                <button id="join-confirm" class="btn-primary">Join Lobby</button>
            </div>
        </div>
    </div>
</section>
```

### CSS Architecture

```css
/* ========================================
   LOBBY SELECTION SCREEN
   ======================================== */

.mvd-section {
    display: none;
    animation: fadeIn 0.4s ease-out;
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
}

.mvd-section.active {
    display: block;
}

/* Header */
.mvd-header {
    text-align: center;
    margin-bottom: 30px;
}

.mvd-header h1 {
    color: #9CAF88;
    font-size: 2rem;
    margin-bottom: 8px;
    font-weight: 700;
}

.mvd-header p {
    color: #3A3326;
    font-size: 1.1rem;
}

/* Lobby Grid */
.lobbies-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

/* Lobby Card */
.lobby-card {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 3px solid #F5EDD8;
    border-radius: 16px;
    padding: 24px 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-height: 140px;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.lobby-card:hover {
    transform: translateY(-4px);
    border-color: #9CAF88;
    box-shadow: 0 8px 24px rgba(156, 175, 136, 0.25);
}

.lobby-card:active {
    transform: translateY(-2px);
}

/* Lobby Status */
.lobby-status {
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 6px 12px;
    border-radius: 20px;
    background: #E8F5E9;
    color: #2E7D32;
}

.lobby-card.full .lobby-status {
    background: #FFEBEE;
    color: #C62828;
}

.lobby-card.filling .lobby-status {
    background: #FFF3E0;
    color: #E65100;
}

/* Lobby Title */
.lobby-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: #3A3326;
}

/* Lobby Count */
.lobby-count {
    font-size: 1rem;
    color: #5D4E37;
    font-weight: 500;
}

/* Join Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(90, 82, 71, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-overlay.hidden {
    display: none;
}

.modal-content {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
    color: #9CAF88;
    margin-bottom: 20px;
    font-size: 1.5rem;
}

.modal-content input[type="text"] {
    width: 100%;
    padding: 16px;
    border: 2px solid #F5EDD8;
    border-radius: 12px;
    font-size: 1.1rem;
    font-family: 'Nunito', sans-serif;
    margin-bottom: 20px;
    text-align: center;
}

.modal-content input[type="text"]:focus {
    outline: none;
    border-color: #9CAF88;
    box-shadow: 0 0 0 4px rgba(156, 175, 136, 0.15);
}

.modal-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.btn-primary {
    background: linear-gradient(135deg, #9CAF88 0%, #7A8F6A 100%);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(156, 175, 136, 0.3);
}

.btn-secondary {
    background: transparent;
    color: #3A3326;
    border: 2px solid #F5EDD8;
    padding: 16px 32px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: #F5EDD8;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .mvd-section {
        padding: 16px;
    }

    .lobbies-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .lobby-card {
        padding: 20px 16px;
        min-height: 120px;
    }

    .mvd-header h1 {
        font-size: 1.6rem;
    }

    .mvd-header p {
        font-size: 1rem;
    }
}
```

---

## 🎨 Screen 2: Waiting Room

### Wireframe Description

```
┌─────────────────────────────┐
│  Lobby A - Waiting          │
│  ──────────────────────     │
│                             │
│  Players (3/8):             │
│                             │
│  👤 Alice                   │
│  👤 Bob                     │
│  👤 Carol                   │
│                             │
│  ⏳ Waiting for players... │
│                             │
│  [Admin Panel - Hidden]     │
│  ──────────────────────     │
│  Start Game                 │
│  Number of Rounds: [5 ▼]   │
│  [Start Game]               │
│                             │
│  [Exit Lobby]               │
└─────────────────────────────┘
```

### HTML Structure

```html
<section id="mom-vs-dad-waiting" class="mvd-section">
    <div class="mvd-header">
        <h1>Lobby A</h1>
        <p>Waiting for players...</p>
    </div>

    <!-- Player List -->
    <div class="player-list-container">
        <div class="player-list-header">
            <span class="player-count">3/8 Players</span>
        </div>

        <div class="player-list" id="player-list">
            <!-- Players will be added dynamically -->
            <div class="player-item">
                <div class="player-avatar">👤</div>
                <span class="player-name">Alice</span>
            </div>
            <div class="player-item">
                <div class="player-avatar">👤</div>
                <span class="player-name">Bob</span>
            </div>
            <div class="player-item">
                <div class="player-avatar">👤</div>
                <span class="player-name">Carol</span>
            </div>
        </div>
    </div>

    <!-- Waiting Message (non-admin) -->
    <div class="waiting-message" id="waiting-message">
        <p>⏳ Waiting for more players to join...</p>
    </div>

    <!-- Admin Panel (only visible to admin) -->
    <div class="admin-panel hidden" id="admin-panel">
        <h3>🎮 Admin Controls</h3>

        <div class="setting-row">
            <label for="rounds-select">Number of Rounds:</label>
            <select id="rounds-select">
                <option value="3">3 Rounds</option>
                <option value="5" selected>5 Rounds</option>
                <option value="7">7 Rounds</option>
                <option value="10">10 Rounds</option>
            </select>
        </div>

        <button id="start-game-btn" class="btn-primary full-width">
            🎯 Start Game
        </button>
    </div>

    <!-- Exit Button -->
    <div class="exit-section">
        <button id="exit-lobby-btn" class="btn-secondary">
            ← Exit Lobby
        </button>
    </div>
</section>
```

### CSS Architecture

```css
/* ========================================
   WAITING ROOM SCREEN
   ======================================== */

.player-list-container {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 2px solid #F5EDD8;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
}

.player-list-header {
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px dashed #F5EDD8;
}

.player-count {
    font-size: 1.1rem;
    font-weight: 700;
    color: #9CAF88;
}

/* Player List */
.player-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.player-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #FFFFFF;
    border: 2px solid #F5EDD8;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.player-item:hover {
    border-color: #9CAF88;
    transform: translateX(4px);
}

.player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #9CAF88 0%, #7A8F6A 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.player-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: #3A3326;
    flex: 1;
}

.player-item.is-admin .player-name::after {
    content: '👑';
    margin-left: 8px;
}

/* Waiting Message */
.waiting-message {
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, #FFF8E7 0%, #F4E4BC 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    border: 2px dashed #9CAF88;
}

.waiting-message p {
    font-size: 1.2rem;
    color: #3A3326;
    margin: 0;
}

/* Admin Panel */
.admin-panel {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 3px solid #9CAF88;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(156, 175, 136, 0.15);
}

.admin-panel.hidden {
    display: none;
}

.admin-panel h3 {
    color: #9CAF88;
    font-size: 1.3rem;
    margin-bottom: 20px;
    text-align: center;
}

.setting-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
}

.setting-row label {
    font-weight: 700;
    color: #3A3326;
    font-size: 0.95rem;
}

.setting-row select {
    padding: 14px;
    border: 2px solid #F5EDD8;
    border-radius: 10px;
    font-size: 1rem;
    font-family: 'Nunito', sans-serif;
    background: #FFFFFF;
    cursor: pointer;
    transition: all 0.3s ease;
}

.setting-row select:focus {
    outline: none;
    border-color: #9CAF88;
    box-shadow: 0 0 0 4px rgba(156, 175, 136, 0.15);
}

.full-width {
    width: 100%;
}

/* Exit Section */
.exit-section {
    text-align: center;
    margin-top: 20px;
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .player-list-container {
        padding: 16px;
    }

    .player-item {
        padding: 10px 12px;
    }

    .player-avatar {
        width: 36px;
        height: 36px;
        font-size: 1rem;
    }

    .player-name {
        font-size: 1rem;
    }

    .admin-panel {
        padding: 20px;
    }

    .admin-panel h3 {
        font-size: 1.1rem;
    }

    .waiting-message p {
        font-size: 1.1rem;
    }
}
```

---

## 🎨 Screen 3: Game Screen

### Wireframe Description

```
┌─────────────────────────────┐
│  Round 3/5                  │
│  ════════════════════       │
│                             │
│     👩 Michelle              │
│     (Mom)                   │
│                             │
│  Question:                  │
│  ┌─────────────────────┐   │
│  │ Who changes more     │   │
│  │ diapers at 3 AM?    │   │
│  └─────────────────────┘   │
│                             │
│                             │
│     👨 Jazeel               │
│     (Dad)                   │
│                             │
│  [Michelle]   [Jazeel]      │
│                             │
│  Progress: ████████░░ 80%   │
└─────────────────────────────┘
```

### HTML Structure

```html
<section id="mom-vs-dad-game" class="mvd-section">
    <!-- Progress Header -->
    <div class="game-header">
        <div class="round-indicator">Round 3/5</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 60%"></div>
        </div>
    </div>

    <!-- Michelle Avatar (Left) -->
    <div class="avatar-container avatar-left">
        <div class="avatar-circle">
            <div class="avatar-image">👩</div>
        </div>
        <div class="avatar-name">Michelle</div>
        <div class="avatar-role">(Mom)</div>
    </div>

    <!-- Question Card -->
    <div class="question-card">
        <div class="question-icon">❓</div>
        <h2 id="question-text">Who changes more diapers at 3 AM?</h2>
    </div>

    <!-- Jazeel Avatar (Right) -->
    <div class="avatar-container avatar-right">
        <div class="avatar-circle">
            <div class="avatar-image">👨</div>
        </div>
        <div class="avatar-name">Jazeel</div>
        <div class="avatar-role">(Dad)</div>
    </div>

    <!-- Vote Buttons -->
    <div class="vote-buttons">
        <button class="vote-btn vote-mom" data-choice="mom">
            <span class="vote-icon">👩</span>
            <span class="vote-text">Michelle</span>
        </button>

        <button class="vote-btn vote-dad" data-choice="dad">
            <span class="vote-icon">👨</span>
            <span class="vote-text">Jazeel</span>
        </button>
    </div>

    <!-- Feedback Message -->
    <div class="vote-feedback hidden" id="vote-feedback">
        Your vote has been recorded!
    </div>
</section>
```

### CSS Architecture

```css
/* ========================================
   GAME SCREEN
   ======================================== */

.game-header {
    text-align: center;
    margin-bottom: 24px;
}

.round-indicator {
    font-size: 1.3rem;
    font-weight: 700;
    color: #9CAF88;
    margin-bottom: 12px;
}

.progress-bar {
    height: 8px;
    background: #F5EDD8;
    border-radius: 4px;
    overflow: hidden;
    margin: 0 auto;
    max-width: 300px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #9CAF88 0%, #E8C4A0 100%);
    border-radius: 4px;
    transition: width 0.5s ease;
    box-shadow: 0 2px 4px rgba(156, 175, 136, 0.3);
}

/* Avatar Containers */
.avatar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 16px 0;
}

.avatar-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 4px solid #F5EDD8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: relative;
}

.avatar-left .avatar-circle {
    border-color: #FF9FF3;
}

.avatar-right .avatar-circle {
    border-color: #74B9FF;
}

.avatar-image {
    font-size: 3.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.avatar-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #3A3326;
}

.avatar-role {
    font-size: 0.9rem;
    color: #5D4E37;
    font-weight: 500;
}

/* Question Card */
.question-card {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 3px solid #9CAF88;
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
    margin: 20px 0;
    box-shadow: 0 4px 16px rgba(156, 175, 136, 0.15);
}

.question-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    display: block;
}

.question-card h2 {
    color: #3A3326;
    font-size: 1.3rem;
    line-height: 1.5;
    margin: 0;
    font-weight: 700;
}

/* Vote Buttons */
.vote-buttons {
    display: flex;
    gap: 16px;
    margin: 24px 0;
    justify-content: center;
}

.vote-btn {
    flex: 1;
    max-width: 200px;
    padding: 16px 24px;
    border: 3px solid #F5EDD8;
    border-radius: 16px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 100px;
    justify-content: center;
}

.vote-btn:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(156, 175, 136, 0.25);
}

.vote-btn:active:not(:disabled) {
    transform: translateY(-2px);
}

.vote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.vote-mom:hover:not(:disabled) {
    border-color: #FF9FF3;
    background: linear-gradient(135deg, #FF9FF3 0%, #FFB3D1 100%);
}

.vote-dad:hover:not(:disabled) {
    border-color: #74B9FF;
    background: linear-gradient(135deg, #74B9FF 0%, #A0D2FF 100%);
}

.vote-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.vote-text {
    font-size: 1.2rem;
    font-weight: 700;
    color: #3A3326;
}

.vote-btn:hover .vote-text {
    color: #FFFFFF;
}

/* Vote Feedback */
.vote-feedback {
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, #9CAF88 0%, #7A8F6A 100%);
    color: white;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 16px;
    animation: slideUp 0.4s ease-out;
}

.vote-feedback.hidden {
    display: none;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .avatar-circle {
        width: 80px;
        height: 80px;
    }

    .avatar-image {
        font-size: 2.8rem;
    }

    .avatar-name {
        font-size: 1.1rem;
    }

    .avatar-role {
        font-size: 0.85rem;
    }

    .question-card {
        padding: 24px 20px;
    }

    .question-card h2 {
        font-size: 1.2rem;
    }

    .vote-buttons {
        flex-direction: column;
        gap: 12px;
    }

    .vote-btn {
        max-width: 100%;
        padding: 14px 20px;
        min-height: 90px;
        flex-direction: row;
        justify-content: flex-start;
        padding-left: 30px;
    }

    .vote-icon {
        font-size: 2rem;
    }

    .vote-text {
        font-size: 1.1rem;
    }

    .round-indicator {
        font-size: 1.1rem;
    }
}
```

---

## 🎨 Screen 4: Results Screen

### Wireframe Description

```
┌─────────────────────────────┐
│  🎉 Game Complete!          │
│  ════════════════════       │
│                             │
│  Final Scores:              │
│  ┌─────────────────────┐   │
│  │ Michelle: 15 pts    │   │
│  │ Jazeel: 12 pts     │   │
│  └─────────────────────┘   │
│                             │
│  🏆 Winner: Michelle!       │
│                             │
│  Thanks for playing!        │
│                             │
│  [Play Again]               │
│  [Back to Lobbies]          │
└─────────────────────────────┘
```

### HTML Structure

```html
<section id="mom-vs-dad-results" class="mvd-section">
    <div class="results-header">
        <div class="trophy-icon">🏆</div>
        <h1>Game Complete!</h1>
        <p>Thanks for playing!</p>
    </div>

    <!-- Score Cards -->
    <div class="score-container">
        <div class="score-card winner">
            <div class="score-avatar">👩</div>
            <div class="score-name">Michelle</div>
            <div class="score-points">15 points</div>
            <div class="winner-badge">👑 Winner!</div>
        </div>

        <div class="score-card">
            <div class="score-avatar">👨</div>
            <div class="score-name">Jazeel</div>
            <div class="score-points">12 points</div>
        </div>
    </div>

    <!-- Final Message -->
    <div class="final-message">
        <p>Mom really knows her stuff! 🎉</p>
    </div>

    <!-- Action Buttons -->
    <div class="results-actions">
        <button id="play-again-btn" class="btn-primary full-width">
            🔄 Play Again
        </button>
        <button id="back-to-lobbies-btn" class="btn-secondary full-width">
            🏠 Back to Lobbies
        </button>
    </div>
</section>
```

### CSS Architecture

```css
/* ========================================
   RESULTS SCREEN
   ======================================== */

.results-header {
    text-align: center;
    margin-bottom: 30px;
}

.trophy-icon {
    font-size: 4rem;
    margin-bottom: 16px;
    display: block;
    filter: drop-shadow(0 4px 8px rgba(156, 175, 136, 0.3));
}

.results-header h1 {
    color: #9CAF88;
    font-size: 2rem;
    margin-bottom: 8px;
    font-weight: 700;
}

.results-header p {
    color: #3A3326;
    font-size: 1.1rem;
    margin: 0;
}

/* Score Container */
.score-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

.score-card {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
    border: 3px solid #F5EDD8;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.score-card.winner {
    border-color: #FFD700;
    background: linear-gradient(135deg, #FFF9E6 0%, #FFD700 20%, #FFF8E7 100%);
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.score-avatar {
    font-size: 3rem;
    margin-bottom: 12px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.score-name {
    font-size: 1.4rem;
    font-weight: 700;
    color: #3A3326;
    margin-bottom: 8px;
}

.score-points {
    font-size: 1.3rem;
    font-weight: 600;
    color: #9CAF88;
}

.winner-badge {
    font-size: 1.2rem;
    font-weight: 700;
    color: #FFD700;
    margin-top: 12px;
    animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

/* Final Message */
.final-message {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #FFF8E7 0%, #F4E4BC 100%);
    border-radius: 12px;
    margin-bottom: 24px;
    border: 2px dashed #9CAF88;
}

.final-message p {
    font-size: 1.2rem;
    color: #3A3326;
    margin: 0;
    font-weight: 600;
}

/* Results Actions */
.results-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.full-width {
    width: 100%;
}

/* Mobile Responsive */
@media (max-width: 600px) {
    .trophy-icon {
        font-size: 3rem;
    }

    .results-header h1 {
        font-size: 1.6rem;
    }

    .score-card {
        padding: 20px;
    }

    .score-avatar {
        font-size: 2.5rem;
    }

    .score-name {
        font-size: 1.2rem;
    }

    .score-points {
        font-size: 1.1rem;
    }

    .winner-badge {
        font-size: 1.1rem;
    }

    .final-message p {
        font-size: 1.1rem;
    }
}
```

---

## 🎨 Component Hierarchy

```
#mom-vs-dad-game (Container)
├── #mom-vs-dad-lobbies (Section: Lobby Selection)
│   ├── .mvd-header
│   ├── .lobbies-grid
│   │   ├── .lobby-card × 4
│   └── #join-modal (Modal)
│       └── .modal-content
│           ├── input#player-name
│           └── .modal-actions
│               ├── #join-cancel
│               └── #join-confirm
│
├── #mom-vs-dad-waiting (Section: Waiting Room)
│   ├── .mvd-header
│   ├── .player-list-container
│   │   ├── .player-list-header
│   │   └── .player-list
│   │       └── .player-item × N
│   ├── #waiting-message
│   ├── #admin-panel
│   │   ├── .setting-row × N
│   │   └── #start-game-btn
│   └── .exit-section
│       └── #exit-lobby-btn
│
├── #mom-vs-dad-game (Section: Active Game)
│   ├── .game-header
│   │   ├── .round-indicator
│   │   └── .progress-bar
│   ├── .avatar-container.avatar-left
│   ├── .question-card
│   ├── .avatar-container.avatar-right
│   ├── .vote-buttons
│   │   ├── .vote-btn.vote-mom
│   │   └── .vote-btn.vote-dad
│   └── #vote-feedback
│
└── #mom-vs-dad-results (Section: Results)
    ├── .results-header
    ├── .score-container
    │   ├── .score-card.winner
    │   └── .score-card
    ├── .final-message
    └── .results-actions
        ├── #play-again-btn
        └── #back-to-lobbies-btn
```

---

## 🎬 Animation Specifications

### Fade Transitions (Screen Changes)

```css
.fade-in {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

### Button Hover Effects

```css
/* No bouncing, only translate and shadow */
.vote-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(156, 175, 136, 0.25);
}
```

### Progress Bar Animation

```css
.progress-fill {
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(156, 175, 136, 0.3);
}
```

### Modal Pop-in

```css
.modal-content {
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
```

### Winner Badge Bounce (Subtle)

```css
.winner-badge {
    animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
```

### Vote Feedback Slide-up

```css
.vote-feedback {
    animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

---

## 📱 Mobile Responsive Breakpoints

### Small Phones (320px - 400px)
```css
@media (max-width: 400px) {
    .lobbies-grid {
        grid-template-columns: 1fr;
    }

    .lobby-card {
        padding: 16px 12px;
        min-height: 110px;
    }

    .avatar-circle {
        width: 70px;
        height: 70px;
    }

    .avatar-image {
        font-size: 2.5rem;
    }

    .vote-buttons {
        flex-direction: column;
    }

    .question-card h2 {
        font-size: 1.1rem;
    }
}
```

### Medium Phones (401px - 600px)
```css
@media (max-width: 600px) {
    .lobbies-grid {
        grid-template-columns: 1fr;
    }

    .mvd-header h1 {
        font-size: 1.6rem;
    }

    .avatar-circle {
        width: 80px;
        height: 80px;
    }

    .question-card {
        padding: 24px 20px;
    }

    .vote-buttons {
        flex-direction: column;
        gap: 12px;
    }
}
```

### Tablets (601px - 768px)
```css
@media (max-width: 768px) {
    .lobbies-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
    }

    .vote-buttons {
        flex-direction: row;
    }
}
```

### Desktop (769px+)
```css
@media (min-width: 769px) {
    .lobbies-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }

    .mvd-section {
        padding: 20px;
        max-width: 700px;
    }
}
```

---

## ♿ Accessibility Requirements

### Touch Targets
- Minimum 48px × 48px for all interactive elements
- 56px × 56px for primary action buttons
- Minimum 44px spacing between touch targets

### Color Contrast
- Text: WCAG AA compliant (4.5:1 ratio)
- Interactive elements: WCAG AA compliant (3:1 ratio)
- Success/error states: WCAG AAA compliant (7:1 ratio)

### Keyboard Navigation
- Tab order follows visual flow
- Visible focus indicators (2px solid #9CAF88)
- Escape key closes modals
- Enter/Space activates buttons

### Screen Reader Support
- Semantic HTML elements (`<section>`, `<button>`, `<input>`)
- ARIA labels where necessary
- Live regions for dynamic content updates
- Descriptive alt text for images

---

## 🔧 Technical Implementation Notes

### File Structure
```
styles/
├── main.css                    # Base styles
└── mom-vs-dad.css             # Game-specific styles (NEW)

scripts/
└── mom-vs-dad.js              # Game logic (NEW)
```

### CSS Variables (Add to main.css)
```css
:root {
    /* Mom vs Dad Game Colors */
    --mvd-mom-color: #FF9FF3;      /* Pink for Michelle */
    --mvd-dad-color: #74B9FF;      /* Blue for Jazeel */
    --mvd-question-bg: #FFF8E7;     /* Cream background */
    --mvd-question-border: #9CAF88; /* Sage border */
    --mvd-success: #9CAF88;        /* Green for success */
    --mvd-error: #E07A5F;          /* Red for errors */
}
```

### JavaScript State Management
```javascript
const GameStates = {
    LOBBY_SELECT: 'lobby-select',
    WAITING: 'waiting',
    PLAYING: 'playing',
    RESULTS: 'results'
};

let currentState = GameStates.LOBBY_SELECT;
let currentLobby = null;
let playerName = null;
let isAdmin = false;
```

---

## 📊 Performance Considerations

### CSS Optimization
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, or `margin` (reflow triggers)
- Use `will-change` sparingly
- Minimize box-shadows on mobile devices

### JavaScript Optimization
- Debounce scroll events (if needed)
- Use `requestAnimationFrame` for animations
- Implement proper cleanup for event listeners
- Use `classList` instead of direct style manipulation

---

## ✅ Design Validation Checklist

- [ ] No background images - solid colors only
- [ ] No horizontal scrolling
- [ ] No overlapping content
- [ ] Touch targets minimum 48px
- [ ] Mobile-first design
- [ ] Accessible colors (WCAG AA)
- [ ] Simple animations (no bouncing on interactive elements)
- [ ] Clear visual hierarchy
- [ ] Proper focus indicators
- [ ] Semantic HTML structure
- [ ] Responsive breakpoints tested
- [ ] Admin panel hidden by default
- [ ] No complex entry flow

---

**Document Version:** 1.0
**Created:** 2026-01-04
**Status:** Ready for Implementation
**Next Steps:** Implement HTML structure, add CSS, integrate with game logic
