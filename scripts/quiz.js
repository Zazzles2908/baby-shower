// Baby Shower App - Emoji Pictionary Feature

/**
 * Initialize quiz-specific functionality
 */
function initializeQuiz() {
    // Any quiz-specific initialization can go here
    // Currently handled in main.js
}

/**
 * Validate quiz form
 * @param {HTMLFormElement} form - Quiz form
 * @returns {boolean} Valid or not
 */
function validateQuizForm(form) {
    const name = form.querySelector('#quiz-name')?.value.trim();
    const puzzle1 = form.querySelector('[name="puzzle1"]').value.trim();
    const puzzle2 = form.querySelector('[name="puzzle2"]').value.trim();
    const puzzle3 = form.querySelector('[name="puzzle3"]').value.trim();
    const puzzle4 = form.querySelector('[name="puzzle4"]').value.trim();
    const puzzle5 = form.querySelector('[name="puzzle5"]').value.trim();

    if (!name) {
        alert('Please enter your name');
        return false;
    }

    if (!puzzle1 || !puzzle2 || !puzzle3 || !puzzle4 || !puzzle5) {
        alert('Please answer all puzzles');
        return false;
    }

    return true;
}

/**
 * Update quiz score display in real-time
 * @param {number} score - Current score (0-5)
 */
function updateQuizScore(score) {
    const scoreDisplay = document.getElementById('quiz-score-display');
    const currentScoreEl = document.getElementById('current-score');
    
    if (scoreDisplay && currentScoreEl) {
        // Show score display if hidden
        scoreDisplay.classList.remove('hidden');
        
        // Update score with animation
        currentScoreEl.textContent = score;
        
        // Add pulse animation
        currentScoreEl.classList.add('score-updated');
        setTimeout(() => {
            currentScoreEl.classList.remove('score-updated');
        }, 500);
    }
}

/**
 * Get quiz form data
 * @param {HTMLFormElement} form - Quiz form
 * @returns {Object} Form data
 */
function getQuizFormData(form) {
    const puzzles = CONFIG.QUIZ_PUZZLES;
    const answers = {};
    
    Object.keys(puzzles).forEach(key => {
        answers[key] = form.querySelector(`[name="${key}"]`)?.value.trim() || '';
    });
    
    return {
        name: form.querySelector('#quiz-name')?.value.trim() || '',
        answers: answers,
        puzzle1: answers.puzzle1 || '',
        puzzle2: answers.puzzle2 || '',
        puzzle3: answers.puzzle3 || '',
        puzzle4: answers.puzzle4 || '',
        puzzle5: answers.puzzle5 || ''
    };
}

/**
 * Calculate quiz score
 * @param {Object} answers - User's answers
 * @returns {number} Score (0-5)
 */
function calculateQuizScore(answers) {
    const puzzles = CONFIG.QUIZ_PUZZLES;
    let score = 0;
    
    // Check first 5 puzzles only (matching form fields)
    for (let i = 1; i <= 5; i++) {
        const puzzleKey = `puzzle${i}`;
        const userAnswer = answers[puzzleKey]?.toLowerCase().trim() || '';
        const correctAnswer = puzzles[puzzleKey]?.answer.toLowerCase().trim() || '';
        
        if (userAnswer === correctAnswer) {
            score++;
        }
    }

    return score;
}

/**
 * Reset quiz form
 * @param {HTMLFormElement} form - Quiz form
 */
function resetQuizForm(form) {
    form.reset();
}

/**
 * Show quiz success message
 * @param {string} name - Guest name
 * @param {number} score - Quiz score
 * @returns {string} Success message
 */
function getQuizSuccessMessage(name, score) {
    if (score === 5) {
        return `Perfect score ${name}! You're a Baby Genius! 🧠`;
    } else if (score === 4) {
        return `Great job ${name}! You got 4/5 correct! 🌟`;
    } else if (score === 3) {
        return `Well done ${name}! You got 3/5 correct! 🎉`;
    } else if (score === 2) {
        return `Good try ${name}! You got 2/5 correct! 👍`;
    } else if (score === 1) {
        return `Nice try ${name}! You got 1/5 correct! 💪`;
    } else {
        return `Thanks for trying ${name}! Better luck next time! 😊`;
    }
}

/**
 * Get personal quiz progress
 * @returns {number} Number of quiz entries
 */
function getQuizProgress() {
    return getPersonalProgress('quiz');
}

/**
 * Check if quiz milestone should be shown
 * @param {number} totalCorrect - Total correct answers across all guests
 * @returns {string|null} Milestone key or null
 */
function checkQuizMilestone(totalCorrect) {
    if (totalCorrect >= CONFIG.MILESTONES.QUIZ_25 && totalCorrect < CONFIG.MILESTONES.QUIZ_50) {
        return 'QUIZ_25';
    } else if (totalCorrect >= CONFIG.MILESTONES.QUIZ_50) {
        return 'QUIZ_50';
    }
    return null;
}

/**
 * Get quiz milestone message
 * @param {number} totalCorrect - Total correct answers
 * @returns {string} Milestone message
 */
function getQuizMilestoneMessage(totalCorrect) {
    if (totalCorrect >= CONFIG.MILESTONES.QUIZ_25 && totalCorrect < CONFIG.MILESTONES.QUIZ_50) {
        return "Guests have solved 25 baby riddles! Baby will be so smart!";
    } else if (totalCorrect >= CONFIG.MILESTONES.QUIZ_50) {
        return "50 correct answers! You're all baby experts!";
    }
    return "";
}

/**
 * Get quiz badge based on score
 * @param {number} score - Quiz score
 * @returns {string} Badge emoji
 */
function getQuizBadge(score) {
    if (score === 5) {
        return '🏆';
    } else if (score === 4) {
        return '🥇';
    } else if (score === 3) {
        return '🥈';
    } else if (score === 2) {
        return '🥉';
    } else if (score === 1) {
        return '👍';
    } else {
        return '😊';
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeQuiz,
        validateQuizForm,
        getQuizFormData,
        calculateQuizScore,
        resetQuizForm,
        getQuizSuccessMessage,
        getQuizProgress,
        checkQuizMilestone,
        getQuizMilestoneMessage,
        getQuizBadge
    };
}
