/**
 * Baby Shower App - The Shoe Game
 * Traditional wedding shoe game adapted for baby shower!
 * Simple face-tapping game - no lobby, no auto-advance
 */

(function() {
    'use strict';

    console.log('[ShoeGame] loading...');

    const AVATAR_URLS = {
        michelle: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
        jazeel: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/Jazeel_Icon/asset_chibi_avatar_m.png'
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

    function init() {
        container = document.getElementById('who-would-rather-game');
        if (!container) {
            console.warn('[ShoeGame] Container not found');
            return;
        }
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
        const progress = ((state.currentQuestion) / state.totalQuestions) * 100;

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
                        id="btn-michelle"
                        class="shoe-avatar-btn shoe-avatar-left ${state.hasVoted ? 'disabled' : ''}"
                        ${state.hasVoted ? 'disabled' : ''}
                        onclick="window.ShoeGame.vote('michelle')"
                    >
                        <img src="${AVATAR_URLS.michelle}" alt="Michelle" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Michelle</span>
                    </button>

                    <div class="shoe-vs-badge">VS</div>

                    <button 
                        type="button"
                        id="btn-jazeel"
                        class="shoe-avatar-btn shoe-avatar-right ${state.hasVoted ? 'disabled' : ''}"
                        ${state.hasVoted ? 'disabled' : ''}
                        onclick="window.ShoeGame.vote('jazeel')"
                    >
                        <img src="${AVATAR_URLS.jazeel}" alt="Jazeel" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Jazeel</span>
                    </button>
                </div>

                ${state.hasVoted ? `
                <div class="vote-recorded">
                    <p>Vote recorded!</p>
                </div>
                ` : ''}
            </div>
        `;
        
        // Auto-advance to next question after short delay
        if (state.hasVoted) {
            setTimeout(() => {
                state.currentQuestion++;
                state.hasVoted = false;
                render();
            }, 800);
        }
    }

    function renderResults() {
        const michelleVotes = state.votes.filter(v => v === 'michelle').length;
        const jazeelVotes = state.votes.filter(v => v === 'jazeel').length;
        const totalVotes = state.votes.length;
        
        const michellePercent = totalVotes > 0 ? Math.round((michelleVotes / totalVotes) * 100) : 0;
        const jazeelPercent = totalVotes > 0 ? Math.round((jazeelVotes / totalVotes) * 100) : 0;
        
        let winner = 'Tie';
        if (michellePercent > jazeelPercent) winner = 'Michelle';
        else if (jazeelPercent > michellePercent) winner = 'Jazeel';

        container.innerHTML = `
            <div class="shoe-game-results">
                <h2>🎉 Game Complete!</h2>
                
                <div class="results-summary">
                    <p>You answered ${totalVotes} questions about Michelle & Jazeel!</p>
                </div>

                ${winner !== 'Tie' ? `
                <div class="winner-banner">
                    <div class="winner-avatar">
                        <img src="${winner === 'Michelle' ? AVATAR_URLS.michelle : AVATAR_URLS.jazeel}" alt="${winner}" class="winner-img">
                    </div>
                    <div class="winner-text">
                        <div class="winner-label">Predicted Winner</div>
                        <div class="winner-name">${winner}</div>
                        <div class="winner-percent">${Math.max(michellePercent, jazeelPercent)}%</div>
                    </div>
                </div>
                ` : `
                <div class="tie-result">
                    <h3>It's a Tie! 🤝</h3>
                    <p>The crowd couldn't decide!</p>
                </div>
                `}

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

                <div class="results-actions">
                    <button class="shoe-btn" onclick="window.ShoeGame.restart()">Play Again</button>
                    <button class="shoe-btn secondary" onclick="window.ShoeGame.backToActivities()">Back to Activities</button>
                </div>
            </div>
        `;
    }

    function vote(choice) {
        if (state.hasVoted) return;
        
        console.log('[ShoeGame] Vote:', choice);
        
        state.votes.push(choice);
        state.hasVoted = true;
        
        const btnMichelle = document.getElementById('btn-michelle');
        const btnJazeel = document.getElementById('btn-jazeel');
        
        if (btnMichelle && btnJazeel) {
            btnMichelle.disabled = true;
            btnJazeel.disabled = true;
            
            if (choice === 'michelle') {
                btnMichelle.classList.add('voted');
                btnJazeel.classList.add('disabled');
                addRippleEffect(btnMichelle);
            } else {
                btnJazeel.classList.add('voted');
                btnMichelle.classList.add('disabled');
                addRippleEffect(btnJazeel);
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

    function nextQuestion() {
        state.currentQuestion++;
        state.hasVoted = false;
        render();
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

    window.ShoeGame = {
        init: init,
        vote: vote,
        nextQuestion: nextQuestion,
        restart: restart,
        backToActivities: backToActivities
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[ShoeGame] loaded!');
})();
