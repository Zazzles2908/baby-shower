/**
 * Who Would Rather Game
 * Simple party game where guests answer fun questions
 */

(function() {
    'use strict';

    console.log('[WhoWouldRather] loading...');

    // Game state
    let state = {
        view: 'lobby',
        sessionCode: null,
        sessionId: null,
        currentQuestion: 0,
        totalQuestions: 24,
        score: 0,
        questions: []
    };

    // DOM elements
    let container = null;

    /**
     * Initialize the game
     */
    function init() {
        container = document.getElementById('who-would-rather-game');
        if (!container) {
            console.warn('[WhoWouldRather] Container not found');
            return;
        }
        render();
    }

    /**
     * Render the current view
     */
    function render() {
        if (!container) return;

        switch (state.view) {
            case 'lobby':
                renderLobby();
                break;
            case 'playing':
                renderQuestion();
                break;
            case 'results':
                renderResults();
                break;
        }
    }

    /**
     * Render lobby view
     */
    function renderLobby() {
        container.innerHTML = `
            <div class="wwr-lobby">
                <h2>🤔 Who Would Rather?</h2>
                <p>Answer fun questions about the parents-to-be!</p>
                <div class="wwr-code-display">---</div>
                <p>Enter a code to join, or ask the host for a new game</p>
                <div class="wwr-join-form">
                    <input type="text" id="wwr-join-code" placeholder="Game Code" maxlength="8">
                    <button class="wwr-btn" onclick="window.WhoWouldRather.join()">Join Game</button>
                </div>
            </div>
        `;
    }

    /**
     * Render question view
     */
    function renderQuestion() {
        const question = state.questions[state.currentQuestion];
        if (!question) return;

        container.innerHTML = `
            <div class="wwr-question">
                <div class="wwr-progress">Question ${state.currentQuestion + 1} of ${state.totalQuestions}</div>
                <div class="wwr-question-text">${question.question_text}</div>
                <div class="wwr-choices">
                    <div class="wwr-choice mom" onclick="window.WhoWouldRather.vote('mom')">
                        <div class="wwr-choice-icon">👩</div>
                        <div class="wwr-choice-label">Mom</div>
                    </div>
                    <div class="wwr-choice dad" onclick="window.WhoWouldRather.vote('dad')">
                        <div class="wwr-choice-icon">👨</div>
                        <div class="wwr-choice-label">Dad</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render results view
     */
    function renderResults() {
        const percentage = Math.round((state.score / state.totalQuestions) * 100);
        let message = '';
        
        if (percentage >= 80) {
            message = '🎉 Amazing! You really know them!';
        } else if (percentage >= 60) {
            message = '👍 Pretty good!';
        } else if (percentage >= 40) {
            message = '🤔 Hmm, maybe you need to spend more time with them!';
        } else {
            message = '😅 Time to pay more attention!';
        }

        container.innerHTML = `
            <div class="wwr-results">
                <h2>Game Complete! 🎊</h2>
                <div class="wwr-score">${state.score}/${state.totalQuestions}</div>
                <div class="wwr-message">${message}</div>
                <div class="wwr-play-again">
                    <button class="wwr-btn" onclick="window.WhoWouldRather.backToLobby()">Back to Lobby</button>
                </div>
            </div>
        `;
    }

    /**
     * Join an existing session
     */
    async function join() {
        const code = document.getElementById('wwr-join-code').value.trim().toUpperCase();
        if (!code) {
            alert('Please enter a game code');
            return;
        }

        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                },
                body: JSON.stringify({
                    action: 'join',
                    session_code: code
                })
            });

            if (!response.ok) {
                throw new Error('Failed to join session');
            }

            const data = await response.json();
            state.sessionCode = code;
            state.sessionId = data.session_id;
            state.questions = data.questions || [];
            state.totalQuestions = state.questions.length || 24;
            state.view = 'playing';
            state.currentQuestion = 0;
            state.score = 0;
            
            render();
        } catch (error) {
            console.error('[WhoWouldRather]);
            alert(' Join error:', errorFailed to join game. Please check the code and try again.');
        }
    }

    /**
     * Submit a vote
     */
    async function vote(choice) {
        if (!state.sessionId || state.currentQuestion >= state.questions.length) return;

        try {
            const response = await fetch(`${window.CONFIG?.SUPABASE?.URL}/functions/v1/who-would-rather`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.CONFIG?.SUPABASE?.ANON_KEY || ''
                },
                body: JSON.stringify({
                    action: 'vote',
                    session_id: state.sessionId,
                    question_number: state.currentQuestion + 1,
                    vote_choice: choice
                })
            });

            // Check if vote was correct (if answer provided)
            if (response.ok) {
                const data = await response.json();
                if (data.correct) {
                    state.score++;
                }
            }

            state.currentQuestion++;

            if (state.currentQuestion >= state.totalQuestions) {
                state.view = 'results';
            }

            render();
        } catch (error) {
            console.error('[WhoWouldRather] Vote error:', error);
            // Continue anyway for offline play
            state.currentQuestion++;
            if (state.currentQuestion >= state.totalQuestions) {
                state.view = 'results';
            }
            render();
        }
    }

    /**
     * Back to lobby
     */
    function backToLobby() {
        state.view = 'lobby';
        state.sessionCode = null;
        state.sessionId = null;
        state.currentQuestion = 0;
        state.score = 0;
        render();
    }

    // Export public API
    window.WhoWouldRather = {
        init: init,
        join: join,
        vote: vote,
        backToLobby: backToLobby
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
