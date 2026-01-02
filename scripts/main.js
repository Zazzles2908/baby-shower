// Baby Shower App - Main JavaScript

// Global state
let currentSection = 'welcome';
let selectedVotes = [];
let statsCache = {
    guestbook_count: 0,
    pool_count: 0,
    quiz_count: 0,
    advice_count: 0,
    votes: {},
    lastUpdated: null
};

// Guest name storage key
const GUEST_NAME_KEY = 'babyShowerGuestName';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAPI();
    initializeNavigation();
    initializeForms();
    initializeBackButtons();
    loadPersonalProgress();
    initializeWelcomeName();
});

/**
 * Get guest name from localStorage
 * @returns {string|null} Guest name or null if not set
 */
function getGuestName() {
    return localStorage.getItem(GUEST_NAME_KEY);
}

/**
 * Set guest name in localStorage
 * @param {string} name - Guest name to store
 */
function setGuestName(name) {
    if (name && name.trim()) {
        localStorage.setItem(GUEST_NAME_KEY, name.trim());
    }
}

/**
 * Initialize welcome screen name collection
 */
function initializeWelcomeName() {
    const nameContainer = document.getElementById('welcome-name-container');
    const activitiesContainer = document.getElementById('activities-container');
    const nameInput = document.getElementById('welcome-guest-name');
    const nameBtn = document.getElementById('welcome-name-btn');
    
    if (!nameContainer || !activitiesContainer) return;
    
    // Check if name is already collected
    const existingName = getGuestName();
    if (existingName) {
        // Name already collected, hide input and show greeting
        nameContainer.innerHTML = `<p class="welcome-greeting">Welcome back, ${existingName}! 👋</p>`;
        nameContainer.classList.add('hidden');
        // Pre-fill all activity name fields
        prefillAllNameFields(existingName);
        return;
    }
    
    // Handle continue button click
    if (nameBtn && nameInput) {
        nameBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
                setGuestName(name);
                nameContainer.innerHTML = `<p class="welcome-greeting">Welcome, ${name}! 👋</p>`;
                nameContainer.classList.add('hidden');
                prefillAllNameFields(name);
            } else {
                alert('Please enter your name');
                nameInput.focus();
            }
        });
        
        // Allow Enter key to submit
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                nameBtn.click();
            }
        });
    }
}

/**
 * Re-populate name field after form reset
 * @param {string} fieldId - ID of the name field
 */
function repopulateNameField(fieldId) {
    const name = getGuestName();
    if (name) {
        const input = document.getElementById(fieldId);
        if (input) {
            input.value = name;
        }
    }
}

/**
 * Pre-fill all activity name fields with the guest's name
 * @param {string} name - Guest name
 */
function prefillAllNameFields(name) {
    const nameFields = [
        { id: 'guestbook-name', section: 'guestbook-section' },
        { id: 'pool-name', section: 'pool-section' },
        { id: 'quiz-name', section: 'quiz-section' },
        { id: 'advice-name', section: 'advice-section' }
    ];
    
    nameFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) {
            input.value = name;
            // Make the field readonly so it can't be edited (but still submitted)
            input.classList.add('name-field-readonly');
            input.setAttribute('readonly', 'readonly');
            // Update label to show it's pre-filled
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.innerHTML = `${label.textContent} <small>(auto-filled)</small>`;
            }
        }
    });
}

/**
 * Initialize API client and load stats
 */
async function initializeAPI() {
    try {
        // Wait for API to be available (handles script loading race conditions)
        let retries = 10;
        while (!window.API && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
            retries--;
        }
        
        if (!window.API) {
            console.warn('API client not loaded, pool stats will not be available');
            return;
        }
        
        // Initialize API client (already auto-initialized in api-supabase.js)
        const result = await window.API.initializeAPI();
        
        if (result && result.success) {
            console.log('API client initialized successfully');
            
            // Load initial stats
            await refreshStatsFromAPI();
            
            console.log('API ready');
        } else {
            console.log('API initialization pending or failed:', result?.error);
        }
    } catch (error) {
        console.error('Failed to initialize API:', error);
    }
}

