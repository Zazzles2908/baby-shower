// Baby Shower App - Name Voting Feature - PROPERLY SCOPED

(function() {
    'use strict';
    
    console.log('🗳️ Voting module loading (properly scoped)...');

    // Use local variables inside IIFE to avoid global conflicts
    let votingState = {
        selectedVotes: [],
        voteCounts: {}
    };

    // Make initializeVoting globally available
    window.initializeVoting = function() {
        console.log('🗳️ initializeVoting() called');
        
        const nameList = document.getElementById('name-list');
        const voteSubmit = document.getElementById('vote-submit');

        if (!nameList || !voteSubmit) {
            console.error('❌ Voting elements not found');
            return;
        }

        // Clear existing content
        nameList.innerHTML = '';
        votingState.selectedVotes = [];

        // Check if baby names are configured
        if (!window.CONFIG || !window.CONFIG.BABY_NAMES) {
            console.error('❌ No baby names configured');
            nameList.innerHTML = '<p style="color:red">Error: Baby names not configured</p>';
            return;
        }

        console.log(`✅ Found ${window.CONFIG.BABY_NAMES.length} baby names`);

        // Create name items
        window.CONFIG.BABY_NAMES.forEach((name, index) => {
            const nameItem = document.createElement('div');
            nameItem.className = 'name-item';
            nameItem.innerHTML = `
                <div class="name">${name}</div>
                <button class="heart-btn" onclick="window.votingToggle('${name}', this)">🤍</button>
                <div class="vote-count" id="vote-count-${index}">0 votes</div>
            `;
            nameList.appendChild(nameItem);
        });

        console.log('✅ Created all name items');

        // Initialize vote submit button
        voteSubmit.addEventListener('click', window.votingSubmit);
        voteSubmit.disabled = true;
        
        console.log('🗳️ Voting initialized successfully!');
    };

    // Make toggleVote globally available
    window.votingToggle = function(name, button) {
        console.log(`❤️ toggleVote: ${name}`);
        
        const index = votingState.selectedVotes.indexOf(name);

        if (index > -1) {
            votingState.selectedVotes.splice(index, 1);
            button.textContent = '🤍';
            button.classList.remove('liked');
        } else {
            if (votingState.selectedVotes.length >= window.CONFIG.UI.MAX_VOTES_PER_GUEST) {
                alert(`You can only vote for ${window.CONFIG.UI.MAX_VOTES_PER_GUEST} names`);
                return;
            }
            votingState.selectedVotes.push(name);
            button.textContent = '❤️';
            button.classList.add('liked');
        }

        document.getElementById('vote-submit').disabled = votingState.selectedVotes.length === 0;
        console.log('❤️ Current votes:', votingState.selectedVotes);
    };

    // Make handleVoteSubmit globally available
    window.votingSubmit = async function(event) {
        console.log('🗳️ handleVoteSubmit called');
        event.preventDefault();

        if (votingState.selectedVotes.length === 0) {
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
            selectedNames: votingState.selectedVotes
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
            votingState.selectedVotes = [];
            document.querySelectorAll('.heart-btn').forEach(btn => {
                btn.textContent = '🤍';
                btn.classList.remove('liked');
            });
            document.getElementById('vote-submit').disabled = true;

        } catch (error) {
            console.error('❌ Submit failed:', error);
            alert('Error submitting votes: ' + error.message);
        }
    };

    console.log('🗳️ Voting module fully loaded with proper scoping');
})();

// Wait for config to be available before initializing
function waitForConfig(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
        if (window.CONFIG && window.CONFIG.BABY_NAMES) {
            console.log('✅ CONFIG.BABY_NAMES is now available');
            callback();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`⏳ Waiting for CONFIG... attempt ${attempts}/${maxAttempts}`);
            setTimeout(check, 100);
        } else {
            console.error('❌ CONFIG.BABY_NAMES never became available');
            const nameList = document.getElementById('name-list');
            if (nameList) {
                nameList.innerHTML = '<p style="color:red">Error: Baby names failed to load within 5 seconds</p>';
            }
        }
    }
    
    check();
}

// Replace the immediate window.initializeVoting assignment with a version that waits
const originalInitialize = window.initializeVoting;
window.initializeVoting = function() {
    console.log('🗳️ initializeVoting called - will wait for config');
    waitForConfig(originalInitialize);
};

console.log('🗳️ Voting module configured to wait for CONFIG');
