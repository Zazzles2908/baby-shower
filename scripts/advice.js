// Baby Shower App - Advice Capsule Feature

/**
 * Initialize advice-specific functionality
 */
function initializeAdvice() {
    // Any advice-specific initialization can go here
    // Currently handled in main.js
}

/**
 * Validate advice form
 * @param {HTMLFormElement} form - Advice form
 * @returns {boolean} Valid or not
 */
function validateAdviceForm(form) {
    const name = form.querySelector('#advice-name').value.trim();
    const adviceType = form.querySelector('#advice-type').value;
    const message = form.querySelector('#advice-message').value.trim();

    if (!name) {
        alert('Please enter your name');
        return false;
    }

    if (!adviceType) {
        alert('Please select the type of advice');
        return false;
    }

    if (!message) {
        alert('Please enter your message');
        return false;
    }

    if (message.length < 10) {
        alert('Please enter a longer message (at least 10 characters)');
        return false;
    }

    if (message.length > 500) {
        alert('Message is too long (maximum 500 characters)');
        return false;
    }

    return true;
}

/**
 * Get advice form data
 * @param {HTMLFormElement} form - Advice form
 * @returns {Object} Form data
 */
function getAdviceFormData(form) {
    return {
        name: form.querySelector('#advice-name').value.trim(),
        adviceType: form.querySelector('#advice-type').value,
        message: form.querySelector('#advice-message').value.trim()
    };
}

/**
 * Reset advice form
 * @param {HTMLFormElement} form - Advice form
 */
function resetAdviceForm(form) {
    form.reset();
}

/**
 * Show advice success message
 * @param {string} name - Guest name
 * @param {string} adviceType - Type of advice
 * @returns {string} Success message
 */
function getAdviceSuccessMessage(name, adviceType) {
    const forParents = [
        `Thanks ${name}! Your parenting wisdom has been saved!`,
        `Wonderful advice ${name}! This will help us so much!`,
        `${name}, your advice means the world to us! Thank you!`,
        `Parenting tip saved ${name}! We'll treasure this!`
    ];

    const forBaby = [
        `Thanks ${name}! Your wish for baby has been saved!`,
        `Beautiful message ${name}! Baby will love reading this someday!`,
        `${name}, your wish is perfect! We'll save it for baby's 18th birthday!`,
        `Wish saved ${name}! What a thoughtful message!`
    ];

    const messages = adviceType === 'For Parents' ? forParents : forBaby;
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get personal advice progress
 * @returns {number} Number of advice entries
 */
function getAdviceProgress() {
    return getPersonalProgress('advice');
}

/**
 * Check if advice milestone should be shown
 * @param {number} count - Current advice count
 * @returns {string|null} Milestone key or null
 */
function checkAdviceMilestone(count) {
    if (count === CONFIG.MILESTONES.ADVICE_10) {
        return 'ADVICE_10';
    } else if (count === CONFIG.MILESTONES.ADVICE_20) {
        return 'ADVICE_20';
    }
    return null;
}

/**
 * Get advice milestone message
 * @param {number} count - Current advice count
 * @returns {string} Milestone message
 */
function getAdviceMilestoneMessage(count) {
    if (count === CONFIG.MILESTONES.ADVICE_10) {
        return "10 pieces of advice collected! Parenting pro tip #1: Sleep when the baby sleeps (if you can!).";
    } else if (count === CONFIG.MILESTONES.ADVICE_20) {
        return "20 pieces of advice! This baby will have the best guidance growing up!";
    }
    return "";
}

/**
 * Get random parenting tip
 * @returns {string} Parenting tip
 */
function getParentingTip() {
    const tips = [
        "Sleep when the baby sleeps (if you can!)",
        "Trust your instincts - you know your baby best",
        "It's okay to ask for help",
        "Every baby is different - don't compare",
        "Take photos of everything - they grow so fast",
        "Cherish the small moments",
        "Remember: this too shall pass",
        "Self-care isn't selfish",
        "Perfect parents don't exist, good ones do",
        "Love is the most important thing you can give"
    ];

    return tips[Math.floor(Math.random() * tips.length)];
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAdvice,
        validateAdviceForm,
        getAdviceFormData,
        resetAdviceForm,
        getAdviceSuccessMessage,
        getAdviceProgress,
        checkAdviceMilestone,
        getAdviceMilestoneMessage,
        getParentingTip
    };
}