/**
 * Handle new submission data
 * @param {Object} submission - New submission data
 */
function handleRealtimeUpdate(submission) {
    console.log('New submission received:', submission);
    
    // Update local stats cache
    updateStatsCache(submission);
    
    // Update UI with new stats
    updateStatsDisplay();
    
    // Check for milestone achievements
    checkMilestonesFromCache();
    
    // Show notification for new activity (subtle toast)
    showActivityNotification(submission);
}

/**
 * Update stats cache with new submission
 * @param {Object} submission - New submission
 */
function updateStatsCache(submission) {
    if (!submission || !submission.activity_type) return;
    
    const type = submission.activity_type;
    
    switch (type) {
        case 'guestbook':
            statsCache.guestbook_count++;
            break;
        case 'baby_pool':
            statsCache.pool_count++;
            break;
        case 'quiz':
            statsCache.quiz_count++;
            break;
        case 'advice':
            statsCache.advice_count++;
            break;
        case 'voting':
            if (submission.activity_data && submission.activity_data.names) {
                submission.activity_data.names.forEach(name => {
                    statsCache.votes[name] = (statsCache.votes[name] || 0) + 1;
                });
            }
            break;
    }
    
    statsCache.lastUpdated = new Date();
}

/**
 * Refresh stats from API (initial load or fallback)
 */
async function refreshStatsFromAPI() {
    try {
        // Add loading state to stats displays
        const statsDisplays = document.querySelectorAll('.stats-display');
        statsDisplays.forEach(display => {
            display.classList.add('stats-loading');
        });
        
        const stats = {
            guestbook_count: 0,
            pool_count: 0,
            quiz_count: 0,
            advice_count: 0
        };
        
        // Get counts for each activity type
        const activities = ['guestbook', 'pool', 'quiz', 'advice'];
        for (const activity of activities) {
            try {
                const submissions = await window.API.getSubmissions(activity);
                stats[activity + '_count'] = submissions.length || 0;
            } catch (e) {
                console.warn(`Failed to get ${activity} submissions:`, e.message);
            }
        }
        
        statsCache.guestbook_count = stats.guestbook_count;
        statsCache.pool_count = stats.pool_count;
        statsCache.quiz_count = stats.quiz_count;
        statsCache.advice_count = stats.advice_count;
        statsCache.lastUpdated = new Date();
        
        // Remove loading state
        statsDisplays.forEach(display => {
            display.classList.remove('stats-loading');
        });
        
        updateStatsDisplay();
        console.log('Stats loaded:', statsCache);
    } catch (error) {
        console.error('Failed to load stats from API:', error);
        // Remove loading state even on error
        const statsDisplays = document.querySelectorAll('.stats-display');
        statsDisplays.forEach(display => {
            display.classList.remove('stats-loading');
        });
    }
}

/**
 * Update stats display elements
 */
function updateStatsDisplay() {
    // Update all stat counters on the page
    const statElements = {
        'guestbook-count': statsCache.guestbook_count,
        'pool-count': statsCache.pool_count,
        'quiz-count': statsCache.quiz_count,
        'advice-count': statsCache.advice_count
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            // Add pulse animation
            el.classList.add('stat-updated');
            setTimeout(() => el.classList.remove('stat-updated'), 500);
        }
    });
    
    // Update vote counts
    Object.entries(statsCache.votes).forEach(([name, count]) => {
        const el = document.getElementById(`vote-count-${name}`);
        if (el) {
            el.textContent = count;
        }
    });
    
    // Update total votes
    const totalVotes = Object.values(statsCache.votes).reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('total-votes');
    if (totalEl) {
        totalEl.textContent = totalVotes;
    }
}

/**
 * Check milestones from current stats cache
 */
