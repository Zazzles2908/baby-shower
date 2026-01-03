/**
 * Baby Shower App - Mom vs Dad Simplified Game
 * Complete rewrite using simplified lobby architecture
 * IIFE pattern with global namespace
 *
 * Created: 2026-01-04
 * Version: 2.0 Simplified
 */

(function(root) {
    'use strict';

    console.log('[MomVsDadSimplified] loading...');

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================

    const GameStates = {
        LOBBY_SELECT: 'lobby-select',
        WAITING: 'waiting',
        PLAYING: 'playing',
        RESULTS: 'results'
    };

    const GameState = {
        view: GameStates.LOBBY_SELECT,
        lobbyKey: null,
        lobbyData: null,
        currentPlayerId: null,
        playerName: null,
        isAdmin: false,
        players: [],
        currentRound: 0,
        totalRounds: 5,
        gameStatus: 'setup',
        myVote: null,
        currentQuestion: null,
        realtimeChannel: null
    };

    // ==========================================
    // API FUNCTIONS
    // ==========================================

    function getSupabaseUrl() {
        return root.CONFIG?.SUPABASE?.URL || '';
    }

    function getAnonKey() {
        return root.CONFIG?.SUPABASE?.ANON_KEY || '';
    }

    function getEdgeFunctionUrl(functionName) {
        return `${getSupabaseUrl()}/functions/v1/${functionName}`;
    }

    /**
     * Generic API fetch with error handling
     */
    async function apiFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (getAnonKey()) {
            headers['Authorization'] = `Bearer ${getAnonKey()}`;
            headers['apikey'] = getAnonKey();
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[MomVsDadSimplified] API Error:', error.message);
            throw error;
        }
    }

    /**
     * Fetch lobby status
     */
    async function fetchLobbyStatus(lobbyKey) {
        // Simulate lobby status for now (will be replaced with actual API)
        return {
            key: lobbyKey,
            playerCount: Math.floor(Math.random() * 6),
            maxPlayers: 8,
            status: 'available'
        };
    }

    /**
     * Join lobby
     */
    async function joinLobby(lobbyKey, playerName) {
        try {
            const url = getEdgeFunctionUrl('lobby-create');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    lobby_key: lobbyKey,
                    player_name: playerName
                }),
            });

            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to join lobby:', error);
            throw error;
        }
    }

    /**
     * Start game (admin only)
     */
    async function startGame(lobbyKey, settings = {}) {
        try {
            const url = getEdgeFunctionUrl('game-start');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    lobby_key: lobbyKey,
                    total_rounds: settings.totalRounds || 5
                }),
            });

            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to start game:', error);
            throw error;
        }
    }

    /**
     * Submit vote
     */
    async function submitVote(lobbyKey, roundNumber, choice) {
        try {
            const url = getEdgeFunctionUrl('game-vote');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    lobby_key: lobbyKey,
                    round: roundNumber,
                    choice: choice, // 'mom' or 'dad'
                    player_name: GameState.playerName
                }),
            });

            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to submit vote:', error);
            throw error;
        }
    }

    /**
     * Reveal results (admin only)
     */
    async function revealRound(lobbyKey, roundNumber) {
        try {
            const url = getEdgeFunctionUrl('game-reveal');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    lobby_key: lobbyKey,
                    round: roundNumber
                }),
            });

            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to reveal round:', error);
            throw error;
        }
    }

    // ==========================================
    // UI COMPONENTS
    // ==========================================

    /**
     * Render Lobby Selector Screen
     */
    function renderLobbySelector() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        container.innerHTML = `
            <div id="mom-vs-dad-lobbies" class="mvd-section active">
                <div class="mvd-header">
                    <h1>🎮 Mom vs Dad</h1>
                    <p>Choose a lobby to join</p>
                </div>

                <div class="lobbies-grid">
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
                        <h2>Join Lobby <span id="modal-lobby-key">A</span></h2>
                        <input type="text" id="player-name" placeholder="Enter your name" maxlength="20" />
                        <div class="modal-actions">
                            <button id="join-cancel" class="btn-secondary">Cancel</button>
                            <button id="join-confirm" class="btn-primary">Join Lobby</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        attachLobbySelectorEvents();

        // Fetch and update lobby status
        updateLobbyStatus();
    }

    /**
     * Attach event listeners for lobby selector
     */
    function attachLobbySelectorEvents() {
        // Lobby cards
        document.querySelectorAll('.lobby-card').forEach(card => {
            card.addEventListener('click', () => {
                const lobbyKey = card.dataset.lobby;
                showJoinModal(lobbyKey);
            });
        });

        // Cancel button
        document.getElementById('join-cancel')?.addEventListener('click', hideJoinModal);

        // Confirm join
        document.getElementById('join-confirm')?.addEventListener('click', handleJoinLobby);

        // Enter key on name input
        document.getElementById('player-name')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleJoinLobby();
            }
        });
    }

    /**
     * Show join modal
     */
    function showJoinModal(lobbyKey) {
        const modal = document.getElementById('join-modal');
        const modalLobbyKey = document.getElementById('modal-lobby-key');
        const playerNameInput = document.getElementById('player-name');

        if (modal && modalLobbyKey && playerNameInput) {
            modalLobbyKey.textContent = lobbyKey;
            modal.classList.remove('hidden');
            playerNameInput.value = '';
            playerNameInput.focus();
        }
    }

    /**
     * Hide join modal
     */
    function hideJoinModal() {
        const modal = document.getElementById('join-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Handle join lobby
     */
    async function handleJoinLobby() {
        const modalLobbyKey = document.getElementById('modal-lobby-key');
        const playerNameInput = document.getElementById('player-name');

        const lobbyKey = modalLobbyKey ? `LOBBY-${modalLobbyKey.textContent}` : null;
        const playerName = playerNameInput ? playerNameInput.value.trim() : '';

        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        try {
            // Join lobby (simulated for now)
            GameState.lobbyKey = lobbyKey;
            GameState.playerName = playerName;
            GameState.view = GameStates.WAITING;

            // Try to join via API (will fail until Edge Functions are implemented)
            try {
                const result = await joinLobby(lobbyKey, playerName);
                if (result.data) {
                    GameState.currentPlayerId = result.data.player_id;
                    GameState.isAdmin = result.data.is_admin || false;
                    GameState.players = result.data.players || [];
                }
            } catch (apiError) {
                console.warn('[MomVsDadSimplified] API not available, using simulated mode');
                // Simulate joining
                GameState.currentPlayerId = 'player-' + Date.now();
                GameState.isAdmin = GameState.players.length === 0;
                GameState.players = [{
                    id: GameState.currentPlayerId,
                    name: playerName,
                    is_admin: GameState.isAdmin
                }];
            }

            renderWaitingRoom();
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to join lobby:', error);
            alert('Failed to join lobby. Please try again.');
        }
    }

    /**
     * Update lobby status
     */
    async function updateLobbyStatus() {
        const lobbies = ['A', 'B', 'C', 'D'];

        for (const key of lobbies) {
            try {
                const status = await fetchLobbyStatus(key);
                const card = document.querySelector(`.lobby-card[data-lobby="${key}"]`);
                if (card) {
                    updateLobbyCard(card, status);
                }
            } catch (error) {
                console.warn(`[MomVsDadSimplified] Failed to fetch status for lobby ${key}`);
            }
        }
    }

    /**
     * Update lobby card display
     */
    function updateLobbyCard(card, status) {
        const statusEl = card.querySelector('.lobby-status');
        const countEl = card.querySelector('.lobby-count');

        if (statusEl && countEl) {
            countEl.textContent = `${status.playerCount}/${status.maxPlayers} players`;

            card.classList.remove('full', 'filling');

            if (status.playerCount >= status.maxPlayers) {
                card.classList.add('full');
                statusEl.textContent = '🔴 FULL';
            } else if (status.playerCount > 0) {
                card.classList.add('filling');
                statusEl.textContent = '🟡 FILLING';
            } else {
                statusEl.textContent = '🟢 OPEN';
            }
        }
    }

    /**
     * Render Waiting Room Screen
     */
    function renderWaitingRoom() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        const lobbyDisplay = GameState.lobbyKey ? GameState.lobbyKey.replace('LOBBY-', 'Lobby ') : 'Lobby';

        container.innerHTML = `
            <div id="mom-vs-dad-waiting" class="mvd-section">
                <div class="mvd-header">
                    <h1>${lobbyDisplay}</h1>
                    <p>Waiting for players...</p>
                </div>

                <!-- Player List -->
                <div class="player-list-container">
                    <div class="player-list-header">
                        <span class="player-count">${GameState.players.length}/8 Players</span>
                    </div>

                    <div class="player-list" id="player-list">
                        ${renderPlayerList()}
                    </div>
                </div>

                <!-- Waiting Message (non-admin) -->
                <div class="waiting-message" id="waiting-message" ${GameState.isAdmin ? 'style="display: none;"' : ''}>
                    <p>⏳ Waiting for more players to join...</p>
                </div>

                <!-- Admin Panel (only visible to admin) -->
                <div class="admin-panel ${GameState.isAdmin ? '' : 'hidden'}" id="admin-panel">
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

                    <button id="start-game-btn" class="btn-primary full-width" ${GameState.players.length < 2 ? 'disabled' : ''}>
                        🎯 Start Game
                    </button>
                </div>

                <!-- Exit Button -->
                <div class="exit-section">
                    <button id="exit-lobby-btn" class="btn-secondary">
                        ← Exit Lobby
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners
        attachWaitingRoomEvents();

        // Start realtime subscriptions
        subscribeToLobbyUpdates();
    }

    /**
     * Render player list HTML
     */
    function renderPlayerList() {
        return GameState.players.map(player => `
            <div class="player-item ${player.is_admin ? 'is-admin' : ''}">
                <div class="player-avatar">👤</div>
                <span class="player-name">${player.name}</span>
            </div>
        `).join('');
    }

    /**
     * Attach event listeners for waiting room
     */
    function attachWaitingRoomEvents() {
        // Start game button
        document.getElementById('start-game-btn')?.addEventListener('click', handleStartGame);

        // Exit lobby button
        document.getElementById('exit-lobby-btn')?.addEventListener('click', handleExitLobby);
    }

    /**
     * Handle start game
     */
    async function handleStartGame() {
        const roundsSelect = document.getElementById('rounds-select');
        const totalRounds = roundsSelect ? parseInt(roundsSelect.value) : 5;

        try {
            GameState.totalRounds = totalRounds;

            try {
                await startGame(GameState.lobbyKey, { totalRounds });
            } catch (apiError) {
                console.warn('[MomVsDadSimplified] API not available, using simulated mode');
            }

            GameState.view = GameStates.PLAYING;
            GameState.currentRound = 1;
            renderGameScreen();
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to start game:', error);
            alert('Failed to start game. Please try again.');
        }
    }

    /**
     * Handle exit lobby
     */
    function handleExitLobby() {
        // Unsubscribe from realtime
        if (GameState.realtimeChannel) {
            GameState.realtimeChannel.unsubscribe();
            GameState.realtimeChannel = null;
        }

        // Reset state
        GameState.view = GameStates.LOBBY_SELECT;
        GameState.lobbyKey = null;
        GameState.lobbyData = null;
        GameState.currentPlayerId = null;
        GameState.playerName = null;
        GameState.isAdmin = false;
        GameState.players = [];

        renderLobbySelector();
    }

    /**
     * Render Game Screen
     */
    function renderGameScreen() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        // Sample questions (will be replaced with API-generated questions)
        const questions = [
            "Who changes more diapers at 3 AM?",
            "Who's better at baby talk?",
            "Who will lose more sleep?",
            "Who's more likely to buy too many toys?",
            "Who will take more baby photos?"
        ];

        const currentQuestion = questions[(GameState.currentRound - 1) % questions.length];
        const progressPercent = ((GameState.currentRound - 1) / GameState.totalRounds) * 100;

        container.innerHTML = `
            <div id="mom-vs-dad-game-screen" class="mvd-section">
                <!-- Progress Header -->
                <div class="game-header">
                    <div class="round-indicator">Round ${GameState.currentRound}/${GameState.totalRounds}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
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
                    <h2 id="question-text">${currentQuestion}</h2>
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
            </div>
        `;

        // Attach event listeners
        attachGameScreenEvents();

        // Subscribe to realtime updates
        subscribeToGameUpdates();
    }

    /**
     * Attach event listeners for game screen
     */
    function attachGameScreenEvents() {
        // Vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (GameState.myVote !== null) return; // Already voted

                const choice = btn.dataset.choice;
                handleVote(choice);
            });
        });
    }

    /**
     * Handle vote
     */
    async function handleVote(choice) {
        try {
            GameState.myVote = choice;

            try {
                await submitVote(GameState.lobbyKey, GameState.currentRound, choice);
            } catch (apiError) {
                console.warn('[MomVsDadSimplified] API not available, using simulated mode');
            }

            // Show feedback
            const feedback = document.getElementById('vote-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
            }

            // Disable vote buttons
            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.disabled = true;
            });

            // Simulate waiting for results (will be replaced with realtime)
            setTimeout(() => {
                handleRoundComplete();
            }, 2000);
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to submit vote:', error);
            alert('Failed to submit vote. Please try again.');
        }
    }

    /**
     * Handle round complete
     */
    function handleRoundComplete() {
        // Move to next round or results
        if (GameState.currentRound < GameState.totalRounds) {
            GameState.currentRound++;
            GameState.myVote = null;
            renderGameScreen();
        } else {
            GameState.view = GameStates.RESULTS;
            renderResultsScreen();
        }
    }

    /**
     * Render Results Screen
     */
    function renderResultsScreen() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        // Simulate scores (will be replaced with actual scores)
        const momScore = 15;
        const dadScore = 12;
        const winner = momScore > dadScore ? 'Michelle' : 'Jazeel';

        container.innerHTML = `
            <div id="mom-vs-dad-results" class="mvd-section">
                <div class="results-header">
                    <div class="trophy-icon">🏆</div>
                    <h1>Game Complete!</h1>
                    <p>Thanks for playing!</p>
                </div>

                <!-- Score Cards -->
                <div class="score-container">
                    <div class="score-card ${winner === 'Michelle' ? 'winner' : ''}">
                        <div class="score-avatar">👩</div>
                        <div class="score-name">Michelle</div>
                        <div class="score-points">${momScore} points</div>
                        ${winner === 'Michelle' ? '<div class="winner-badge">👑 Winner!</div>' : ''}
                    </div>

                    <div class="score-card ${winner === 'Jazeel' ? 'winner' : ''}">
                        <div class="score-avatar">👨</div>
                        <div class="score-name">Jazeel</div>
                        <div class="score-points">${dadScore} points</div>
                        ${winner === 'Jazeel' ? '<div class="winner-badge">👑 Winner!</div>' : ''}
                    </div>
                </div>

                <!-- Final Message -->
                <div class="final-message">
                    <p>${winner === 'Michelle' ? 'Mom really knows her stuff! 🎉' : 'Dad takes the crown! 🏆'}</p>
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
            </div>
        `;

        // Attach event listeners
        attachResultsScreenEvents();

        // Unsubscribe from realtime
        if (GameState.realtimeChannel) {
            GameState.realtimeChannel.unsubscribe();
            GameState.realtimeChannel = null;
        }
    }

    /**
     * Attach event listeners for results screen
     */
    function attachResultsScreenEvents() {
        // Play again button
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            if (GameState.isAdmin) {
                handleStartGame();
            } else {
                alert('Waiting for admin to start a new game...');
            }
        });

        // Back to lobbies button
        document.getElementById('back-to-lobbies-btn')?.addEventListener('click', handleExitLobby);
    }

    // ==========================================
    // REALTIME SUBSCRIPTIONS
    // ==========================================

    /**
     * Subscribe to lobby updates
     */
    function subscribeToLobbyUpdates() {
        // Placeholder for Supabase realtime subscriptions
        // Will be implemented once Supabase client is available
        console.log('[MomVsDadSimplified] Subscribing to lobby updates:', GameState.lobbyKey);
    }

    /**
     * Subscribe to game updates
     */
    function subscribeToGameUpdates() {
        // Placeholder for Supabase realtime subscriptions
        // Will be implemented once Supabase client is available
        console.log('[MomVsDadSimplified] Subscribing to game updates:', GameState.lobbyKey);
    }

    /**
     * Handle realtime player joined
     */
    function handlePlayerJoined(player) {
        if (!GameState.players.find(p => p.id === player.id)) {
            GameState.players.push(player);
            renderWaitingRoom();
        }
    }

    /**
     * Handle realtime game started
     */
    function handleGameStarted(data) {
        GameState.view = GameStates.PLAYING;
        GameState.currentRound = 1;
        GameState.totalRounds = data.totalRounds || 5;
        renderGameScreen();
    }

    /**
     * Handle realtime round new
     */
    function handleRoundNew(data) {
        GameState.currentRound = data.round;
        GameState.currentQuestion = data.question;
        GameState.myVote = null;
        renderGameScreen();
    }

    /**
     * Handle realtime vote update
     */
    function handleVoteUpdate(data) {
        // Update vote tally (for future implementation)
        console.log('[MomVsDadSimplified] Vote update:', data);
    }

    /**
     * Handle realtime round reveal
     */
    function handleRoundReveal(data) {
        // Show round results (for future implementation)
        console.log('[MomVsDadSimplified] Round reveal:', data);
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize game
     */
    function initializeGame() {
        console.log('[MomVsDadSimplified] initializing...');

        // Check if container exists
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) {
            console.warn('[MomVsDadSimplified] Container not found');
            return;
        }

        // Render initial screen
        renderLobbySelector();
    }

    /**
     * Get current game state
     */
    function getState() {
        return { ...GameState };
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    const MomVsDadSimplified = {
        init: initializeGame,
        getState: getState,
        renderLobbySelector,
        renderWaitingRoom,
        renderGameScreen,
        renderResultsScreen
    };

    // Attach to global scope
    if (typeof root !== 'undefined') {
        root.MomVsDadSimplified = MomVsDadSimplified;
    }

    // Auto-initialize when DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeGame);
        } else {
            initializeGame();
        }
    }

    console.log('[MomVsDadSimplified] loaded successfully');

})(typeof window !== 'undefined' ? window : this);
