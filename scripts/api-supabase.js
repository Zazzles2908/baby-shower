/**
 * Baby Shower App - Supabase Edge Functions API Client
 * Production-ready integration with comprehensive error handling
 * Updated to query baby_shower schema for all reads
 * 
 * Works as regular script (IIFE) attached to window.API
 */

(function(root) {
    'use strict';

    // Configuration from CONFIG or environment variables
    // Note: import.meta.env only works in ES modules, not regular scripts
    const SUPABASE_URL = root.CONFIG?.SUPABASE?.URL ||
                        root.ENV?.VITE_SUPABASE_URL ||
                        root.ENV?.NEXT_PUBLIC_SUPABASE_URL ||
                        '';

    const SUPABASE_ANON_KEY = root.CONFIG?.SUPABASE?.ANON_KEY ||
                              root.ENV?.VITE_SUPABASE_ANON_KEY ||
                              root.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                              '';

    const USE_SUPABASE = SUPABASE_URL && SUPABASE_ANON_KEY;

    // Timeout settings
    const API_TIMEOUT = 30000; // 30 seconds

    // Lazy-loaded Supabase client for realtime
    let supabaseClient = null;

    function getSupabaseClient() {
        if (supabaseClient) return supabaseClient;
        
        // Check if Supabase client is already available globally
        if (typeof root.supabase !== 'undefined') {
            supabaseClient = root.supabase;
            return supabaseClient;
        }
        
        // Check if @supabase/supabase-js is loaded via module
        if (typeof root.SupabaseClient !== 'undefined') {
            supabaseClient = root.SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        }
        
        // Supabase client not available - realtime won't work
        console.warn('Supabase client not available - realtime subscriptions disabled');
        return null;
    }

    /**
     * Build Supabase Edge Function URL
     */
    function getSupabaseFunctionUrl(functionName) {
        return `${SUPABASE_URL}/functions/v1/${functionName}`;
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async function apiFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add Supabase authorization header
        if (SUPABASE_ANON_KEY) {
            headers['apikey'] = SUPABASE_ANON_KEY;
            headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);

            if (err.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw err;
        }
    }

    /**
     * Transform baby_shower.submissions row to frontend format
     * Maps from: { id, created_at, name, activity_type, activity_data }
     * To: { activity_type, data, metadata, created_at }
     */
    function transformSubmissionToFrontendFormat(row) {
        const activityType = row.activity_type;
        const activityData = row.activity_data || {};
        
        // Build data object based on activity type
        let data = {};
        let metadata = {};
        
        switch (activityType) {
            case 'guestbook':
                data = {
                    name: row.name || activityData.name || '',
                    message: activityData.message || '',
                    relationship: activityData.relationship || ''
                };
                break;
                
            case 'baby_pool':
            case 'pool':
                data = {
                    name: row.name || activityData.name || '',
                    prediction: activityData.prediction || '',
                    dateGuess: activityData.dueDate || activityData.dateGuess || '',
                    timeGuess: activityData.timeGuess || '',
                    weightGuess: activityData.weight || activityData.weightGuess || 3.5,
                    lengthGuess: activityData.length || activityData.lengthGuess || 50
                };
                break;
                
            case 'quiz':
                data = {
                    name: row.name || activityData.name || 'Anonymous Quiz Taker',
                    answers: activityData.answers || {},
                    score: activityData.score || 0,
                    totalQuestions: activityData.totalQuestions || 5,
                    percentage: activityData.percentage || 0
                };
                metadata = {
                    puzzle1: activityData.answers?.puzzle1 || '',
                    puzzle2: activityData.answers?.puzzle2 || '',
                    puzzle3: activityData.answers?.puzzle3 || '',
                    puzzle4: activityData.answers?.puzzle4 || '',
                    puzzle5: activityData.answers?.puzzle5 || ''
                };
                break;
                
            case 'advice':
                data = {
                    name: row.name || activityData.name || 'Anonymous Advisor',
                    advice: activityData.advice || activityData.advice_text || '',
                    adviceType: activityData.category || activityData.adviceType || ''
                };
                break;
                
            case 'voting':
            case 'vote':
                data = {
                    name: row.name || activityData.name || '',
                    names: activityData.names || activityData.vote_names || []
                };
                metadata = {
                    voteCount: activityData.vote_count || (activityData.names ? activityData.names.length : 0)
                };
                break;
                
            default:
                // Generic fallback
                data = {
                    name: row.name || '',
                    ...activityData
                };
        }
        
        return {
            activity_type: activityType,
            data: data,
            metadata: metadata,
            created_at: row.created_at,
            id: row.id
        };
    }

    /**
     * Query baby_shower.submissions table directly
     * Uses Supabase REST API with proper schema prefix
     */
    async function queryBabyShowerSubmissions(options = {}) {
        const {
            activityType = null,
            limit = 100,
            orderBy = 'created_at',
            orderDir = 'desc'
        } = options;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase credentials not configured');
        }

        let url = `${SUPABASE_URL}/rest/v1/submissions?select=*`;
        
        // Add activity_type filter if specified
        if (activityType) {
            url += `&activity_type=eq.${activityType}`;
        }
        
        // Add ordering
        url += `&order=${orderBy}.${orderDir}`;
        
        // Add limit
        url += `&limit=${limit}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Accept-Profile': 'baby_shower' // Important: specify schema
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const rows = await response.json();
        return rows.map(transformSubmissionToFrontendFormat);
    }

    /**
     * Submit guestbook entry
     */
    async function submitGuestbook(data) {
        const url = getSupabaseFunctionUrl('guestbook');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                message: data.message?.trim() || '',
                relationship: data.relationship?.trim() || '',
            }),
        });
    }

    /**
     * Get current vote counts for baby names
     */
    async function getVoteCounts() {
        const url = `${SUPABASE_URL}/functions/vote`;
        
        return apiFetch(url, {
            method: 'GET',
        });
    }

    /**
     * Submit baby name vote
     */
    async function submitVote(data) {
        const url = getSupabaseFunctionUrl('vote');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                selected_names: Array.isArray(data.selected_names) ? data.selected_names : [],
            }),
        });
    }

    /**
     * Submit due date prediction
     */
    async function submitPool(data) {
        const url = getSupabaseFunctionUrl('pool');
        
        // Build comprehensive prediction string from all fields
        const dateGuess = data.dateGuess || '';
        const timeGuess = data.timeGuess || '';
        const weightGuess = Number(data.weightGuess) || 3.5;
        const lengthGuess = Number(data.lengthGuess) || 50;
        
        // Create prediction string: "Date: YYYY-MM-DD, Time: HH:mm, Weight: X.Xkg, Length: XXcm"
        const prediction = `Date: ${dateGuess}, Time: ${timeGuess}, Weight: ${weightGuess}kg, Length: ${lengthGuess}cm`;
        
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                prediction: prediction,
                dueDate: dateGuess,
                weight: weightGuess,
                length: lengthGuess,
            }),
        });
    }

    /**
     * Submit quiz answers
     */
    async function submitQuiz(data) {
        const url = getSupabaseFunctionUrl('quiz');
        
        // Build answers object with puzzle1, puzzle2, etc. keys
        const answers = {
            puzzle1: data.puzzle1?.trim() || '',
            puzzle2: data.puzzle2?.trim() || '',
            puzzle3: data.puzzle3?.trim() || '',
            puzzle4: data.puzzle4?.trim() || '',
            puzzle5: data.puzzle5?.trim() || '',
        };
        
        // Use pre-calculated score if provided, otherwise calculate
        const score = Number(data.score) || 0;
        const totalQuestions = Number(data.totalQuestions) || 5;
        const percentage = Math.round((score / totalQuestions) * 100);

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || 'Anonymous Quiz Taker',
                answers: answers,
                score: score,
                totalQuestions: totalQuestions,
                percentage: percentage,
            }),
        });
    }

    /**
     * Submit parenting advice
     */
    async function submitAdvice(data) {
        const url = getSupabaseFunctionUrl('advice');
        
        // Map adviceType to category: "For Parents" -> "general", "For Baby" -> "fun"
        const adviceType = data.adviceType?.trim() || '';
        const categoryMap = {
            'For Parents': 'general',
            'For Baby': 'fun',
        };
        const category = categoryMap[adviceType] || adviceType.toLowerCase();

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || 'Anonymous Advisor',
                advice: data.advice?.trim() || data.message?.trim() || '',
                category: category,
            }),
        });
    }

    /**
     * Get all guestbook entries from baby_shower.guestbook_entries view
     */
    async function getAllGuestbook() {
        return queryBabyShowerSubmissions({ activityType: 'guestbook' });
    }

    /**
     * Get all pool predictions from baby_shower.pool_entries view
     */
    async function getAllPool() {
        return queryBabyShowerSubmissions({ activityType: 'baby_pool' });
    }

    /**
     * Get all quiz results from baby_shower.quiz_entries view
     */
    async function getAllQuiz() {
        return queryBabyShowerSubmissions({ activityType: 'quiz' });
    }

    /**
     * Get all advice entries from baby_shower.advice_entries view
     */
    async function getAllAdvice() {
        return queryBabyShowerSubmissions({ activityType: 'advice' });
    }

    /**
     * Get all votes from baby_shower.submissions
     */
    async function getAllVotes() {
        return queryBabyShowerSubmissions({ activityType: 'voting' });
    }

    /**
     * Join Mom vs Dad game lobby
     * @param {string} sessionCode - Lobby code (LOBBY-A/B/C/D or session code)
     * @param {string} playerName - Player name
     * @returns {Promise<Object>} Join response with player data
     */
    async function gameJoin(sessionCode, playerName) {
        const url = getSupabaseFunctionUrl('lobby-join');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                lobby_key: sessionCode,
                player_name: playerName?.trim() || '',
                player_type: 'human'
            }),
        });
    }

    /**
     * Get submissions for realtime updates
     * Updated to query baby_shower schema
     */
    async function getSubmissions(activityType) {
        if (!SUPABASE_URL) {
            throw new Error('Supabase URL not configured');
        }

        const url = `${SUPABASE_URL}/rest/v1/submissions?activity_type=eq.${activityType}&order=created_at.desc`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Accept-Profile': 'baby_shower' // Query from baby_shower schema
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rows = await response.json();
        return rows.map(transformSubmissionToFrontendFormat);
    }

    /**
     * Get all submissions (aggregated from all activity types)
     */
    async function getAllSubmissions() {
        return queryBabyShowerSubmissions({ limit: 500 });
    }

    /**
     * Subscribe to guestbook realtime changes
     */
    function subscribeToGuestbook(callback) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured for realtime');
            return () => {};
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return () => {};
        }

        // Create channel for guestbook changes
        const channel = supabase
            .channel('guestbook-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'baby_shower',
                    table: 'submissions',
                    filter: "activity_type=eq.guestbook"
                },
                (payload) => {
                    const transformed = transformSubmissionToFrontendFormat(payload.new);
                    callback(transformed, 'INSERT');
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Subscribe to pool realtime changes
     */
    function subscribeToPool(callback) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured for realtime');
            return () => {};
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return () => {};
        }

        const channel = supabase
            .channel('pool-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'baby_shower',
                    table: 'submissions',
                    filter: "activity_type=eq.baby_pool"
                },
                (payload) => {
                    const transformed = transformSubmissionToFrontendFormat(payload.new);
                    callback(transformed, 'INSERT');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Subscribe to quiz realtime changes
     */
    function subscribeToQuiz(callback) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured for realtime');
            return () => {};
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return () => {};
        }

        const channel = supabase
            .channel('quiz-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'baby_shower',
                    table: 'submissions',
                    filter: "activity_type=eq.quiz"
                },
                (payload) => {
                    const transformed = transformSubmissionToFrontendFormat(payload.new);
                    callback(transformed, 'INSERT');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Subscribe to advice realtime changes
     */
    function subscribeToAdvice(callback) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured for realtime');
            return () => {};
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return () => {};
        }

        const channel = supabase
            .channel('advice-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'baby_shower',
                    table: 'submissions',
                    filter: "activity_type=eq.advice"
                },
                (payload) => {
                    const transformed = transformSubmissionToFrontendFormat(payload.new);
                    callback(transformed, 'INSERT');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Subscribe to all submission changes
     */
    function subscribeToAllSubmissions(callback) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured for realtime');
            return () => {};
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('Supabase client not available for realtime');
            return () => {};
        }

        const channel = supabase
            .channel('all-submissions-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'baby_shower',
                    table: 'submissions'
                },
                (payload) => {
                    const transformed = transformSubmissionToFrontendFormat(payload.new);
                    callback(transformed, 'INSERT');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Export configuration for debugging
     */
    function getApiConfig() {
        return {
            provider: USE_SUPABASE ? 'supabase' : 'vercel',
            supabaseUrl: SUPABASE_URL ? '***configured***' : 'not configured',
            status: SUPABASE_URL ? 'ready' : 'not configured',
            schema: 'baby_shower',
            tables: ['submissions']
        };
    }

    /**
     * Initialize API and verify connection
     */
    async function initializeAPI() {
        console.log('API Client initializing...');
        console.log('Supabase URL:', SUPABASE_URL ? '***configured***' : 'missing');

        if (!SUPABASE_URL) {
            console.error('Supabase URL not configured in CONFIG');
            return { success: false, error: 'Supabase URL not configured' };
        }

        try {
            // Test health check against baby_shower schema
            const healthUrl = `${SUPABASE_URL}/rest/v1/submissions?select=id&limit=1`;
            const response = await fetch(healthUrl, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Accept-Profile': 'baby_shower'
                }
            });

            if (!response.ok) {
                throw new Error(`Health check failed: HTTP ${response.status}`);
            }

            console.log('API Client ready - reading from baby_shower schema');
            return { success: true, schema: 'baby_shower' };
        } catch (err) {
            console.error('API Client initialization failed:', err.message);
            return { success: false, error: err.message };
        }
    }

    // Create API object with all functions
    const API = {
        // Submit functions (via Edge Functions)
        submitGuestbook,
        submitVote,
        submitPool,
        submitQuiz,
        submitAdvice,
        submit,

        // Mom vs Dad Game functions
        gameJoin,

        // Read functions (from baby_shower schema)
        getVoteCounts,
        getSubmissions,
        getAllSubmissions,
        getAllGuestbook,
        getAllPool,
        getAllQuiz,
        getAllAdvice,
        getAllVotes,

        // Realtime subscription functions
        subscribeToGuestbook,
        subscribeToPool,
        subscribeToQuiz,
        subscribeToAdvice,
        subscribeToAllSubmissions,

        // Utility functions
        getApiConfig,
        initializeAPI,

        // Expose transform function for external use
        transformSubmission: transformSubmissionToFrontendFormat,

        // Expose query helper
        queryBabyShower: queryBabyShowerSubmissions
    };

    // Legacy function name for compatibility
    function submit(activityType, data) {
        switch(activityType) {
            case 'guestbook': return submitGuestbook(data);
            case 'vote': return submitVote(data);
            case 'baby_pool':
            case 'pool': return submitPool(data);
            case 'quiz': return submitQuiz(data);
            case 'advice': return submitAdvice(data);
            default: return Promise.reject(new Error(`Unknown activity type: ${activityType}`));
        }
    }

    // Attach to global scope
    if (typeof root !== 'undefined') {
        root.API = API;
    }

    // Auto-initialize when DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAPI);
        } else {
            initializeAPI();
        }
    }

    console.log('API Client (api-supabase.js) loaded successfully - baby_shower schema enabled');

})(typeof window !== 'undefined' ? window : this);
