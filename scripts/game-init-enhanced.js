/**
 * Baby Shower App - Enhanced Game Initialization System
 * Robust game initialization with fallbacks and comprehensive error handling
 */

(function() {
    'use strict';
    
    console.log('[GameInit] Loading enhanced game initialization system...');
    
    // Configuration
    const CONFIG = {
        MAX_INIT_ATTEMPTS: 3,
        INIT_TIMEOUT: 15000,
        RETRY_DELAY: 2000,
        FALLBACK_MODE_TIMEOUT: 5000,
        REQUIRED_COMPONENTS: ['supabase', 'realtime', 'data', 'ui']
    };
    
    // Game initialization states
    const GAME_STATES = {
        LOADING: 'loading',
        READY: 'ready',
        ERROR: 'error',
        OFFLINE: 'offline',
        FALLBACK: 'fallback'
    };
    
    // State tracking
    let gameInitializations = new Map();
    let initializationAttempts = new Map();
    
    // Public API
    window.GameInit = {
        initializeGame: initializeGameWithFallbacks,
        getGameStatus: getGameInitializationStatus,
        enableOfflineMode: enableOfflineGameMode,
        retryInitialization: retryGameInitialization,
        getStats: getInitializationStats
    };
    
    /**
     * Initialize game with comprehensive fallback logic
     */
    async function initializeGameWithFallbacks(gameId, options = {}) {
        const {
            maxAttempts = CONFIG.MAX_INIT_ATTEMPTS,
            timeout = CONFIG.INIT_TIMEOUT,
            enableOffline = true,
            showLoadingUI = true,
            onProgress = null
        } = options;
        
        console.log(`[GameInit] Starting initialization for game: ${gameId}`);
        
        // Check if already initializing
        if (gameInitializations.has(gameId)) {
            const existing = gameInitializations.get(gameId);
            if (existing.status === GAME_STATES.LOADING) {
                console.log(`[GameInit] Game ${gameId} already initializing`);
                return existing.promise;
            }
        }
        
        // Create initialization state
        const initState = {
            gameId: gameId,
            status: GAME_STATES.LOADING,
            components: {},
            errors: [],
            startTime: Date.now(),
            attempts: 0,
            options: options
        };
        
        // Set up loading UI if requested
        if (showLoadingUI) {
            showGameLoadingUI(gameId, 'Initializing game...');
        }
        
        // Create initialization promise
        const initPromise = performGameInitialization(initState, {
            maxAttempts,
            timeout,
            enableOffline,
            onProgress
        });
        
        initState.promise = initPromise;
        gameInitializations.set(gameId, initState);
        
        try {
            const result = await initPromise;
            
            // Update status
            initState.status = GAME_STATES.READY;
            initState.endTime = Date.now();
            initState.duration = initState.endTime - initState.startTime;
            
            console.log(`[GameInit] Game ${gameId} initialized successfully in ${initState.duration}ms`);
            
            // Hide loading UI
            if (showLoadingUI) {
                hideGameLoadingUI(gameId);
            }
            
            return {
                success: true,
                gameId: gameId,
                status: GAME_STATES.READY,
                components: result.components,
                duration: initState.duration,
                offlineMode: result.offlineMode || false
            };
            
        } catch (error) {
            console.error(`[GameInit] Game ${gameId} initialization failed:`, error);
            
            initState.status = GAME_STATES.ERROR;
            initState.endTime = Date.now();
            initState.duration = initState.endTime - initState.startTime;
            initState.errors.push(error.message);
            
            // Log to error monitor
            if (window.ErrorMonitor) {
                window.ErrorMonitor.logCustom('game_initialization_failed', error.message, {
                    gameId: gameId,
                    duration: initState.duration,
                    attempts: initState.attempts,
                    components: initState.components
                });
            }
            
            // Hide loading UI
            if (showLoadingUI) {
                hideGameLoadingUI(gameId);
            }
            
            return {
                success: false,
                gameId: gameId,
                status: GAME_STATES.ERROR,
                error: error.message,
                components: initState.components,
                duration: initState.duration
            };
        }
    }
    
    /**
     * Perform actual game initialization
     */
    async function performGameInitialization(initState, options) {
        const { maxAttempts, timeout, enableOffline, onProgress } = options;
        const { gameId } = initState;
        
        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Game initialization timeout after ${timeout}ms`));
            }, timeout);
        });
        
        // Set up initialization promise
        const initPromise = (async () => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    initState.attempts = attempt;
                    console.log(`[GameInit] Initialization attempt ${attempt} for game: ${gameId}`);
                    
                    if (onProgress) {
                        onProgress({
                            gameId: gameId,
                            attempt: attempt,
                            totalAttempts: maxAttempts,
                            status: 'initializing'
                        });
                    }
                    
                    // Initialize components in parallel with tracking
                    const componentResults = await initializeGameComponents(gameId, {
                        onProgress: (component, status) => {
                            initState.components[component] = status;
                            
                            if (onProgress) {
                                onProgress({
                                    gameId: gameId,
                                    attempt: attempt,
                                    totalAttempts: maxAttempts,
                                    component: component,
                                    componentStatus: status,
                                    status: 'component_initializing'
                                });
                            }
                        }
                    });
                    
                    // Check if all critical components are ready
                    const criticalComponents = CONFIG.REQUIRED_COMPONENTS;
                    const failedCritical = criticalComponents.filter(comp => 
                        !componentResults[comp] || componentResults[comp].status !== 'ready'
                    );
                    
                    if (failedCritical.length === 0) {
                        // All components ready
                        return {
                            components: componentResults,
                            offlineMode: false
                        };
                    } else if (enableOffline && failedCritical.length < criticalComponents.length) {
                        // Partial success, enable offline mode
                        console.warn(`[GameInit] Partial initialization, enabling offline mode for: ${gameId}`);
                        
                        const offlineResult = await enableOfflineGameMode(gameId, componentResults);
                        
                        return {
                            components: offlineResult.components,
                            offlineMode: true
                        };
                    } else {
                        // Critical failure, retry
                        throw new Error(`Critical components failed: ${failedCritical.join(', ')}`);
                    }
                    
                } catch (error) {
                    console.warn(`[GameInit] Initialization attempt ${attempt} failed for ${gameId}:`, error.message);
                    initState.errors.push(error.message);
                    
                    if (attempt === maxAttempts) {
                        if (enableOffline) {
                            // Final fallback to offline mode
                            console.log(`[GameInit] All attempts failed, enabling offline mode for: ${gameId}`);
                            
                            const offlineResult = await enableOfflineGameMode(gameId, initState.components);
                            
                            return {
                                components: offlineResult.components,
                                offlineMode: true
                            };
                        } else {
                            throw error;
                        }
                    }
                    
                    // Wait before retry
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                    console.log(`[GameInit] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        })();
        
        // Race between initialization and timeout
        return Promise.race([initPromise, timeoutPromise]);
    }
    
    /**
     * Initialize individual game components
     */
    async function initializeGameComponents(gameId, options = {}) {
        const { onProgress } = options;
        const components = {};
        
        // Supabase client initialization
        try {
            onProgress?.('supabase', 'initializing');
            
            if (window.API && window.API.getSupabaseClient) {
                const client = await window.API.getSupabaseClient();
                components.supabase = {
                    status: client ? 'ready' : 'failed',
                    client: client,
                    error: client ? null : 'Supabase client not available'
                };
            } else {
                components.supabase = {
                    status: 'failed',
                    error: 'API not available'
                };
            }
            
            onProgress?.('supabase', components.supabase.status);
            
        } catch (error) {
            components.supabase = {
                status: 'failed',
                error: error.message
            };
            onProgress?.('supabase', 'failed');
        }
        
        // Realtime subscription setup
        try {
            onProgress?.('realtime', 'initializing');
            
            if (window.RealtimeManager) {
                components.realtime = {
                    status: 'ready',
                    manager: window.RealtimeManager,
                    error: null
                };
            } else {
                components.realtime = {
                    status: 'failed',
                    error: 'RealtimeManager not available'
                };
            }
            
            onProgress?.('realtime', components.realtime.status);
            
        } catch (error) {
            components.realtime = {
                status: 'failed',
                error: error.message
            };
            onProgress?.('realtime', 'failed');
        }
        
        // Game data loading
        try {
            onProgress?.('data', 'initializing');
            
            const gameData = await loadGameData(gameId);
            components.data = {
                status: 'ready',
                data: gameData,
                error: null
            };
            
            onProgress?.('data', 'ready');
            
        } catch (error) {
            components.data = {
                status: 'failed',
                error: error.message
            };
            onProgress?.('data', 'failed');
        }
        
        // UI component setup
        try {
            onProgress?.('ui', 'initializing');
            
            const uiReady = await initializeGameUI(gameId);
            components.ui = {
                status: uiReady ? 'ready' : 'failed',
                error: uiReady ? null : 'UI initialization failed'
            };
            
            onProgress?.('ui', components.ui.status);
            
        } catch (error) {
            components.ui = {
                status: 'failed',
                error: error.message
            };
            onProgress?.('ui', 'failed');
        }
        
        return components;
    }
    
    /**
     * Load game data
     */
    async function loadGameData(gameId) {
        // Simulate game data loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            gameId: gameId,
            config: getGameConfig(gameId),
            questions: [],
            scores: {},
            settings: {}
        };
    }
    
    /**
     * Initialize game UI
     */
    async function initializeGameUI(gameId) {
        // Check if game UI elements exist
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameContainer) {
            console.warn(`[GameInit] Game container not found for: ${gameId}`);
            return false;
        }
        
        // Add loading states
        gameContainer.classList.add('game-loading');
        
        // Set up UI event handlers
        setupGameUIHandlers(gameId, gameContainer);
        
        return true;
    }
    
    /**
     * Enable offline game mode
     */
    async function enableOfflineGameMode(gameId, components) {
        console.log(`[GameInit] Enabling offline mode for game: ${gameId}`);
        
        const offlineComponents = { ...components };
        
        // Create offline versions of failed components
        if (components.supabase?.status !== 'ready') {
            offlineComponents.supabase = {
                status: 'offline',
                client: createOfflineSupabaseClient(),
                error: null
            };
        }
        
        if (components.realtime?.status !== 'ready') {
            offlineComponents.realtime = {
                status: 'offline',
                manager: createOfflineRealtimeManager(),
                error: null
            };
        }
        
        if (components.data?.status !== 'ready') {
            offlineComponents.data = {
                status: 'offline',
                data: getOfflineGameData(gameId),
                error: null
            };
        }
        
        // Show offline indicator
        showOfflineIndicator(gameId);
        
        return {
            components: offlineComponents,
            offlineMode: true
        };
    }
    
    /**
     * Create offline Supabase client
     */
    function createOfflineSupabaseClient() {
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({ data: [], error: null }),
                    order: () => ({ data: [], error: null }),
                    limit: () => ({ data: [], error: null })
                }),
                insert: () => ({ data: null, error: null }),
                update: () => ({ data: null, error: null }),
                delete: () => ({ data: null, error: null })
            }),
            auth: {
                getSession: () => ({ data: { session: null }, error: null })
            }
        };
    }
    
    /**
     * Create offline realtime manager
     */
    function createOfflineRealtimeManager() {
        return {
            createSubscription: () => ({
                unsubscribe: () => {},
                getStatus: () => ({ status: 'offline' })
            })
        };
    }
    
    /**
     * Get offline game data
     */
    function getOfflineGameData(gameId) {
        return {
            gameId: gameId,
            config: getGameConfig(gameId),
            questions: getOfflineQuestions(gameId),
            scores: {},
            settings: { offline: true }
        };
    }
    
    /**
     * Get game configuration
     */
    function getGameConfig(gameId) {
        const configs = {
            'mom-vs-dad': {
                name: 'Mom vs Dad',
                maxPlayers: 10,
                rounds: 5,
                timePerRound: 60
            },
            'who-would-rather': {
                name: 'Who Would Rather',
                maxPlayers: 20,
                questions: 24,
                timePerQuestion: 30
            }
        };
        
        return configs[gameId] || {
            name: 'Unknown Game',
            maxPlayers: 10,
            rounds: 5,
            timePerRound: 60
        };
    }
    
    /**
     * Get offline questions
     */
    function getOfflineQuestions(gameId) {
        const questions = {
            'mom-vs-dad': [
                {
                    id: 1,
                    text: "Who is more likely to change diapers at 3 AM?",
                    momOption: "Mom would handle it like a pro",
                    dadOption: "Dad would power through"
                },
                {
                    id: 2,
                    text: "Who will be the stricter parent?",
                    momOption: "Mom will lay down the law",
                    dadOption: "Dad will be the enforcer"
                }
            ],
            'who-would-rather': [
                {
                    id: 1,
                    text: "Who would rather eat baby food for a week?",
                    category: "food",
                    difficulty: "easy"
                },
                {
                    id: 2,
                    text: "Who would rather change 100 diapers in one day?",
                    category: "chores",
                    difficulty: "hard"
                }
            ]
        };
        
        return questions[gameId] || [];
    }
    
    /**
     * Show game loading UI
     */
    function showGameLoadingUI(gameId, message) {
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameContainer) return;
        
        let loadingElement = gameContainer.querySelector('.game-loading-overlay');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.className = 'game-loading-overlay';
            loadingElement.innerHTML = `
                <div class="game-loading-content">
                    <div class="game-loading-spinner"></div>
                    <div class="game-loading-message">${message}</div>
                    <div class="game-loading-progress">
                        <div class="game-loading-bar"></div>
                    </div>
                </div>
            `;
            gameContainer.appendChild(loadingElement);
        }
        
        loadingElement.querySelector('.game-loading-message').textContent = message;
        loadingElement.style.display = 'flex';
    }
    
    /**
     * Hide game loading UI
     */
    function hideGameLoadingUI(gameId) {
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameContainer) return;
        
        const loadingElement = gameContainer.querySelector('.game-loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        gameContainer.classList.remove('game-loading');
    }
    
    /**
     * Show offline indicator
     */
    function showOfflineIndicator(gameId) {
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameContainer) return;
        
        let offlineElement = gameContainer.querySelector('.game-offline-indicator');
        if (!offlineElement) {
            offlineElement = document.createElement('div');
            offlineElement.className = 'game-offline-indicator';
            offlineElement.innerHTML = `
                <div class="offline-message">
                    <span class="offline-icon">📡</span>
                    <span class="offline-text">Playing offline - scores won't be saved</span>
                </div>
            `;
            gameContainer.appendChild(offlineElement);
        }
        
        offlineElement.style.display = 'block';
    }
    
    /**
     * Setup game UI handlers
     */
    function setupGameUIHandlers(gameId, container) {
        // Add retry button handler
        const retryButton = container.querySelector('.game-retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                retryGameInitialization(gameId);
            });
        }
        
        // Add refresh button handler
        const refreshButton = container.querySelector('.game-refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                location.reload();
            });
        }
    }
    
    /**
     * Get game initialization status
     */
    function getGameInitializationStatus(gameId) {
        const initState = gameInitializations.get(gameId);
        if (!initState) {
            return { status: 'not_initialized' };
        }
        
        return {
            gameId: gameId,
            status: initState.status,
            components: initState.components,
            errors: initState.errors,
            attempts: initState.attempts,
            duration: initState.duration || 0
        };
    }
    
    /**
     * Retry game initialization
     */
    async function retryGameInitialization(gameId) {
        console.log(`[GameInit] Retrying initialization for game: ${gameId}`);
        
        const initState = gameInitializations.get(gameId);
        if (!initState) {
            console.error(`[GameInit] No initialization state found for: ${gameId}`);
            return { success: false, error: 'No initialization state found' };
        }
        
        // Reset state
        initState.status = GAME_STATES.LOADING;
        initState.errors = [];
        initState.components = {};
        
        // Retry with same options
        return await initializeGameWithFallbacks(gameId, initState.options);
    }
    
    /**
     * Get initialization statistics
     */
    function getInitializationStats() {
        const stats = {
            totalGames: gameInitializations.size,
            byStatus: {
                loading: 0,
                ready: 0,
                error: 0,
                offline: 0,
                fallback: 0
            },
            averageDuration: 0,
            games: {}
        };
        
        let totalDuration = 0;
        let completedGames = 0;
        
        for (const [gameId, initState] of gameInitializations) {
            stats.byStatus[initState.status]++;
            
            if (initState.duration > 0) {
                totalDuration += initState.duration;
                completedGames++;
            }
            
            stats.games[gameId] = {
                status: initState.status,
                attempts: initState.attempts,
                duration: initState.duration,
                errors: initState.errors.length
            };
        }
        
        stats.averageDuration = completedGames > 0 ? Math.round(totalDuration / completedGames) : 0;
        
        return stats;
    }
    
    // Initialize when DOM is ready
    function initializeGameInit() {
        console.log('[GameInit] Initialization system ready');
        
        // Add CSS for loading states
        const style = document.createElement('style');
        style.textContent = `
            .game-loading {
                position: relative;
                pointer-events: none;
            }
            
            .game-loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .game-loading-content {
                text-align: center;
                padding: 2rem;
            }
            
            .game-loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: game-loading-spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes game-loading-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .game-offline-indicator {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 0.5rem;
                margin: 0.5rem 0;
                display: none;
            }
            
            .offline-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                color: #856404;
            }
            
            .offline-icon {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);
        
        console.log('[GameInit] Enhanced game initialization system ready');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGameInit);
    } else {
        initializeGameInit();
    }
    
})();