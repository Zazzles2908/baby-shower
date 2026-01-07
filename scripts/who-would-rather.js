/**
 * Baby Shower App - The Shoe Game (Who Would Rather)
 * Traditional wedding shoe game adapted for baby shower!
 * Guests predict: "Who would do this?" - Michelle or Jazeel?
 * Tap the avatar you think is correct, then auto-advance to next question
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
        view: 'start',
        sessionCode: null,
        sessionId: null,
        currentQuestion: 0,
        totalQuestions: QUESTIONS.length,
        votes: [],
        userName: '',
        currentQuestionData: null
    };

    let container = null;

    function init() {
        container = document.getElementById('who-would-rather-game');
        if (!container) {
            console.warn('[ShoeGame] Container not found');
            return;
        }
        
        const savedName = localStorage.getItem('shoe_game_name');
        if (savedName) {
            state.userName = savedName;
            createOrJoinSession();
        } else {
            showStartScreen();
        }
    }

    function showStartScreen() {
        state.view = 'start';
        render();
    }

    async function createOrJoinSession() {
        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather/create-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                },
                body: JSON.stringify({
                    guest_name: state.userName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const data = await response.json();
            if (data.success) {
                state.sessionCode = data.data.session_code;
                state.sessionId = data.data.session_id;
                state.currentQuestion = data.data.current_question;
                state.totalQuestions = data.data.total_questions;
                
                console.log('[ShoeGame] Session created:', state.sessionCode);
                await loadCurrentQuestion();
            } else {
                throw new Error(data.error || 'Failed to create session');
            }
        } catch (error) {
            console.error('[ShoeGame] Session creation error:', error);
            showError('Failed to start game. Please refresh and try again.');
        }
    }

    async function loadCurrentQuestion() {
        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather/current-question?session_code=${state.sessionCode}&guest_name=${state.userName}`, {
                method: 'GET',
                headers: {
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load question');
            }

            const data = await response.json();
            if (data.success) {
                state.currentQuestionData = data.data;
                state.view = 'playing';
                render();
            } else {
                throw new Error(data.error || 'Failed to load question');
            }
        } catch (error) {
            console.error('[ShoeGame] Question loading error:', error);
            showError('Failed to load question. Please refresh and try again.');
        }
    }

    function render() {
        if (!container) return;

        switch (state.view) {
            case 'start':
                renderStartScreen();
                break;
            case 'playing':
                renderQuestionScreen();
                break;
            case 'results':
                renderResultsScreen();
                break;
            case 'error':
                renderErrorScreen();
                break;
        }
    }

    function renderStartScreen() {
        container.innerHTML = `
            <div class="shoe-game-start">
                <h2>🤔 Who Would Rather?</h2>
                <p>Answer fun questions about the parents-to-be!</p>
                <div class="start-form">
                    <input type="text" id="guest-name-input" placeholder="Enter your name" maxlength="50">
                    <button class="shoe-btn" onclick="window.ShoeGame.startGame()">Start Game</button>
                </div>
                <div class="game-instructions">
                    <p>Tap Michelle or Jazeel's avatar to vote on who would do each thing!</p>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const input = document.getElementById('guest-name-input');
            if (input) input.focus();
        }, 100);
    }

    function renderQuestionScreen() {
        if (!state.currentQuestionData) {
            showError('No question data available');
            return;
        }

        const question = state.currentQuestionData;
        const progress = ((question.question_number - 1) / state.totalQuestions) * 100;

        container.innerHTML = `
            <div class="shoe-game-question">
                <div class="game-header">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="question-counter">Question ${question.question_number} of ${state.totalQuestions}</div>
                </div>

                <div class="question-section">
                    <div class="question-label">Who would do this?</div>
                    <h2 class="question-text">${question.question_text}</h2>
                </div>

                <div class="shoe-game-avatars">
                    <button 
                        type="button"
                        id="btn-michelle"
                        class="shoe-avatar-btn shoe-avatar-left"
                        onclick="window.ShoeGame.vote('michelle')"
                    >
                        <img src="${AVATAR_URLS.michelle}" alt="Michelle" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Michelle</span>
                        <span class="shoe-tap-hint">Tap to vote!</span>
                    </button>

                    <div class="shoe-vs-badge">VS</div>

                    <button 
                        type="button"
                        id="btn-jazeel"
                        class="shoe-avatar-btn shoe-avatar-right"
                        onclick="window.ShoeGame.vote('jazeel')"
                    >
                        <img src="${AVATAR_URLS.jazeel}" alt="Jazeel" class="shoe-avatar-img">
                        <span class="shoe-avatar-name">Jazeel</span>
                        <span class="shoe-tap-hint">Tap to vote!</span>
                    </button>
                </div>

                <div id="shoe-feedback" class="shoe-feedback hidden">
                    <div class="feedback-text">Vote recorded!</div>
                    <div class="feedback-subtitle">Moving to next question...</div>
                </div>

                <div class="session-info">
                    <span>Session: ${state.sessionCode}</span>
                    <span>Player: ${state.userName}</span>
                </div>
            </div>
        `;
    }

    function renderResultsScreen(apiResults = null) {
        const michelleVotes = state.votes.filter(v => v.choice === 'michelle').length;
        const jazeelVotes = state.votes.filter(v => v.choice === 'jazeel').length;
        const totalVotes = state.votes.length;
        
        let michellePercent = 0;
        let jazeelPercent = 0;
        let winner = 'Tie';
        
        if (totalVotes > 0) {
            michellePercent = Math.round((michelleVotes / totalVotes) * 100);
            jazeelPercent = Math.round((jazeelVotes / totalVotes) * 100);
            
            if (michellePercent > jazeelPercent) {
                winner = 'Michelle';
            } else if (jazeelPercent > michellePercent) {
                winner = 'Jazeel';
            }
        }

        if (apiResults && apiResults.results) {
            const results = apiResults.results;
            michellePercent = Math.round(results.mom_percentage || 0);
            jazeelPercent = Math.round(results.dad_percentage || 0);
            winner = results.winning_choice === 'mom' ? 'Michelle' : 
                    results.winning_choice === 'dad' ? 'Jazeel' : 'Tie';
        }

        container.innerHTML = `
            <div class="shoe-game-results">
                <h2>🎉 Game Complete!</h2>
                
                <div class="results-summary">
                    <p>Thanks for playing, ${state.userName}!</p>
                    <p>You answered ${state.votes.length} questions about Michelle & Jazeel.</p>
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
                    <p>The crowd couldn't decide between Michelle and Jazeel!</p>
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

    function renderErrorScreen() {
        container.innerHTML = `
            <div class="shoe-game-error">
                <h2>😅 Oops!</h2>
                <p>Something went wrong with the game.</p>
                <p>Please refresh the page and try again.</p>
                <button class="shoe-btn" onclick="location.reload()">Refresh Page</button>
            </div>
        `;
    }

    function showError(message) {
        state.view = 'error';
        container.innerHTML = `
            <div class="shoe-game-error">
                <h2>😅 Oops!</h2>
                <p>${message}</p>
                <button class="shoe-btn" onclick="window.ShoeGame.backToActivities()">Back to Activities</button>
            </div>
        `;
    }

    function startGame() {
        const nameInput = document.getElementById('guest-name-input');
        if (!nameInput) return;
        
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter your name!');
            return;
        }
        
        if (name.length > 50) {
            alert('Name is too long! Please use 50 characters or less.');
            return;
        }
        
        state.userName = name;
        localStorage.setItem('shoe_game_name', name);
        
        createOrJoinSession();
    }

    async function vote(choice) {
        console.log('[ShoeGame] Vote:', choice);
        
        const btnMichelle = document.getElementById('btn-michelle');
        const btnJazeel = document.getElementById('btn-jazeel');
        const feedback = document.getElementById('shoe-feedback');
        
        if (!btnMichelle || !btnJazeel || !feedback) return;
        
        btnMichelle.disabled = true;
        btnJazeel.disabled = true;
        
        if (choice === 'michelle') {
            btnMichelle.classList.add('voted');
            btnJazeel.classList.add('disabled');
        } else {
            btnJazeel.classList.add('voted');
            btnMichelle.classList.add('disabled');
        }
        
        feedback.classList.remove('hidden');
        
        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                },
                body: JSON.stringify({
                    session_code: state.sessionCode,
                    guest_name: state.userName,
                    question_number: state.currentQuestionData.question_number,
                    vote_choice: choice === 'michelle' ? 'mom' : 'dad'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit vote');
            }

            const data = await response.json();
            if (data.success) {
                state.votes.push({
                    question_number: state.currentQuestionData.question_number,
                    choice: choice,
                    question_text: state.currentQuestionData.question_text
                });
                
                setTimeout(() => {
                    advanceToNextQuestion();
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to submit vote');
            }
        } catch (error) {
            console.error('[ShoeGame] Vote submission error:', error);
            btnMichelle.disabled = false;
            btnJazeel.disabled = false;
            btnMichelle.classList.remove('voted', 'disabled');
            btnJazeel.classList.remove('voted', 'disabled');
            feedback.classList.add('hidden');
            
            showError('Failed to record vote. Please try again.');
        }
    }

    async function advanceToNextQuestion() {
        try {
            if (state.currentQuestionData.question_number >= state.totalQuestions) {
                showResults();
                return;
            }
            
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather/next-question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                },
                body: JSON.stringify({
                    session_code: state.sessionCode
                })
            });

            if (!response.ok) {
                throw new Error('Failed to advance to next question');
            }

            const data = await response.json();
            if (data.success) {
                if (data.data.is_complete) {
                    showResults();
                } else {
                    await loadCurrentQuestion();
                }
            } else {
                throw new Error(data.error || 'Failed to advance to next question');
            }
        } catch (error) {
            console.error('[ShoeGame] Next question error:', error);
            showError('Failed to load next question. Please refresh and try again.');
        }
    }

    async function showResults() {
        state.view = 'results';
        
        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather/results?session_code=${state.sessionCode}`, {
                method: 'GET',
                headers: {
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load results');
            }

            const data = await response.json();
            if (data.success) {
                renderResultsScreen(data.data);
            } else {
                throw new Error(data.error || 'Failed to load results');
            }
        } catch (error) {
            console.error('[ShoeGame] Results loading error:', error);
            renderResultsScreen(null);
        }
    }

    function restart() {
        state.votes = [];
        state.currentQuestion = 0;
        state.currentQuestionData = null;
        
        createOrJoinSession();
    }

    function backToActivities() {
        if (window.Navigation && window.Navigation.showSection) {
            window.Navigation.showSection('welcome');
        } else {
            window.location.hash = '';
            location.reload();
        }
    }

    window.ShoeGame = {
        init: init,
        startGame: startGame,
        vote: vote,
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