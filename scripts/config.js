// Baby Shower App - Configuration

// Environment variable detection with fallback to .env.local values
// Supports Vite (import.meta.env) and script tag loading patterns
(function() {
    'use strict';

    console.log('CONFIG.js loading...');

    // Get environment variables - use window.ENV for script loading
    // Note: import.meta.env only works in ES modules, not regular scripts
    const ENV_SUPABASE_URL = window.ENV?.VITE_SUPABASE_URL ||
                              window.ENV?.NEXT_PUBLIC_SUPABASE_URL ||
                              '';

    const ENV_SUPABASE_ANON_KEY = window.ENV?.VITE_SUPABASE_ANON_KEY ||
                                    window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                                    '';

    // Validate environment variables - no hardcoded fallbacks for security
    if (!ENV_SUPABASE_URL || !ENV_SUPABASE_ANON_KEY) {
        console.error('CRITICAL: Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
        // Set empty values to prevent runtime errors
        window.ENV_CONFIG_ERROR = 'Missing required environment variables';
    }

    const SUPABASE_URL = ENV_SUPABASE_URL;
    const SUPABASE_ANON_KEY = ENV_SUPABASE_ANON_KEY;

    /**
     * Security validation function
     * @returns {Object} Validation results
     */
    function validateSecurityConfig() {
        const errors = [];
        const warnings = [];

        // Check for required environment variables
        if (!SUPABASE_URL) {
            errors.push('SUPABASE_URL is required');
        }
        if (!SUPABASE_ANON_KEY) {
            errors.push('SUPABASE_ANON_KEY is required');
        }

        // Security checks
        if (SUPABASE_URL && SUPABASE_URL.includes('localhost')) {
            warnings.push('Using localhost Supabase URL - ensure this is intentional');
        }

        // Check for potential hardcoded secrets (basic patterns)
        const suspiciousPatterns = [
            /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/, // JWT tokens
            /sk_[a-zA-Z0-9]{24,}/, // Stripe-like keys
            /pk_[a-zA-Z0-9]{24,}/, // Public keys
        ];

        suspiciousPatterns.forEach(pattern => {
            if (pattern.test(SUPABASE_ANON_KEY || '')) {
                // This is expected for JWT tokens, but log for awareness
                console.log('Security: JWT token detected in configuration');
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            timestamp: new Date().toISOString()
        };
    }

    const CONFIG = {
        API_BASE_URL: window.location.origin + '/api',
        SUPABASE: {
            ENABLED: true,
            URL: SUPABASE_URL,
            ANON_KEY: SUPABASE_ANON_KEY,
            PROJECT_REF: 'bkszmvfsfgvdwzacgmfz',
            REALTIME_ENABLED: true,
            CHANNEL: 'baby-shower-updates'
        },
        UI: {
            MAX_VOTES_PER_GUEST: 3,
            MAX_FILE_SIZE: 5 * 1024 * 1024,
            ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
            SHOW_MILESTONES: true,
            ENABLE_CONFETTI: true
        },
        MILESTONES: {
            GUESTBOOK_5: 5,
            GUESTBOOK_10: 10,
            GUESTBOOK_20: 20,
            POOL_10: 10,
            POOL_20: 20,
            QUIZ_25: 25,
            QUIZ_50: 50,
            ADVICE_10: 10,
            ADVICE_20: 20,
            VOTES_50: 50
        },
        BABY_NAMES: [
            'Emma', 'Olivia', 'Sophia', 'Charlotte', 'Amelia',
            'Ava', 'Mia', 'Isabella', 'Lily', 'Harper'
        ],
        QUIZ_ANSWERS: {
            puzzle1: 'Baby Shower',
            puzzle2: 'Three Little Pigs',
            puzzle3: 'Rock a Bye Baby',
            puzzle4: 'Baby Bottle',
            puzzle5: 'Diaper Change'
        },
        STORAGE: {
            BUCKET: 'guestbook-photos',
            MAX_FILE_SIZE: 5 * 1024 * 1024,
            ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif']
        },
        DEBUG: false
    };

    // Make CONFIG globally accessible
    window.CONFIG = CONFIG;

    // Add security validation function
    window.CONFIG.validateSecurity = validateSecurityConfig;

    // Run security validation
    const securityCheck = validateSecurityConfig();
    if (!securityCheck.isValid) {
        console.error('Security validation failed:', securityCheck.errors);
        window.ENV_CONFIG_ERROR = securityCheck.errors.join(', ');
    } else {
        console.log('Security validation passed');
        if (securityCheck.warnings.length > 0) {
            console.warn('Security warnings:', securityCheck.warnings);
        }
    }

    console.log("CONFIG ready!", CONFIG.BABY_NAMES.length, "names loaded");
})();