function checkMilestonesFromCache() {
    const milestones = CONFIG.MILESTONES;
    const newlyUnlocked = [];
    
    // Check each milestone threshold
    if (statsCache.guestbook_count === milestones.GUESTBOOK_5) {
        newlyUnlocked.push('GUESTBOOK_5');
    }
    if (statsCache.guestbook_count === milestones.GUESTBOOK_10) {
        newlyUnlocked.push('GUESTBOOK_10');
    }
    if (statsCache.guestbook_count === milestones.GUESTBOOK_20) {
        newlyUnlocked.push('GUESTBOOK_20');
    }
    if (statsCache.pool_count === milestones.POOL_10) {
        newlyUnlocked.push('POOL_10');
    }
    if (statsCache.pool_count === milestones.POOL_20) {
        newlyUnlocked.push('POOL_20');
    }
    if (statsCache.quiz_count === milestones.QUIZ_25) {
        newlyUnlocked.push('QUIZ_25');
    }
    if (statsCache.quiz_count === milestones.QUIZ_50) {
        newlyUnlocked.push('QUIZ_50');
    }
    if (statsCache.advice_count === milestones.ADVICE_10) {
        newlyUnlocked.push('ADVICE_10');
    }
    if (statsCache.advice_count === milestones.ADVICE_20) {
        newlyUnlocked.push('ADVICE_20');
    }
    
    const totalVotes = Object.values(statsCache.votes).reduce((a, b) => a + b, 0);
    if (totalVotes === milestones.VOTES_50) {
        newlyUnlocked.push('VOTES_50');
    }
    
    // Show milestone modals for newly unlocked milestones
    newlyUnlocked.forEach(key => {
        showMilestoneSurprise(key);
    });
}

/**
 * Show subtle notification for new activity
 * @param {Object} submission - New submission
 */
function showActivityNotification(submission) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'activity-toast';
    
    const typeLabels = {
        guestbook: 'New wish!',
        baby_pool: 'New prediction!',
        quiz: 'Quiz completed!',
        advice: 'New advice!',
        voting: 'New vote!'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${getActivityIcon(submission.activity_type)}</span>
        <span class="toast-text">${typeLabels[submission.activity_type] || 'New activity!'}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Get icon for activity type
 * @param {string} type - Activity type
 * @returns {string} Emoji icon
 */
function getActivityIcon(type) {
    const icons = {
        guestbook: '💌',
        baby_pool: '🎯',
        quiz: '🧩',
        advice: '💡',
        voting: '🗳️'
    };
    return icons[type] || '✨';
}

/**
 * Initialize navigation between sections
 */
function initializeNavigation() {
    const activityButtons = document.querySelectorAll('.activity-card');
    
    if (activityButtons.length === 0) {
        console.warn('No activity cards found in DOM');
        return;
    }

    activityButtons.forEach(button => {
        // Remove any existing listeners to prevent duplicates
        button.removeEventListener('click', handleActivityClick);
        button.addEventListener('click', handleActivityClick);
    });
    
    console.log(`Navigation initialized with ${activityButtons.length} activity cards`);
}

// Separate handler function for proper event management
function handleActivityClick(event) {
    const button = event.currentTarget;
    const sectionName = button.getAttribute('data-section');
    
    if (!sectionName) {
        console.error('Activity card missing data-section attribute');
        return;
    }
    
    console.log(`Activity clicked: ${sectionName}`);
    navigateToSection(sectionName);
}

/**
 * Navigate to a specific section
 * @param {string} sectionName - Name of the section to navigate to
 */
function navigateToSection(sectionName) {
    console.log(`navigateToSection called with: ${sectionName}`);
    
    if (!sectionName) {
        console.error('navigateToSection: sectionName is null or empty');
        return;
    }
    
    // Hide current section
    const currentSectionEl = document.getElementById(`${currentSection}-section`);
    if (currentSectionEl) {
        currentSectionEl.classList.remove('active');
        currentSectionEl.classList.add('hidden');
        console.log(`Hid section: ${currentSection}-section`);
    } else {
        console.warn(`Current section element not found: ${currentSection}-section`);
    }

    // Show new section
    const newSectionEl = document.getElementById(`${sectionName}-section`);
    if (newSectionEl) {
        newSectionEl.classList.remove('hidden');
        newSectionEl.classList.add('active');
        newSectionEl.classList.add('fade-in');
        console.log(`Showed section: ${sectionName}-section`);
    } else {
        console.error(`Target section element not found: ${sectionName}-section`);
        return;
    }

    // Update current section
    currentSection = sectionName;
    console.log(`Current section updated to: ${currentSection}`);

    // Initialize section-specific functionality
    initializeSection(sectionName);
}

/**
 * Initialize section-specific functionality
 * @param {string} sectionName - Name of the section
 */
function initializeSection(sectionName) {
    switch(sectionName) {
        case 'voting':
            initializeVoting();
            break;
        case 'pool':
            loadPoolStats();
            break;
        default:
            break;
    }
}

/**
 * Initialize all forms
 */
function initializeForms() {
    // Guestbook form
    const guestbookForm = document.getElementById('guestbook-form');
    if (guestbookForm) {
        guestbookForm.addEventListener('submit', handleGuestbookSubmit);
    }

    // Pool form
    const poolForm = document.getElementById('pool-form');
    if (poolForm) {
        poolForm.addEventListener('submit', handlePoolSubmit);
    }

    // Quiz form
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', handleQuizSubmit);
    }

    // Advice form
    const adviceForm = document.getElementById('advice-form');
    if (adviceForm) {
        adviceForm.addEventListener('submit', handleAdviceSubmit);
    }

    // Photo preview
    const photoInput = document.getElementById('guestbook-photo');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoPreview);
    }
}

