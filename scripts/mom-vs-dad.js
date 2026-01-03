/**
 * Baby Shower App - Mom vs Dad Game Feature
 * Interactive "who would rather" voting game with AI-generated scenarios
 * Follows IIFE pattern and attaches to window.MomVsDad
 */

(function() {
    'use strict';

    console.log('[MomVsDad] Game module loading...');

    // =====================================================
    // PRIVATE STATE
    // =====================================================

    let currentSession = null;
    let currentScenario = null;
    let userRole = 'guest'; // 'guest' or 'admin'
    let userName = '';
    let voted = false;
    let realtimeSubscription = null;
    let votePollingInterval = null;
    let chibiMom = null;
    let chibiDad = null;
    let tugOfWarBar = null;

    // Game state constants
    const GAME_STATES = {
        SETUP: 'setup',
        VOTING: 'voting',
        REVEALED: 'revealed',
        COMPLETE: 'complete'
    };

    // =====================================================
    // PRIVATE HELPER FUNCTIONS
    // =====================================================

    /**
     * Get Supabase configuration
     */
    function getSupabaseConfig() {
        return {
            url: window.CONFIG?.SUPABASE?.URL || '',
            anonKey: window.CONFIG?.SUPABASE?.ANON_KEY || ''
        };
    }

    /**
     * Generic API fetch wrapper
     */
    async function apiFetch(url, options = {}) {
        const config = getSupabaseConfig();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.anonKey}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[MomVsDad] API Error:', error.message);
            throw error;
        }
    }

    /**
     * Show error message to user
     */
    function showError(message) {
        alert(message); // Could be enhanced with a toast notification
    }

    /**
     * Show success message to user
     */
    function showSuccess(message) {
        alert(message); // Could be enhanced with a toast notification
    }

    /**
     * Initialize confetti effect
     */
    function triggerConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = (Math.random() * 2) + 's';
            container.appendChild(confetti);
        }

        setTimeout(() => {
            document.body.removeChild(container);
        }, 4000);
    }

    /**
     * Animate chibi avatar
     */
    function animateChibi(chibi, animation) {
        if (!chibi) return;

        // Remove existing animation classes
        chibi.classList.remove('bounce', 'pulse', 'glow', 'shake');

        // Add new animation
        chibi.classList.add(animation);

        // Remove animation after it completes
        setTimeout(() => {
            chibi.classList.remove(animation);
        }, 600);
    }

    /**
     * Update tug-of-war bar
     */
    function updateTugOfWar(momPercentage, dadPercentage) {
        if (!tugOfWarBar) return;

        const momFill = tugOfWarBar.querySelector('.tug-of-war-mom');
        const dadFill = tugOfWarBar.querySelector('.tug-of-war-dad');

        if (momFill && dadFill) {
            momFill.style.width = momPercentage + '%';
            dadFill.style.width = dadPercentage + '%';

            // Add pulse animation on update
            tugOfWarBar.classList.add('pulse');
            setTimeout(() => {
                tugOfWarBar.classList.remove('pulse');
            }, 600);
        }
    }

    /**
     * Initialize chibi avatars
     */
    function initChibiAvatars() {
        chibiMom = document.querySelector('.chibi-avatar-mom');
        chibiDad = document.querySelector('.chibi-avatar-dad');
        tugOfWarBar = document.querySelector('.tug-of-war-bar');

        console.log('[MomVsDad] Chibi avatars initialized');
    }

    // =====================================================
    // REALTIME SUBSCRIPTION
    // =====================================================

    /**
     * Subscribe to game state updates
     */
    function subscribeToGame(sessionId) {
        const config = getSupabaseConfig();

        if (!config.url) {
            console.error('[MomVsDad] Supabase URL not configured');
            return;
        }

        const channelName = `game_state:${sessionId}`;

        // Note: This would use the Supabase realtime client
        // For now, we'll use a polling approach as a fallback
        console.log('[MomVsDad] Subscribing to game updates...');

        // Start polling for updates (every 3 seconds)
        realtimeSubscription = setInterval(async () => {
            try {
                // Poll for game state updates
                const gameState = await apiFetch(
                    `${config.url}/functions/v1/game-session`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'get_state',
                            session_id: sessionId
                        })
                    }
                );

                handleGameUpdate(gameState);
            } catch (error) {
                console.error('[MomVsDad] Polling error:', error.message);
            }
        }, 3000);

        console.log('[MomVsDad] Started polling for game updates');
    }

    /**
     * Unsubscribe from game updates
     */
    function unsubscribeFromGame() {
        if (realtimeSubscription) {
            clearInterval(realtimeSubscription);
            realtimeSubscription = null;
            console.log('[MomVsDad] Unsubscribed from game updates');
        }
    }

    /**
     * Poll for vote count updates (only when on voting screen)
     */
    function startVotePolling() {
        console.log('[MomVsDad] Starting vote count polling...');

        // Clear any existing vote polling
        if (votePollingInterval) {
            clearInterval(votePollingInterval);
        }

        const config = getSupabaseConfig();
        if (!config.url || !currentScenario) {
            console.log('[MomVsDad] Cannot start vote polling - no config or scenario');
            return;
        }

        // Poll every 2 seconds for updated vote counts
        votePollingInterval = setInterval(async () => {
            try {
                // Call game-vote function to get current vote counts
                // Using GET request with query parameters
                const url = new URL(`${config.url}/functions/v1/game-vote`);
                url.searchParams.append('scenario_id', currentScenario.id);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    // Update UI with new vote counts
                    if (data && (data.mom_pct !== undefined || data.mom_votes !== undefined)) {
                        // Calculate percentages if not provided
                        const momPct = data.mom_pct !== undefined
                            ? data.mom_pct
                            : calculatePercentage(data.mom_votes, data.dad_votes);
                        const dadPct = data.dad_pct !== undefined
                            ? data.dad_pct
                            : 100 - momPct;

                        // Update tug-of-war bar
                        updateTugOfWar(momPct, dadPct);

                        // Update percentage text displays
                        const momPctText = document.querySelector('.mom-pct');
                        const dadPctText = document.querySelector('.dad-pct');

                        if (momPctText) {
                            momPctText.textContent = `${Math.round(momPct)}%`;
                        }
                        if (dadPctText) {
                            dadPctText.textContent = `${Math.round(dadPct)}%`;
                        }

                        console.log('[MomVsDad] Vote counts updated:', {
                            mom: momPct,
                            dad: dadPct,
                            votes: data
                        });
                    }
                }
            } catch (error) {
                console.error('[MomVsDad] Vote polling error:', error.message);
                // Don't stop polling on error, just log it
            }
        }, 2000); // Poll every 2 seconds

        console.log('[MomVsDad] Vote polling started');
    }

    /**
     * Stop vote count polling
     */
    function stopVotePolling() {
        if (votePollingInterval) {
            clearInterval(votePollingInterval);
            votePollingInterval = null;
            console.log('[MomVsDad] Vote polling stopped');
        }
    }

    /**
     * Calculate percentage from vote counts
     */
    function calculatePercentage(momVotes, dadVotes) {
        if (!momVotes && !dadVotes) return 50; // Default to 50-50 if no votes
        const total = (momVotes || 0) + (dadVotes || 0);
        if (total === 0) return 50;
        return ((momVotes || 0) / total) * 100;
    }

    /**
     * Handle game state updates
     */
    function handleGameUpdate(gameState) {
        console.log('[MomVsDad] Game state update:', gameState);

        if (!gameState) return;

        // Handle different update types
        if (gameState.type === 'vote_update') {
            handleVoteUpdate(gameState.payload);
        } else if (gameState.type === 'scenario_new') {
            handleNewScenario(gameState.payload);
        } else if (gameState.type === 'answer_locked') {
            handleAnswerLocked(gameState.payload);
        } else if (gameState.type === 'result_reveal') {
            handleResultReveal(gameState.payload);
        } else if (gameState.type === 'reveal_trigger') {
            handleRevealTrigger(gameState.payload);
        }
    }

    /**
     * Handle vote updates
     */
    function handleVoteUpdate(payload) {
        if (payload && tugOfWarBar) {
            updateTugOfWar(payload.mom_pct || 50, payload.dad_pct || 50);

            // Animate appropriate chibi
            if (payload.last_vote === 'mom' && chibiMom) {
                animateChibi(chibiMom, 'bounce');
            } else if (payload.last_vote === 'dad' && chibiDad) {
                animateChibi(chibiDad, 'bounce');
            }
        }
    }

    /**
     * Handle new scenario
     */
    function handleNewScenario(payload) {
        console.log('[MomVsDad] New scenario:', payload);
        currentScenario = payload;

        // Update voting screen
        const scenarioText = document.querySelector('.game-scenario-text');
        const momOption = document.querySelector('.game-option-mom');
        const dadOption = document.querySelector('.game-option-dad');

        if (scenarioText) scenarioText.textContent = payload.scenario_text || '';
        if (momOption) momOption.textContent = payload.mom_option || '';
        if (dadOption) dadOption.textContent = payload.dad_option || '';

        // Reset voted state
        voted = false;
        updateVoteButtons();
    }

    /**
     * Handle answer locked
     */
    function handleAnswerLocked(payload) {
        console.log('[MomVsDad] Answer locked:', payload);

        // Update lock status indicators
        const momLock = document.querySelector('.lock-status-mom');
        const dadLock = document.querySelector('.lock-status-dad');

        if (momLock && payload.parent === 'mom') {
            momLock.classList.add('locked');
            momLock.textContent = '🔒 Locked';
        }

        if (dadLock && payload.parent === 'dad') {
            dadLock.classList.add('locked');
            dadLock.textContent = '🔒 Locked';
        }

        // Check if both locked and notify admin
        if (momLock?.classList.contains('locked') && dadLock?.classList.contains('locked')) {
            if (userRole === 'admin') {
                showSuccess('Both parents locked! Ready to reveal!');
            }
        }
    }

    /**
     * Handle result reveal
     */
    function handleResultReveal(payload) {
        console.log('[MomVsDad] Result reveal:', payload);

        // Show results screen
        showResults(payload);

        // Trigger confetti if significant reveal
        if (payload.perception_gap > 30) {
            triggerConfetti();
        }
    }

    /**
     * Handle reveal trigger
     */
    function handleRevealTrigger(payload) {
        console.log('[MomVsDad] Reveal triggered:', payload);

        // Update session state
        if (currentSession) {
            currentSession.status = GAME_STATES.REVEALED;
        }
    }

    // =====================================================
    // UI COMPONENTS
    // =====================================================

    /**
     * Create join screen HTML
     */
    function createJoinScreen() {
        return `
            <div id="game-join-screen" class="game-screen fade-in">
                <div class="game-card">
                    <div class="game-header">
                        <h2 class="game-title">🎮 Mom vs Dad Game</h2>
                        <p class="game-subtitle">Join the fun!</p>
                    </div>

                    <form id="game-join-form" class="game-form">
                        <div class="form-group">
                            <label for="game-session-code" class="form-label">
                                Session Code
                            </label>
                            <input
                                type="text"
                                id="game-session-code"
                                name="session_code"
                                class="form-input"
                                placeholder="Enter 6-digit code"
                                maxlength="6"
                                required
                                pattern="[A-Za-z0-9]{6}"
                                title="Please enter a valid 6-character code"
                            />
                            <small class="form-hint">Example: ABC123</small>
                        </div>

                        <div class="form-group">
                            <label for="game-guest-name" class="form-label">
                                Your Name
                            </label>
                            <input
                                type="text"
                                id="game-guest-name"
                                name="guest_name"
                                class="form-input"
                                placeholder="Enter your name"
                                required
                                maxlength="50"
                            />
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-block">
                                🎯 Join Game
                            </button>
                        </div>

                        <div class="form-divider">OR</div>

                        <button
                            type="button"
                            id="btn-admin-login"
                            class="btn btn-secondary btn-block"
                        >
                            🔐 Parent Login
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Create admin login screen HTML
     */
    function createAdminLoginScreen() {
        return `
            <div id="game-admin-screen" class="game-screen fade-in">
                <div class="game-card">
                    <div class="game-header">
                        <h2 class="game-title">🔐 Parent Login</h2>
                        <p class="game-subtitle">Enter your admin PIN</p>
                    </div>

                    <form id="game-admin-form" class="game-form">
                        <div class="form-group">
                            <label for="admin-session-code" class="form-label">
                                Session Code
                            </label>
                            <input
                                type="text"
                                id="admin-session-code"
                                name="session_code"
                                class="form-input"
                                placeholder="Enter 6-digit code"
                                maxlength="6"
                                required
                                pattern="[A-Za-z0-9]{6}"
                            />
                        </div>

                        <div class="form-group">
                            <label for="admin-pin" class="form-label">
                                Admin PIN (4 digits)
                            </label>
                            <input
                                type="password"
                                id="admin-pin"
                                name="admin_pin"
                                class="form-input"
                                placeholder="Enter 4-digit PIN"
                                maxlength="4"
                                required
                                pattern="[0-9]{4}"
                                title="Please enter a 4-digit PIN"
                            />
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-block">
                                🔓 Login as Parent
                            </button>
                        </div>

                        <button
                            type="button"
                            id="btn-back-to-join"
                            class="btn btn-link btn-block"
                        >
                            ← Back to Guest Join
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Create voting screen HTML
     */
    function createVotingScreen() {
        return `
            <div id="game-voting-screen" class="game-screen">
                <div class="game-voting-container">
                    <!-- Chibi Avatars -->
                    <div class="game-chibis">
                        <div class="chibi-avatar chibi-avatar-mom">
                            <div class="chibi-emoji">👩</div>
                            <div class="chibi-label">Mom</div>
                        </div>

                        <div class="game-vs-badge">VS</div>

                        <div class="chibi-avatar chibi-avatar-dad">
                            <div class="chibi-emoji">👨</div>
                            <div class="chibi-label">Dad</div>
                        </div>
                    </div>

                    <!-- Scenario Card -->
                    <div class="game-scenario-card fade-in-up">
                        <div class="scenario-icon">❓</div>
                        <div class="game-scenario-text">
                            Loading scenario...
                        </div>
                    </div>

                    <!-- Tug of War Bar -->
                    <div class="tug-of-war-section">
                        <div class="tug-of-war-label">Live Votes</div>
                        <div class="tug-of-war-bar">
                            <div class="tug-of-war-mom" style="width: 50%"></div>
                            <div class="tug-of-war-center">🏆</div>
                            <div class="tug-of-war-dad" style="width: 50%"></div>
                        </div>
                        <div class="tug-of-war-percentages">
                            <span class="mom-pct">50%</span>
                            <span class="dad-pct">50%</span>
                        </div>
                    </div>

                    <!-- Vote Buttons -->
                    <div class="game-vote-buttons">
                        <button
                            type="button"
                            id="btn-vote-mom"
                            class="btn btn-vote-mom"
                            disabled
                        >
                            <span class="vote-icon">👩</span>
                            <span class="vote-label game-option-mom">Mom's option</span>
                        </button>

                        <button
                            type="button"
                            id="btn-vote-dad"
                            class="btn btn-vote-dad"
                            disabled
                        >
                            <span class="vote-icon">👨</span>
                            <span class="vote-label game-option-dad">Dad's option</span>
                        </button>
                    </div>

                    <!-- Vote Status -->
                    <div id="vote-status" class="vote-status hidden">
                        <span class="status-icon">✅</span>
                        <span class="status-text">You voted! Waiting for reveal...</span>
                    </div>

                    <!-- Admin Panel (only for parents) -->
                    <div id="game-admin-panel" class="game-admin-panel hidden">
                        <div class="admin-panel-header">
                            <h3>🎛️ Parent Controls</h3>
                        </div>

                        <div class="lock-status-section">
                            <div class="lock-status-item">
                                <span class="lock-label">Mom's Answer:</span>
                                <span class="lock-status lock-status-mom">⏳ Pending</span>
                            </div>
                            <div class="lock-status-item">
                                <span class="lock-label">Dad's Answer:</span>
                                <span class="lock-status lock-status-dad">⏳ Pending</span>
                            </div>
                        </div>

                        <div class="admin-actions">
                            <button
                                type="button"
                                id="btn-lock-mom"
                                class="btn btn-lock-mom"
                            >
                                🔒 Lock Mom's Answer
                            </button>
                            <button
                                type="button"
                                id="btn-lock-dad"
                                class="btn btn-lock-dad"
                            >
                                🔒 Lock Dad's Answer
                            </button>
                            <button
                                type="button"
                                id="btn-trigger-reveal"
                                class="btn btn-reveal"
                                disabled
                            >
                                🎉 Reveal Results!
                            </button>
                        </div>
                    </div>

                    <!-- Game Info -->
                    <div class="game-info">
                        <div class="info-item">
                            <span class="info-label">Session:</span>
                            <span class="info-value game-session-code">---</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Round:</span>
                            <span class="info-value game-round">1/5</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create results screen HTML
     */
    function createResultsScreen() {
        return `
            <div id="game-results-screen" class="game-screen hidden">
                <div class="game-results-container">
                    <!-- Results Header -->
                    <div class="results-header fade-in">
                        <div class="results-icon">🎯</div>
                        <h2 class="results-title">The Truth Revealed!</h2>
                    </div>

                    <!-- Crowd vs Reality Split -->
                    <div class="results-split-view slide-in">
                        <!-- Crowd's Choice -->
                        <div class="result-card crowd-choice">
                            <div class="result-card-header">
                                <span class="result-icon">👥</span>
                                <h3 class="result-title">Crowd's Choice</h3>
                            </div>
                            <div class="result-percentage">
                                <span class="percentage-value crowd-pct">---</span>
                                <span class="percentage-label">voted</span>
                            </div>
                            <div class="result-choice crowd-choice-text">
                                ---
                            </div>
                        </div>

                        <!-- VS Badge -->
                        <div class="results-vs">VS</div>

                        <!-- Reality -->
                        <div class="result-card reality-choice">
                            <div class="result-card-header">
                                <span class="result-icon">🏠</span>
                                <h3 class="result-title">Reality</h3>
                            </div>
                            <div class="result-percentage">
                                <span class="percentage-label">Actual answer:</span>
                            </div>
                            <div class="result-choice reality-choice-text">
                                ---
                            </div>
                        </div>
                    </div>

                    <!-- Perception Gap -->
                    <div class="perception-gap-section fade-in-up">
                        <div class="gap-icon">📊</div>
                        <h3 class="gap-title">Perception Gap</h3>
                        <div class="gap-value perception-gap-value">---</div>
                        <div class="gap-description">
                            How wrong (or right!) the crowd was
                        </div>
                    </div>

                    <!-- AI Roast Commentary -->
                    <div class="roast-section fade-in-up">
                        <div class="roast-header">
                            <span class="roast-icon">🔥</span>
                            <h3 class="roast-title">AI Roast Commentary</h3>
                        </div>
                        <div class="roast-content roast-commentary">
                            Loading roast...
                        </div>
                    </div>

                    <!-- Vote Match Feedback -->
                    <div id="vote-match-feedback" class="vote-match-feedback hidden">
                        <div class="match-icon">🎉</div>
                        <div class="match-message">
                            You nailed it! Your prediction was correct!
                        </div>
                    </div>

                    <!-- Next Round Button -->
                    <div class="results-actions">
                        <button
                            type="button"
                            id="btn-next-round"
                            class="btn btn-primary btn-block"
                        >
                            ➡️ Next Round
                        </button>
                    </div>

                    <!-- Final Game Results -->
                    <div id="game-final-results" class="game-final-results hidden">
                        <div class="final-results-header">
                            <div class="final-icon">🏆</div>
                            <h2 class="final-title">Game Complete!</h2>
                            <p class="final-subtitle">Final Results</h2>
                        </div>

                        <div class="final-scores">
                            <div class="score-item">
                                <span class="score-label">Mom's Wins:</span>
                                <span class="score-value mom-wins">0</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Dad's Wins:</span>
                                <span class="score-value dad-wins">0</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Most Accurate Predictor:</span>
                                <span class="score-value best-predictor">---</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update vote button states
     */
    function updateVoteButtons() {
        const btnMom = document.getElementById('btn-vote-mom');
        const btnDad = document.getElementById('btn-vote-dad');
        const voteStatus = document.getElementById('vote-status');

        if (btnMom && btnDad) {
            if (voted) {
                btnMom.disabled = true;
                btnDad.disabled = true;
                btnMom.classList.add('voted');
                btnDad.classList.add('voted');
            } else if (currentScenario) {
                btnMom.disabled = false;
                btnDad.disabled = false;
                btnMom.classList.remove('voted');
                btnDad.classList.remove('voted');
            } else {
                btnMom.disabled = true;
                btnDad.disabled = true;
            }
        }

        if (voteStatus) {
            if (voted) {
                voteStatus.classList.remove('hidden');
            } else {
                voteStatus.classList.add('hidden');
            }
        }
    }

    // =====================================================
    // PUBLIC API METHODS
    // =====================================================

    /**
     * Initialize the Mom vs Dad game module
     */
    function init() {
        console.log('[MomVsDad] Initializing game module...');

        // Find or create game container
        let gameContainer = document.getElementById('mom-vs-dad-game');

        if (!gameContainer) {
            gameContainer = document.createElement('section');
            gameContainer.id = 'mom-vs-dad-game';
            gameContainer.className = 'game-section';

            // Add to main content
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.appendChild(gameContainer);
            } else {
                document.body.appendChild(gameContainer);
            }
        }

        // Show join screen
        showJoinScreen();

        console.log('[MomVsDad] Game module initialized');
    }

    /**
     * Display session join UI
     */
    function showJoinScreen() {
        // Stop vote polling when leaving voting screen
        stopVotePolling();

        const gameContainer = document.getElementById('mom-vs-dad-game');
        if (!gameContainer) return;

        gameContainer.innerHTML = createJoinScreen();

        // Attach event listeners
        const joinForm = document.getElementById('game-join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', handleJoinSubmit);
        }

        const adminLoginBtn = document.getElementById('btn-admin-login');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', showAdminLoginScreen);
        }

        console.log('[MomVsDad] Join screen displayed');
    }

    /**
     * Handle join form submission
     */
    async function handleJoinSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const sessionCode = formData.get('session_code').toUpperCase();
        const guestName = formData.get('guest_name').trim();

        try {
            await joinSession(sessionCode, guestName);
        } catch (error) {
            showError(`Failed to join game: ${error.message}`);
        }
    }

    /**
     * Join a game session as guest
     */
    async function joinSession(code, name) {
        console.log('[MomVsDad] Joining session:', code, 'as', name);

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            // Call game-session Edge Function
            const response = await apiFetch(
                `${config.url}/functions/v1/game-session`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'join',
                        session_code: code,
                        guest_name: name
                    })
                }
            );

            currentSession = response;
            userName = name;
            userRole = 'guest';
            voted = false;

            console.log('[MomVsDad] Joined session successfully:', response);

            // Subscribe to game updates
            subscribeToGame(response.id);

            // Show voting screen
            showVotingScreen();

            showSuccess(`Welcome ${name}! You've joined the game.`);

        } catch (error) {
            console.error('[MomVsDad] Join session error:', error.message);
            throw error;
        }
    }

    /**
     * Display admin login UI
     */
    function showAdminLoginScreen() {
        // Stop vote polling when leaving voting screen
        stopVotePolling();

        const gameContainer = document.getElementById('mom-vs-dad-game');
        if (!gameContainer) return;

        gameContainer.innerHTML = createAdminLoginScreen();

        // Attach event listeners
        const adminForm = document.getElementById('game-admin-form');
        if (adminForm) {
            adminForm.addEventListener('submit', handleAdminLoginSubmit);
        }

        const backBtn = document.getElementById('btn-back-to-join');
        if (backBtn) {
            backBtn.addEventListener('click', showJoinScreen);
        }

        console.log('[MomVsDad] Admin login screen displayed');
    }

    /**
     * Handle admin login form submission
     */
    async function handleAdminLoginSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const sessionCode = formData.get('session_code').toUpperCase();
        const pin = formData.get('admin_pin');

        try {
            await adminLogin(sessionCode, pin);
        } catch (error) {
            showError(`Login failed: ${error.message}`);
        }
    }

    /**
     * Login as parent/admin
     */
    async function adminLogin(code, pin) {
        console.log('[MomVsDad] Admin login attempt:', code);

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/game-session`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'admin_login',
                        session_code: code,
                        admin_code: pin
                    })
                }
            );

            currentSession = response;
            userRole = 'admin';

            console.log('[MomVsDad] Admin login successful:', response);

            // Subscribe to game updates
            subscribeToGame(response.id);

            // Show voting screen with admin panel
            showVotingScreen();

            showSuccess('Parent login successful! You can now lock answers.');

        } catch (error) {
            console.error('[MomVsDad] Admin login error:', error.message);
            throw error;
        }
    }

    /**
     * Display voting interface
     */
    function showVotingScreen(scenario) {
        const gameContainer = document.getElementById('mom-vs-dad-game');
        if (!gameContainer) return;

        // Stop any existing vote polling
        stopVotePolling();

        gameContainer.innerHTML = createVotingScreen();

        // Initialize chibi avatars
        initChibiAvatars();

        // Attach event listeners
        const btnVoteMom = document.getElementById('btn-vote-mom');
        const btnVoteDad = document.getElementById('btn-vote-dad');

        if (btnVoteMom) {
            btnVoteMom.addEventListener('click', () => submitVote('mom'));
        }

        if (btnVoteDad) {
            btnVoteDad.addEventListener('click', () => submitVote('dad'));
        }

        // Admin panel event listeners
        if (userRole === 'admin') {
            const btnLockMom = document.getElementById('btn-lock-mom');
            const btnLockDad = document.getElementById('btn-lock-dad');
            const btnTriggerReveal = document.getElementById('btn-trigger-reveal');

            if (btnLockMom) {
                btnLockMom.addEventListener('click', () => lockAnswer('mom'));
            }

            if (btnLockDad) {
                btnLockDad.addEventListener('click', () => lockAnswer('dad'));
            }

            if (btnTriggerReveal) {
                btnTriggerReveal.addEventListener('click', triggerReveal);
            }
        }

        // Show admin panel if parent
        if (userRole === 'admin') {
            const adminPanel = document.getElementById('game-admin-panel');
            if (adminPanel) {
                adminPanel.classList.remove('hidden');
            }
        }

        // Update session info
        const sessionCodeEl = document.querySelector('.game-session-code');
        if (sessionCodeEl) {
            sessionCodeEl.textContent = currentSession?.session_code || '---';
        }

        // Update scenario if provided
        if (scenario) {
            handleNewScenario(scenario);
        }

        // Update vote buttons
        updateVoteButtons();

        // Start polling for vote counts
        startVotePolling();

        console.log('[MomVsDad] Voting screen displayed');
    }

    /**
     * Submit a vote
     */
    async function submitVote(choice) {
        console.log('[MomVsDad] Submitting vote:', choice);

        if (voted) {
            showError('You have already voted!');
            return;
        }

        if (!currentSession || !currentScenario) {
            showError('No active game session or scenario');
            return;
        }

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/game-vote`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        scenario_id: currentScenario.id,
                        guest_name: userName,
                        vote_choice: choice
                    })
                }
            );

            voted = true;
            updateVoteButtons();

            // Animate the chosen chibi
            if (choice === 'mom' && chibiMom) {
                animateChibi(chibiMom, 'bounce');
            } else if (choice === 'dad' && chibiDad) {
                animateChibi(chibiDad, 'bounce');
            }

            // Update tug of war
            if (response && tugOfWarBar) {
                updateTugOfWar(response.mom_pct || 50, response.dad_pct || 50);
            }

            showSuccess('Vote submitted! Waiting for results...');

            console.log('[MomVsDad] Vote submitted successfully:', response);

        } catch (error) {
            console.error('[MomVsDad] Submit vote error:', error.message);
            throw error;
        }
    }

    /**
     * Display admin controls
     */
    function showAdminPanel() {
        const adminPanel = document.getElementById('game-admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('fade-in');
        }
    }

    /**
     * Parent locks in their answer
     */
    async function lockAnswer(choice) {
        console.log('[MomVsDad] Locking answer:', choice);

        if (!currentSession || !currentScenario) {
            showError('No active game session or scenario');
            return;
        }

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/game-vote`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'lock_answer',
                        scenario_id: currentScenario.id,
                        choice: choice,
                        admin_code: currentSession.admin_code
                    })
                }
            );

            showSuccess(`${choice === 'mom' ? 'Mom' : 'Dad'}'s answer locked!`);

            console.log('[MomVsDad] Answer locked successfully:', response);

        } catch (error) {
            console.error('[MomVsDad] Lock answer error:', error.message);
            throw error;
        }
    }

    /**
     * Admin triggers result reveal
     */
    async function triggerReveal() {
        console.log('[MomVsDad] Triggering reveal');

        if (!currentSession || !currentScenario) {
            showError('No active game session or scenario');
            return;
        }

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/game-reveal`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        scenario_id: currentScenario.id,
                        admin_code: currentSession.admin_code
                    })
                }
            );

            showSuccess('Reveal triggered!');

            console.log('[MomVsDad] Reveal triggered successfully:', response);

        } catch (error) {
            console.error('[MomVsDad] Trigger reveal error:', error.message);
            throw error;
        }
    }

    /**
     * Display vote comparison + roast results
     */
    function showResults(result) {
        console.log('[MomVsDad] Showing results:', result);

        // Stop vote polling when showing results
        stopVotePolling();

        const gameContainer = document.getElementById('mom-vs-dad-game');
        if (!gameContainer) return;

        // Check if results screen exists
        let resultsScreen = document.getElementById('game-results-screen');

        if (!resultsScreen) {
            // Create results screen and append to container
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createResultsScreen();
            gameContainer.appendChild(tempDiv.firstChild);
            resultsScreen = document.getElementById('game-results-screen');
        }

        resultsScreen.classList.remove('hidden');
        resultsScreen.classList.add('fade-in');

        // Populate results
        const crowdPct = document.querySelector('.crowd-pct');
        const crowdChoice = document.querySelector('.crowd-choice-text');
        const realityChoice = document.querySelector('.reality-choice-text');
        const perceptionGap = document.querySelector('.perception-gap-value');
        const roastCommentary = document.querySelector('.roast-commentary');

        if (crowdPct && result.mom_percentage) {
            crowdPct.textContent = `${result.mom_percentage}% ${result.crowd_choice || ''}`;
        }

        if (crowdChoice) {
            crowdChoice.textContent = result.crowd_choice_text || '---';
        }

        if (realityChoice) {
            realityChoice.textContent = result.actual_choice_text || '---';
        }

        if (perceptionGap && result.perception_gap) {
            perceptionGap.textContent = `${result.perception_gap}%`;

            // Add visual styling based on gap size
            if (result.perception_gap > 50) {
                perceptionGap.classList.add('gap-huge');
            } else if (result.perception_gap > 30) {
                perceptionGap.classList.add('gap-large');
            } else if (result.perception_gap > 10) {
                perceptionGap.classList.add('gap-medium');
            } else {
                perceptionGap.classList.add('gap-small');
            }
        }

        if (roastCommentary && result.roast_commentary) {
            roastCommentary.textContent = result.roast_commentary;
        }

        // Show vote match feedback if user voted correctly
        if (voted && result.crowd_choice === result.actual_choice) {
            const feedback = document.getElementById('vote-match-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
                triggerConfetti();
            }
        }

        // Attach next round button
        const btnNextRound = document.getElementById('btn-next-round');
        if (btnNextRound) {
            btnNextRound.addEventListener('click', () => {
                // Reset voted state and show voting screen
                voted = false;
                resultsScreen.classList.add('hidden');
                showVotingScreen();
            });
        }

        console.log('[MomVsDad] Results displayed');
    }

    // =====================================================
    // PUBLIC API EXPORT
    // =====================================================

    window.MomVsDad = {
        // Initialization
        init: init,

        // Session management
        showJoinScreen: showJoinScreen,
        joinSession: joinSession,
        adminLogin: adminLogin,

        // Voting
        showVotingScreen: showVotingScreen,
        submitVote: submitVote,

        // Admin
        showAdminPanel: showAdminPanel,
        lockAnswer: lockAnswer,
        triggerReveal: triggerReveal,

        // Results
        showResults: showResults,

        // Internal state (for debugging)
        _state: {
            get currentSession() { return currentSession; },
            get currentScenario() { return currentScenario; },
            get userRole() { return userRole; },
            get voted() { return voted; }
        }
    };

    // =====================================================
    // AUTO-INITIALIZE
    // =====================================================

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[MomVsDad] Game module loaded successfully');
})();
