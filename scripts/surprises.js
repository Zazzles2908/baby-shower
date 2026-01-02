// Baby Shower App - Milestone and Surprise System

/**
 * Check if a submission response contains a milestone trigger
 * @param {Object} response - API response object
 * @returns {boolean} Whether milestone was triggered
 */
function checkForMilestone(response) {
    return response?.milestone?.triggered === true;
}

/**
 * Trigger full-screen milestone celebration
 * @param {Object} milestone - Milestone data from API response
 */
function triggerMilestoneCelebration(milestone) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'milestone-overlay';
    overlay.id = 'milestone-celebration-overlay';
    
    // Create celebration content
    const content = document.createElement('div');
    content.className = 'milestone-message';
    content.innerHTML = `
        <div class="milestone-icon">🎉</div>
        <h2 class="milestone-title">${milestone.message || '🎉 We hit 50 submissions! Cake time!'}</h2>
        <p class="milestone-subtitle">Thank you for being part of this magical moment!</p>
        <div class="milestone-count">50 amazing guests have contributed!</div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Trigger confetti
    triggerFullscreenConfetti();
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
        dismissMilestoneCelebration();
    }, 6000);
}

/**
 * Dismiss the milestone celebration
 */
function dismissMilestoneCelebration() {
    const overlay = document.getElementById('milestone-celebration-overlay');
    if (overlay) {
        overlay.classList.add('fading-out');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }
}

/**
 * Trigger full-screen confetti animation
 */
function triggerFullscreenConfetti() {
    const container = document.createElement('div');
    container.className = 'milestone-confetti-container';
    
    // Create more confetti pieces for full-screen effect
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
        '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#54A0FF',
        '#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF6347'
    ];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'milestone-confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Randomize shapes
        const shapes = ['square', 'circle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        if (shape === 'circle') {
            confetti.style.borderRadius = '50%';
        }
        
        // Randomize size
        const size = Math.random() * 8 + 6;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        container.appendChild(confetti);
    }
    
    document.body.appendChild(container);
    
    // Remove confetti after animation
    setTimeout(() => {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }, 6000);
}

/**
 * Show milestone surprise
 * @param {string} milestoneKey - Milestone key
 */
function showMilestoneSurprise(milestoneKey) {
    const milestone = MILESTONE_CONTENT[milestoneKey];

    if (!milestone) {
        console.warn(`Milestone ${milestoneKey} not found`);
        return;
    }

    const modal = document.getElementById('milestone-modal');
    const titleEl = document.getElementById('milestone-title');
    const messageEl = document.getElementById('milestone-message');
    const iconEl = document.getElementById('milestone-icon');

    if (modal && titleEl && messageEl && iconEl) {
        titleEl.textContent = milestone.title;
        messageEl.textContent = milestone.message;
        iconEl.textContent = milestone.icon;

        modal.classList.remove('hidden');

        // Add animation classes
        modal.querySelector('.modal-content').classList.add('bounce-in');

        // Trigger confetti
        triggerConfetti();

        // Play sound effect (optional - add audio file if desired)
        // playMilestoneSound();
    }
}

/**
 * Close milestone modal
 */
function closeMilestoneModal() {
    const modal = document.getElementById('milestone-modal');

    if (modal) {
        modal.classList.add('hidden');

        // Remove animation class
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.remove('bounce-in');
        }
    }
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';

    // Create confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

        // Randomize confetti shape
        const shapes = ['square', 'circle', 'triangle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        if (shape === 'circle') {
            confetti.style.borderRadius = '50%';
        } else if (shape === 'triangle') {
            confetti.style.width = '0';
            confetti.style.height = '0';
            confetti.style.borderLeft = '5px solid transparent';
            confetti.style.borderRight = '5px solid transparent';
            confetti.style.borderBottom = `10px solid ${getRandomColor()}`;
        }

        container.appendChild(confetti);
    }

    document.body.appendChild(container);

    // Remove confetti after animation
    setTimeout(() => {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }, 5000);
}

/**
 * Get random confetti color
 * @returns {string} Color
 */
function getRandomColor() {
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#FFE66D', // Yellow
        '#95E1D3', // Green
        '#F38181', // Pink
        '#AA96DA', // Purple
        '#FCBAD3', // Light Pink
        '#A8D8EA', // Blue
        '#FF9F43', // Orange
        '#54A0FF'  // Light Blue
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Show personal milestone
 * @param {string} feature - Feature name
 * @param {number} count - Current count
 */
function showPersonalMilestone(feature, count) {
    let milestoneKey = null;

    switch(feature) {
        case 'guestbook':
            milestoneKey = checkGuestbookMilestone(count);
            break;
        case 'pool':
            milestoneKey = checkPoolMilestone(count);
            break;
        case 'quiz':
            // Quiz milestones are based on total correct answers, not personal count
            break;
        case 'advice':
            milestoneKey = checkAdviceMilestone(count);
            break;
        case 'votes':
            // Voting milestones are based on total votes, not personal count
            break;
    }

    if (milestoneKey) {
        showMilestoneSurprise(milestoneKey);
    }
}

/**
 * Check for all milestones based on current stats
 * @param {Object} stats - Current statistics
 * @returns {Array} Newly unlocked milestone keys
 */
function checkAllMilestones(stats) {
    const newlyUnlocked = [];

    // Check guestbook milestones
    if (stats.guestbookCount >= CONFIG.MILESTONES.GUESTBOOK_5) {
        newlyUnlocked.push('GUESTBOOK_5');
    }
    if (stats.guestbookCount >= CONFIG.MILESTONES.GUESTBOOK_10) {
        newlyUnlocked.push('GUESTBOOK_10');
    }
    if (stats.guestbookCount >= CONFIG.MILESTONES.GUESTBOOK_20) {
        newlyUnlocked.push('GUESTBOOK_20');
    }

    // Check pool milestones
    if (stats.poolCount >= CONFIG.MILESTONES.POOL_10) {
        newlyUnlocked.push('POOL_10');
    }
    if (stats.poolCount >= CONFIG.MILESTONES.POOL_20) {
        newlyUnlocked.push('POOL_20');
    }

    // Check quiz milestones
    if (stats.quizTotalCorrect >= CONFIG.MILESTONES.QUIZ_25) {
        newlyUnlocked.push('QUIZ_25');
    }
    if (stats.quizTotalCorrect >= CONFIG.MILESTONES.QUIZ_50) {
        newlyUnlocked.push('QUIZ_50');
    }

    // Check advice milestones
    if (stats.adviceCount >= CONFIG.MILESTONES.ADVICE_10) {
        newlyUnlocked.push('ADVICE_10');
    }
    if (stats.adviceCount >= CONFIG.MILESTONES.ADVICE_20) {
        newlyUnlocked.push('ADVICE_20');
    }

    // Check voting milestones
    if (stats.totalVotes >= CONFIG.MILESTONES.VOTES_50) {
        newlyUnlocked.push('VOTES_50');
    }

    return newlyUnlocked;
}

/**
 * Get milestone progress percentage
 * @param {string} milestoneKey - Milestone key
 * @param {Object} stats - Current statistics
 * @returns {number} Progress percentage (0-100)
 */
function getMilestoneProgress(milestoneKey, stats) {
    const threshold = CONFIG.MILESTONES[milestoneKey];

    if (!threshold) {
        return 0;
    }

    let current = 0;

    switch(milestoneKey) {
        case 'GUESTBOOK_5':
        case 'GUESTBOOK_10':
        case 'GUESTBOOK_20':
            current = stats.guestbookCount || 0;
            break;
        case 'POOL_10':
        case 'POOL_20':
            current = stats.poolCount || 0;
            break;
        case 'QUIZ_25':
        case 'QUIZ_50':
            current = stats.quizTotalCorrect || 0;
            break;
        case 'ADVICE_10':
        case 'ADVICE_20':
            current = stats.adviceCount || 0;
            break;
        case 'VOTES_50':
            current = stats.totalVotes || 0;
            break;
    }

    return Math.min(100, Math.round((current / threshold) * 100));
}

/**
 * Create progress bar HTML
 * @param {string} milestoneKey - Milestone key
 * @param {Object} stats - Current statistics
 * @returns {string} Progress bar HTML
 */
function createProgressBar(milestoneKey, stats) {
    const progress = getMilestoneProgress(milestoneKey, stats);
    const milestone = MILESTONE_CONTENT[milestoneKey];

    let html = '<div class="progress-item">';
    html += `<div class="progress-label">${milestone.title}</div>`;
    html += '<div class="progress-bar">';
    html += `<div class="progress-fill" style="width: ${progress}%"></div>`;
    html += '</div>';
    html += `<div class="progress-percentage">${progress}%</div>`;
    html += '</div>';

    return html;
}

/**
 * Show all milestones progress
 * @param {Object} stats - Current statistics
 */
function showMilestoneProgress(stats) {
    const container = document.getElementById('milestone-progress');

    if (!container) {
        return;
    }

    let html = '<h3>Milestone Progress</h3>';

    Object.keys(CONFIG.MILESTONES).forEach(milestoneKey => {
        html += createProgressBar(milestoneKey, stats);
    });

    container.innerHTML = html;
}

/**
 * Get unlocked milestones
 * @returns {Array} Unlocked milestone keys
 */
function getUnlockedMilestones() {
    const progress = localStorage.getItem('babyShowerUnlockedMilestones');

    if (progress) {
        return JSON.parse(progress);
    }

    return [];
}

/**
 * Save unlocked milestone
 * @param {string} milestoneKey - Milestone key
 */
function saveUnlockedMilestone(milestoneKey) {
    const unlocked = getUnlockedMilestones();

    if (!unlocked.includes(milestoneKey)) {
        unlocked.push(milestoneKey);
        localStorage.setItem('babyShowerUnlockedMilestones', JSON.stringify(unlocked));
    }
}

/**
 * Check if milestone is unlocked
 * @param {string} milestoneKey - Milestone key
 * @returns {boolean} Is unlocked
 */
function isMilestoneUnlocked(milestoneKey) {
    const unlocked = getUnlockedMilestones();
    return unlocked.includes(milestoneKey);
}

/**
 * Reset all milestones (for testing)
 */
function resetMilestones() {
    localStorage.removeItem('babyShowerUnlockedMilestones');
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showMilestoneSurprise,
        closeMilestoneModal,
        triggerConfetti,
        getRandomColor,
        showPersonalMilestone,
        checkAllMilestones,
        getMilestoneProgress,
        createProgressBar,
        showMilestoneProgress,
        getUnlockedMilestones,
        saveUnlockedMilestone,
        isMilestoneUnlocked,
        resetMilestones,
        checkForMilestone,
        triggerMilestoneCelebration,
        dismissMilestoneCelebration,
        triggerFullscreenConfetti
    };
}
