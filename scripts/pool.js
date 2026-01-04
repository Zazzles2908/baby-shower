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
        // Wait for API to be available (handles script loading race conditions)
        let retries = 10;
        while (!window.API && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
            retries--;
        }
        
        if (!window.API) {
            console.warn('API client not available, pool stats will not be displayed');
            return;
        }
        
        const submissions = await window.API.getSubmissions('pool');
        
        if (submissions && submissions.length > 0) {
            const stats = {
                poolCount: submissions.length,
                submissions: submissions
            };
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

    // Validate date is within acceptable range (2024-01-01 to 2025-12-31)
    const selectedDate = new Date(dateGuess);
    const minDate = new Date('2024-01-01');
    const maxDate = new Date('2025-12-31');
    
    if (selectedDate < minDate || selectedDate > maxDate) {
        alert('Please select a date between January 1, 2024 and December 31, 2025');
        return false;
    }

    if (!timeGuess) {
        alert('Please select a predicted time');
        return false;
    }

    if (!weightGuess || weightGuess < 1 || weightGuess > 10) {
        alert('Please enter a valid weight between 1 and 10 kg');
        return false;
    }

    if (!lengthGuess || lengthGuess < 40 || lengthGuess > 60) {
        alert('Please enter a valid length between 40 and 60 cm');
        return false;
    }

    return true;
}

/**
 * Get pool form data
 * @param {HTMLFormElement} form - Pool form
 * @returns {Object} Form data - normalized for backend
 */
function getPoolFormData(form) {
    const name = form.querySelector('#pool-name').value.trim();
    const dateGuess = form.querySelector('#pool-date').value;
    const timeGuess = form.querySelector('#pool-time').value;
    const weightGuess = form.querySelector('#pool-weight').value;
    const lengthGuess = form.querySelector('#pool-length').value;
    
    // Create prediction string combining date and time
    const prediction = dateGuess && timeGuess ? `${dateGuess} at ${timeGuess}` : dateGuess || '';
    
    return {
        name: name,
        prediction: prediction,
        due_date: dateGuess,
        weight: weightGuess,
        length: lengthGuess,
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
 * Show pool success message with AI roast
 * @param {string} name - Guest name
 * @param {string|null} roast - AI-generated roast (optional)
 * @returns {string} Success message
 */
function getPoolSuccessMessage(name, roast = null) {
    const baseMessages = [
        `Thanks ${name}! Your prediction has been saved!`,
        `Great prediction ${name}! Let's see if you're right!`,
        `${name}, your guess is in! Good luck!`,
        `Prediction saved ${name}! May the best guesser win!`
    ];
    
    const baseMessage = baseMessages[Math.floor(Math.random() * baseMessages.length)];
    
    // Return object with message and roast for frontend handling
    return {
        message: baseMessage,
        roast: roast
    };
}

/**
 * Display roast in success modal
 * @param {string} roast - AI-generated roast
 */
function displayRoast(roast) {
    if (!roast) return;
    
    const roastContainer = document.getElementById('roast-container');
    const roastText = document.getElementById('roast-text');
    
    if (roastContainer && roastText) {
        roastText.textContent = roast;
        roastContainer.classList.add('fade-in', 'roast-visible');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            roastContainer.classList.remove('roast-visible');
            roastContainer.classList.add('fade-out');
        }, 4000);
    }
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
        displayRoast,
        getPoolProgress,
        checkPoolMilestone,
        getPoolMilestoneMessage
    };
}
