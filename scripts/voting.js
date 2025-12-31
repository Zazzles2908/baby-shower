// Baby Shower App - Name Voting Feature

// Global voting state
let selectedVotes = [];
let voteCounts = {};

/**
 * Initialize voting functionality
 */
function initializeVoting() {
    const nameList = document.getElementById('name-list');
    const voteSubmit = document.getElementById('vote-submit');

    if (!nameList || !voteSubmit) {
        return;
    }

    // Clear existing content
    nameList.innerHTML = '';
    selectedVotes = [];

    // Create name items
    CONFIG.BABY_NAMES.forEach((name, index) => {
        const nameItem = createNameItem(name, index);
        nameList.appendChild(nameItem);
    });

    // Initialize vote submit button
    voteSubmit.addEventListener('click', handleVoteSubmit);

    // Load current vote counts
    loadVoteStats();
}

/**
 * Create a name item element
 * @param {string} name - Baby name
 * @param {number} index - Index of the name
 * @returns {HTMLElement} Name item element
 */
function createNameItem(name, index) {
    const item = document.createElement('div');
    item.className = 'name-item';
    item.dataset.name = name;

    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = name;

    const heartBtn = document.createElement('button');
    heartBtn.className = 'heart-btn';
    heartBtn.textContent = '🤍';
    heartBtn.dataset.name = name;
    heartBtn.addEventListener('click', () => toggleVote(name, heartBtn));

    const voteCount = document.createElement('div');
    voteCount.className = 'vote-count';
    voteCount.id = `vote-count-${index}`;
    voteCount.textContent = '0 votes';

    item.appendChild(nameEl);
    item.appendChild(heartBtn);
    item.appendChild(voteCount);

    return item;
}

/**
 * Toggle vote for a name
 * @param {string} name - Baby name
 * @param {HTMLElement} button - Heart button element
 */
function toggleVote(name, button) {
    const index = selectedVotes.indexOf(name);

    if (index > -1) {
        // Remove vote
        selectedVotes.splice(index, 1);
        button.classList.remove('liked');
        button.textContent = '🤍';
    } else {
        // Add vote if under limit
        if (selectedVotes.length >= CONFIG.UI.MAX_VOTES_PER_GUEST) {
            alert(`You can only vote for ${CONFIG.UI.MAX_VOTES_PER_GUEST} names`);
            return;
        }

        selectedVotes.push(name);
        button.classList.add('liked');
        button.textContent = '❤️';
        button.classList.add('heart-animation');

        // Remove animation class after animation completes
        setTimeout(() => {
            button.classList.remove('heart-animation');
        }, 500);
    }

    // Update submit button state
    updateVoteSubmitButton();
}

/**
 * Update vote submit button state
 */
function updateVoteSubmitButton() {
    const voteSubmit = document.getElementById('vote-submit');

    if (voteSubmit) {
        voteSubmit.disabled = selectedVotes.length === 0;
    }
}

/**
 * Handle vote submission
 * @param {Event} event - Click event
 */
async function handleVoteSubmit(event) {
    event.preventDefault();

    if (selectedVotes.length === 0) {
        alert('Please select at least one name to vote for');
        return;
    }

    // Get guest name (could add a form field for this)
    const guestName = prompt('Please enter your name:');

    if (!guestName || !guestName.trim()) {
        alert('Please enter your name');
        return;
    }

    const data = {
        name: guestName.trim(),
        selectedNames: selectedVotes.join(',')
    };

    try {
        showLoading();

        const response = await submitVotes(data);
        const processedResponse = handleResponse(response);

        hideLoading();
        showSuccessModal(processedResponse.data.message);
        triggerConfetti();

        // Update personal progress
        updatePersonalProgress('votes');

        // Refresh vote stats
        loadVoteStats();

        // Reset votes
        resetVotes();

    } catch (error) {
        hideLoading();
        showError(error);
    }
}

/**
 * Reset voting state
 */
function resetVotes() {
    selectedVotes = [];

    // Reset all heart buttons
    const heartBtns = document.querySelectorAll('.heart-btn');
    heartBtns.forEach(btn => {
        btn.classList.remove('liked');
        btn.textContent = '🤍';
    });

    // Update submit button
    updateVoteSubmitButton();
}

/**
 * Load and display vote statistics
 */
async function loadVoteStats() {
    try {
        const stats = await getStats();

        if (stats && stats.voteCounts) {
            updateVoteCounts(stats.voteCounts);
        }
    } catch (error) {
        console.error('Error loading vote stats:', error);
    }
}

/**
 * Update vote counts display
 * @param {Object} voteCounts - Vote counts object
 */
function updateVoteCounts(voteCounts) {
    CONFIG.BABY_NAMES.forEach((name, index) => {
        const voteCountEl = document.getElementById(`vote-count-${index}`);

        if (voteCountEl && voteCounts[name]) {
            voteCountEl.textContent = `${voteCounts[name]} votes`;
        }
    });
}

/**
 * Show voting success message
 * @param {string} name - Guest name
 * @param {number} voteCount - Number of votes cast
 * @returns {string} Success message
 */
function getVotingSuccessMessage(name, voteCount) {
    const messages = [
        `Thanks ${name}! Your ${voteCount} vote${voteCount > 1 ? 's have' : ' has'} been recorded!`,
        `Great choices ${name}! Your votes have been saved!`,
        `${name}, your votes are in! Thanks for helping us name baby!`,
        `Votes saved ${name}! We appreciate your input!`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get personal voting progress
 * @returns {number} Number of voting entries
 */
function getVotingProgress() {
    return getPersonalProgress('votes');
}

/**
 * Check if voting milestone should be shown
 * @param {number} totalVotes - Total votes across all guests
 * @returns {string|null} Milestone key or null
 */
function checkVotingMilestone(totalVotes) {
    if (totalVotes >= CONFIG.MILESTONES.VOTES_50) {
        return 'VOTES_50';
    }
    return null;
}

/**
 * Get voting milestone message
 * @param {number} totalVotes - Total votes
 * @returns {string} Milestone message
 */
function getVotingMilestoneMessage(totalVotes) {
    if (totalVotes >= CONFIG.MILESTONES.VOTES_50) {
        return "50 total votes! Everyone is excited to help name baby!";
    }
    return "";
}

/**
 * Check if a name is a crowd favorite
 * @param {string} name - Baby name
 * @param {number} voteCount - Vote count for the name
 * @returns {boolean} Is crowd favorite
 */
function isCrowdFavorite(name, voteCount) {
    return voteCount >= 10;
}

/**
 * Get crowd favorite message
 * @param {string} name - Baby name
 * @returns {string} Crowd favorite message
 */
function getCrowdFavoriteMessage(name) {
    const messages = [
        `Ooh, ${name} is a crowd favorite! ❤️`,
        `${name} is getting lots of love! 💕`,
        `Everyone loves ${name}! 💖`,
        `${name} is rising to the top! 🌟`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeVoting,
        createNameItem,
        toggleVote,
        updateVoteSubmitButton,
        handleVoteSubmit,
        resetVotes,
        loadVoteStats,
        updateVoteCounts,
        getVotingSuccessMessage,
        getVotingProgress,
        checkVotingMilestone,
        getVotingMilestoneMessage,
        isCrowdFavorite,
        getCrowdFavoriteMessage
    };
}
