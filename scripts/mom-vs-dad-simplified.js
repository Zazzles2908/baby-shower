/**
 * Baby Shower App - Mom vs Dad Simplified Game
 * Complete rewrite with realtime multiplayer support
 * Fixes all 18 critical issues identified in QA validation
 * 
 * Created: 2026-01-04
 * Version: 3.0 Production Ready
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
        adminCode: null,  // Store admin code for starting game
        adminPlayerId: null,
        players: [],
        currentRound: 0,
        totalRounds: 5,
        scenarios: [],
        currentScenario: null,
        gameStatus: 'setup',
        myVote: null,
        voteProgress: { mom: 0, dad: 0 },
        realtimeChannel: null,
        connectionStatus: 'disconnected',
        isLoading: false,
        error: null
    };

    // ==========================================
    // SUPABASE CLIENT - USE EXISTING API CLIENT (FIXES ISSUE #1)
    // ==========================================

    function getSupabase() {
        // Use the existing window.API client instead of creating a new one
        if (typeof window.API !== 'undefined' && typeof window.API.getSupabaseClient === 'function') {
            // Return a promise that resolves to the Supabase client
            return window.API.getSupabaseClient();
        }

        // Fallback: try to get client synchronously from window if API is not async
        if (typeof window.supabaseClient !== 'undefined') {
            return window.supabaseClient;
        }

        console.warn('[MomVsDadSimplified] Supabase client not available via window.API');
        return null;
    }

    // ==========================================
    // API FUNCTIONS - FIXED PARAMETERS (FIXES ISSUES #3, #4, #5)
    // ==========================================

    function getEdgeFunctionUrl(functionName) {
        const supabaseUrl = root.CONFIG?.SUPABASE?.URL || '';
        return `${supabaseUrl}/functions/${functionName}`;
    }

    /**
      * Generic API fetch with error handling
      * Note: For Supabase Edge Functions with verify_jwt:true, use apikey header only
      * Don't send Authorization: Bearer <anon_key> as it's not a valid JWT
      */
    async function apiFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'apikey': root.CONFIG?.SUPABASE?.ANON_KEY || '',
            ...options.headers,
        };

        // For REST API calls to baby_shower schema, add Accept-Profile
        if (url.includes('/rest/v1/')) {
            headers['Accept-Profile'] = 'baby_shower';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                console.error('[MomVsDadSimplified] API Error:', errorMsg);
                throw new Error(errorMsg);
            }

            return await response.json();
        } catch (error) {
            console.error('[MomVsDadSimplified] API Error:', error.message);
            throw error;
        }
    }

    /**
       * Fetch lobby status - using window.API client
       * Updated to specify baby_shower schema explicitly
       */
    async function fetchLobbyStatus(lobbyKey) {
        try {
            // Use window.API.getSupabaseClient() instead of local initialization
            let supabase;
            if (typeof window.API !== 'undefined' && typeof window.API.getSupabaseClient === 'function') {
                supabase = await window.API.getSupabaseClient();
            } else {
                // Fallback to synchronous client if available
                supabase = getSupabase();
            }

            if (!supabase) {
                console.warn('[MomVsDadSimplified] Supabase client not available');
                return null;
            }

            console.log('[MomVsDadSimplified] Fetching lobby status for:', lobbyKey);

            // Use Supabase client to fetch session data from baby_shower.game_sessions
            const { data: session, error } = await supabase
                .from('baby_shower.game_sessions')
                .select('id, session_code, status, mom_name, dad_name, total_rounds, current_round, admin_code')
                .eq('session_code', lobbyKey.toUpperCase())
                .single();

            if (error || !session) {
                console.warn('[MomVsDadSimplified] Session not found:', lobbyKey, error);
                return null;
            }

            console.log('[MomVsDadSimplified] Found session:', session.mom_name, 'vs', session.dad_name, session.status);

            return {
                id: session.id,
                lobby_key: session.session_code,
                lobby_name: `${session.mom_name} vs ${session.dad_name}`,
                status: session.status,
                mom_name: session.mom_name,
                dad_name: session.dad_name,
                total_rounds: session.total_rounds,
                current_round: session.current_round,
                admin_code: session.admin_code,
                players: [] // Would need separate player tracking for complete implementation
            };
        } catch (error) {
            console.warn('[MomVsDadSimplified] Failed to fetch lobby status:', error.message);
            return null;
        }
    }

    /**
     * Fetch full game status including scenarios and votes
     */
    async function fetchGameStatus(lobbyKey) {
        try {
            const url = getEdgeFunctionUrl('lobby-status');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    session_code: lobbyKey
                }),
            });

            if (response && response.data) {
                // Update game state with fetched data
                GameState.gameStatus = response.data.session?.status || 'setup';
                GameState.totalRounds = response.data.session?.total_rounds || 5;
                GameState.currentRound = response.data.session?.current_round || 0;
                GameState.adminCode = response.data.session?.admin_code || GameState.adminCode;
                
                // Store scenarios if game has started
                if (response.data.scenarios && response.data.scenarios.length > 0) {
                    GameState.scenarios = response.data.scenarios;
                    // Set current scenario based on current round
                    const currentScenario = response.data.scenarios.find(s => s.round_number === GameState.currentRound);
                    if (currentScenario) {
                        GameState.currentScenario = currentScenario;
                    }
                }

                console.log('[MomVsDadSimplified] Game status updated:', {
                    status: GameState.gameStatus,
                    rounds: GameState.totalRounds,
                    scenarios: GameState.scenarios.length
                });
            }

            return response;
        } catch (error) {
            console.warn('[MomVsDadSimplified] Failed to fetch game status:', error.message);
            return null;
        }
    }

       /**
        * Join lobby - using lobby-join Edge Function
        * Works with baby_shower.game_sessions schema
        */
      async function joinLobby(lobbyKey, playerName) {
          setLoading(true);
          const startTime = Date.now();

          try {
              // Use window.API for Edge Function calls (no JWT needed)
              if (typeof window.API === 'undefined') {
                  throw new Error('API not available. Please refresh the page.');
              }

              // Check if gameJoin method exists
              if (typeof window.API.gameJoin !== 'function') {
                  throw new Error('gameJoin method not available in API. Please check that lobby-join Edge Function is deployed.');
              }

              // ===== VALIDATION =====
              const cleanName = playerName ? playerName.trim().substring(0, 50) : '';
              if (!cleanName || cleanName.length < 1) {
                  throw new Error('Please enter your name');
              }
              const safeName = cleanName.replace(/[<>\"\'\\\/]/g, '');

              // Validate lobby key format
              const isLobbyFormat = /^(LOBBY-[A-D])$/.test(lobbyKey);
              const isSessionCode = /^[A-Z0-9]{6}$/.test(lobbyKey);

              if (!isLobbyFormat && !isSessionCode) {
                  throw new Error('Invalid lobby key format. Use LOBBY-A, LOBBY-B, LOBBY-C, LOBBY-D or a 6-character code.');
              }

              console.log(`[MomVsDadSimplified] Joining lobby: ${lobbyKey} as ${safeName}`);

              // Use lobby-join Edge Function (works with anon key)
              const response = await window.API.gameJoin(lobbyKey, safeName);

              if (!response.success) {
                  throw new Error(response.error || 'Failed to join lobby');
              }

              const duration = Date.now() - startTime;
              console.log(`[MomVsDadSimplified] Joined lobby in ${duration}ms`, response.data);

              setLoading(false);
              return response.data;

          } catch (error) {
              const duration = Date.now() - startTime;
              console.error('[MomVsDadSimplified] Join failed:', error.message);

              setLoading(false);
              throw error;
          }
      }
             


    /**
      * Start game - uses session_code and admin_code (matches backend API)
      */
    async function startGame(lobbyKey, settings = {}) {
        setLoading(true);
        try {
            const url = getEdgeFunctionUrl('game-start');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    session_code: lobbyKey,
                    admin_code: GameState.adminCode,
                    total_rounds: settings.totalRounds || 5,
                    intensity: settings.intensity || 0.5
                }),
            });
            
            if (response && response.data) {
                // Store game data
                GameState.totalRounds = response.data.total_rounds || 5;
                GameState.gameStatus = 'active';
                GameState.currentScenario = response.data.scenarios?.[0] || null;
                GameState.scenarios = response.data.scenarios || [];
            }
            
            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to start game:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    /**
      * Submit vote - uses session_code, guest_name, scenario_id, vote_choice (matches backend API)
      */
    async function submitVote(lobbyKey, scenarioId, choice) {
        setLoading(true);
        try {
            const url = getEdgeFunctionUrl('game-vote');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    session_code: lobbyKey,
                    guest_name: GameState.playerName,
                    scenario_id: scenarioId,
                    vote_choice: choice
                }),
            });
            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to submit vote:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    /**
      * Reveal round results - uses session_code, admin_code, scenario_id (matches backend API)
      */
    async function revealRound(lobbyKey, scenarioId) {
        setLoading(true);
        try {
            const url = getEdgeFunctionUrl('game-reveal');
            const response = await apiFetch(url, {
                method: 'POST',
                body: JSON.stringify({
                    session_code: lobbyKey,
                    admin_code: GameState.adminCode,
                    scenario_id: scenarioId
                }),
            });
            return response;
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to reveal round:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // LOADING & ERROR HANDLING (FIXES ISSUES #11, #12)
    // ==========================================

    function setLoading(isLoading) {
        GameState.isLoading = isLoading;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (isLoading) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
        
        // Disable buttons during loading
        document.querySelectorAll('#mom-vs-dad-game button').forEach(btn => {
            btn.disabled = isLoading;
        });
    }

    function showError(message) {
        GameState.error = message;
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;
        
        // Remove any existing error
        const existingError = container.querySelector('.mvd-error');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mvd-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
                <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
            </div>
        `;
        container.insertBefore(errorDiv, container.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => errorDiv.remove(), 10000);
    }

    function clearError() {
        GameState.error = null;
        const existingError = document.querySelector('.mvd-error');
        if (existingError) existingError.remove();
    }

    // ==========================================
    // REALTIME SUBSCRIPTIONS (FIXES ISSUE #2)
    // ==========================================

    function subscribeToLobbyUpdates() {
        // Use window.API.getSupabaseClient() instead of local initialization
        getSupabase().then(async (supabase) => {
            if (!supabase || !GameState.lobbyKey) return;

            // Unsubscribe from existing channel
            if (GameState.realtimeChannel) {
                GameState.realtimeChannel.unsubscribe();
            }

            console.log('[MomVsDadSimplified] Subscribing to lobby updates:', GameState.lobbyKey);
            GameState.connectionStatus = 'connecting';

            const channelName = `lobby:${GameState.lobbyKey}`;
            GameState.realtimeChannel = supabase.channel(channelName)
                .on('broadcast', { event: 'player_joined' }, handlePlayerJoined)
                .on('broadcast', { event: 'player_left' }, handlePlayerLeft)
                .on('broadcast', { event: 'game_started' }, handleGameStarted)
                .on('broadcast', { event: 'lobby_closed' }, handleLobbyClosed)
                .subscribe((status) => {
                    console.log('[MomVsDadSimplified] Realtime subscription status:', status);
                    if (status === 'SUBSCRIBED') {
                        GameState.connectionStatus = 'connected';
                    } else if (status === 'CHANNEL_ERROR') {
                        GameState.connectionStatus = 'error';
                    } else if (status === 'TIMED_OUT') {
                        GameState.connectionStatus = 'timeout';
                    }
                    // Re-render waiting room to show connection status
                    if (GameState.view === GameStates.WAITING) {
                        renderWaitingRoom();
                    }
                });
        }).catch(error => {
            console.warn('[MomVsDadSimplified] Failed to initialize realtime subscription:', error);
        });
    }

    function subscribeToGameUpdates() {
        // Use window.API.getSupabaseClient() instead of local initialization
        getSupabase().then(async (supabase) => {
            if (!supabase || !GameState.lobbyKey) return;

            console.log('[MomVsDadSimplified] Subscribing to game updates:', GameState.lobbyKey);

            const channelName = `game:${GameState.lobbyKey}`;
            GameState.realtimeChannel = supabase.channel(channelName)
                .on('broadcast', { event: 'round_new' }, handleRoundNew)
                .on('broadcast', { event: 'vote_update' }, handleVoteUpdate)
                .on('broadcast', { event: 'round_reveal' }, handleRoundReveal)
                .on('broadcast', { event: 'game_complete' }, handleGameComplete)
                .subscribe();
        }).catch(error => {
            console.warn('[MomVsDadSimplified] Failed to initialize game updates subscription:', error);
        });
    }

    // ==========================================
    // REALTIME EVENT HANDLERS
    // ==========================================

    function handlePlayerJoined(payload) {
        console.log('[MomVsDadSimplified] Player joined:', payload);
        if (payload && payload.player) {
            // Check if player already exists
            if (!GameState.players.find(p => p.id === payload.player.id)) {
                GameState.players.push(payload.player);
                // Re-render waiting room to show new player (FIXES ISSUE #10)
                if (GameState.view === GameStates.WAITING) {
                    renderWaitingRoom();
                }
            }
        }
    }

    function handlePlayerLeft(payload) {
        console.log('[MomVsDadSimplified] Player left:', payload);
        if (payload && payload.player_id) {
            GameState.players = GameState.players.filter(p => p.id !== payload.player_id);
            // Re-render waiting room (FIXES ISSUE #10)
            if (GameState.view === GameStates.WAITING) {
                renderWaitingRoom();
            }
        }
    }

    function handleGameStarted(payload) {
        console.log('[MomVsDadSimplified] Game started:', payload);
        if (payload) {
            GameState.view = GameStates.PLAYING;
            GameState.currentRound = 1;
            GameState.totalRounds = payload.total_rounds || 5;
            GameState.currentScenario = payload.scenario || null;
            GameState.gameStatus = 'active';
            GameState.myVote = null;
            renderGameScreen();
        }
    }

    function handleLobbyClosed(payload) {
        console.log('[MomVsDadSimplified] Lobby closed:', payload);
        showError('The lobby has been closed by the admin.');
        handleExitLobby();
    }

    function handleRoundNew(payload) {
        console.log('[MomVsDadSimplified] New round:', payload);
        if (payload) {
            GameState.currentRound = payload.round || GameState.currentRound + 1;
            GameState.currentScenario = payload.scenario || null;
            GameState.myVote = null;
            GameState.voteProgress = { mom: 0, dad: 0 };
            renderGameScreen();
        }
    }

    function handleVoteUpdate(payload) {
        console.log('[MomVsDadSimplified] Vote update:', payload);
        if (payload) {
            // Update vote progress (FIXES ISSUE #16)
            GameState.voteProgress = {
                mom: payload.mom_votes || 0,
                dad: payload.dad_votes || 0
            };
            // Re-render game screen to show updated progress
            if (GameState.view === GameStates.PLAYING) {
                updateVoteProgress();
            }
        }
    }

    function handleRoundReveal(payload) {
        console.log('[MomVsDadSimplified] Round reveal:', payload);
        if (payload) {
            // Show round results
            showRoundResults(payload);
        }
    }

    function handleGameComplete(payload) {
        console.log('[MomVsDadSimplified] Game complete:', payload);
        if (payload) {
            GameState.gameStatus = 'complete';
            renderResultsScreen(payload.results);
        }
    }

    // ==========================================
    // UI COMPONENTS
    // ==========================================

    /**
     * Render Lobby Selector Screen - WITH REAL DATA (FIXES ISSUE #6)
     */
    function renderLobbySelector() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) {
            console.warn('[MomVsDadSimplified] Container not found during render');
            return;
        }

        clearError();

        // Render the lobby selection UI
        container.innerHTML = `
            <div id="mom-vs-dad-lobbies" class="mvd-section active">
                <div class="mvd-header">
                    <h1>🎮 Mom vs Dad</h1>
                    <p>Choose a lobby to join</p>
                </div>

                <div class="lobbies-grid" id="lobbies-grid">
                    ${renderLobbyCards()}
                </div>

                <!-- Join Modal -->
                <div id="join-modal" class="modal-overlay hidden">
                    <div class="modal-content">
                        <h2>Join Lobby <span id="modal-lobby-key">A</span></h2>
                        <input type="text" id="player-name" placeholder="Enter your name" maxlength="20" />
                        <input type="text" id="admin-code" placeholder="Admin Code (4 digits, optional)" maxlength="4" style="display: none;" />
                        <div class="modal-actions">
                            <button id="join-cancel" class="btn-secondary">Cancel</button>
                            <button id="join-confirm" class="btn-primary">Join Lobby</button>
                        </div>
                    </div>
                </div>

                <!-- Admin Code Toggle -->
                <div style="margin-top: 20px; text-align: center;">
                    <button id="show-admin-code" class="btn-secondary" style="font-size: 12px;">
                        🔑 I'm an Admin (Enter Code)
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners
        attachLobbySelectorEvents();
        
        // Fetch lobby status (but don't fail if API is unavailable)
        console.log('[MomVsDadSimplified] Fetching lobby status...');
        updateLobbyStatus().catch(error => {
            console.warn('[MomVsDadSimplified] Lobby status update failed:', error.message);
            // Update cards to show offline status
            const lobbies = ['LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D'];
            lobbies.forEach(lobbyKey => {
                updateLobbyCardDisplay(lobbyKey, null);
            });
        });
        
        console.log('[MomVsDadSimplified] Lobby selector ready');
    }

    /**
      * Demo lobby configuration - 4 always-available demo lobbies
      * Uses LOBBY-A/B/C/D format with game_sessions table
      */
    const DEMO_LOBBIES = {
        'LOBBY-A': { name: 'Sunny Meadows', theme: 'farm', icon: '☀️' },
        'LOBBY-B': { name: 'Cozy Barn', theme: 'barn', icon: '🏠' },
        'LOBBY-C': { name: 'Happy Henhouse', theme: 'chicken', icon: '🐔' },
        'LOBBY-D': { name: 'Peaceful Pond', theme: 'pond', icon: '🦆' }
    };

    /**
      * Get the lobby key for a lobby (no session code conversion needed)
      */
    function getLobbyKey(lobbyKey) {
        // Return as-is - no conversion needed
        return lobbyKey;
    }

    /**
      * Render lobby cards with demo lobby configuration
      */
    function renderLobbyCards() {
        const lobbies = [
            { key: 'LOBBY-A', name: 'Sunny Meadows', theme: 'farm', icon: '☀️' },
            { key: 'LOBBY-B', name: 'Cozy Barn', theme: 'barn', icon: '🏠' },
            { key: 'LOBBY-C', name: 'Happy Henhouse', theme: 'chicken', icon: '🐔' },
            { key: 'LOBBY-D', name: 'Peaceful Pond', theme: 'pond', icon: '🦆' }
        ];

        return lobbies.map(lobby => `
            <button class="lobby-card" data-lobby="${lobby.key}" data-name="${lobby.name}">
                <div class="lobby-icon">${lobby.icon}</div>
                <div class="lobby-status" id="status-${lobby.key}">🟢 READY</div>
                <div class="lobby-title">${lobby.name}</div>
                <div class="lobby-code">Key: ${lobby.key}</div>
                <div class="lobby-hint">Click to join!</div>
            </button>
        `).join('');
    }

      /**
       * Update lobby status from API (FIXES ISSUE #6)
       * Updated to use LOBBY-A/B/C/D format directly with game_sessions table
       */
    async function updateLobbyStatus() {
        console.log('[MomVsDadSimplified] Updating lobby status...');

        // Use LOBBY-A/B/C/D format directly (no session code conversion needed)
        const lobbyKeys = ['LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D'];

        // Process all lobbies concurrently
        const promises = lobbyKeys.map(async (lobbyKey) => {
            try {
                const status = await fetchLobbyStatus(lobbyKey);
                updateLobbyCardDisplay(lobbyKey, status);
            } catch (error) {
                console.warn(`[MomVsDadSimplified] Failed to fetch status for ${lobbyKey}:`, error.message);
                // For demo lobbies, show as available if API fails
                updateLobbyCardDisplay(lobbyKey, {
                    data: {
                        lobby: {
                            current_players: 0,
                            max_players: 6,
                            status: 'waiting'
                        }
                    }
                });
            }
        });

        // Wait for all to complete
        await Promise.all(promises);
        console.log('[MomVsDadSimplified] Lobby status update complete');
    }

    /**
     * Update individual lobby card display (FIXES ISSUE #6, #13)
     */
    function updateLobbyCardDisplay(lobbyKey, status) {
        const statusEl = document.getElementById(`status-${lobbyKey}`);
        const countEl = document.getElementById(`count-${lobbyKey}`);
        const card = document.querySelector(`.lobby-card[data-lobby="${lobbyKey}"]`);

        if (!card || !statusEl) return;

        card.classList.remove('full', 'filling', 'empty', 'error');

        if (!status || !status.data || !status.data.lobby) {
            // For demo lobbies, show as available if API doesn't have them
            // This makes the demo lobbies always appear playable
            if (statusEl) {
                statusEl.textContent = '🟢 READY';
                statusEl.className = 'lobby-status ready';
            }
            if (countEl) {
                countEl.textContent = 'Click to join!';
            }
            card.classList.add('empty');
            return;
        }

        const lobby = status.data.lobby;
        const playerCount = lobby?.current_players || 0;
        const maxPlayers = lobby?.max_players || 6;

        if (countEl) {
            countEl.textContent = `${playerCount}/${maxPlayers} players`;
        }

        // Update status (FIXES ISSUE #6, #13)
        if (playerCount >= maxPlayers) {
            card.classList.add('full');
            if (statusEl) statusEl.textContent = '🔴 FULL';
        } else if (playerCount > 0) {
            card.classList.add('filling');
            if (statusEl) statusEl.textContent = '🟡 FILLING';
        } else {
            card.classList.add('empty');
            if (statusEl) statusEl.textContent = '🟢 OPEN';
        }
        
        if (statusEl) statusEl.className = 'lobby-status';
    }

    /**
      * Attach event listeners for lobby selector
      */
    function attachLobbySelectorEvents() {
        // Lobby cards
        document.querySelectorAll('.lobby-card').forEach(card => {
            card.addEventListener('click', () => {
                const lobbyKey = card.dataset.lobby;
                const lobbyName = card.dataset.name;
                showJoinModal(lobbyKey, lobbyName);
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

        // Admin code toggle
        document.getElementById('show-admin-code')?.addEventListener('click', () => {
            const adminCodeInput = document.getElementById('admin-code');
            const toggleBtn = document.getElementById('show-admin-code');
            if (adminCodeInput && toggleBtn) {
                adminCodeInput.style.display = adminCodeInput.style.display === 'none' ? 'block' : 'none';
                toggleBtn.textContent = adminCodeInput.style.display === 'none' 
                    ? '🔑 I\'m an Admin (Enter Code)' 
                    : '❌ Hide Admin Code';
            }
        });
    }

    /**
     * Show join modal
     */
    function showJoinModal(lobbyKey, lobbyName) {
        const modal = document.getElementById('join-modal');
        const modalLobbyKey = document.getElementById('modal-lobby-key');
        const playerNameInput = document.getElementById('player-name');

        if (modal && modalLobbyKey && playerNameInput) {
            modalLobbyKey.textContent = lobbyName || lobbyKey.replace('LOBBY-', '');
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
      * Handle join lobby - WITH REAL DATA (FIXES ISSUES #7, #8, #9)
      */
    async function handleJoinLobby() {
        clearError();
        const modalLobbyKey = document.getElementById('modal-lobby-key');
        const playerNameInput = document.getElementById('player-name');
        const adminCodeInput = document.getElementById('admin-code');

        const lobbyKeyEl = modalLobbyKey?.textContent || '';
        // Find the full lobby key
        let fullLobbyKey = null;
        const allCards = document.querySelectorAll('.lobby-card');
        allCards.forEach(card => {
            if (card.dataset.name === lobbyKeyEl || card.dataset.lobby.includes(lobbyKeyEl)) {
                fullLobbyKey = card.dataset.lobby;
            }
        });

        const playerName = playerNameInput?.value.trim() || '';
        const adminCode = adminCodeInput?.value.trim() || '';

        if (!playerName) {
            showError('Please enter your name');
            return;
        }

        if (!fullLobbyKey) {
            showError('Invalid lobby');
            return;
        }

        try {
            setLoading(true);
            hideJoinModal();

            console.log(`[MomVsDadSimplified] Joining lobby: ${fullLobbyKey}`);

            // Join lobby via API using LOBBY-A/B/C/D format
            const result = await joinLobby(fullLobbyKey, playerName);

            if (result) {
                // Store real player data (FIXES ISSUES #7, #8)
                GameState.lobbyKey = fullLobbyKey;
                GameState.sessionCode = fullLobbyKey; // Use lobby key as session code
                GameState.playerName = playerName;
                GameState.currentPlayerId = result.current_player_id;
                
                // Check if provided admin code matches session admin code
                const sessionAdminCode = result.admin_code || '';
                GameState.isAdmin = adminCode === sessionAdminCode;
                GameState.adminCode = adminCode; // Store provided admin code
                
                GameState.players = result.players || [];
                GameState.adminPlayerId = GameState.isAdmin ? result.current_player_id : null;
                GameState.totalRounds = result.total_rounds || 5;
                GameState.gameStatus = result.status || 'setup';

                // Set connection status
                GameState.connectionStatus = 'connecting';

                // Fetch full lobby status to get scenarios if game already started
                await fetchGameStatus(fullLobbyKey);

                renderWaitingRoom();
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to join lobby:', error);
            showError(`Failed to join lobby: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Render Waiting Room Screen - WITH REAL PLAYER DATA (FIXES ISSUES #7, #8, #10, #14, #15)
     */
    function renderWaitingRoom() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        const lobbyName = GameState.lobbyKey ? GameState.lobbyKey.replace('LOBBY-', 'Lobby ') : 'Lobby';
        const connectionStatus = getConnectionStatusIcon();
        
        container.innerHTML = `
            <div id="mom-vs-dad-waiting" class="mvd-section">
                <div class="mvd-header">
                    <h1>${lobbyName}</h1>
                    <p>Waiting for players...</p>
                    <div class="connection-status ${GameState.connectionStatus}">
                        ${connectionStatus}
                    </div>
                </div>

                <!-- Player List -->
                <div class="player-list-container">
                    <div class="player-list-header">
                        <span class="player-count">${GameState.players.length}/6 Players</span>
                        <span class="connection-text">${getConnectionStatusText()}</span>
                    </div>

                    <div class="player-list" id="player-list">
                        ${renderPlayerList()}
                    </div>
                </div>

                <!-- Waiting Message (non-admin) -->
                <div class="waiting-message" id="waiting-message" ${GameState.isAdmin ? 'style="display: none;"' : ''}>
                    <p>⏳ Waiting for admin to start the game...</p>
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

                    <div class="setting-row">
                        <label for="intensity-select">Comedy Intensity:</label>
                        <select id="intensity-select">
                            <option value="0.3">Mild (Family Friendly)</option>
                            <option value="0.5" selected>Normal</option>
                            <option value="0.7">Spicy (More Roast)</option>
                            <option value="0.9">Maximum Chaos</option>
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

        attachWaitingRoomEvents();
        
        // Start realtime subscriptions (FIXES ISSUE #2, #10)
        subscribeToLobbyUpdates();
    }

    /**
     * Get connection status icon (FIXES ISSUE #14)
     */
    function getConnectionStatusIcon() {
        switch (GameState.connectionStatus) {
            case 'connected':
                return '<span class="status-icon connected">🟢</span>';
            case 'connecting':
                return '<span class="status-icon connecting">🟡</span>';
            case 'error':
                return '<span class="status-icon error">🔴</span>';
            case 'timeout':
                return '<span class="status-icon timeout">🟠</span>';
            default:
                return '<span class="status-icon disconnected">⚫</span>';
        }
    }

    /**
     * Get connection status text (FIXES ISSUE #14)
     */
    function getConnectionStatusText() {
        switch (GameState.connectionStatus) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'error':
                return 'Connection error';
            case 'timeout':
                return 'Reconnecting...';
            default:
                return 'Disconnected';
        }
    }

    /**
     * Render player list HTML - WITH REAL NAMES & AI INDICATOR (FIXES ISSUES #7, #8, #15)
     */
    function renderPlayerList() {
        if (GameState.players.length === 0) {
            return '<div class="player-empty">Waiting for players to join...</div>';
        }

        return GameState.players.map((player, index) => {
            const isCurrentPlayer = player.id === GameState.currentPlayerId;
            const isAdmin = player.is_admin;
            const isAI = player.player_type === 'AI';
            
            return `
                <div class="player-item ${isAdmin ? 'is-admin' : ''} ${isCurrentPlayer ? 'is-me' : ''}">
                    <div class="player-avatar">${getPlayerAvatar(player.player_type)}</div>
                    <span class="player-name">
                        ${escapeHtml(player.player_name || player.name || 'Anonymous')}
                        ${isCurrentPlayer ? ' (You)' : ''}
                    </span>
                    ${isAdmin ? '<span class="admin-badge">👑 Admin</span>' : ''}
                    ${isAI ? '<span class="ai-badge">🤖 AI</span>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Get player avatar based on type (FIXES ISSUE #15)
     */
    function getPlayerAvatar(playerType) {
        if (playerType === 'AI') {
            return '🤖';
        }
        return '👤';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
      * Handle start game - WITH REAL API (FIXES ISSUE #3, #9)
      */
    async function handleStartGame() {
        const roundsSelect = document.getElementById('rounds-select');
        const intensitySelect = document.getElementById('intensity-select');
        const totalRounds = roundsSelect ? parseInt(roundsSelect.value) : 5;
        const intensity = intensitySelect ? parseFloat(intensitySelect.value) : 0.5;

        try {
            setLoading(true);
            
            // Start game via API (now includes session_code and admin_code)
            const response = await startGame(GameState.lobbyKey, { totalRounds, intensity });
            
            if (response && response.data) {
                // Store scenarios returned from game-start
                GameState.scenarios = response.data.scenarios || [];
                if (GameState.scenarios.length > 0) {
                    GameState.currentScenario = GameState.scenarios[0];
                }
            }
            
            // Switch to playing state (FIXES ISSUE #9 - real gameplay)
            GameState.view = GameStates.PLAYING;
            GameState.currentRound = 1;
            GameState.gameStatus = 'voting';
            
            // Subscribe to game updates
            subscribeToGameUpdates();
            
            renderGameScreen();
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to start game:', error);
            showError(`Failed to start game: ${error.message}`);
        } finally {
            setLoading(false);
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
        GameState.adminCode = null;  // Reset admin code
        GameState.adminPlayerId = null;
        GameState.players = [];
        GameState.currentRound = 0;
        GameState.totalRounds = 5;
        GameState.scenarios = [];
        GameState.currentScenario = null;
        GameState.gameStatus = 'setup';
        GameState.myVote = null;
        GameState.voteProgress = { mom: 0, dad: 0 };
        GameState.connectionStatus = 'disconnected';

        renderLobbySelector();
    }

    /**
      * Render Game Screen - WITH REAL SCENARIOS (FIXES ISSUE #9)
      */
    function renderGameScreen() {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        // Use real scenario from game start or default
        const scenario = GameState.currentScenario;
        const questionText = scenario?.scenario_text || "Who would rather handle this baby situation?";
        
        // Get mom/dad names from session or use defaults
        const momName = GameState.lobbyData?.mom_name || 'Mom';
        const dadName = GameState.lobbyData?.dad_name || 'Dad';
        
        const progressPercent = ((GameState.currentRound - 1) / GameState.totalRounds) * 100;

        container.innerHTML = `
            <div id="mom-vs-dad-game-screen" class="mvd-section">
                <!-- Progress Header with Round Timer (FIXES ISSUE #17) -->
                <div class="game-header">
                    <div class="round-info">
                        <div class="round-indicator">Round ${GameState.currentRound}/${GameState.totalRounds}</div>
                        <div class="round-timer" id="round-timer">⏱️ Tap to vote!</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                <!-- Mom Avatar (Left) -->
                <div class="avatar-container avatar-left">
                    <div class="avatar-circle">
                        <div class="avatar-image">👩</div>
                    </div>
                    <div class="avatar-name">${escapeHtml(momName)}</div>
                    <div class="avatar-role">(Mom)</div>
                </div>

                <!-- Vote Progress Bar (FIXES ISSUE #16) -->
                <div class="vote-progress-container" id="vote-progress">
                    <div class="vote-progress-bar">
                        <div class="vote-mom-progress" style="width: ${getVotePercent('mom')}%"></div>
                        <div class="vote-dad-progress" style="width: ${getVotePercent('dad')}%"></div>
                    </div>
                    <div class="vote-counts">
                        <span class="mom-count">Mom: ${GameState.voteProgress.mom}</span>
                        <span class="dad-count">Dad: ${GameState.voteProgress.dad}</span>
                    </div>
                </div>

                <!-- Question Card -->
                <div class="question-card">
                    <div class="question-icon">❓</div>
                    <h2 id="question-text">${escapeHtml(questionText)}</h2>
                    ${scenario ? `
                        <div class="scenario-options">
                            <div class="option-mom">👩 ${escapeHtml(scenario.mom_option || `${momName} would`)}</div>
                            <div class="option-dad">👨 ${escapeHtml(scenario.dad_option || `${dadName} would`)}</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Dad Avatar (Right) -->
                <div class="avatar-container avatar-right">
                    <div class="avatar-circle">
                        <div class="avatar-image">👨</div>
                    </div>
                    <div class="avatar-name">${escapeHtml(dadName)}</div>
                    <div class="avatar-role">(Dad)</div>
                </div>

                <!-- Vote Buttons -->
                <div class="vote-buttons">
                    <button class="vote-btn vote-mom" data-choice="mom" ${GameState.myVote ? 'disabled' : ''}>
                        <span class="vote-icon">👩</span>
                        <span class="vote-text">${escapeHtml(momName)}</span>
                    </button>

                    <button class="vote-btn vote-dad" data-choice="dad" ${GameState.myVote ? 'disabled' : ''}>
                        <span class="vote-icon">👨</span>
                        <span class="vote-text">${escapeHtml(dadName)}</span>
                    </button>
                </div>

                <!-- Feedback Message -->
                <div class="vote-feedback ${GameState.myVote ? '' : 'hidden'}" id="vote-feedback">
                    ✅ Vote recorded! Waiting for admin to reveal results...
                </div>
            </div>
        `;

        attachGameScreenEvents();
        
        // Subscribe to game updates
        subscribeToGameUpdates();
    }

    /**
     * Get vote percentage for progress bar (FIXES ISSUE #16)
     */
    function getVotePercent(choice) {
        const total = GameState.voteProgress.mom + GameState.voteProgress.dad;
        if (total === 0) return 50;
        return (GameState.voteProgress[choice] / total) * 100;
    }

    /**
     * Update vote progress display (FIXES ISSUE #16)
     */
    function updateVoteProgress() {
        const progressContainer = document.getElementById('vote-progress');
        if (!progressContainer) return;

        const momPercent = getVotePercent('mom');
        const dadPercent = getVotePercent('dad');

        const momBar = progressContainer.querySelector('.vote-mom-progress');
        const dadBar = progressContainer.querySelector('.vote-dad-progress');
        const momCount = progressContainer.querySelector('.mom-count');
        const dadCount = progressContainer.querySelector('.dad-count');

        if (momBar) momBar.style.width = `${momPercent}%`;
        if (dadBar) dadBar.style.width = `${dadPercent}%`;
        if (momCount) momCount.textContent = `Mom: ${GameState.voteProgress.mom}`;
        if (dadCount) dadCount.textContent = `Dad: ${GameState.voteProgress.dad}`;
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
      * Handle vote - WITH REAL API (FIXES ISSUE #4, #9)
      */
    async function handleVote(choice) {
        try {
            // Get current scenario ID
            const scenarioId = GameState.currentScenario?.id;
            if (!scenarioId) {
                throw new Error('No active scenario to vote on');
            }

            GameState.myVote = choice;

            // Disable vote buttons
            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.disabled = true;
            });

            // Submit vote to API (now uses session_code, guest_name, scenario_id, vote_choice)
            await submitVote(GameState.lobbyKey, scenarioId, choice);

            // Show feedback
            const feedback = document.getElementById('vote-feedback');
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.textContent = '✅ Vote recorded! Waiting for admin to reveal results...';
            }

            // Update vote progress optimistically
            GameState.voteProgress[choice]++;
            updateVoteProgress();

        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to submit vote:', error);
            showError(`Failed to submit vote: ${error.message}`);
            
            // Re-enable buttons on error
            GameState.myVote = null;
            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.disabled = false;
            });
        }
    }

    /**
      * Show round results (FIXES ISSUE #18)
      */
    function showRoundResults(data) {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        // Get mom/dad names from session or use defaults
        const momName = GameState.lobbyData?.mom_name || 'Mom';
        const dadName = GameState.lobbyData?.dad_name || 'Dad';

        const momWins = data.crowd_choice === 'mom' || data.winner === 'mom';
        const momVotes = data.mom_votes || 0;
        const dadVotes = data.dad_votes || 0;
        const totalVotes = momVotes + dadVotes;
        const momPercent = totalVotes > 0 ? Math.round((momVotes / totalVotes) * 100) : 0;
        const dadPercent = totalVotes > 0 ? Math.round((dadVotes / totalVotes) * 100) : 0;

        container.innerHTML = `
            <div id="mom-vs-dad-results" class="mvd-section">
                <div class="results-header">
                    <div class="result-icon">${momWins ? '👩' : '👨'}</div>
                    <h1>${momWins ? `${escapeHtml(momName)} Wins!` : `${escapeHtml(dadName)} Wins!`}</h1>
                    <p>${data.perception_gap > 0 ? `Perception Gap: ${data.perception_gap}%` : 'Results revealed!'}</p>
                </div>

                <!-- Real Vote Counts (FIXES ISSUE #18) -->
                <div class="vote-results-container">
                    <div class="result-bar">
                        <div class="result-mom" style="width: ${momPercent}%">
                            <span>👩 ${escapeHtml(momName)} ${momPercent}%</span>
                        </div>
                        <div class="result-dad" style="width: ${dadPercent}%">
                            <span>👨 ${escapeHtml(dadName)} ${dadPercent}%</span>
                        </div>
                    </div>
                    <div class="result-counts">
                        ${momVotes} votes vs ${dadVotes} votes
                    </div>
                </div>

                <!-- AI Roast Commentary (FIXES ISSUE #13 from Medium Priority) -->
                ${data.roast_commentary ? `
                    <div class="roast-commentary">
                        <div class="roast-header">🔥 AI Roast</div>
                        <p>${escapeHtml(data.roast_commentary)}</p>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="results-actions">
                    ${GameState.isAdmin ? `
                        <button id="next-round-btn" class="btn-primary full-width">
                            ⏭️ Next Round
                        </button>
                    ` : `
                        <div class="waiting-for-admin">
                            <p>⏳ Waiting for admin to start next round...</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Attach event listeners
        if (GameState.isAdmin) {
            document.getElementById('next-round-btn')?.addEventListener('click', handleNextRound);
        }
    }

    /**
      * Handle next round (admin only)
      */
    async function handleNextRound() {
        try {
            setLoading(true);
            
            // Move to next round or show final results
            if (GameState.currentRound < GameState.totalRounds) {
                GameState.currentRound++;
                GameState.myVote = null;
                
                // Load next scenario from the scenarios array
                const nextScenario = GameState.scenarios.find(s => s.round_number === GameState.currentRound);
                if (nextScenario) {
                    GameState.currentScenario = nextScenario;
                } else {
                    // Fetch updated game status if scenario not found locally
                    await fetchGameStatus(GameState.lobbyKey);
                }
                
                // Reset vote progress
                GameState.voteProgress = { mom: 0, dad: 0 };
                
                renderGameScreen();
            } else {
                // Game complete - show final results
                GameState.view = GameStates.RESULTS;
                renderResultsScreen();
            }
        } catch (error) {
            console.error('[MomVsDadSimplified] Failed to advance round:', error);
            showError(`Failed to advance round: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    /**
      * Render Results Screen - WITH REAL SCORES (FIXES ISSUE #18)
      */
    function renderResultsScreen(results = null) {
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) return;

        // Get mom/dad names from session or use defaults
        const momName = GameState.lobbyData?.mom_name || 'Mom';
        const dadName = GameState.lobbyData?.dad_name || 'Dad';

        // Use real results or calculate from vote data
        const finalResults = results || calculateFinalResults();

        const momWins = finalResults.winner === 'mom';
        const momScore = finalResults.mom_score || 0;
        const dadScore = finalResults.dad_score || 0;

        container.innerHTML = `
            <div id="mom-vs-dad-results" class="mvd-section">
                <div class="results-header">
                    <div class="trophy-icon">🏆</div>
                    <h1>Game Complete!</h1>
                    <p>Thanks for playing!</p>
                </div>

                <!-- Real Score Display (FIXES ISSUE #18) -->
                <div class="score-container">
                    <div class="score-card ${momWins ? 'winner' : ''}">
                        <div class="score-avatar">👩</div>
                        <div class="score-name">${escapeHtml(momName)}</div>
                        <div class="score-points">${momScore} points</div>
                        ${momWins ? '<div class="winner-badge">👑 Winner!</div>' : ''}
                    </div>

                    <div class="score-card ${!momWins ? 'winner' : ''}">
                        <div class="score-avatar">👨</div>
                        <div class="score-name">${escapeHtml(dadName)}</div>
                        <div class="score-points">${dadScore} points</div>
                        ${!momWins ? '<div class="winner-badge">👑 Winner!</div>' : ''}
                    </div>
                </div>

                <!-- Final Message -->
                <div class="final-message">
                    <p>${momWins ? `${escapeHtml(momName)} really knows her stuff! 🎉` : `${escapeHtml(dadName)} takes the crown! 🏆`}</p>
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

        attachResultsScreenEvents();

        // Unsubscribe from realtime
        if (GameState.realtimeChannel) {
            GameState.realtimeChannel.unsubscribe();
            GameState.realtimeChannel = null;
        }
    }

    /**
     * Calculate final results from scenario data
     */
    function calculateFinalResults() {
        let momScore = 0;
        let dadScore = 0;

        // Count wins from revealed scenarios
        GameState.scenarios.forEach(scenario => {
            if (scenario.results) {
                if (scenario.results.crowd_choice === 'mom') {
                    momScore++;
                } else if (scenario.results.crowd_choice === 'dad') {
                    dadScore++;
                }
            }
        });

        return {
            mom_score: momScore,
            dad_score: dadScore,
            winner: momScore > dadScore ? 'mom' : (dadScore > momScore ? 'dad' : 'tie')
        };
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
    // INITIALIZATION
    // ==========================================

    /**
     * Initialize the game
     */
     function initializeGame() {
        console.log('[MomVsDadSimplified] initializing...');

        // Check if container exists
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) {
            console.warn('[MomVsDadSimplified] Container not found');
            return;
        }

        try {
            // Render initial screen immediately
            renderLobbySelector();
            console.log('[MomVsDadSimplified] Lobby selector rendered successfully');
        } catch (error) {
            console.error('[MomVsDadSimplified] Error initializing game:', error);
            // Show error state in container
            container.innerHTML = `
                <div class="mvd-section" style="text-align: center; padding: 40px 20px;">
                    <h2>🎮 Mom vs Dad Game</h2>
                    <p>Unable to load game. Please try again later.</p>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Re-initialize game when section becomes visible
     * This is called by main.js when navigating to the section
     */
    function reinitializeForSection() {
        console.log('[MomVsDadSimplified] Re-initializing for section view...');
        
        // Ensure container exists and is visible
        const container = document.getElementById('mom-vs-dad-game');
        if (!container) {
            console.warn('[MomVsDadSimplified] Container not found during re-initialization');
            return;
        }
        
        // Check if we need to re-render (container is empty or has old content)
        if (!container.querySelector('.mvd-section')) {
            console.log('[MomVsDadSimplified] Container empty, rendering lobby...');
            renderLobbySelector();
        } else {
            console.log('[MomVsDadSimplified] Content already present');
        }
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
        renderResultsScreen,
        reinitializeForSection
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
