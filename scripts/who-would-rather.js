/**
 * Baby Shower App - The Shoe Game
 * Traditional wedding shoe game adapted for baby shower!
 * Guests predict: "Who would do this?" - Michelle or Jazeel?
 * Tap the avatar you think is correct, then auto-advance to next question
 */

(function() {
    'use strict';

    console.log('[ShoeGame] loading...');

    // Avatar URLs from Supabase Storage
    const AVATAR_URLS = {
        michelle: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
        jazeel: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Icon/asset_chibi_avatar_m.png'
    };

    // Questions in Shoe Game format - "Who is more likely to...?"
    const QUESTIONS = [
        "Who wakes up first when baby cries at night?",
        "Who changes the most diapers?",
        "Who handles baby vomit like a pro?",
        "Who sings the best lullabies?",
        "Who reads the most books to baby?",
        "Who loses their temper first?",
        "Who is better at packing the diaper bag?",
        "Who handles doctor visits better?",
        "Who does most of the baby bath time?",
        "Who cooks dinner while holding baby?",
        "Who does the 2 AM feeding without complaining?",
        "Who handles baby laundry (even with explosions)?",
        "Who plans the best birthday parties?",
        "Who is more emotional about baby's milestones?",
        "Who takes better baby photos?",
        "Who is better at calming a fussy baby?",
        "Who does more research on parenting?",
        "Who is more likely to cry at baby's first steps?",
        "Who handles teething episodes better?",
        "Who is the better baby whisperer?"
    ];

    let currentQuestionIndex = 0;
    let userName = '';
    let votes = []; // Store all votes

    /**
     * Get guest name
     */
    function getGuestName() {
        const name = localStorage.getItem('babyShowerGuestName');
        if (name) {
            userName = name;
            return name;
        }
        
        const nameInput = prompt("What's your name?");
        if (nameInput && nameInput.trim()) {
            userName = nameInput.trim();
            localStorage.setItem('babyShowerGuestName', userName);
        }
        return userName;
    }

    /**
     * Create main game screen HTML
     */
    function createGameScreen() {
        const question = QUESTIONS[currentQuestionIndex];
        
        return `
            <div id="shoe-game-container" class="shoe-game-container fade-in">
                <!-- Progress -->
                <div class="shoe-game-progress">
                    <div class="progress-text">${currentQuestionIndex + 1} / ${QUESTIONS.length}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%"></div>
                    </div>
                </div>

                <!-- Question -->
                <div class="shoe-game-question fade-in-up">
                    <div class="question-label">Who would do this?</div>
                    <h2 class="question-text">${question}</h2>
                </div>

                <!-- Avatars - Tap to Vote -->
                <div class="shoe-game-avatars">
                    <!-- Michelle (Left) -->
                    <button 
                        type="button"
                        id="btn-michelle"
                        class="shoe-avatar-btn shoe-avatar-left"
                        onclick="window.ShoeGame.vote('michelle')"
                    >
                        <img src="${AVATAR_URLS.michelle}" alt="Michelle" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Michelle</span>
                        <span class="shoe-tap-hint">Tap if you!</span>
                    </button>

                    <!-- VS Badge -->
                    <div class="shoe-vs-badge">?</div>

                    <!-- Jazeel (Right) -->
                    <button 
                        type="button"
                        id="btn-jazeel"
                        class="shoe-avatar-btn shoe-avatar-right"
                        onclick="window.ShoeGame.vote('jazeel')"
                    >
                        <img src="${AVATAR_URLS.jazeel}" alt="Jazeel" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Jazeel</span>
                        <span class="shoe-tap-hint">Tap if you!</span>
                    </button>
                </div>

                <!-- Vote Feedback (shows briefly after voting) -->
                <div id="shoe-feedback" class="shoe-feedback hidden">
                    <span class="feedback-icon">✓</span>
                    <span class="feedback-text">Recorded!</span>
                </div>
            </div>
        `;
    }

    /**
     * Create results screen HTML
     */
    function createResultsScreen() {
        const michelleVotes = votes.filter(v => v === 'michelle').length;
        const jazeelVotes = votes.filter(v => 'jazeel').length;
        const total = votes.length;
        const michellePercent = total > 0 ? Math.round((michelleVotes / total) * 100) : 0;
        const jazeelPercent = total > 0 ? Math.round((jazeelVotes / total) * 100) : 0;

        // Determine majority
        let winner = '';
        if (michellePercent > jazeelPercent) {
            winner = 'Michelle';
        } else if (jazeelPercent > michellePercent) {
            winner = 'Jazeel';
        } else {
            winner = 'Tie';
        }

        return `
            <div id="shoe-results" class="shoe-results fade-in-up">
                <div class="results-header">
                    <div class="results-icon">🎉</div>
                    <h2>All Done!</h2>
                    <p class="results-subtitle">Thanks for playing, ${userName}!</p>
                </div>

                <!-- Winner Banner -->
                <div class="winner-banner ${winner.toLowerCase()}">
                    <div class="winner-avatar">
                        <img src="${winner === 'Michelle' ? AVATAR_URLS.michelle : AVATAR_URLS.jazeel}" alt="${winner}" class="winner-img">
                    </div>
                    <div class="winner-text">
                        <div class="winner-label">Predicted Winner</div>
                        <div class="winner-name">${winner}</div>
                        <div class="winner-percent">${Math.max(michellePercent, jazeelPercent)}%</div>
                    </div>
                </div>

                <!-- Results Breakdown -->
                <div class="results-breakdown">
                    <div class="breakdown-item michelle">
                        <div class="breakdown-name">Michelle</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${michellePercent}%"></div>
                        </div>
                        <div class="breakdown-percent">${michellePercent}%</div>
                    </div>
                    <div class="breakdown-item jazeel">
                        <div class="breakdown-name">Jazeel</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${jazeelPercent}%"></div>
                        </div>
                        <div class="breakdown-percent">${jazeelPercent}%</div>
                    </div>
                </div>

                <!-- Play Again Button -->
                <button 
                    type="button"
                    class="shoe-btn shoe-btn-primary"
                    onclick="window.ShoeGame.restart()"
                >
                    Play Again ↺
                </button>

                <!-- Back to Activities -->
                <button 
                    type="button"
                    class="shoe-btn shoe-btn-secondary"
                    onclick="window.location.reload()"
                >
                    Back to Activities
                </button>
            </div>
        `;
    }

    /**
     * Handle vote - auto advance to next question
     */
    function vote(choice) {
        console.log('[ShoeGame] Vote:', choice);
        
        // Store vote
        votes.push(choice);
        
        // Visual feedback
        const btnMichelle = document.getElementById('btn-michelle');
        const btnJazeel = document.getElementById('btn-jazeel');
        const feedback = document.getElementById('shoe-feedback');
        
        // Highlight selected button
        if (choice === 'michelle') {
            btnMichelle.classList.add('voted');
            btnJazeel.classList.add('disabled');
        } else {
            btnJazeel.classList.add('voted');
            btnMichelle.classList.add('disabled');
        }
        
        // Show feedback
        feedback.classList.remove('hidden');
        
        // Auto-advance after short delay
        setTimeout(() => {
            if (currentQuestionIndex < QUESTIONS.length - 1) {
                // Next question
                currentQuestionIndex++;
                renderScreen();
            } else {
                // Show results
                showResults();
            }
        }, 600); // Short delay for better UX
    }

    /**
     * Show results screen
     */
    function showResults() {
        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createResultsScreen();
    }

    /**
     * Render current screen
     */
    function renderScreen() {
        const container = document.getElementById('who-would-rather-container');
        if (!container) return;

        container.innerHTML = createGameScreen();
    }

    /**
     * Restart game
     */
    function restart() {
        currentQuestionIndex = 0;
        votes = [];
        renderScreen();
    }

    // Public API
    window.ShoeGame = {
        init: function() {
            console.log('[ShoeGame] initializing...');
            getGuestName();
            renderScreen();
            console.log('[ShoeGame] initialized');
        },
        vote: vote,
        restart: restart
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ShoeGame.init());
    } else {
        window.ShoeGame.init();
    }

    console.log('[ShoeGame] loaded!');
})();
