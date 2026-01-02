// Baby Shower App - Configuration

console.log('CONFIG.js loading...');
const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    SUPABASE: {
        ENABLED: true,
        URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI',
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

console.log("CONFIG ready!", CONFIG.BABY_NAMES.length, "names loaded");
