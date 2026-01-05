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
     * Submit baby pool prediction
     */
    async function submitPool(data) {
        const url = getSupabaseFunctionUrl('pool');
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                prediction: data.prediction || '',
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
                score: data.score || 0,
                totalQuestions: data.totalQuestions || 5,
                answers: data.answers || {},
            }),
        });
    }

    /**
     * Submit advice for parents
      */
     async function submitAdvice(data) {
         const url = getSupabaseFunctionUrl('advice');
         
         // Handle both category (from main.js) and adviceType (direct calls)
         const adviceType = data.adviceType?.trim() || data.category || 'For Parents';
         
         return apiFetch(url, {
             method: 'POST',
             body: JSON.stringify({
                 name: data.name?.trim() || '',
                 message: data.message?.trim() || '',
                 advice: data.advice?.trim() || '',  // Also support 'advice' field
                 adviceType: adviceType,
                 category: data.category,  // Pass through for backend compatibility
             }),
         });
     }

    /**
     * Generic submit function for any activity
     */
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

    /**
     * Generic fetch wrapper with error handling and retry logic
     */
    async function apiFetch(url, options = {}, maxRetries = RETRY_ATTEMPTS) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add Supabase authorization header
        if (SUPABASE_ANON_KEY) {
            headers['apikey'] = SUPABASE_ANON_KEY;
            headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
                    if (attempt === maxRetries) {
                        throw new Error('Request timed out after multiple attempts. Please check your connection.');
                    }
                    console.warn(`[API] Request timeout on attempt ${attempt}, retrying...`);
                } else {
                    console.warn(`[API] Request failed on attempt ${attempt}:`, err.message);
                    
                    if (attempt === maxRetries) {
                        // Log to error monitor
                        if (root.ErrorMonitor) {
                            root.ErrorMonitor.logCustom('api_request_failed', err.message, {
                                url: url,
                                method: options.method || 'GET',
                                attempt: attempt,
                                maxRetries: maxRetries
                            });
                        }
                        
                        throw err;
                    }
                }

                // Exponential backoff delay
                const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`[API] Retrying request in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Enhanced health check with detailed diagnostics
     */
    async function performHealthCheck() {
        console.log('[API] Performing comprehensive health check...');
        
        const results = {
            supabaseUrl: SUPABASE_URL ? 'configured' : 'missing',
            supabaseKey: SUPABASE_ANON_KEY ? 'configured' : 'missing',
            clientAvailable: false,
            realtimeAvailable: false,
            edgeFunctions: {},
            database: false,
            overall: 'unknown'
        };

        try {
            // Test Supabase client
            const client = await getSupabaseClient();
            results.clientAvailable = !!client;
            
            if (client) {
                // Test realtime capability
                try {
                    const { error } = await client.auth.getSession();
                    results.realtimeAvailable = !error;
                } catch (error) {
                    results.realtimeAvailable = false;
                }
            }

            // Test database connection
            try {
                const healthUrl = `${SUPABASE_URL}/rest/v1/submissions?select=id&limit=1`;
                const response = await apiFetch(healthUrl, {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY,
                        'Accept-Profile': 'baby_shower'
                    }
                });
                results.database = response && response.length >= 0;
            } catch (error) {
                results.database = false;
                console.error('[API] Database health check failed:', error.message);
            }

            // Test edge functions
            const functionsToTest = ['vote', 'guestbook'];
            for (const functionName of functionsToTest) {
                try {
                    const url = getSupabaseFunctionUrl(functionName);
                    const response = await fetch(url, {
                        method: 'OPTIONS',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    });
                    results.edgeFunctions[functionName] = response.ok;
                } catch (error) {
                    results.edgeFunctions[functionName] = false;
                    console.error(`[API] Edge function ${functionName} health check failed:`, error.message);
                }
            }

            // Determine overall health
            const criticalComponents = [
                results.supabaseUrl === 'configured',
                results.supabaseKey === 'configured',
                results.database
            ];
            
            results.overall = criticalComponents.every(Boolean) ? 'healthy' : 'degraded';
            
            console.log('[API] Health check completed:', results);
            return results;
            
        } catch (error) {
            console.error('[API] Health check failed:', error.message);
            results.overall = 'failed';
            return results;
        }
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
     * Initialize API and verify connection with enhanced diagnostics
     */
    async function initializeAPI() {
        console.log('[API] Client initializing with enhanced retry logic...');
        
        const healthResults = await performHealthCheck();
        
        if (healthResults.overall === 'healthy') {
            console.log('[API] Client ready - all systems operational');
            return { success: true, health: healthResults };
        } else if (healthResults.overall === 'degraded') {
            console.warn('[API] Client ready - some features may be limited');
            return { success: true, health: healthResults, warning: 'Some features may be limited' };
        } else {
            console.error('[API] Client initialization failed');
            return { success: false, health: healthResults, error: 'Initialization failed' };
        }
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
        // Supabase client accessor
        getSupabaseClient,
        // Health check
        performHealthCheck,
        // Initialize API
        initialize: initializeAPI,
    };

    // Legacy function name for compatibility (removed - functions now in main.js)

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

    console.log('[API] Client (api-supabase.js) loaded successfully with enhanced retry logic');

})(typeof window !== 'undefined' ? window : this);