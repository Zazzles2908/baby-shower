// Baby Shower App - Baby Pool Feature

/**
 * Initialize pool-specific functionality
 */
function initializePool() {
    // Set date picker to show dates from January 6, 2026 (today) to December 31, 2026
    setPoolDateRange();
    initializeFavouriteColourGrid();
    loadPoolStats();
}

/**
 * Set the date picker range for Baby Pool predictions
 * Due date should be in 2026 (event is Jan 4, 2026)
 */
function setPoolDateRange() {
    const dateInput = document.getElementById('pool-date');
    if (dateInput) {
        const today = new Date('2026-01-05'); // Today is Jan 5, 2026
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 1); // Tomorrow (Jan 6, 2026)
        
        const maxDate = new Date('2026-12-31'); // End of 2026
        
        // Format as YYYY-MM-DD for HTML date input
        const minDateStr = minDate.toISOString().split('T')[0];
        const maxDateStr = maxDate.toISOString().split('T')[0];
        
        dateInput.min = minDateStr;
        dateInput.max = maxDateStr;
        
        console.log('[Pool] Date range set:', minDateStr, 'to', maxDateStr);
    }
}

/**
 * Initialize favourite colour grid with options from CONFIG
 */
function initializeFavouriteColourGrid() {
    const grid = document.getElementById('colour-grid');
    if (!grid) {
        console.warn('[Pool] Colour grid element not found');
        return;
    }
    
    const options = window.CONFIG.FAVOURITE_COLOUR_OPTIONS;
    if (!options || options.length === 0) {
        console.warn('[Pool] No colour options configured');
        return;
    }
    
    grid.innerHTML = options.map(option => `
        <div class="colour-option" data-colour="${option.id}" role="button" tabindex="0" aria-label="${option.label} colour" style="--colour-color: ${option.color}">
            <div class="colour-preview" style="background-color: ${option.color};"></div>
            <div class="colour-emoji">${option.emoji}</div>
            <span class="colour-label">${option.label}</span>
        </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.colour-option').forEach(option => {
        option.addEventListener('click', function() {
            selectFavouriteColour(this);
        });
        
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectFavouriteColour(this);
            }
        });
    });
    
    console.log('[Pool] Colour grid initialized with', options.length, 'options');
}

/**
 * Select a colour option
 * @param {HTMLElement} selectedOption - The selected colour option element
 */
function selectFavouriteColour(selectedOption) {
    const grid = document.getElementById('colour-grid');
    const hiddenInput = document.getElementById('pool-favourite-colour');
    
    if (!grid || !hiddenInput) {
        console.warn('[Pool] Required elements not found');
        return;
    }
    
    // Deselect all options
    grid.querySelectorAll('.colour-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select the clicked option
    selectedOption.classList.add('selected');
    
    // Update hidden input value
    const colourId = selectedOption.dataset.colour;
    hiddenInput.value = colourId;
    
    console.log('[Pool] Colour selected:', colourId);
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
        
        // Check if getSubmissions is available (graceful degradation)
        if (typeof window.API.getSubmissions !== 'function') {
            console.log('[Pool] ℹ️ getSubmissions not available - stats will not be loaded');
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
    const favouriteColour = form.querySelector('#pool-favourite-colour').value;

    if (!name) {
        alert('Please enter your name');
        return false;
    }

    if (!dateGuess) {
        alert('Please select a predicted birth date');
        return false;
    }

    // Validate date is within acceptable range (2026-01-06 to 2026-12-31)
    const selectedDate = new Date(dateGuess);
    const minDate = new Date('2026-01-06');
    const maxDate = new Date('2026-12-31');
    
    if (selectedDate < minDate || selectedDate > maxDate) {
        alert('Please select a date between January 6, 2026 and December 31, 2026');
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

    if (!favouriteColour) {
        alert('Please select a favourite colour for baby');
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
    const favouriteColour = form.querySelector('#pool-favourite-colour').value;
    
    // Create prediction string combining date and time
    const prediction = dateGuess && timeGuess ? `${dateGuess} at ${timeGuess}` : dateGuess || '';
    
    return {
        name: name,
        prediction: prediction,
        due_date: dateGuess,
        weight: weightGuess,
        length: lengthGuess,
        favourite_colour: favouriteColour,
    };
}

/**
 * Reset pool form
 * @param {HTMLFormElement} form - Pool form
 */
function resetPoolForm(form) {
    form.reset();
    // Clear colour selection
    const colourGrid = document.getElementById('colour-grid');
    if (colourGrid) {
        colourGrid.querySelectorAll('.colour-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    }
    const colourInput = document.getElementById('pool-favourite-colour');
    if (colourInput) {
        colourInput.value = '';
    }
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
        initializeFavouriteColourGrid,
        selectFavouriteColour,
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

// Create global Pool object for programmatic access
window.Pool = {
    init: initializePool,
    initColourGrid: initializeFavouriteColourGrid,
    selectColour: selectFavouriteColour,
    loadStats: loadPoolStats,
    validate: validatePoolForm,
    getData: getPoolFormData,
    reset: resetPoolForm
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Pool] Auto-initializing pool module...');
        initializePool();
    });
} else {
    console.log('[Pool] Auto-initializing pool module (DOM ready)...');
    initializePool();
}