/**
 * Initialize back buttons
 */
function initializeBackButtons() {
    const backButtons = document.querySelectorAll('.back-btn');

    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            navigateToSection('welcome');
        });
    });
}

/**
 * Validate form before submission
 * @param {HTMLFormElement} form - Form to validate
 * @returns {boolean} - True if valid
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const formGroup = input.closest('.form-group');
        
        // Remove previous error state
        formGroup?.classList.remove('error');
        const existingError = formGroup?.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Check if field is valid
        if (!value) {
            isValid = false;
            formGroup?.classList.add('error');
            
            // Add error message
            if (!firstInvalidField) {
                firstInvalidField = input;
            }
            
            const errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'This field is required';
            formGroup?.appendChild(errorMsg);
        }
    });
    
    // Focus first invalid field
    if (firstInvalidField) {
        firstInvalidField.focus();
    }
    
    return isValid;
}

/**
 * Handle guestbook form submission
 * @param {Event} event - Form submit event
 */
async function handleGuestbookSubmit(event) {
    event.preventDefault();

    const form = event.target;
    
    // Validate form first
    if (!validateForm(form)) {
        // Validation will show error messages
        return;
    }

    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        relationship: formData.get('relationship'),
        message: formData.get('message')
    };

    const photoInput = document.getElementById('guestbook-photo');
    const photoFile = photoInput ? photoInput.files[0] : null;
    const submitBtn = form.querySelector('.submit-btn');

    try {
        // Add loading state to submit button
        if (submitBtn) {
            submitBtn.classList.add('api-loading');
            submitBtn.disabled = true;
        }
        
        showLoading();

        const response = await submitGuestbook(data, photoFile);
        const processedResponse = handleResponse(response);

        // Check for 50-submission milestone
        if (response?.milestone?.triggered) {
            triggerMilestoneCelebration(response.milestone);
        }

        hideLoading();
        
        // Remove loading state from submit button
        if (submitBtn) {
            submitBtn.classList.remove('api-loading');
            submitBtn.disabled = false;
        }
        
        // Show inline success message
        showFormSuccessMessage('Thank you for your message!', form);
        triggerConfetti();

        // Update personal progress
        updatePersonalProgress('guestbook');

        // Reset form and re-populate name
        form.reset();
        repopulateNameField('guestbook-name');
        clearPhotoPreview();

    } catch (error) {
        hideLoading();
        
        // Remove loading state from submit button
        if (submitBtn) {
            submitBtn.classList.remove('api-loading');
            submitBtn.disabled = false;
        }
        
        showError(error);
    }
}

