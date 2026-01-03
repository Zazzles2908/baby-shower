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
        // Anime Character System - "Digital Living Room" Hosts
        ANIME_CHARACTERS: {
            // Mom Character - Warm, welcoming mother figure
            mom: {
                id: 'mom',
                name: 'Michelle',
                role: 'hostess',
                personality: 'warm, nurturing, encouraging',
                avatarImage: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
                colors: {
                    primary: '#FF69B4', // Soft pink
                    secondary: '#FFB6C1', // Light pink
                    accent: '#FFD700', // Gold
                    skin: '#FFE4C4', // Bisque skin tone
                    eyes: '#6B5B95' // Soft purple
                },
                emotions: {
                    happy: '😊',
                    excited: '😆',
                    thinking: '🤔',
                    surprised: '😲',
                    proud: '😤',
                    celebrating: '🎉',
                    welcoming: '🤗',
                    loving: '🥰'
                },
                phrases: [
                    "Welcome, dear guest! 🌸",
                    "Oh my, what lovely energy! ✨",
                    "Let me help you get comfortable~",
                    "So excited to have you here!",
                    "Your kindness warms my heart! 💖"
                ]
            },
            // Dad Character - Playful, fun father figure
            dad: {
                id: 'dad',
                name: 'Jazeel',
                role: 'host',
                personality: 'playful, fun, enthusiastic',
                avatarImage: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Icon/asset_chibi_avatar_m.png',
                colors: {
                    primary: '#4169E1', // Royal blue
                    secondary: '#87CEEB', // Sky blue
                    accent: '#FFD700', // Gold
                    skin: '#F5DEB3', // Wheat skin tone
                    eyes: '#2F4F4F' // Dark slate gray
                },
                emotions: {
                    happy: '😄',
                    excited: '🤩',
                    thinking: '🧐',
                    surprised: '😳',
                    proud: '😎',
                    celebrating: '🎊',
                    welcoming: '🙌',
                    funny: '😂'
                },
                phrases: [
                    "Hey there, awesome guest! 🌟",
                    "Let the fun begin! 🎮",
                    "You're gonna love this!",
                    "Best day ever, right?!",
                    "High five for being here! ✋"
                ]
            },
            // Baby Character - Adorable, curious
            baby: {
                id: 'baby',
                name: 'Mochi Baby',
                role: 'mascot',
                personality: 'curious, adorable, innocent',
                colors: {
                    primary: '#FFB6C1', // Light pink
                    secondary: '#E6E6FA', // Lavender
                    accent: '#FFD700', // Gold
                    skin: '#FFF0F5', // Lavender blush
                    eyes: '#4169E1' // Blue
                },
                emotions: {
                    happy: '🥺',
                    excited: '🤩',
                    curious: '👀',
                    sleepy: '😴',
                    hungry: '🍼',
                    playful: '🎈',
                    loving: '🥰',
                    surprised: '😮'
                },
                phrases: [
                    "Mochi happy! 🍡",
                    "Sparkle sparkle~ ✨",
                    "Baby love you! 💕",
                    "So many exciting things!",
                    "Welcome to baby world! 🌟"
                ]
            },
            // Farm Animal Hosts - For the farm theme
            farm: {
                pig: {
                    id: 'pig',
                    name: 'Piggy-Chan',
                    colors: { primary: '#FFB6C1', accent: '#FF69B4' },
                    personality: 'cute, bubbly, loving',
                    emoji: '🐷'
                },
                sheep: {
                    id: 'sheep',
                    name: 'Mimi Sheep',
                    colors: { primary: '#F5F5F5', accent: '#E6E6FA' },
                    personality: 'gentle, soft, kind',
                    emoji: '🐑'
                },
                cow: {
                    id: 'cow',
                    name: 'Moo-Moo',
                    colors: { primary: '#FFFFFF', accent: '#000000' },
                    personality: 'calm, wise, nurturing',
                    emoji: '🐄'
                },
                chicken: {
                    id: 'chicken',
                    name: 'Chick-Chan',
                    colors: { primary: '#FFD700', accent: '#FFA500' },
                    personality: 'energetic, cheerful, helpful',
                    emoji: '🐔'
                }
            }
        },
        // Anime Icon Styles and Animations
        ANIME_ICONS: {
            // Chibi proportions (2.5 heads tall)
            chibi: {
                headScale: 1.0,
                bodyScale: 0.7,
                eyeSize: 'large',
                expression: 'exaggerated'
            },
            // Animation speeds
            animations: {
                idle: 3000, // ms
                happy: 500,
                excited: 300,
                thinking: 1500,
                surprised: 400,
                celebrate: 800
            },
            // Size variants
            sizes: {
                tiny: 24,
                small: 32,
                medium: 48,
                large: 64,
                xlarge: 96,
                hero: 128
            }
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
