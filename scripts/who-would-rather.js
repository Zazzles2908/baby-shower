/**
 * Baby Shower App - The Shoe Game
 * Traditional wedding shoe game adapted for baby shower!
 * Simple face-tapping game with configurable parent names
 */

(function() {
    'use strict';

    console.log('[ShoeGame] loading...');

    // Configuration - can be customized per event via window.ShoeGameConfig
    const CONFIG = window.ShoeGameConfig || {
        parentA: { name: 'Mom', avatar: '' },
        parentB: { name: 'Dad', avatar: '' },
        autoAdvanceDelay: 800
    };

    // Default avatar URLs (fallback if not configured)
    const DEFAULT_AVATARS = {
        parentA: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Michelle/chibi_michelle_excited_red.png',
        parentB: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/Jazeel/chibi_jazeel_eating.png'
    };

    const QUESTIONS = [
        "Who worries more?",
        "Who wants more kids?", 
        "Whose parents will feed you more?",
        "Who will be more nervous in labour?",
        "Who keeps track of appointments?",
        "Who is the better baby whisperer?",
        "Who will spoil the baby more?",
        "Who will be stricter with rules?",
        "Who will handle night feeds better?",
        "Who will cry more at baby's first day of school?",
        "Who is more likely to match outfits with baby?",
        "Who will take more photos of baby?",
        "Who will be more protective?",
        "Who will handle tantrums better?",
        "Who will read more bedtime stories?",
        "Who will be the fun parent?",
        "Who will be the disciplinarian?",
        "Who will handle diaper changes better?",
        "Who will plan more elaborate birthday parties?",
        "Who will be more emotional during milestones?"
    ];

    let state = {
        currentQuestion: 0,
        totalQuestions: QUESTIONS.length,
        votes: [],
        hasVoted: false
    };

    let container = null;

    function getAvatar(key) {
        const avatar = key === 'parentA' ? CONFIG.parentA.avatar : CONFIG.parentB.avatar;
        return avatar || (key === 'parentA' ? DEFAULT_AVATARS.parentA : DEFAULT_AVATARS.parentB);
    }

    function getName(key) {
        return key === 'parentA' ? CONFIG.parentA.name : CONFIG.parentB.name;
    }

    function init() {
        container = document.getElementById('who-would-rather-container');
        if (!container) {
            console.warn('[ShoeGame] Container #who-would-rather-container not found');
            return;
        }
        console.log('[ShoeGame] Initialized with parent names:', CONFIG.parentA.name, '&', CONFIG.parentB.name);
        render();
    }

    function render() {
        if (!container) return;
        renderQuestion();
    }

    function renderQuestion() {
        if (state.currentQuestion >= state.totalQuestions) {
            renderResults();
            return;
        }

        const question = QUESTIONS[state.currentQuestion];
        const progress = ((state.currentQuestion + 1) / state.totalQuestions) * 100;

        container.innerHTML = `
            <div class="shoe-game-question">
                <div class="game-header">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="question-counter">Question ${state.currentQuestion + 1} of ${state.totalQuestions}</div>
                </div>

                <div class="question-section">
                    <div class="question-label">Who would do this?</div>
                    <h2 class="question-text">${question}</h2>
                </div>

                <div class="shoe-game-avatars">
                    <button 
                        type="button"
                        id="btn-parentA"
                        class="shoe-avatar-btn shoe-avatar-left ${state.hasVoted ? 'disabled' : ''}"
                        ${state.hasVoted ? 'disabled' : ''}
                        onclick="window.ShoeGame.vote('parentA')"
                    >
                        <img src="${getAvatar('parentA')}" alt="${getName('parentA')}" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">${getName('parentA')}</span>
                    </button>

                    <div class="shoe-vs-badge">VS</div>

                    <button 
                        type="button"
                        id="btn-parentB"
                        class="shoe-avatar-btn shoe-avatar-right ${state.hasVoted ? 'disabled' : ''}"
                        ${state.hasVoted ? 'disabled' : ''}
                        onclick="window.ShoeGame.vote('parentB')"
                    >
                        <img src="${getAvatar('parentB')}" alt="${getName('parentB')}" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">${getName('parentB')}</span>
                    </button>
                </div>

                ${state.hasVoted ? `
                <div class="vote-recorded">
                    <p>Vote recorded!</p>
                </div>
                ` : ''}
            </div>
        `;
        
        if (state.hasVoted) {
            setTimeout(() => {
                state.currentQuestion++;
                state.hasVoted = false;
                render();
            }, CONFIG.autoAdvanceDelay);
        }
    }

    function renderResults() {
        const parentAVotes = state.votes.filter(v => v === 'parentA').length;
        const parentBVotes = state.votes.filter(v => v === 'parentB').length;
        const totalVotes = state.votes.length;
        
        const percentA = totalVotes > 0 ? Math.round((parentAVotes / totalVotes) * 100) : 0;
        const percentB = totalVotes > 0 ? Math.round((parentBVotes / totalVotes) * 100) : 0;
        
        let winner = null;
        if (percentA > percentB) winner = 'parentA';
        else if (percentB > percentA) winner = 'parentB';

        container.innerHTML = `
            <div class="shoe-game-results">
                <h2>🎉 Game Complete!</h2>
                
                <div class="results-summary">
                    <p>You answered ${totalVotes} questions about ${CONFIG.parentA.name} & ${CONFIG.parentB.name}!</p>
                </div>

                ${winner ? `
                <div class="winner-banner">
                    <div class="winner-avatar">
                        <img src="${getAvatar(winner)}" alt="${getName(winner)}" class="winner-img">
                    </div>
                    <div class="winner-text">
                        <div class="winner-label">Predicted Winner</div>
                        <div class="winner-name">${getName(winner)}</div>
                        <div class="winner-percent">${winner === 'parentA' ? percentA : percentB}%</div>
                    </div>
                </div>
                ` : `
                <div class="tie-result">
                    <h3>It's a Tie! 🤝</h3>
                    <p>The crowd couldn't decide!</p>
                </div>
                `}

                <div class="results-breakdown">
                    <div class="breakdown-item">
                        <div class="breakdown-name">${CONFIG.parentA.name}</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${percentA}%"></div>
                        </div>
                        <div class="breakdown-percent">${percentA}%</div>
                    </div>
                    <div class="breakdown-item">
                        <div class="breakdown-name">${CONFIG.parentB.name}</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${percentB}%"></div>
                        </div>
                        <div class="breakdown-percent">${percentB}%</div>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="shoe-btn" onclick="window.ShoeGame.restart()">Play Again</button>
                    <button class="shoe-btn secondary" onclick="window.ShoeGame.backToActivities()">Back to Activities</button>
                </div>
            </div>
        `;
    }

    function vote(choice) {
        if (state.hasVoted) return;
        
        console.log('[ShoeGame] Vote:', choice, `(${getName(choice)})`);
        
        state.votes.push(choice);
        state.hasVoted = true;
        
        const btnA = document.getElementById('btn-parentA');
        const btnB = document.getElementById('btn-parentB');
        
        if (btnA && btnB) {
            btnA.disabled = true;
            btnB.disabled = true;
            
            if (choice === 'parentA') {
                btnA.classList.add('voted');
                btnB.classList.add('disabled');
                addRippleEffect(btnA);
            } else {
                btnB.classList.add('voted');
                btnA.classList.add('disabled');
                addRippleEffect(btnB);
            }
        }
        
        render();
    }

    function addRippleEffect(button) {
        const ripple = document.createElement('span');
        ripple.className = 'vote-ripple';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    function restart() {
        state.currentQuestion = 0;
        state.votes = [];
        state.hasVoted = false;
        render();
    }

    function backToActivities() {
        if (window.Navigation && window.Navigation.showSection) {
            window.Navigation.showSection('welcome');
        } else {
            location.reload();
        }
    }

    function configure(config) {
        Object.assign(CONFIG, config);
        console.log('[ShoeGame] Config updated:', CONFIG.parentA.name, '&', CONFIG.parentB.name);
    }

    window.ShoeGame = {
        init: init,
        vote: vote,
        restart: restart,
        backToActivities: backToActivities,
        configure: configure
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[ShoeGame] loaded!');
})();
