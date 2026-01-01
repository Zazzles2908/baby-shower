// Baby Shower App - Name Voting Feature

console.log('🗳️ Voting module loading...');

// Global voting state
let selectedVotes = [];
let voteCounts = {};

console.log('🗳️ Global variables declared');

/**
 * Initialize voting functionality
 */
function initializeVoting() {
    console.log('🗳️ initializeVoting() called');
    
    const nameList = document.getElementById('name-list');
    const voteSubmit = document.getElementById('vote-submit');

    if (!nameList || !voteSubmit) {
        console.error('❌ Voting elements not found');
        return;
    }

    // Clear existing content
    nameList.innerHTML = '';
    selectedVotes = [];

    // Check if baby names are configured
    if (!CONFIG || !CONFIG.BABY_NAMES) {
        console.error('❌ No baby names configured');
        nameList.innerHTML = '<p style="color:red">Error: Baby names not configured</p>';
        return;
    }

    console.log(`✅ Found ${CONFIG.BABY_NAMES.length} baby names`);

    // Create name items
    CONFIG.BABY_NAMES.forEach((name, index) => {
        const nameItem = document.createElement('div');
        nameItem.className = 'name-item';
        nameItem.innerHTML = `
            <div class="name">${name}</div>
            <button class="heart-btn" onclick="toggleVote('${name}', this)">🤍</button>
            <div class="vote-count" id="vote-count-${index}">0 votes</div>
        `;
        nameList.appendChild(nameItem);
    });

    console.log('✅ Created all name items');

    // Initialize vote submit button
    voteSubmit.addEventListener('click', handleVoteSubmit);
    voteSubmit.disabled = true;
    
    console.log('🗳️ Voting initialized successfully!');
}

/**
 * Toggle vote for a name
 */
function toggleVote(name, button) {
    console.log(`❤️ toggleVote: ${name}`);
    
    const index = selectedVotes.indexOf(name);

    if (index > -1) {
        selectedVotes.splice(index, 1);
        button.textContent = '🤍';
        button.classList.remove('liked');
    } else {
        if (selectedVotes.length >= CONFIG.UI.MAX_VOTES_PER_GUEST) {
            alert(`You can only vote for ${CONFIG.UI.MAX_VOTES_PER_GUEST} names`);
            return;
        }
        selectedVotes.push(name);
        button.textContent = '❤️';
        button.classList.add('liked');
    }

    document.getElementById('vote-submit').disabled = selectedVotes.length === 0;
    console.log('❤️ Current votes:', selectedVotes);
}

/**
 * Handle vote submission
 */
async function handleVoteSubmit(event) {
    console.log('🗳️ handleVoteSubmit called');
    event.preventDefault();

    if (selectedVotes.length === 0) {
        alert('Please select at least one name');
        return;
    }

    const guestName = prompt('Please enter your name:');
    if (!guestName || !guestName.trim()) {
        alert('Please enter your name');
        return;
    }

    const data = {
        name: guestName.trim(),
        selectedNames: selectedVotes
    };

    console.log('🗳️ Submitting data:', data);

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('✅ Vote submitted:', result);
        alert(`Thanks ${guestName}! Your votes have been saved!`);
        
        // Reset
        selectedVotes = [];
        document.querySelectorAll('.heart-btn').forEach(btn => {
            btn.textContent = '🤍';
            btn.classList.remove('liked');
        });
        document.getElementById('vote-submit').disabled = true;

    } catch (error) {
        console.error('❌ Submit failed:', error);
        alert('Error submitting votes: ' + error.message);
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeVoting, toggleVote, handleVoteSubmit };
}

console.log('🗳️ Voting module fully loaded');
