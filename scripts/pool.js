// Baby Shower App - Baby Pool Feature

/**
 * Initialize pool-specific functionality
 */
function initializePool() {
    loadPoolStats();
}

/**
 * Load and display pool statistics
 */
async function loadPoolStats() {
    try {
        const stats = await SupabaseClient.getStats();

        if (stats && stats.poolCount > 0) {
            displayPoolStats(stats);
        }
    } catch (error) {
        console.error('Error loading pool stats:', error);
    }
}

/**
 * Display pool statistics
 * @param {Object} stats - Statistics object
 */
function displayPoolStats(stats) {
    const statsContainer = document.getElementById('pool-stats');

    if (!statsContainer) {
        return;
    }

    let html = '<h3>Current Predictions</h3>';
    html += '<div class="stat-item">';
    html += `<span>Total Predictions:</span>`;
    html += `<span>${stats.poolCount}</span>`;
    html += '</div>';

    // Add more stats as needed
    // html += '<div class="stat-item">';
    // html += '<span>Most Popular Date:</span>';
    // html += '<span>...</span>';
    // html += '</div>';

    statsContainer.innerHTML = html;
    statsContainer.classList.add('fade-in');
}

/**
 * Validate pool form
 * @param {HTMLFormElement} form - Pool form
 * @returns {boolean} Valid or not
 */
function validatePoolForm(form) {
    const name = form.querySelector('#pool-name').value.trim();
    const dateGuess = form.querySelector('#pool-date').value;
    const timeGuess = form.querySelector('#pool-time').value;
    const weightGuess = form.querySelector('#pool-weight').value;
    const lengthGuess = form.querySelector('#pool-length').value;

    if (!name) {
        alert('Please enter your name');
        return false;
    }

    if (!dateGuess) {
        alert('Please select a predicted birth date');
        return false;
    }

    if (!timeGuess) {
        alert('Please select a predicted time');
        return false;
    }

    if (!weightGuess || weightGuess < 1 || weightGuess > 6) {
        alert('Please enter a valid weight between 1 and 6 kg');
        return false;
    }

    if (!lengthGuess || lengthGuess < 30 || lengthGuess > 60) {
        alert('Please enter a valid length between 30 and 60 cm');
        return false;
    }

    return true;
}

/**
 * Get pool form data
 * @param {HTMLFormElement} form - Pool form
 * @returns {Object} Form data
 */
function getPoolFormData(form) {
    return {
        name: form.querySelector('#pool-name').value.trim(),
        dateGuess: form.querySelector('#pool-date').value,
        timeGuess: form.querySelector('#pool-time').value,
        weightGuess: form.querySelector('#pool-weight').value,
        lengthGuess: form.querySelector('#pool-length').value
    };
}

/**
 * Reset pool form
 * @param {HTMLFormElement} form - Pool form
 */
function resetPoolForm(form) {
    form.reset();
}

/**
 * Show pool success message
 * @param {string} name - Guest name
 * @returns {string} Success message
 */
function getPoolSuccessMessage(name) {
    const messages = [
        `Thanks ${name}! Your prediction has been saved!`,
        `Great prediction ${name}! Let's see if you're right!`,
        `${name}, your guess is in! Good luck!`,
        `Prediction saved ${name}! May the best guesser win!`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get personal pool progress
 * @returns {number} Number of pool entries
 */
function getPoolProgress() {
    return getPersonalProgress('pool');
}

/**
 * Check if pool milestone should be shown
 * @param {number} count - Current pool count
 * @returns {string|null} Milestone key or null
 */
function checkPoolMilestone(count) {
    if (count === CONFIG.MILESTONES.POOL_10) {
        return 'POOL_10';
    } else if (count === CONFIG.MILESTONES.POOL_20) {
        return 'POOL_20';
    }
    return null;
}

/**
 * Get pool milestone message
 * @param {number} count - Current pool count
 * @returns {string} Milestone message
 */
function getPoolMilestoneMessage(count) {
    if (count === CONFIG.MILESTONES.POOL_10) {
        return "We have 10 predictions! Parent clue: Mom thinks baby will come early.";
    } else if (count === CONFIG.MILESTONES.POOL_20) {
        return "20 predictions collected! Let's see who will be closest!";
    }
    return "";
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePool,
        loadPoolStats,
        displayPoolStats,
        validatePoolForm,
        getPoolFormData,
        resetPoolForm,
        getPoolSuccessMessage,
        getPoolProgress,
        checkPoolMilestone,
        getPoolMilestoneMessage
    };
}