/**
 * Handle pool form submission
 * @param {Event} event - Form submit event
 */
async function handlePoolSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        dateGuess: formData.get('dateGuess'),
        timeGuess: formData.get('timeGuess'),
        weightGuess: formData.get('weightGuess'),
        lengthGuess: formData.get('lengthGuess')
    };

    try {
        showLoading();

        const response = await submitPool(data);
        const processedResponse = handleResponse(response);

        // Check for 50-submission milestone
        if (response?.milestone?.triggered) {
            triggerMilestoneCelebration(response.milestone);
        }

        hideLoading();
        
        // Get success message and roast from response
        const successResult = getPoolSuccessMessage(data.name, response.roast);
        
        // Display the roast if available
        if (response.roast) {
            displayRoast(response.roast);
        }
        
        // Show inline success message
        showFormSuccessMessage(successResult.message, form);
        triggerConfetti();

        // Update personal progress
        updatePersonalProgress('pool');

        // Refresh stats
        loadPoolStats();

        // Reset form and re-populate name
        form.reset();
        repopulateNameField('pool-name');

    } catch (error) {
        hideLoading();
        showError(error);
    }
}

/**
 * Handle quiz form submission
 * @param {Event} event - Form submit event
 */
async function handleQuizSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Calculate score BEFORE API call to show immediately
    const answers = {
        puzzle1: formData.get('puzzle1')?.trim() || '',
        puzzle2: formData.get('puzzle2')?.trim() || '',
        puzzle3: formData.get('puzzle3')?.trim() || '',
        puzzle4: formData.get('puzzle4')?.trim() || '',
        puzzle5: formData.get('puzzle5')?.trim() || ''
    };
    const score = calculateQuizScore(answers);
    
    const data = {
        name: formData.get('name'),
        ...answers,
        score: score,
        totalQuestions: 5,
        percentage: Math.round((score / 5) * 100)
    };

    try {
        showLoading();

        const response = await submitQuiz(data);
        const processedResponse = handleResponse(response);

        // Check for 50-submission milestone
        if (response?.milestone?.triggered) {
            triggerMilestoneCelebration(response.milestone);
        }

        hideLoading();
        
        // Show success message with pre-calculated score
        showFormSuccessMessage(getQuizSuccessMessage(data.name, score), form);
        triggerConfetti();

        // Update personal progress
        updatePersonalProgress('quiz');

        // Reset form (but show score first in the message above) and re-populate name
        form.reset();
        repopulateNameField('quiz-name');

    } catch (error) {
        hideLoading();
        showError(error);
    }
}

/**
 * Handle advice form submission
 * @param {Event} event - Form submit event
 */
async function handleAdviceSubmit(event) {
    event.preventDefault();

    const form = event.target;
    
    // Validate form first
    if (!validateForm(form)) {
        // Validation will show error messages
        return;
    }

    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        adviceType: formData.get('adviceType'),
        message: formData.get('message')
    };

    const submitBtn = form.querySelector('.submit-btn');

    try {
        // Add loading state to submit button
        if (submitBtn) {
            submitBtn.classList.add('api-loading');
            submitBtn.disabled = true;
        }
        
        showLoading();

        const response = await submitAdvice(data);
        const processedResponse = handleResponse(response);

        // Check for 50-submission milestone
        if (response?.milestone?.triggered) {
            triggerMilestoneCelebration(response.milestone);
        }

        hideLoading();
        
        // Show inline success message
        showFormSuccessMessage('Thank you for your advice!', form);
        triggerConfetti();

        // Update personal progress
        updatePersonalProgress('advice');

        // Reset form and re-populate name
        form.reset();
        repopulateNameField('advice-name');

    } catch (error) {
        hideLoading();
        showError(error);
    }
}

/**
 * Handle photo preview
 * @param {Event} event - File input change event
 */
function handlePhotoPreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('photo-preview');

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Photo preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        clearPhotoPreview();
    }
}

