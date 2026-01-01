// Baby Shower App - Configuration

const CONFIG = {
    // API Base URL (Vercel deployment)
    // In development: use '/api' for relative paths
    // In production: 'https://baby-shower-qr-app.vercel.app/api'
    API_BASE_URL: window.location.origin + '/api',

    // Supabase Configuration (for real-time features only)
    // Project: baby-shower-2026 (bkszmvfsfgvdwzacgmfz)
    SUPABASE: {
        ENABLED: true,
        URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
        ANON_KEY: 'sb_publishable_4_-bf5hda3a5Bb9enUmA0Q_jrKJf1K_',
        PROJECT_REF: 'bkszmvfsfgvdwzacgmfz',
        REALTIME_ENABLED: true,
        CHANNEL: 'baby-shower-updates'
    },

    // Milestone thresholds
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

    // Baby names for voting
    BABY_NAMES: [
        'Emma',
        'Olivia',
        'Sophia',
        'Charlotte',
        'Amelia',
        'Ava',
        'Mia',
        'Isabella',
        'Lily',
        'Harper'
    ],

    // Quiz correct answers
    QUIZ_ANSWERS: {
        puzzle1: 'Baby Shower',
        puzzle2: 'Three Little Pigs',
        puzzle3: 'Rock a Bye Baby',
        puzzle4: 'Baby Bottle',
        puzzle5: 'Diaper Change'
    },

    // Supabase Storage configuration
    STORAGE: {
        BUCKET: 'guestbook-photos',
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
    }
};
