/**
 * Baby Shower App - Supabase Edge Functions API Client
 * Production-ready integration with comprehensive error handling
 * 
 * This script works as a regular JavaScript file (not ES6 module)
 * All functions are attached to window.API for global access
 */

(function() {
    'use strict';

    // Configuration from config.js
    const SUPABASE_URL = window.CONFIG?.SUPABASE?.URL || '';
    const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE?.ANON_KEY || '';
    
    // Timeout settings
    const API_TIMEOUT = 30000; // 30 seconds

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
        const url = `${SUPABASE_URL}/functions/v1/guestbook`;
        
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
        const url = `${SUPABASE_URL}/functions/vote`;
        
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
        const url = `${SUPABASE_URL}/functions/pool`;
        
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name?.trim() || '',
                prediction: data.prediction?.trim() || '',
                dueDate: data.dueDate || '',
            }),
        });
    }

    /**
     * Submit quiz answers
     */
    async function submitQuiz(data) {
        const url = `${SUPABASE_URL}/functions/quiz`;
        
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                answers: data.answers || {},
                score: Number(data.score) || 0,
                totalQuestions: Number(data.totalQuestions) || 0,
            }),
        });
    }

    /**
     * Submit parenting advice
     */
    async function submitAdvice(data) {
        const url = `${SUPABASE_URL}/functions/advice`;
        
        return apiFetch(url, {
            method: 'POST',
            body: JSON.stringify({
                advice: data.advice?.trim() || '',
                category: data.category?.trim() || 'general',
            }),
        });
    }

    /**
     * Get current vote counts
     */
    async function getVoteCounts() {
        const url = `${SUPABASE_URL}/functions/v1/vote`;
        
        return apiFetch(url, {
            method: 'GET',
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
            provider: 'supabase',
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

    // Attach all functions to window.API for global access
    window.API = {
        submitGuestbook,
        submitVote,
        submitPool,
        submitQuiz,
        submitAdvice,
        getVoteCounts,
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

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAPI);
    } else {
        initializeAPI();
    }

    console.log('API Client loaded successfully');
})();
