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
    let selectedTheme = 'general';
    let realtimeSubscription = null;
    let votePollingInterval = null;
    let chibiMom = null;
    let chibiDad = null;
    let tugOfWarBar = null;

    // Theme configuration with emojis and colors
    const GAME_THEMES = {
        farm: {
            icon: '🐄',
            name: 'Farm Life',
            color: '#9CAF88',
            description: 'Cute barnyard adventures'
        },
        funny: {
            icon: '😂',
            name: 'Funny & Silly',
            color: '#F4E4BC',
            description: 'Hilarious baby moments'
        },
        sleep: {
            icon: '😴',
            name: 'Sleep Struggles',
            color: '#A8D8EA',
            description: 'Nighttime parenting chaos'
        },
        feeding: {
            icon: '🍼',
            name: 'Feeding Time',
            color: '#E8C4A0',
            description: 'Mealtime madness'
        },
        messy: {
            icon: '💩',
            name: 'Messy Moments',
            color: '#FCBAD3',
            description: 'Diaper disasters galore'
        },
        emotional: {
            icon: '💕',
            name: 'Emotional Journey',
            color: '#AA96DA',
            description: 'Heartfelt parenting moments'
        },
        general: {
            icon: '🎮',
            name: 'General Mix',
            color: '#4ECDC4',
            description: 'A bit of everything'
        }
    };

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
     * Show error message to user (enhanced with better UX)
     */
    function showError(message) {
        // Try to use enhanced error display if available
        if (window.MomVsDadEnhanced && window.MomVsDadEnhanced.showGameError) {
            window.MomVsDadEnhanced.showGameError(
                'Oops!',
                message,
                'Try Again',
                null // Could pass retry callback
            );
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    /**
     * Show success message to user (enhanced with particles)
     */
    function showSuccess(message) {
        console.log('[MomVsDad] Success:', message);

        // Trigger floating particles for celebration
        if (window.MomVsDadEnhanced && window.MomVsDadEnhanced.triggerFloatingParticles) {
            window.MomVsDadEnhanced.triggerFloatingParticles('star', 8);
        }

        // Could show toast notification
        // For now, keep it simple
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
     * Handle leave game from voting screen (Enhanced UX)
     */
    function handleLeaveGameFromVoting() {
        console.log('[MomVsDad] Leaving game from voting screen...');

        // Confirm with user
        const confirmed = confirm(
            'Are you sure you want to leave the game?\n\n' +
            'Your progress in the current round will be lost, but you can rejoin anytime.'
        );

        if (!confirmed) {
            return;
        }

        try {
            // Stop vote polling
            stopVotePolling();

            // Unsubscribe from game
            unsubscribeFromGame();

            // Clear game state
            currentSession = null;
            currentScenario = null;
            voted = false;

            // Show farewell message with particles
            if (window.MomVsDadEnhanced && window.MomVsDadEnhanced.triggerFloatingParticles) {
                window.MomVsDadEnhanced.triggerFloatingParticles('star', 15);
            }

            // Return to main menu using API navigation
            if (window.API && typeof window.API.showSection === 'function') {
                window.API.showSection('welcome-section');
            } else {
                // Fallback: reload page
                location.reload();
            }

            console.log('[MomVsDad] Game left successfully');

        } catch (error) {
            console.error('[MomVsDad] Error leaving game:', error);

            // Show enhanced error message with retry option
            showError(
                `Could not leave game: ${error.message}. Please try refreshing the page.`
            );
        }
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
     * Handle new scenario with enhanced UI updates
     */
    function handleNewScenario(payload) {
        console.log('[MomVsDad] New scenario:', payload);
        currentScenario = payload;

        // Update voting screen with animation
        const scenarioCard = document.querySelector('.game-scenario-card');
        if (scenarioCard) {
            scenarioCard.classList.add('scenario-reveal');
            setTimeout(() => {
                scenarioCard.classList.remove('scenario-reveal');
            }, 600);
        }

        // Update scenario text with fade
        const scenarioText = document.querySelector('.game-scenario-text');
        if (scenarioText) {
            scenarioText.style.opacity = '0';
            setTimeout(() => {
                scenarioText.textContent = payload.scenario_text || '';
                scenarioText.style.opacity = '1';
            }, 200);
        }

        // Update vote options with animations
        const momOption = document.querySelector('.game-option-mom');
        const dadOption = document.querySelector('.game-option-dad');

        if (momOption) momOption.textContent = payload.mom_option || '';
        if (dadOption) dadOption.textContent = payload.dad_option || '';

        // Update scenario intensity if available
        const intensityFill = document.getElementById('scenario-intensity-fill');
        const intensityValue = document.getElementById('scenario-intensity-value');
        if (intensityFill && intensityValue && payload.intensity !== undefined) {
            const intensity = Math.round((payload.intensity || 0.5) * 100);
            intensityFill.style.width = `${intensity}%`;
            intensityValue.textContent = `${intensity}%`;
        }

        // Update round information
        const currentRoundEl = document.querySelector('.current-round');
        const totalRoundsEl = document.querySelector('.total-rounds');
        if (currentRoundEl && currentSession) {
            currentRoundEl.textContent = currentSession.current_round + 1;
        }
        if (totalRoundsEl && currentSession) {
            totalRoundsEl.textContent = currentSession.total_rounds || 5;
        }

        // Update theme badge
        const themeBadge = document.querySelector('.theme-badge');
        if (themeBadge) {
            themeBadge.innerHTML = `
                <span class="theme-icon">${GAME_THEMES[selectedTheme].icon}</span>
                <span class="theme-name">${GAME_THEMES[selectedTheme].name}</span>
            `;
        }

        // Reset voted state
        voted = false;
        updateVoteButtons();

        // Reset vote buttons
        const btnMom = document.getElementById('btn-vote-mom');
        const btnDad = document.getElementById('btn-vote-dad');

        if (btnMom) {
            btnMom.classList.remove('vote-selected', 'voting-animation');
            btnMom.innerHTML = `
                <span class="vote-icon">👩</span>
                <span class="vote-label game-option-mom">${payload.mom_option || "Mom's option"}</span>
            `;
        }

        if (btnDad) {
            btnDad.classList.remove('vote-selected', 'voting-animation');
            btnDad.innerHTML = `
                <span class="vote-icon">👨</span>
                <span class="vote-label game-option-dad">${payload.dad_option || "Dad's option"}</span>
            `;
        }

        // Hide vote status
        const voteStatus = document.getElementById('vote-status');
        if (voteStatus) {
            voteStatus.classList.add('hidden');
            voteStatus.classList.remove('fade-in');
        }
    }

    /**
     * Handle answer locked with enhanced feedback
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

        // Update lock button states
        const btnLockMom = document.getElementById('btn-lock-mom');
        const btnLockDad = document.getElementById('btn-lock-dad');

        if (btnLockMom && payload.parent === 'mom') {
            btnLockMom.classList.add('locked');
            btnLockMom.disabled = true;
            btnLockMom.querySelector('.lock-text').textContent = 'Michelle Locked';
        }

        if (btnLockDad && payload.parent === 'dad') {
            btnLockDad.classList.add('locked');
            btnLockDad.disabled = true;
            btnLockDad.querySelector('.lock-text').textContent = 'Jazeel Locked';
        }

        // Trigger celebration particles
        if (window.MomVsDadEnhanced && window.MomVsDadEnhanced.triggerFloatingParticles) {
            window.MomVsDadEnhanced.triggerFloatingParticles('sparkle', 10);
        }

        // Check if both locked and notify admin
        if (momLock?.classList.contains('locked') && dadLock?.classList.contains('locked')) {
            if (userRole === 'admin') {
                showSuccess('Both parents locked! Ready to reveal!');

                // Enable reveal button
                const btnTriggerReveal = document.getElementById('btn-trigger-reveal');
                if (btnTriggerReveal) {
                    btnTriggerReveal.disabled = false;
                }
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
     * Create theme selection HTML
     */
    function createThemeSelection() {
        let themesHtml = '';
        for (const [key, theme] of Object.entries(GAME_THEMES)) {
            themesHtml += `
                <option value="${key}" ${key === 'general' ? 'selected' : ''}>
                    ${theme.icon} ${theme.name}
                </option>
            `;
        }
        return themesHtml;
    }

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

                        <div class="form-group">
                            <label for="game-theme" class="form-label">
                                <span>🎨 Game Theme</span>
                                <span class="theme-description" id="theme-description">
                                    ${GAME_THEMES.general.description}
                                </span>
                            </label>
                            <div class="theme-select-wrapper">
                                <select
                                    id="game-theme"
                                    name="theme"
                                    class="form-input theme-select"
                                >
                                    ${createThemeSelection()}
                                </select>
                                <span class="theme-icon-preview" id="theme-preview">
                                    ${GAME_THEMES.general.icon}
                                </span>
                            </div>
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

                        <div class="form-group">
                            <label for="admin-theme" class="form-label">
                                <span>🎨 Create Theme</span>
                                <span class="theme-description" id="admin-theme-description">
                                    ${GAME_THEMES.general.description}
                                </span>
                            </label>
                            <div class="theme-select-wrapper">
                                <select
                                    id="admin-theme"
                                    name="theme"
                                    class="form-input theme-select"
                                >
                                    ${createThemeSelection()}
                                </select>
                                <span class="theme-icon-preview" id="admin-theme-preview">
                                    ${GAME_THEMES.general.icon}
                                </span>
                            </div>
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
                    <!-- Round Counter & Theme Badge -->
                    <div class="game-status-bar">
                        <div class="round-counter">
                            <span class="round-icon">🎯</span>
                            <span class="round-text">Round <span class="current-round">1</span> of <span class="total-rounds">5</span></span>
                        </div>
                        <div class="theme-badge">
                            <span class="theme-icon">${GAME_THEMES[selectedTheme].icon}</span>
                            <span class="theme-name">${GAME_THEMES[selectedTheme].name}</span>
                        </div>
                    </div>

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

                    <!-- Enhanced Scenario Card -->
                    <div class="game-scenario-card fade-in-up">
                        <div class="scenario-illustrations">
                            <div class="scenario-chibi-left">
                                <div class="chibi-placeholder">
                                    <span class="placeholder-emoji">👩</span>
                                </div>
                            </div>
                            <div class="scenario-divider">
                                <span class="divider-icon">⚡</span>
                            </div>
                            <div class="scenario-chibi-right">
                                <div class="chibi-placeholder">
                                    <span class="placeholder-emoji">👨</span>
                                </div>
                            </div>
                        </div>
                        <div class="scenario-icon">${GAME_THEMES[selectedTheme].icon}</div>
                        <div class="game-scenario-text">
                            Loading scenario...
                        </div>
                        <div class="scenario-intensity">
                            <span class="intensity-label">Intensity:</span>
                            <div class="intensity-bar">
                                <div class="intensity-fill" id="scenario-intensity-fill" style="width: 50%"></div>
                            </div>
                            <span class="intensity-value" id="scenario-intensity-value">50%</span>
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
                    </div>

                    <!-- Leave Game Button (Enhanced UX) -->
                    <div class="game-actions-footer">
                        ${window.MomVsDadEnhanced ? window.MomVsDadEnhanced.createLeaveButton('Leave Game') : `
                            <button type="button" id="btn-leave-game" class="game-leave-btn" aria-label="Leave game and return to menu">
                                <span class="game-leave-icon">🚪</span>
                                <span class="game-leave-text">Leave Game</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create results screen HTML with enhanced animations
     */
    function createResultsScreen() {
        return `
            <div id="game-results-screen" class="game-screen hidden">
                <div class="game-results-container">
                    <!-- Curtain Overlay for Reveal Animation -->
                    <div id="reveal-curtain" class="reveal-curtain">
                        <div class="curtain-left"></div>
                        <div class="curtain-center">
                            <div class="curtain-icon">🎭</div>
                            <div class="curtain-text">Revealing...</div>
                        </div>
                        <div class="curtain-right"></div>
                    </div>

                    <!-- Scenario Reminder -->
                    <div id="scenario-reminder" class="scenario-reminder hidden">
                        <div class="reminder-icon">💭</div>
                        <div class="reminder-text scenario-text-reminder">
                            Loading scenario...
                        </div>
                    </div>

                    <!-- Results Header -->
                    <div class="results-header fade-in hidden" id="results-header">
                        <div class="results-icon">🎯</div>
                        <h2 class="results-title">The Truth Revealed!</h2>
                    </div>

                    <!-- Crowd vs Reality Split -->
                    <div class="results-split-view slide-in hidden" id="results-split-view">
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
                            <div class="vote-breakdown">
                                <div class="vote-stat mom-votes">
                                    <span class="vote-icon">👩</span>
                                    <span class="vote-count mom-count">0</span>
                                </div>
                                <div class="vote-stat dad-votes">
                                    <span class="vote-icon">👨</span>
                                    <span class="vote-count dad-count">0</span>
                                </div>
                            </div>
                        </div>

                        <!-- VS Badge -->
                        <div class="results-vs">VS</div>

                        <!-- Reality -->
                        <div class="result-card reality-choice winner-highlight">
                            <div class="result-card-header">
                                <span class="result-icon">🏠</span>
                                <h3 class="result-title">Reality</h3>
                                <div class="winner-badge hidden">👑 WINNER!</div>
                            </div>
                            <div class="result-percentage">
                                <span class="percentage-label">Actual answer:</span>
                            </div>
                            <div class="result-choice reality-choice-text">
                                ---
                            </div>
                            <div class="correct-answer-icon hidden">✅</div>
                        </div>
                    </div>

                    <!-- Perception Gap -->
                    <div class="perception-gap-section fade-in-up hidden" id="perception-gap-section">
                        <div class="gap-icon">📊</div>
                        <h3 class="gap-title">Perception Gap</h3>
                        <div class="gap-value perception-gap-value">---</div>
                        <div class="gap-description">
                            How wrong (or right!) the crowd was
                        </div>
                        <div class="gap-meter">
                            <div class="gap-fill" id="gap-fill"></div>
                        </div>
                    </div>

                    <!-- AI Roast Commentary -->
                    <div class="roast-section fade-in-up hidden" id="roast-section">
                        <div class="roast-header">
                            <span class="roast-icon">🔥</span>
                            <h3 class="roast-title">AI Roast Commentary</h3>
                        </div>
                        <div class="roast-content roast-commentary">
                            Loading roast...
                        </div>
                        <div class="roast-sparkles">
                            <span class="sparkle">✨</span>
                            <span class="sparkle">✨</span>
                            <span class="sparkle">✨</span>
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
                    <div class="results-actions hidden" id="results-actions">
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
                            <p class="final-subtitle">Final Results</p>
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
                btnMom.classList.add('voted', 'vote-selected');
                btnDad.classList.add('voted');
            } else if (currentScenario) {
                btnMom.disabled = false;
                btnDad.disabled = false;
                btnMom.classList.remove('voted', 'vote-selected', 'voting-animation');
                btnDad.classList.remove('voted', 'vote-selected', 'voting-animation');
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

        // Use the existing game-container from index.html
        let gameContainer = document.getElementById('game-container');

        if (!gameContainer) {
            console.error('[MomVsDad] game-container not found in index.html');
            return;
        }

        // Clear any existing content
        gameContainer.innerHTML = '';

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

        const gameContainer = document.getElementById('game-container');
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

        // Theme selection event listeners
        const themeSelect = document.getElementById('game-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', handleThemeChange);
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
     * Handle theme selection change
     */
    function handleThemeChange(event) {
        const theme = event.target.value;
        selectedTheme = theme;

        // Update preview icon and description
        const preview = event.target.parentElement.querySelector('.theme-icon-preview');
        const description = event.target.parentElement.querySelector('.theme-description');

        if (preview && description) {
            preview.textContent = GAME_THEMES[theme].icon;
            description.textContent = GAME_THEMES[theme].description;
            preview.classList.add('pop');
            setTimeout(() => preview.classList.remove('pop'), 300);
        }

        console.log('[MomVsDad] Theme changed to:', theme);
    }

    /**
     * Display admin login UI
     */
    function showAdminLoginScreen() {
        // Stop vote polling when leaving voting screen
        stopVotePolling();

        const gameContainer = document.getElementById('game-container');
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

        // Theme selection event listeners for admin
        const adminThemeSelect = document.getElementById('admin-theme');
        if (adminThemeSelect) {
            adminThemeSelect.addEventListener('change', handleAdminThemeChange);
        }

        console.log('[MomVsDad] Admin login screen displayed');
    }

    /**
     * Handle admin theme selection change
     */
    function handleAdminThemeChange(event) {
        const theme = event.target.value;
        selectedTheme = theme;

        // Update preview icon and description
        const preview = event.target.parentElement.querySelector('.theme-icon-preview');
        const description = event.target.parentElement.querySelector('.theme-description');

        if (preview && description) {
            preview.textContent = GAME_THEMES[theme].icon;
            description.textContent = GAME_THEMES[theme].description;
            preview.classList.add('pop');
            setTimeout(() => preview.classList.remove('pop'), 300);
        }

        console.log('[MomVsDad] Admin theme changed to:', theme);
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
        const gameContainer = document.getElementById('game-container');
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

        // Leave game button event listener (Enhanced UX)
        const btnLeaveGame = document.getElementById('btn-leave-game');
        if (btnLeaveGame) {
            btnLeaveGame.addEventListener('click', handleLeaveGameFromVoting);
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
     * Submit a vote with enhanced animations
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

        // Get the clicked button for animation
        const btn = document.getElementById(`btn-vote-${choice}`);
        if (btn) {
            // Add voting animation class
            btn.classList.add('voting-animation');

            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'vote-ripple';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            btn.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
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

            // Animate the chosen chibi with enhanced bounce
            if (choice === 'mom' && chibiMom) {
                animateChibi(chibiMom, 'bounce');
                chibiMom.classList.add('chibi-glow');
                setTimeout(() => chibiMom.classList.remove('chibi-glow'), 1000);
            } else if (choice === 'dad' && chibiDad) {
                animateChibi(chibiDad, 'bounce');
                chibiDad.classList.add('chibi-glow');
                setTimeout(() => chibiDad.classList.remove('chibi-glow'), 1000);
            }

            // Trigger vote success feedback
            triggerVoteSuccessFeedback(choice);

            // Update tug of war
            if (response && tugOfWarBar) {
                updateTugOfWar(response.mom_pct || 50, response.dad_pct || 50);
            }

            showSuccess(`You voted for ${choice === 'mom' ? 'Mom' : 'Dad'}! Waiting for results...`);

            console.log('[MomVsDad] Vote submitted successfully:', response);

        } catch (error) {
            console.error('[MomVsDad] Submit vote error:', error.message);
            // Remove voting animation on error
            if (btn) {
                btn.classList.remove('voting-animation');
            }
            throw error;
        }
    }

    /**
     * Trigger vote success visual feedback
     */
    function triggerVoteSuccessFeedback(choice) {
        // Create success particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'vote-particles';
        document.body.appendChild(particlesContainer);

        // Create particle burst
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = `vote-particle vote-particle-${choice}`;
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--angle', `${(i * 30)}deg`);
            particle.style.setProperty('--delay', `${i * 0.05}s`);
            particlesContainer.appendChild(particle);
        }

        // Clean up particles after animation
        setTimeout(() => {
            document.body.removeChild(particlesContainer);
        }, 1500);

        // Update vote status with animation
        const voteStatus = document.getElementById('vote-status');
        if (voteStatus) {
            voteStatus.classList.remove('hidden');
            voteStatus.classList.add('fade-in');
        }

        // Update vote buttons to show selection
        const btnMom = document.getElementById('btn-vote-mom');
        const btnDad = document.getElementById('btn-vote-dad');

        if (choice === 'mom' && btnMom) {
            btnMom.classList.add('vote-selected');
            btnMom.innerHTML = `
                <span class="vote-icon">✅</span>
                <span class="vote-label">You chose Mom!</span>
            `;
        } else if (choice === 'dad' && btnDad) {
            btnDad.classList.add('vote-selected');
            btnDad.innerHTML = `
                <span class="vote-icon">✅</span>
                <span class="vote-label">You chose Dad!</span>
            `;
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
     * Display vote comparison + roast results with enhanced animations
     */
    function showResults(result) {
        console.log('[MomVsDad] Showing results:', result);

        // Stop vote polling when showing results
        stopVotePolling();

        const gameContainer = document.getElementById('game-container');
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

        // Start reveal curtain animation sequence
        animateRevealSequence(result);
    }

    /**
     * Animate the reveal sequence with curtain and staggered reveals
     */
    function animateRevealSequence(result) {
        const curtain = document.getElementById('reveal-curtain');
        const scenarioReminder = document.getElementById('scenario-reminder');
        const resultsHeader = document.getElementById('results-header');
        const resultsSplitView = document.getElementById('results-split-view');
        const perceptionGapSection = document.getElementById('perception-gap-section');
        const roastSection = document.getElementById('roast-section');
        const resultsActions = document.getElementById('results-actions');

        // Step 1: Show curtain (it's already visible from createResultsScreen)
        if (curtain) {
            setTimeout(() => {
                curtain.classList.add('opening');
            }, 100);
        }

        // Step 2: Show scenario reminder (0.5s)
        setTimeout(() => {
            if (scenarioReminder && currentScenario) {
                scenarioReminder.classList.remove('hidden');
                scenarioReminder.querySelector('.scenario-text-reminder').textContent =
                    `💭 ${currentScenario.scenario_text}`;
            }
        }, 600);

        // Step 3: Close curtain (1.5s)
        setTimeout(() => {
            if (curtain) {
                curtain.classList.remove('opening');
                curtain.classList.add('closing');
                setTimeout(() => {
                    curtain.classList.add('hidden');
                }, 1500);
            }
        }, 1000);

        // Step 4: Show results header (2s)
        setTimeout(() => {
            if (resultsHeader) {
                resultsHeader.classList.remove('hidden');
            }
        }, 2500);

        // Step 5: Show split view with animated data (2.5s)
        setTimeout(() => {
            if (resultsSplitView) {
                resultsSplitView.classList.remove('hidden');
            }
            populateResultData(result);
        }, 2800);

        // Step 6: Show perception gap with animated meter (3s)
        setTimeout(() => {
            if (perceptionGapSection) {
                perceptionGapSection.classList.remove('hidden');
            }
            populatePerceptionGap(result);
        }, 3200);

        // Step 7: Show roast with typewriter effect (3.5s)
        setTimeout(() => {
            if (roastSection) {
                roastSection.classList.remove('hidden');
            }
            populateRoastCommentary(result);
        }, 3500);

        // Step 8: Show next round button (4s)
        setTimeout(() => {
            if (resultsActions) {
                resultsActions.classList.remove('hidden');
            }
        }, 4000);

        // Step 9: Trigger particles based on perception gap (3.5s)
        setTimeout(() => {
            if (result && result.perception_gap) {
                triggerGapParticles(result.perception_gap);
            }
        }, 3500);

        // Step 10: Check vote match feedback
        setTimeout(() => {
            checkVoteMatch(result);
        }, 4200);

        // Attach next round button listener
        const btnNextRound = document.getElementById('btn-next-round');
        if (btnNextRound) {
            btnNextRound.onclick = () => {
                // Reset voted state and show voting screen
                voted = false;
                resultsScreen.classList.add('hidden');
                showVotingScreen();
            };
        }

        console.log('[MomVsDad] Results displayed with animations');
    }

    /**
     * Populate result data with animated counters
     */
    function populateResultData(result) {
        const crowdPct = document.querySelector('.crowd-pct');
        const crowdChoice = document.querySelector('.crowd-choice-text');
        const realityChoice = document.querySelector('.reality-choice-text');
        const momCount = document.querySelector('.mom-count');
        const dadCount = document.querySelector('.dad-count');
        const winnerBadge = document.querySelector('.winner-badge');
        const correctIcon = document.querySelector('.correct-answer-icon');

        // Animate percentage counter
        if (crowdPct && result.mom_percentage) {
            animateCounter(crowdPct, 0, result.mom_percentage, '%', 1000);
        }

        if (crowdChoice) {
            crowdChoice.textContent = result.crowd_choice_text || '---';
        }

        if (realityChoice) {
            realityChoice.textContent = result.actual_choice_text || '---';
        }

        // Show vote breakdown
        if (momCount && result.mom_votes) {
            momCount.textContent = result.mom_votes;
        }

        if (dadCount && result.dad_votes) {
            dadCount.textContent = result.dad_votes;
        }

        // Highlight winner
        if (winnerBadge && result.actual_choice) {
            setTimeout(() => {
                winnerBadge.classList.remove('hidden');
            }, 500);
        }

        if (correctIcon) {
            setTimeout(() => {
                correctIcon.classList.remove('hidden');
            }, 600);
        }
    }

    /**
     * Populate perception gap with animated meter
     */
    function populatePerceptionGap(result) {
        const perceptionGap = document.querySelector('.perception-gap-value');
        const gapFill = document.getElementById('gap-fill');

        if (perceptionGap && result.perception_gap) {
            // Animate counter
            animateCounter(perceptionGap, 0, result.perception_gap, '%', 800);

            // Add visual styling based on gap size
            perceptionGap.className = 'gap-value perception-gap-value';
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

        // Animate gap meter
        if (gapFill && result.perception_gap) {
            setTimeout(() => {
                gapFill.style.setProperty('--gap-width', `${result.perception_gap}%`);
                gapFill.style.width = `${result.perception_gap}%`;
            }, 200);
        }
    }

    /**
     * Populate roast commentary with typewriter effect
     */
    function populateRoastCommentary(result) {
        const roastCommentary = document.querySelector('.roast-commentary');

        if (roastCommentary && result.roast_commentary) {
            typewriterEffect(roastCommentary, result.roast_commentary, 30);
        }
    }

    /**
     * Trigger particles based on perception gap size
     */
    function triggerGapParticles(gap) {
        let particleType = 'star';
        let particleCount = 10;

        if (gap > 50) {
            particleType = 'gap-huge';
            particleCount = 25;
        } else if (gap > 30) {
            particleType = 'gap-large';
            particleCount = 20;
        } else if (gap > 10) {
            particleType = 'gap-medium';
            particleCount = 15;
        } else {
            particleType = 'gap-small';
            particleCount = 10;
        }

        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'game-particles';
        document.body.appendChild(particlesContainer);

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `${particleType}-particle`;
            particle.textContent = getParticleEmoji(particleType);
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 50}%`;
            particle.style.animationDelay = `${i * 0.1}s`;
            particlesContainer.appendChild(particle);
        }

        // Clean up particles after animation
        setTimeout(() => {
            if (document.body.contains(particlesContainer)) {
                document.body.removeChild(particlesContainer);
            }
        }, 3500);
    }

    /**
     * Get emoji for particle type
     */
    function getParticleEmoji(type) {
        const emojis = {
            'gap-huge': ['🌟', '💥', '🎉', '✨', '🎊', '🎪'],
            'gap-large': ['⭐', '💫', '🎆', '🔮'],
            'gap-medium': ['✨', '💎', '🎯'],
            'gap-small': ['🌟', '🎨', '🎁']
        };
        const list = emojis[type] || emojis['gap-small'];
        return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Animate a counter from start to end value
     */
    function animateCounter(element, start, end, suffix = '', duration = 1000) {
        const startTime = performance.now();
        const difference = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (difference * progress));
            element.textContent = `${current}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Typewriter effect for text
     */
    function typewriterEffect(element, text, speed = 50) {
        element.textContent = '';
        let index = 0;

        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            }
        }

        type();
    }

    /**
     * Check if user voted correctly and show feedback
     */
    function checkVoteMatch(result) {
        if (!voted) return;

        const feedback = document.getElementById('vote-match-feedback');
        if (!feedback) return;

        if (result.crowd_choice === result.actual_choice) {
            // Correct prediction
            feedback.classList.remove('hidden');
            triggerConfetti();
        } else {
            // Wrong prediction - show a gentle message
            feedback.querySelector('.match-message').textContent =
                'Better luck next time!';
        }
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
