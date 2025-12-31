// Baby Shower App - Guestbook Feature

/**
 * Initialize guestbook-specific functionality
 */
function initializeGuestbook() {
    // Any guestbook-specific initialization can go here
    // Currently handled in main.js
}

/**
 * Validate guestbook form
 * @param {HTMLFormElement} form - Guestbook form
 * @returns {boolean} Valid or not
 */
function validateGuestbookForm(form) {
    const name = form.querySelector('#guestbook-name').value.trim();
    const relationship = form.querySelector('#guestbook-relationship').value;
    const message = form.querySelector('#guestbook-message').value.trim();

    if (!name) {
        alert('Please enter your name');
        return false;
    }

    if (!relationship) {
        alert('Please select your relationship');
        return false;
    }

    if (!message) {
        alert('Please enter a message');
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
 * Get guestbook form data
 * @param {HTMLFormElement} form - Guestbook form
 * @returns {Object} Form data
 */
function getGuestbookFormData(form) {
    return {
        name: form.querySelector('#guestbook-name').value.trim(),
        relationship: form.querySelector('#guestbook-relationship').value,
        message: form.querySelector('#guestbook-message').value.trim()
    };
}

/**
 * Reset guestbook form
 * @param {HTMLFormElement} form - Guestbook form
 */
function resetGuestbookForm(form) {
    form.reset();
    clearPhotoPreview();
}

/**
 * Show guestbook success message
 * @param {string} name - Guest name
 * @returns {string} Success message
 */
function getGuestbookSuccessMessage(name) {
    const messages = [
        `Thank you ${name}! Your wish has been saved!`,
        `Wonderful ${name}! Baby will love your message!`,
        `Thanks ${name}! Your wish means so much to us!`,
        `${name}, your message is perfect! Thank you!`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get personal guestbook progress
 * @returns {number} Number of guestbook entries
 */
function getGuestbookProgress() {
    return getPersonalProgress('guestbook');
}

/**
 * Check if guestbook milestone should be shown
 * @param {number} count - Current guestbook count
 * @returns {string|null} Milestone key or null
 */
function checkGuestbookMilestone(count) {
    if (count === CONFIG.MILESTONES.GUESTBOOK_5) {
        return 'GUESTBOOK_5';
    } else if (count === CONFIG.MILESTONES.GUESTBOOK_10) {
        return 'GUESTBOOK_10';
    } else if (count === CONFIG.MILESTONES.GUESTBOOK_20) {
        return 'GUESTBOOK_20';
    }
    return null;
}

/**
 * Get guestbook milestone message
 * @param {number} count - Current guestbook count
 * @returns {string} Milestone message
 */
function getGuestbookMilestoneMessage(count) {
    if (count === CONFIG.MILESTONES.GUESTBOOK_5) {
        return "You've helped fill 5 wishes! Here's a fun fact: Babies can recognize their mother's voice at birth!";
    } else if (count === CONFIG.MILESTONES.GUESTBOOK_10) {
        return "10 messages collected! Baby is already so loved by everyone!";
    } else if (count === CONFIG.MILESTONES.GUESTBOOK_20) {
        return "20 wishes and counting! This baby will have so much love and support!";
    }
    return "";
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeGuestbook,
        validateGuestbookForm,
        getGuestbookFormData,
        resetGuestbookForm,
        getGuestbookSuccessMessage,
        getGuestbookProgress,
        checkGuestbookMilestone,
        getGuestbookMilestoneMessage
    };
}
