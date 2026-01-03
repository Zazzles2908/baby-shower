/**
 * Baby Shower App - Who Would Rather Game
 * Simplified voting game with 24 pre-defined questions
 * Beautiful, mobile-first UI with sage green theme
 */

(function() {
    'use strict';

    console.log('[WhoWouldRather] Game module loading...');

    // =====================================================
    // PRIVATE STATE
    // =====================================================

    let currentSession = null;
    let currentQuestion = null;
    let userName = '';
    let votedForCurrentQuestion = false;
    let currentQuestionNumber = 1;
    let totalQuestions = 24;
    let sessionCode = '';
    let votePollingInterval = null;

    // Avatar URLs from Supabase Storage
    const AVATAR_URLS = {
        mom: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
        dad: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Icon/asset_chibi_avatar_m.png'
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
            console.error('[WhoWouldRather] API Error:', error.message);
            throw error;
        }
    }

    /**
     * Show error message to user
     */
    function showError(message) {
        console.error('[WhoWouldRather] Error:', message);
        alert(message);
    }

    /**
     * Show success message to user
     */
    function showSuccess(message) {
        console.log('[WhoWouldRather] Success:', message);
    }

    /**
     * Animate element with class
     */
    function animateElement(element, animationClass) {
        if (!element) return;

        element.classList.add(animationClass);

        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 600);
    }

    /**
     * Stop vote polling
     */
    function stopVotePolling() {
        if (votePollingInterval) {
            clearInterval(votePollingInterval);
            votePollingInterval = null;
            console.log('[WhoWouldRather] Vote polling stopped');
        }
    }

    /**
     * Start polling for vote updates
     */
    function startVotePolling() {
        console.log('[WhoWouldRather] Starting vote polling...');

        if (votePollingInterval) {
            clearInterval(votePollingInterval);
        }

        const config = getSupabaseConfig();
        if (!config.url || !currentQuestion) {
            console.log('[WhoWouldRather] Cannot start vote polling - no config or question');
            return;
        }

        // Poll every 2 seconds for updated vote counts
        votePollingInterval = setInterval(async () => {
            try {
                const results = await getResults(sessionCode, currentQuestionNumber);
                if (results) {
                    updateResultsDisplay(results);
                }
            } catch (error) {
                console.error('[WhoWouldRather] Vote polling error:', error.message);
            }
        }, 2000);

        console.log('[WhoWouldRather] Vote polling started');
    }

    // =====================================================
    // UI COMPONENTS
    // =====================================================

    /**
     * Create host screen HTML
     */
    function createHostScreen() {
        return `
            <div id="wwr-host-screen" class="wwr-screen fade-in">
                <div class="wwr-card">
                    <div class="wwr-header">
                        <div class="wwr-header-avatars">
                            <img src="${AVATAR_URLS.mom}" alt="Michelle" class="wwr-avatar wwr-avatar-mom">
                            <div class="wwr-header-heart">💕</div>
                            <img src="${AVATAR_URLS.dad}" alt="Jazeel" class="wwr-avatar wwr-avatar-dad">
                        </div>
                        <h2 class="wwr-title">🎯 Who Would Rather?</h2>
                        <p class="wwr-subtitle">24 Fun Questions About Baby!</p>
                    </div>

                    <form id="wwr-host-form" class="wwr-form">
                        <div class="form-group">
                            <label for="wwr-host-name" class="form-label">
                                Your Name
                            </label>
                            <input
                                type="text"
                                id="wwr-host-name"
                                name="host_name"
                                class="form-input"
                                placeholder="Enter your name"
                                required
                                maxlength="50"
                            />
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-block">
                                🎉 Create Game Session
                            </button>
                        </div>
                    </form>

                    <div class="wwr-divider">
                        <span>OR</span>
                    </div>

                    <div class="wwr-join-option">
                        <button
                            type="button"
                            id="btn-wwr-join"
                            class="btn btn-secondary btn-block"
                        >
                            🎮 Join Existing Game
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create join screen HTML
     */
    function createJoinScreen() {
        return `
            <div id="wwr-join-screen" class="wwr-screen fade-in">
                <div class="wwr-card">
                    <div class="wwr-header">
                        <h2 class="wwr-title">🎮 Join Game</h2>
                        <p class="wwr-subtitle">Enter your session code to play!</p>
                    </div>

                    <form id="wwr-join-form" class="wwr-form">
                        <div class="form-group">
                            <label for="wwr-guest-name" class="form-label">
                                Your Name
                            </label>
                            <input
                                type="text"
                                id="wwr-guest-name"
                                name="guest_name"
                                class="form-input"
                                placeholder="Enter your name"
                                required
                                maxlength="50"
                            />
                        </div>

                        <div class="form-group">
                            <label for="wwr-session-code" class="form-label">
                                Session Code
                            </label>
                            <input
                                type="text"
                                id="wwr-session-code"
                                name="session_code"
                                class="form-input wwr-code-input"
                                placeholder="Enter 6-character code"
                                maxlength="6"
                                required
                                pattern="[A-Za-z0-9]{6}"
                                title="Please enter a valid 6-character code"
                            />
                            <small class="form-hint">Example: ABC123</small>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-block">
                                🎯 Join Game
                            </button>
                        </div>
                    </form>

                    <button
                        type="button"
                        id="btn-back-to-host"
                        class="btn btn-link btn-block"
                    >
                        ← Back to Create Game
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create session created screen HTML
     */
    function createSessionCreatedScreen(code) {
        return `
            <div id="wwr-session-created" class="wwr-screen fade-in">
                <div class="wwr-card wwr-card-success">
                    <div class="wwr-success-icon">✨</div>
                    <h2 class="wwr-title">Session Created!</h2>
                    <p class="wwr-subtitle">Share this code with your guests:</p>

                    <div class="wwr-session-code-display">
                        <div class="session-code-box">
                            <span class="session-code">${code}</span>
                        </div>
                        <button
                            type="button"
                            id="btn-copy-code"
                            class="btn btn-copy"
                            title="Copy code to clipboard"
                        >
                            📋 Copy
                        </button>
                    </div>

                    <div class="wwr-info-box">
                        <p><strong>Total Questions:</strong> 24</p>
                        <p><strong>How to Play:</strong></p>
                        <ol class="wwr-instructions">
                            <li>Share session code with guests</li>
                            <li>Guests vote "Mom" or "Dad" for each question</li>
                            <li>See real-time results as votes come in</li>
                            <li>Navigate through all 24 questions</li>
                        </ol>
                    </div>

                    <div class="form-actions">
                        <button
                            type="button"
                            id="btn-start-playing"
                            class="btn btn-primary btn-block"
                        >
                            🎮 Start Playing
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create voting screen HTML
     */
    function createVotingScreen() {
        return `
            <div id="wwr-voting-screen" class="wwr-screen">
                <div class="wwr-voting-container">
                    <!-- Progress Indicator -->
                    <div class="wwr-progress-bar">
                        <div class="progress-info">
                            <span class="progress-icon">🎯</span>
                            <span class="progress-text">Question <span class="current-question">1</span> of <span class="total-questions">24</span></span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 4.17%"></div>
                        </div>
                    </div>

                    <!-- Session Info -->
                    <div class="wwr-session-info">
                        <span class="session-label">Session:</span>
                        <span class="session-code-value">---</span>
                    </div>

                    <!-- Question Card -->
                    <div class="wwr-question-card fade-in-up">
                        <div class="question-icon">❓</div>
                        <div class="question-text">
                            Loading question...
                        </div>
                    </div>

                    <!-- Avatar Display -->
                    <div class="wwr-avatars-display">
                        <div class="wwr-avatar-wrapper wwr-avatar-wrapper-mom">
                            <img src="${AVATAR_URLS.mom}" alt="Michelle" class="wwr-avatar-large">
                            <div class="avatar-label">Mom</div>
                        </div>

                        <div class="wwr-vs-badge">VS</div>

                        <div class="wwr-avatar-wrapper wwr-avatar-wrapper-dad">
                            <img src="${AVATAR_URLS.dad}" alt="Jazeel" class="wwr-avatar-large">
                            <div class="avatar-label">Dad</div>
                        </div>
                    </div>

                    <!-- Vote Buttons -->
                    <div class="wwr-vote-buttons">
                        <button
                            type="button"
                            id="btn-vote-mom"
                            class="btn btn-vote-mom"
                            disabled
                        >
                            <span class="vote-icon">👩</span>
                            <span class="vote-label">Vote Mom</span>
                        </button>

                        <button
                            type="button"
                            id="btn-vote-dad"
                            class="btn btn-vote-dad"
                            disabled
                        >
                            <span class="vote-icon">👨</span>
                            <span class="vote-label">Vote Dad</span>
                        </button>
                    </div>

                    <!-- Vote Status -->
                    <div id="vote-status" class="wwr-vote-status hidden">
                        <span class="status-icon">✅</span>
                        <span class="status-text">You voted! See results below</span>
                    </div>

                    <!-- Results Display -->
                    <div id="wwr-results" class="wwr-results hidden fade-in">
                        <div class="results-header">
                            <span class="results-icon">📊</span>
                            <h3 class="results-title">Live Results</h3>
                        </div>

                        <div class="results-bar-container">
                            <div class="result-bar result-bar-mom">
                                <div class="result-fill result-fill-mom" style="width: 50%"></div>
                                <span class="result-label result-label-mom">Mom: <span class="mom-percentage">50%</span></span>
                            </div>
                            <div class="result-bar result-bar-dad">
                                <div class="result-fill result-fill-dad" style="width: 50%"></div>
                                <span class="result-label result-label-dad">Dad: <span class="dad-percentage">50%</span></span>
                            </div>
                        </div>

                        <div class="results-stats">
                            <div class="stat-item">
                                <span class="stat-icon">👩</span>
                                <span class="stat-value mom-votes">0</span>
                                <span class="stat-label">Mom Votes</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">👨</span>
                                <span class="stat-value dad-votes">0</span>
                                <span class="stat-label">Dad Votes</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">👥</span>
                                <span class="stat-value total-votes">0</span>
                                <span class="stat-label">Total</span>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="wwr-navigation">
                        <button
                            type="button"
                            id="btn-previous-question"
                            class="btn btn-nav btn-nav-prev"
                            disabled
                        >
                            ← Previous
                        </button>
                        <button
                            type="button"
                            id="btn-next-question"
                            class="btn btn-nav btn-nav-next"
                        >
                            Next →
                        </button>
                    </div>

                    <!-- Leave Game Button -->
                    <div class="wwr-actions-footer">
                        <button
                            type="button"
                            id="btn-leave-game"
                            class="btn btn-leave"
                        >
                            🚪 Leave Game
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================================
    // API CALLS
    // =====================================================

    /**
     * Create a new game session
     */
    async function createSession(hostName) {
        console.log('[WhoWouldRather] Creating session for:', hostName);

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/who-would-rather/create-session`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        host_name: hostName
                    })
                }
            );

            currentSession = response;
            sessionCode = response.session_code;
            userName = hostName;

            console.log('[WhoWouldRather] Session created:', response);

            return response;
        } catch (error) {
            console.error('[WhoWouldRather] Create session error:', error.message);
            throw error;
        }
    }

    /**
     * Get current question
     */
    async function getCurrentQuestion(code, guestName) {
        console.log('[WhoWouldRather] Getting question for:', code, guestName);

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const url = new URL(`${config.url}/functions/v1/who-would-rather/current-question`);
            url.searchParams.append('session_code', code);
            url.searchParams.append('guest_name', guestName);

            const response = await apiFetch(url.toString(), {
                method: 'GET'
            });

            currentQuestion = response;

            console.log('[WhoWouldRather] Current question:', response);

            return response;
        } catch (error) {
            console.error('[WhoWouldRather] Get question error:', error.message);
            throw error;
        }
    }

    /**
     * Submit a vote
     */
    async function submitVote(choice) {
        console.log('[WhoWouldRather] Submitting vote:', choice);

        if (votedForCurrentQuestion) {
            showError('You have already voted for this question!');
            return;
        }

        if (!currentQuestion) {
            showError('No current question loaded');
            return;
        }

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const response = await apiFetch(
                `${config.url}/functions/v1/who-would-rather/vote`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        session_code: sessionCode,
                        guest_name: userName,
                        question_number: currentQuestionNumber,
                        vote_choice: choice
                    })
                }
            );

            votedForCurrentQuestion = true;
            updateVoteButtons();

            if (response) {
                updateResultsDisplay(response);
            }

            startVotePolling();

            showSuccess(`You voted for ${choice === 'mom' ? 'Mom' : 'Dad'}!`);

            console.log('[WhoWouldRather] Vote submitted:', response);

            return response;
        } catch (error) {
            console.error('[WhoWouldRather] Submit vote error:', error.message);
            throw error;
        }
    }

    /**
     * Get results for a question
     */
    async function getResults(code, questionNumber) {
        console.log('[WhoWouldRather] Getting results for:', code, questionNumber);

        const config = getSupabaseConfig();
        if (!config.url) {
            throw new Error('Supabase not configured');
        }

        try {
            const url = new URL(`${config.url}/functions/v1/who-would-rather/results`);
            url.searchParams.append('session_code', code);
            url.searchParams.append('question_number', questionNumber);

            const response = await apiFetch(url.toString(), {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('[WhoWouldRather] Get results error:', error.message);
            throw error;
        }
    }

    // =====================================================
    // UI UPDATES
    // =====================================================

    /**
     * Update vote button states
     */
    function updateVoteButtons() {
        const btnMom = document.getElementById('btn-vote-mom');
        const btnDad = document.getElementById('btn-vote-dad');
        const voteStatus = document.getElementById('vote-status');

        if (btnMom && btnDad) {
            if (votedForCurrentQuestion) {
                btnMom.disabled = true;
                btnDad.disabled = true;
            } else if (currentQuestion) {
                btnMom.disabled = false;
                btnDad.disabled = false;
            } else {
                btnMom.disabled = true;
                btnDad.disabled = true;
            }
        }

        if (voteStatus) {
            if (votedForCurrentQuestion) {
                voteStatus.classList.remove('hidden');
            } else {
                voteStatus.classList.add('hidden');
            }
        }
    }

    /**
     * Update results display
     */
    function updateResultsDisplay(results) {
        const resultsContainer = document.getElementById('wwr-results');
        const momPercentage = document.querySelector('.mom-percentage');
        const dadPercentage = document.querySelector('.dad-percentage');
        const momVotes = document.querySelector('.mom-votes');
        const dadVotes = document.querySelector('.dad-votes');
        const totalVotes = document.querySelector('.total-votes');
        const momFill = document.querySelector('.result-fill-mom');
        const dadFill = document.querySelector('.result-fill-dad');

        if (!results || !resultsContainer) return;

        resultsContainer.classList.remove('hidden');

        if (momPercentage && results.mom_percentage !== undefined) {
            momPercentage.textContent = `${Math.round(results.mom_percentage)}%`;
        }
        if (dadPercentage && results.dad_percentage !== undefined) {
            dadPercentage.textContent = `${Math.round(results.dad_percentage)}%`;
        }

        if (momVotes && results.mom_votes !== undefined) {
            momVotes.textContent = results.mom_votes;
        }
        if (dadVotes && results.dad_votes !== undefined) {
            dadVotes.textContent = results.dad_votes;
        }
        if (totalVotes && results.total_votes !== undefined) {
            totalVotes.textContent = results.total_votes;
        }

        if (momFill && results.mom_percentage !== undefined) {
            momFill.style.width = `${results.mom_percentage}%`;
        }
        if (dadFill && results.dad_percentage !== undefined) {
            dadFill.style.width = `${results.dad_percentage}%`;
        }

        animateElement(resultsContainer, 'pulse-update');
    }

    /**
     * Update question display
     */
    function updateQuestionDisplay(question) {
        if (!question) return;

        const questionText = document.querySelector('.question-text');
        if (questionText) {
            questionText.textContent = question.question_text || 'Loading question...';
        }

        updateProgress();
    }

    /**
     * Update progress indicator
     */
    function updateProgress() {
        const currentQuestionEl = document.querySelector('.current-question');
        const totalQuestionsEl = document.querySelector('.total-questions');
        const progressFill = document.querySelector('.progress-fill');

        if (currentQuestionEl) {
            currentQuestionEl.textContent = currentQuestionNumber;
        }
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = totalQuestions;
        }
        if (progressFill) {
            const percentage = (currentQuestionNumber / totalQuestions) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    /**
     * Update navigation buttons
     */
    function updateNavigationButtons() {
        const btnPrev = document.getElementById('btn-previous-question');
        const btnNext = document.getElementById('btn-next-question');

        if (btnPrev) {
            btnPrev.disabled = currentQuestionNumber <= 1;
        }
        if (btnNext) {
            btnNext.disabled = currentQuestionNumber >= totalQuestions;
        }
    }

    // =====================================================
    // SCREEN MANAGEMENT
    // =====================================================

    /**
     * Show host screen
     */
    function showHostScreen() {
        stopVotePolling();

        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createHostScreen();

        const hostForm = document.getElementById('wwr-host-form');
        if (hostForm) {
            hostForm.addEventListener('submit', handleHostSubmit);
        }

        const joinBtn = document.getElementById('btn-wwr-join');
        if (joinBtn) {
            joinBtn.addEventListener('click', showJoinScreen);
        }

        console.log('[WhoWouldRather] Host screen displayed');
    }

    /**
     * Show join screen
     */
    function showJoinScreen() {
        stopVotePolling();

        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createJoinScreen();

        const joinForm = document.getElementById('wwr-join-form');
        if (joinForm) {
            joinForm.addEventListener('submit', handleJoinSubmit);
        }

        const backBtn = document.getElementById('btn-back-to-host');
        if (backBtn) {
            backBtn.addEventListener('click', showHostScreen);
        }

        console.log('[WhoWouldRather] Join screen displayed');
    }

    /**
     * Show session created screen
     */
    function showSessionCreatedScreen(code) {
        stopVotePolling();

        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createSessionCreatedScreen(code);

        const copyBtn = document.getElementById('btn-copy-code');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(code);
                showSuccess('Session code copied to clipboard!');
            });
        }

        const startPlayingBtn = document.getElementById('btn-start-playing');
        if (startPlayingBtn) {
            startPlayingBtn.addEventListener('click', () => {
                showVotingScreen();
            });
        }

        console.log('[WhoWouldRather] Session created screen displayed');
    }

    /**
     * Show voting screen
     */
    function showVotingScreen() {
        stopVotePolling();

        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createVotingScreen();

        const sessionCodeEl = document.querySelector('.session-code-value');
        if (sessionCodeEl) {
            sessionCodeEl.textContent = sessionCode;
        }

        const btnVoteMom = document.getElementById('btn-vote-mom');
        const btnVoteDad = document.getElementById('btn-vote-dad');

        if (btnVoteMom) {
            btnVoteMom.addEventListener('click', () => {
                handleVote('mom');
            });
        }

        if (btnVoteDad) {
            btnVoteDad.addEventListener('click', () => {
                handleVote('dad');
            });
        }

        const btnPrev = document.getElementById('btn-previous-question');
        const btnNext = document.getElementById('btn-next-question');
        const btnLeave = document.getElementById('btn-leave-game');

        if (btnPrev) {
            btnPrev.addEventListener('click', goToPreviousQuestion);
        }

        if (btnNext) {
            btnNext.addEventListener('click', goToNextQuestion);
        }

        if (btnLeave) {
            btnLeave.addEventListener('click', handleLeaveGame);
        }

        loadCurrentQuestion();
    }

    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    async function handleHostSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const hostName = formData.get('host_name').trim();

        try {
            const session = await createSession(hostName);
            showSessionCreatedScreen(session.session_code);
        } catch (error) {
            showError(`Failed to create session: ${error.message}`);
        }
    }

    async function handleJoinSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const guestName = formData.get('guest_name').trim();
        const code = formData.get('session_code').toUpperCase();

        try {
            userName = guestName;
            sessionCode = code;

            await getCurrentQuestion(code, guestName);
            showVotingScreen();
        } catch (error) {
            showError(`Failed to join game: ${error.message}`);
        }
    }

    async function handleVote(choice) {
        console.log('[WhoWouldRather] Voting for:', choice);

        const btn = document.getElementById(`btn-vote-${choice}`);
        if (btn) {
            animateElement(btn, 'vote-animation');
        }

        try {
            await submitVote(choice);
        } catch (error) {
            showError(`Failed to submit vote: ${error.message}`);
        }
    }

    async function goToPreviousQuestion() {
        if (currentQuestionNumber > 1) {
            currentQuestionNumber--;
            votedForCurrentQuestion = false;
            await loadCurrentQuestion();
        }
    }

    async function goToNextQuestion() {
        if (currentQuestionNumber < totalQuestions) {
            currentQuestionNumber++;
            votedForCurrentQuestion = false;
            await loadCurrentQuestion();
        }
    }

    async function loadCurrentQuestion() {
        try {
            stopVotePolling();

            const question = await getCurrentQuestion(sessionCode, userName);
            updateQuestionDisplay(question);
            updateVoteButtons();
            updateNavigationButtons();

            const resultsContainer = document.getElementById('wwr-results');
            if (resultsContainer) {
                resultsContainer.classList.add('hidden');
            }
        } catch (error) {
            showError(`Failed to load question: ${error.message}`);
        }
    }

    function handleLeaveGame() {
        const confirmed = confirm('Are you sure you want to leave the game?');

        if (confirmed) {
            stopVotePolling();

            currentSession = null;
            currentQuestion = null;
            userName = '';
            votedForCurrentQuestion = false;
            currentQuestionNumber = 1;
            sessionCode = '';

            showHostScreen();
        }
    }

    // =====================================================
    // PUBLIC API
    // =====================================================

    function init() {
        console.log('[WhoWouldRather] Initializing game module...');

        let container = document.getElementById('who-would-rather-container');

        if (!container) {
            console.error('[WhoWouldRather] who-would-rather-container not found');
            return;
        }

        showHostScreen();

        console.log('[WhoWouldRather] Game module initialized');
    }

    window.WhoWouldRather = {
        init: init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