/**
 * Clear photo preview
 */
function clearPhotoPreview() {
    const previewContainer = document.getElementById('photo-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Show success modal
 * @param {string} message - Success message
 */
function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    const messageEl = document.getElementById('success-message');

    if (modal && messageEl) {
        messageEl.textContent = message;
        modal.classList.remove('hidden');
    }
}

/**
 * Close success modal
 */
function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Show milestone modal
 * @param {string} milestoneKey - Milestone key
 */
function showMilestoneSurprise(milestoneKey) {
    const modal = document.getElementById('milestone-modal');
    const titleEl = document.getElementById('milestone-title');
    const messageEl = document.getElementById('milestone-message');
    const iconEl = document.getElementById('milestone-icon');

    const milestone = MILESTONE_CONTENT[milestoneKey];

    if (modal && milestone) {
        titleEl.textContent = milestone.title;
        messageEl.textContent = milestone.message;
        iconEl.textContent = milestone.icon;

        modal.classList.remove('hidden');
        triggerConfetti();
    }
}

/**
 * Close milestone modal
 */
function closeMilestoneModal() {
    const modal = document.getElementById('milestone-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }

    document.body.appendChild(container);

    // Remove confetti after animation
    setTimeout(() => {
        document.body.removeChild(container);
    }, 5000);
}

/**
 * Load personal progress from localStorage
 */
function loadPersonalProgress() {
    const progress = localStorage.getItem('babyShowerProgress');
    if (progress) {
        return JSON.parse(progress);
    }
    return {
        guestbook: 0,
        pool: 0,
        quiz: 0,
        advice: 0,
        votes: 0
    };
}

/**
 * Update personal progress
 * @param {string} feature - Feature name
 */
function updatePersonalProgress(feature) {
    const progress = loadPersonalProgress();
    progress[feature] = (progress[feature] || 0) + 1;
    localStorage.setItem('babyShowerProgress', JSON.stringify(progress));
}

/**
 * Get personal progress for a feature
 * @param {string} feature - Feature name
 * @returns {number} Progress count
 */
function getPersonalProgress(feature) {
    const progress = loadPersonalProgress();
    return progress[feature] || 0;
}

// Make functions globally available
window.closeModal = closeModal;
window.closeMilestoneModal = closeMilestoneModal;
window.getGuestName = getGuestName;
window.setGuestName = setGuestName;
window.triggerMilestoneCelebration = triggerMilestoneCelebration;
window.handleActivityClick = handleActivityClick;
window.navigateToSection = navigateToSection;

/**
 * Show error message as toast notification
 * @param {string|object} error - Error message or object
 */
function showError(error) {
    const message = typeof error === 'object' ? (error.message || JSON.stringify(error)) : error;
    showToast(message, 'error');
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.classList.add('hide');
        setTimeout(() => existingToast.remove(), 400);
    }
    
    // Create toast container if needed
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">×</button>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

/**
 * Show inline form success message
 * @param {string} message - Success message to display
 * @param {HTMLFormElement|string} form - Form element or form ID
 */
function showFormSuccessMessage(message, form) {
    // Remove any existing success messages in the form
    const existingMsg = document.querySelector('.form-success-message');
    if (existingMsg) {
        existingMsg.remove();
    }

    // Get form element if form ID was passed
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return;

    // Create success message element
    const msgEl = document.createElement('div');
    msgEl.className = 'form-success-message';
    msgEl.textContent = message;

    // Insert after the form
    formEl.parentNode.insertBefore(msgEl, formEl.nextSibling);

    // Auto-hide after 4 seconds
    setTimeout(() => {
        msgEl.style.animation = 'fadeInSlide 0.3s ease-out reverse';
        setTimeout(() => msgEl.remove(), 300);
    }, 4000);
}

/**
 * Handle API response
 * @param {object} response - Response from API
 * @returns {object} Processed response
 */
function handleResponse(response) {
    if (response.error) {
        throw new Error(response.error.message || 'Submission failed');
    }
    return {
        success: true,
        data: response.data || { message: 'Submission successful!' }
    };
}

/**
 * Submit guestbook entry using Supabase Edge Functions
 */
async function submitGuestbook(data, photoFile) {
    return await window.API.submitGuestbook({
        name: data.name,
        relationship: data.relationship,
        message: data.message
    });
}

/**
 * Submit pool prediction using Supabase Edge Functions
 */
async function submitPool(data) {
    // Build complete prediction string with all fields
    const prediction = `Date: ${data.dateGuess || ''}, Time: ${data.timeGuess || ''}, Weight: ${data.weightGuess || ''}kg, Length: ${data.lengthGuess || ''}cm`;
    
    return await window.API.submitPool({
        name: data.name?.trim() || '',
        prediction: prediction,
        dueDate: data.dateGuess || ''
    });
}

/**
 * Submit quiz answers using Supabase Edge Functions
 */
async function submitQuiz(data) {
    return await window.API.submitQuiz({
        name: data.name,
        answers: {
            puzzle1: data.puzzle1,
            puzzle2: data.puzzle2,
            puzzle3: data.puzzle3,
            puzzle4: data.puzzle4,
            puzzle5: data.puzzle5
        }
    });
}

/**
 * Submit advice using Supabase Edge Functions
 */
async function submitAdvice(data) {
    // Map adviceType to category before sending
    const adviceType = data.adviceType?.trim() || '';
    const categoryMap = {
        'For Parents': 'general',
        'For Baby': 'fun',
    };
    const category = categoryMap[adviceType] || adviceType.toLowerCase();
    
    return await window.API.submitAdvice({
        name: data.name,
        category: category,
        advice: data.message
    });
}

/**
 * Load pool statistics
 */
async function loadPoolStats() {
    try {
        await refreshStatsFromAPI();
    } catch (error) {
        console.error('Failed to load pool stats:', error);
    }
}

// ========================================
// ACTIVITY TICKER - SUPABASE REALTIME
// ========================================

// Ticker state
const tickerState = {
    activities: [],
    maxActivities: 15,
    currentIndex: 0,
    intervalId: null,
    channel: null
};

// Format activity message based on type
function formatActivityMessage(submission) {
    const type = submission.activity_type;
    const data = submission.activity_data;
    const guestName = data?.name || 'Someone';
    
    const messages = {
        voting: () => {
            const names = data?.names;
            if (Array.isArray(names) && names.length > 0) {
                const namesStr = names.length === 1 
                    ? names[0] 
                    : names.length === 2 
                        ? names.join(' and ')
                        : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
                return `${guestName} voted for ${namesStr}!`;
            }
            return `${guestName} cast a vote!`;
        },
        guestbook: () => {
            const message = data?.message;
            if (message && message.length > 30) {
                return `"${guestName}" left a wish!`;
            }
            return `${guestName} left a beautiful message!`;
        },
        pool: () => {
            const prediction = data?.prediction;
            if (prediction) {
                // Extract key info from prediction
                const weightMatch = prediction.match(/Weight:\s*([\d.]+)kg/);
                const weight = weightMatch ? ` (${weightMatch[1]}kg)` : '';
                return `${guestName} predicted baby${weight}!`;
            }
            return `${guestName} made a prediction!`;
        },
        quiz: () => {
            const score = data?.score;
            const total = data?.totalQuestions || 5;
            if (typeof score === 'number') {
                return `${guestName} scored ${score}/${total} on the quiz!`;
            }
            return `${guestName} completed the quiz!`;
        },
        advice: () => {
            const category = data?.category;
            if (category === 'fun' || data?.adviceType?.includes('Baby')) {
                return `${guestName} sealed a time capsule!`;
            }
            return `${guestName} shared wisdom!`;
        }
    };
    
    if (messages[type]) {
        return messages[type]();
    }
    
    return `${guestName} participated!`;
}

// Get icon for activity type
function getTickerIcon(type) {
    const icons = {
        voting: '❤️',
        guestbook: '💌',
        pool: '🎯',
        quiz: '🧩',
        advice: '💡'
    };
    return icons[type] || '✨';
}

// Add activity to ticker
function addTickerActivity(submission) {
    const message = formatActivityMessage(submission);
    const icon = getTickerIcon(submission.activity_type);
    
    tickerState.activities.unshift({
        message,
        icon,
        timestamp: Date.now()
    });
    
    // Limit to max activities
    if (tickerState.activities.length > tickerState.maxActivities) {
        tickerState.activities = tickerState.activities.slice(0, tickerState.maxActivities);
    }
    
    // Show ticker if hidden
    showActivityTicker();
    
    // Update display
    updateTickerDisplay();
    
    console.log('📰 Activity added to ticker:', message);
}

// Update ticker display
function updateTickerDisplay() {
    const messageEl = document.getElementById('ticker-message');
    if (!messageEl) return;
    
    if (tickerState.activities.length === 0) {
        messageEl.textContent = 'Waiting for activity...';
        return;
    }
    
    const current = tickerState.activities[tickerState.currentIndex];
    messageEl.innerHTML = `<span class="ticker-icon">${current.icon}</span> ${current.message}`;
}

// Show ticker
function showActivityTicker() {
    const ticker = document.getElementById('activity-ticker');
    if (ticker) {
        ticker.classList.remove('hidden');
    }
}

// Close ticker
window.closeActivityTicker = function() {
    const ticker = document.getElementById('activity-ticker');
    if (ticker) {
        ticker.classList.add('hidden');
    }
};

// Cycle through activities
function cycleTickerActivities() {
    if (tickerState.activities.length <= 1) return;
    
    tickerState.currentIndex = (tickerState.currentIndex + 1) % tickerState.activities.length;
    updateTickerDisplay();
}

// Start ticker cycling
function startTickerCycling() {
    if (tickerState.intervalId) {
        clearInterval(tickerState.intervalId);
    }
    
    // Cycle every 5 seconds if there are multiple activities
    tickerState.intervalId = setInterval(() => {
        if (tickerState.activities.length > 1) {
            cycleTickerActivities();
        }
    }, 5000);
}

// Get Supabase client for realtime
function getSupabaseClientForTicker() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    
    const supabaseUrl = window.CONFIG?.SUPABASE?.URL;
    const supabaseKey = window.CONFIG?.SUPABASE?.ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        return null;
    }
    
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        return window.supabaseClient;
    }
    
    return null;
}

