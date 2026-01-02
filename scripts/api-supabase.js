/**
 * Baby Shower App - Supabase Edge Functions API Client
 * Production-ready integration with comprehensive error handling
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
     * Submit baby name vote
     */
    async function submitVote(data) {
        const url = getSupabaseFunctionUrl('vote');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                names: Array.isArray(data.names) ? data.names : [],
            }),
        });
    }

    /**
     * Submit due date prediction
     */
    async function submitPool(data) {
        const url = getSupabaseFunctionUrl('pool');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                dateGuess: data.dateGuess || '',
                timeGuess: data.timeGuess || '',
                weightGuess: data.weightGuess || '',
                lengthGuess: data.lengthGuess || '',
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
                puzzle1: data.puzzle1?.trim() || '',
                puzzle2: data.puzzle2?.trim() || '',
                puzzle3: data.puzzle3?.trim() || '',
                puzzle4: data.puzzle4?.trim() || '',
                puzzle5: data.puzzle5?.trim() || '',
                score: Number(data.score) || 0,
                totalQuestions: Number(data.totalQuestions) || 0,
            }),
        });
    }

    /**
     * Submit parenting advice
     */
    async function submitAdvice(data) {
        const url = getSupabaseFunctionUrl('advice');

        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                adviceType: data.adviceType?.trim() || '',
                advice: data.advice?.trim() || data.message?.trim() || '',
            }),
        });
    }

    /**
     * Get submissions for realtime updates
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
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Export configuration for debugging
     */
    function getApiConfig() {
        return {
            provider: USE_SUPABASE ? 'supabase' : 'vercel',
            supabaseUrl: SUPABASE_URL ? '***configured***' : 'not configured',
            status: SUPABASE_URL ? 'ready' : 'not configured'
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
            // Test health check
            const healthUrl = `${SUPABASE_URL}/rest/v1/submissions?select=id&limit=1`;
            await fetch(healthUrl, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                }
            });
            console.log('API Client ready');
            return { success: true };
        } catch (err) {
            console.error('API Client initialization failed:', err.message);
            return { success: false, error: err.message };
        }
    }

    // Create API object
    const API = {
        submitGuestbook,
        submitVote,
        submitPool,
        submitQuiz,
        submitAdvice,
        getSubmissions,
        getApiConfig,
        initializeAPI,
        // Legacy function name for compatibility
        submit: function(activityType, data) {
            switch(activityType) {
                case 'guestbook': return submitGuestbook(data);
                case 'vote': return submitVote(data);
                case 'pool': return submitPool(data);
                case 'quiz': return submitQuiz(data);
                case 'advice': return submitAdvice(data);
                default: return Promise.reject(new Error(`Unknown activity type: ${activityType}`));
            }
        }
    };

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

    console.log('API Client (api-supabase.js) loaded successfully');

})(typeof window !== 'undefined' ? window : this);
