/**
 * Baby Shower App - Supabase Edge Functions API Client
 * Production-ready integration with comprehensive error handling and retry logic
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
    const RETRY_ATTEMPTS = 3;
    const RETRY_DELAY = 1000; // 1 second base delay

    // Lazy-loaded Supabase client for realtime
    let supabaseClient = null;
    let initializationAttempts = 0;

    /**
     * Generic fetch wrapper with error handling
     */
    async function apiFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

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
     * Initialize Supabase client with retry logic
     */
    async function initializeSupabaseClient(maxRetries = RETRY_ATTEMPTS) {
        console.log('[API] Initializing Supabase client...');
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check if Supabase client is already available globally
                if (typeof root.supabase !== 'undefined' && root.supabase.client) {
                    supabaseClient = root.supabase.client;
                    console.log('[API] Using global Supabase client');
                    return supabaseClient;
                }
                
                // Check if @supabase/supabase-js is loaded via module
                if (typeof root.supabase !== 'undefined' && typeof root.supabase.createClient === 'function') {
                    supabaseClient = root.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true
                        },
                        global: {
                            headers: {
                                'X-Client-Info': 'baby-shower-app/1.0.0'
                            }
                        },
                        db: {
                            schema: 'baby_shower'
                        }
                    });
                    console.log('[API] Created new Supabase client');
                    return supabaseClient;
                }
                
                // Try to load Supabase dynamically
                if (attempt === 1) {
                    console.log('[API] Attempting to load Supabase client dynamically...');
                    await loadSupabaseClient();
                    if (typeof root.supabase !== 'undefined' && typeof root.supabase.createClient === 'function') {
                        continue; // Retry with newly loaded client
                    }
                }
                
                throw new Error('Supabase client library not available');
                
            } catch (error) {
                console.warn(`[API] Supabase client initialization attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error('[API] All Supabase client initialization attempts failed');
                    
                    // Log to error monitor
                    if (root.ErrorMonitor) {
                        root.ErrorMonitor.logCustom('supabase_init_failed', error.message, {
                            attempt: attempt,
                            maxRetries: maxRetries,
                            supabaseUrl: SUPABASE_URL ? 'configured' : 'missing',
                            supabaseKey: SUPABASE_ANON_KEY ? 'configured' : 'missing'
                        });
                    }
                    
                    return null;
                }
                
                // Exponential backoff delay
                const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`[API] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Dynamically load Supabase client library
     */
    async function loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="supabase"]')) {
                console.log('[API] Supabase script already loading');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            
            script.onload = () => {
                console.log('[API] Supabase client library loaded');
                resolve();
            };
            
            script.onerror = () => {
                console.error('[API] Failed to load Supabase client library');
                reject(new Error('Failed to load Supabase client library'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Get or create Supabase client with health check
     */
    async function getSupabaseClient() {
        if (supabaseClient) {
            // Health check existing client
            try {
                const { error } = await supabaseClient.auth.getSession();
                if (error) {
                    console.warn('[API] Supabase client health check failed, reinitializing...');
                    supabaseClient = null;
                } else {
                    return supabaseClient;
                }
            } catch (error) {
                console.warn('[API] Supabase client health check error, reinitializing...');
                supabaseClient = null;
            }
        }
        
        if (!supabaseClient) {
            supabaseClient = await initializeSupabaseClient();
        }
        
        return supabaseClient;
    }

    /**
     * Build Supabase Edge Function URL
     */
    function getSupabaseFunctionUrl(functionName) {
        return `${SUPABASE_URL}/functions/v1/${functionName}`;
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
     * Submit vote for baby name
     */
    async function submitVote(data) {
        const url = getSupabaseFunctionUrl('vote');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                votes: data.votes || [],
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

        return await response.json();
    }

    /**
     * Submit baby pool prediction
     */
    async function submitPool(data) {
        const url = getSupabaseFunctionUrl('pool');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                prediction: data.prediction || (data.dateGuess && data.timeGuess ? `${data.dateGuess} at ${data.timeGuess}` : data.dateGuess || ''),
                dueDate: data.due_date || data.dueDate || data.dateGuess || '',
                due_date: data.due_date || '', // Keep for compatibility
                weight: parseFloat(data.weight) || parseFloat(data.weightGuess) || 0,
                length: parseFloat(data.length) || parseFloat(data.lengthGuess) || 0,
            }),
        });
    }

    /**
     * Submit quiz answers
     */
    async function submitQuiz(data) {
        const url = getSupabaseFunctionUrl('quiz');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                answers: data.answers || [],
                score: data.score || 0,
                totalQuestions: data.totalQuestions || 5,
            }),
        });
    }

    /**
     * Submit advice/wishes
     * Maps main.js field names to Edge Function expected fields
     */
    async function submitAdvice(data) {
        const url = getSupabaseFunctionUrl('advice');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                // Edge Function accepts 'message' or 'advice'
                message: data.message?.trim() || data.advice?.trim() || '',
                // Edge Function accepts 'adviceType' or 'category'
                adviceType: data.adviceType?.trim() || data.category?.trim() || 'For Parents',
            }),
        });
    }

    /**
     * Generic submit function that routes to appropriate handler
     */
    async function submit(activityType, data) {
        switch (activityType) {
            case 'guestbook':
                return submitGuestbook(data);
            case 'vote':
                return submitVote(data);
            case 'pool':
                return submitPool(data);
            case 'quiz':
                return submitQuiz(data);
            case 'advice':
                return submitAdvice(data);
            default:
                throw new Error(`Unknown activity type: ${activityType}`);
        }
    }

    /**
     * Join Mom vs Dad game session
     */
    async function gameJoin(data) {
        const url = getSupabaseFunctionUrl('game-session');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                action: 'join',
                session_code: data.sessionCode?.trim().toUpperCase() || data.session_code?.trim().toUpperCase() || '',
                guest_name: data.guestName?.trim() || data.guest_name?.trim() || '',
            }),
        });
    }

    /**
     * Create Mom vs Dad game session
     */
    async function gameCreate(data) {
        const url = getSupabaseFunctionUrl('game-session');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                momName: data.momName?.trim() || '',
                dadName: data.dadName?.trim() || '',
            }),
        });
    }

    /**
     * Submit Who Would Rather vote
     */
    async function submitWhoWouldRather(data) {
        const url = getSupabaseFunctionUrl('who-would-rather');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                votes: data.votes || [], // Array of {questionId, choice}
            }),
        });
    }

    /**
     * Optional health check for API connectivity
     */
    async function runOptionalHealthCheck() {
        const results = {
            supabase: false,
            edgeFunctions: [],
            timestamp: new Date().toISOString(),
        };

        try {
            const client = await getSupabaseClient();
            if (client) {
                const { error } = await client.auth.getSession();
                results.supabase = !error;
            }
        } catch (error) {
            console.warn('[API] Health check failed:', error.message);
        }

        return results;
    }

    // Create API object with functions actually defined in this file
    const API = {
        // Submit functions (via Edge Functions)
        submitGuestbook,
        submitVote,
        submitPool,
        submitQuiz,
        submitAdvice,
        submit,
        submitWhoWouldRather,
        // Game functions (via Edge Functions)
        gameJoin,
        gameCreate,
        // Data retrieval functions
        getSubmissions,
        // Supabase client accessor
        getSupabaseClient,
        // Health checks
        performHealthCheck: runOptionalHealthCheck,
        // Initialize function for deferred loading
        initialize: async function() {
            console.log('[API] initialize() called - initializing Supabase client');
            try {
                await initializeSupabaseClient();
                console.log('[API] initialize() completed');
                return { success: true };
            } catch (error) {
                console.error('[API] initialize() failed:', error);
                return { success: false, error: error.message };
            }
        },
    };

    // Attach to global scope
    if (typeof root !== 'undefined') {
        root.API = API;
    }

    console.log('[API] Client (api-supabase-enhanced.js) loaded successfully');

})(typeof window !== 'undefined' ? window : this);