// Initialize activity ticker realtime subscription
function initializeActivityTicker() {
    const client = getSupabaseClientForTicker();
    if (!client) {
        console.warn('Activity ticker not available - no Supabase client');
        return null;
    }
    
    try {
        const channel = client
            .channel('activity-ticker-' + Date.now())
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'submissions'
            }, (payload) => {
                if (payload.new) {
                    addTickerActivity(payload.new);
                }
            })
            .subscribe((status) => {
                console.log('📰 Activity ticker subscription status:', status);
            });
        
        console.log('✅ Subscribed to activity ticker updates');
        tickerState.channel = channel;
        return channel;
    } catch (error) {
        console.error('Failed to subscribe to activity ticker:', error);
        return null;
    }
}

// Cleanup ticker on page unload
function cleanupTicker() {
    if (tickerState.intervalId) {
        clearInterval(tickerState.intervalId);
    }
    
    if (tickerState.channel) {
        const client = getSupabaseClientForTicker();
        if (client) {
            client.removeChannel(tickerState.channel);
        }
    }
}

// Initialize ticker after API is ready
function initializeTickerAfterAPI() {
    // Wait for API to initialize, then setup ticker
    setTimeout(() => {
        initializeActivityTicker();
        startTickerCycling();
        console.log('✅ Activity ticker initialized');
    }, 1500);
}

// Hook into existing initialization
const originalInitializeAPI = initializeAPI;
initializeAPI = async function() {
    const result = await originalInitializeAPI();
    initializeTickerAfterAPI();
    return result;
};

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupTicker);
