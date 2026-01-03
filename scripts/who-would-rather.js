/**
 * Baby Shower App - Who Would Rather Game (SIMPLE VERSION)
 * Question in middle, Michelle on left, Jazeel on right
 * Tap PNG avatar to vote
 */

(function() {
    'use strict';

    console.log('[WhoWouldRatherSimple] loading...');

    // Avatar URLs from Supabase Storage
    const AVATAR_URLS = {
        mom: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
        dad: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Icon/asset_chibi_avatar_m.png'
    };

    // Questions about Michelle vs Jazeel
    const QUESTIONS = [
        "Who would rather wake up at 3 AM for a feeding?",
        "Who would rather change the first dirty diaper?",
        "Who would rather handle a crying baby in public?",
        "Who would rather give baby a bath?",
        "Who would rather cook dinner while holding baby?",
        "Who would rather do the 2 AM diaper explosion?",
        "Who would rather read bedtime stories every night?",
        "Who would rather plan baby's first birthday party?",
        "Who would rather take baby to doctor appointments?",
        "Who would rather do baby's laundry (explosions included)?",
        "Who would rather handle baby's first fever?",
        "Who would rather pack the diaper bag for outings?",
        "Who would rather deal with baby's first temper tantrum?",
        "Who would rather do baby's first food feeding?",
        "Who would rather manage baby's sleep training?"
    ];

    let currentQuestionIndex = 0;
    let userName = '';

    /**
     * Get guest name
     */
    function getGuestName() {
        const name = localStorage.getItem('babyShowerGuestName');
        if (name) {
            userName = name;
            return name;
        }
        
        // Fallback to prompt
        const nameInput = prompt("What's your name?");
        if (nameInput && nameInput.trim()) {
            userName = nameInput.trim();
            localStorage.setItem('babyShowerGuestName', userName);
        }
        return userName;
    }

    /**
     * Create simple voting screen HTML
     */
    function createVotingScreen() {
        const question = QUESTIONS[currentQuestionIndex];
        
        return `
            <div id="wwr-simple-voting" class="wwr-simple-container fade-in">
                <!-- Progress -->
                <div class="wwr-simple-progress">
                    Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}
                </div>

                <!-- Question -->
                <div class="wwr-simple-question fade-in-up">
                    <h2>${question}</h2>
                </div>

                <!-- Avatars - Left/Right Selection -->
                <div class="wwr-simple-avatars">
                    <!-- Michelle (Left) -->
                    <button 
                        type="button"
                        id="btn-wwr-mom"
                        class="wwr-avatar-btn wwr-avatar-btn-left"
                        onclick="window.WhoWouldRatherSimple.vote('mom')"
                    >
                        <img src="${AVATAR_URLS.mom}" alt="Michelle" class="wwr-avatar-img">
                        <span class="wwr-avatar-name">Michelle</span>
                    </button>

                    <!-- VS Badge -->
                    <div class="wwr-vs-badge">VS</div>

                    <!-- Jazeel (Right) -->
                    <button 
                        type="button"
                        id="btn-wwr-dad"
                        class="wwr-avatar-btn wwr-avatar-btn-right"
                        onclick="window.WhoWouldRatherSimple.vote('dad')"
                    >
                        <img src="${AVATAR_URLS.dad}" alt="Jazeel" class="wwr-avatar-img">
                        <span class="wwr-avatar-name">Jazeel</span>
                    </button>
                </div>

                <!-- Feedback Message -->
                <div id="wwr-feedback" class="wwr-feedback hidden"></div>

                <!-- Navigation -->
                <div class="wwr-simple-nav">
                    <button 
                        type="button"
                        id="btn-wwr-previous"
                        class="btn btn-nav"
                        ${currentQuestionIndex === 0 ? 'disabled' : ''}
                        onclick="window.WhoWouldRatherSimple.previousQuestion()"
                    >
                        ← Previous
                    </button>
                    <button 
                        type="button"
                        id="btn-wwr-next"
                        class="btn btn-nav"
                        onclick="window.WhoWouldRatherSimple.nextQuestion()"
                    >
                        Next →
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle vote
     */
    function vote(choice) {
        console.log('[WhoWouldRatherSimple] Vote:', choice);
        
        // Add feedback
        const feedback = document.getElementById('wwr-feedback');
        const choiceName = choice === 'mom' ? 'Michelle' : 'Jazeel';
        
        feedback.textContent = `You voted for ${choiceName}! 🎉`;
        feedback.classList.remove('hidden');
        feedback.classList.add('fade-in-up');
        
        // Disable buttons temporarily
        const btnMom = document.getElementById('btn-wwr-mom');
        const btnDad = document.getElementById('btn-wwr-dad');
        
        btnMom.disabled = true;
        btnDad.disabled = true;

        // Re-enable after delay
        setTimeout(() => {
            btnMom.disabled = false;
            btnDad.disabled = false;
        }, 1000);
    }

    /**
     * Previous question
     */
    function previousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderScreen();
        }
    }

    /**
     * Next question
     */
    function nextQuestion() {
        if (currentQuestionIndex < QUESTIONS.length - 1) {
            currentQuestionIndex++;
            renderScreen();
        } else {
            // Game complete
            showCompletion();
        }
    }

    /**
     * Render current screen
     */
    function renderScreen() {
        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createVotingScreen();
    }

    /**
     * Show completion screen
     */
    function showCompletion() {
        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = `
            <div class="wwr-simple-complete fade-in-up">
                <div class="wwr-complete-icon">🎉</div>
                <h2>All Done!</h2>
                <p>Thanks for playing, ${userName}!</p>
                <button 
                    type="button"
                    class="btn btn-primary"
                    onclick="window.WhoWouldRatherSimple.restart()"
                >
                    Play Again
                </button>
            </div>
        `;
    }

    /**
     * Restart game
     */
    function restart() {
        currentQuestionIndex = 0;
        renderScreen();
    }

    // Public API
    window.WhoWouldRatherSimple = {
        init: function() {
            console.log('[WhoWouldRatherSimple] initializing...');
            getGuestName();
            renderScreen();
            console.log('[WhoWouldRatherSimple] initialized');
        },
        vote: vote,
        previousQuestion: previousQuestion,
        nextQuestion: nextQuestion,
        restart: restart
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.WhoWouldRatherSimple.init());
    } else {
        window.WhoWouldRatherSimple.init();
    }

    console.log('[WhoWouldRatherSimple] loaded!');
})();
