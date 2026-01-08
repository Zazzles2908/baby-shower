// Baby Shower App - Baby Pool Feature

/**
 * Initialize pool-specific functionality
 */
function initializePool() {
    // Set date picker to show dates from January 6, 2026 (today) to December 31, 2026
    setPoolDateRange();
    initializeColorPickers();
    initializePersonalityGrid();
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
 * Initialize color picker functionality
 * Syncs radio button selections with hidden input fields
 */
function initializeColorPickers() {
    // Hair color picker
    const hairRadios = document.querySelectorAll('input[name="hairColor"]');
    const hairHidden = document.getElementById('pool-hair-color');
    
    if (hairRadios && hairHidden) {
        hairRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    hairHidden.value = this.value;
                    console.log('[Pool] Hair color selected:', this.value);
                }
            });
        });
    }
    
    // Eye color picker
    const eyeRadios = document.querySelectorAll('input[name="eyeColor"]');
    const eyeHidden = document.getElementById('pool-eye-color');
    
    if (eyeRadios && eyeHidden) {
        eyeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    eyeHidden.value = this.value;
                    console.log('[Pool] Eye color selected:', this.value);
                }
            });
        });
    }
    
    console.log('[Pool] Color pickers initialized');
}

/**
 * Initialize personality grid with options from CONFIG
 */
function initializePersonalityGrid() {
    const grid = document.getElementById('personality-grid');
    if (!grid) {
        console.warn('[Pool] Personality grid element not found');
        return;
    }
    
    const options = window.CONFIG.PERSONALITY_OPTIONS;
    if (!options || options.length === 0) {
        console.warn('[Pool] No personality options configured');
        return;
    }
    
    const baseImageUrl = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/Pictures/New Images/';
    
    grid.innerHTML = options.map(option => `
        <div class="personality-option" data-personality="${option.id}" role="button" tabindex="0" aria-label="${option.label} personality" style="--personality-color: ${option.color || 'var(--color-primary)'}">
            <div class="check-mark"></div>
            <div class="personality-emoji">${option.emoji}</div>
            <img src="${baseImageUrl}${option.icon}" alt="${option.label}" class="personality-icon" loading="lazy" onerror="this.style.display='none'">
            <span class="personality-label">${option.label}</span>
        </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.personality-option').forEach(option => {
        option.addEventListener('click', function() {
            selectPersonality(this);
        });
        
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectPersonality(this);
            }
        });
    });
    
    console.log('[Pool] Personality grid initialized with', options.length, 'options');
}

/**
 * Select a personality option
 * @param {HTMLElement} selectedOption - The selected personality option element
 */
function selectPersonality(selectedOption) {
    const grid = document.getElementById('personality-grid');
    const hiddenInput = document.getElementById('pool-personality');
    
    if (!grid || !hiddenInput) {
        console.warn('[Pool] Required elements not found');
        return;
    }
    
    // Deselect all options
    grid.querySelectorAll('.personality-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select the clicked option
    selectedOption.classList.add('selected');
    
    // Update hidden input value
    const personalityId = selectedOption.dataset.personality;
    hiddenInput.value = personalityId;
    
    console.log('[Pool] Personality selected:', personalityId);
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
    const hairColor = form.querySelector('#pool-hair-color').value;
    const eyeColor = form.querySelector('#pool-eye-color').value;
    const personality = form.querySelector('#pool-personality').value;

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

    if (!hairColor) {
        alert('Please select a predicted hair color');
        return false;
    }

    if (!eyeColor) {
        alert('Please select a predicted eye color');
        return false;
    }

    if (!personality) {
        alert('Please select a personality for baby');
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
    const hairColor = form.querySelector('#pool-hair-color').value;
    const eyeColor = form.querySelector('#pool-eye-color').value;
    const personality = form.querySelector('#pool-personality').value;
    
    // Create prediction string combining date and time
    const prediction = dateGuess && timeGuess ? `${dateGuess} at ${timeGuess}` : dateGuess || '';
    
    return {
        name: name,
        prediction: prediction,
        due_date: dateGuess,
        weight: weightGuess,
        length: lengthGuess,
        hair_color: hairColor,
        eye_color: eyeColor,
        personality: personality,
    };
}

/**
 * Reset pool form
 * @param {HTMLFormElement} form - Pool form
 */
function resetPoolForm(form) {
    form.reset();
    // Clear personality selection
    const personalityGrid = document.getElementById('personality-grid');
    if (personalityGrid) {
        personalityGrid.querySelectorAll('.personality-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    }
    const personalityInput = document.getElementById('pool-personality');
    if (personalityInput) {
        personalityInput.value = '';
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
        initializeColorPickers,
        initializePersonalityGrid,
        selectPersonality,
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
