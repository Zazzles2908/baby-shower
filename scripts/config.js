Y// Baby Shower App - Configuration

// Apps Script Web App URL
// TODO: Replace with your actual deployed Apps Script URL
const CONFIG = {
    // Google Apps Script Web App URL (from google_details.txt)
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwgczI-f3PlH_Mb-A6c2oAVSbg_nixUZpn49t3PqoCuo86j0jsUjM-GT6JbrQ-or6yV/exec',

    // Supabase Configuration (for real-time features)
    // Project: baby-shower-2026 (bkszmvfsfgvdwzacgmfz)
    SUPABASE: {
        ENABLED: true,  // Set to true to enable Supabase
        URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
        ANON_KEY: 'sb_publishable_4_-bf5hda3a5Bb9enUmA0Q_jrKJf1K_',
        PROJECT_REF: 'bkszmvfsfgvdwzacgmfz',
        REALTIME_ENABLED: true,  // Enable realtime subscriptions
        // Realtime channel for live updates
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

    // Feature flags
    FEATURES: {
        GUESTBOOK: true,
        POOL: true,
        QUIZ: true,
        ADVICE: true,
        VOTING: true
    },

    // Asset paths
    ASSETS: {
        ILLUSTRATIONS: 'assets/images/illustrations/',
        ICONS: 'assets/images/icons/',
        BACKGROUNDS: 'assets/images/backgrounds/'
    },

    // UI settings
    UI: {
        MAX_VOTES_PER_GUEST: 3,
        MAX_PHOTO_SIZE_MB: 5,
        ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp']
    }
};

// Milestone messages and icons
const MILESTONE_CONTENT = {
    GUESTBOOK_5: {
        title: "Baby's First 5 Wishes! 🎉",
        message: "You helped fill 5 wishes for baby! Here's a fun fact: Babies can recognize their mother's voice at birth!",
        icon: "👶"
    },
    GUESTBOOK_10: {
        title: "So Much Love! 💕",
        message: "10 messages collected! Baby is already so loved by everyone!",
        icon: "💖"
    },
    GUESTBOOK_20: {
        title: "Baby is So Loved! 🌟",
        message: "20 wishes and counting! This baby will have so much love and support!",
        icon: "✨"
    },
    POOL_10: {
        title: "10 Predictions! 🎯",
        message: "We have 10 predictions! Parent clue: Mom thinks baby will come early.",
        icon: "🎲"
    },
    POOL_20: {
        title: "Everyone's Guessing! 🎲",
        message: "20 predictions collected! Let's see who will be closest!",
        icon: "🏆"
    },
    QUIZ_25: {
        title: "Baby Genius Collective! 🧠",
        message: "Guests have solved 25 baby riddles! Baby will be so smart!",
        icon: "🌟"
    },
    QUIZ_50: {
        title: "Super Smart Guests! 🌟",
        message: "50 correct answers! You're all baby experts!",
        icon: "🏆"
    },
    ADVICE_10: {
        title: "Wisdom Unlocked! 💡",
        message: "10 pieces of advice collected! Parenting pro tip #1: Sleep when baby sleeps (if you can!).",
        icon: "💡"
    },
    ADVICE_20: {
        title: "So Much Wisdom! 📚",
        message: "20 pieces of advice collected! This baby will have the best guidance growing up!",
        icon: "📖"
    },
    VOTES_50: {
        title: "Community Loves Helping! ❤️",
        message: "50 total votes! Everyone is excited to help name baby!",
        icon: "💝"
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, MILESTONE_CONTENT };
}
