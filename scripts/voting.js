// This is the actual fix - single instance, no race conditions
(function() {
    'use strict';
    
    // Prevent multiple instances
    if (window.votingInitialized) {
        console.log('Voting already initialized, skipping');
        return;
    }
    
    console.log('🗳️ Voting module v2.0 loading...');
    
    // Voting state with localStorage persistence
    const VOTING_STATE_KEY = 'babyShowerVotingState';
    
    function loadVotingState() {
        try {
            const saved = localStorage.getItem(VOTING_STATE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading voting state:', e);
        }
        return { selected: [], hasVoted: false };
    }
    
    function saveVotingState(state) {
        try {
            localStorage.setItem(VOTING_STATE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Error saving voting state:', e);
        }
    }
    
    const votingState = loadVotingState();
    votingState.maxVotes = 3;
    votingState.initialized = false;
    
    // Only initialize once DOM is ready AND CONFIG is available
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🗳️ DOM ready, checking CONFIG...');
        
        // If CONFIG already available, init now
        if (window.CONFIG && window.CONFIG.BABY_NAMES) {
            console.log('✅ CONFIG already available');
            init();
        } else {
            // Wait up to 5 seconds
            let attempts = 0;
            const check = () => {
                if (window.CONFIG && window.CONFIG.BABY_NAMES) {
                    console.log('✅ CONFIG available (attempt ' + attempts + ')');
                    init();
                } else if (attempts++ > 100) {
                    showError();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        }
    });
    
    function init() {
        if (votingState.initialized) return;
        
        const nameList = document.getElementById('name-list');
        const submitBtn = document.getElementById('vote-submit');
        
        if (!nameList || !submitBtn) {
            console.error('Required elements not found');
            return;
        }
        
        createNameItems(window.CONFIG.BABY_NAMES);
        console.log('✅ Voting module created name items for:', window.CONFIG.BABY_NAMES.join(', '));
        submitBtn.addEventListener('click', handleSubmit);
        
        // Restore voting state
        restoreVotingState();
        
        // Update submit button state
        submitBtn.disabled = votingState.selected.length === 0;
        
        votingState.initialized = true;
        console.log('✅ Voting initialized with', window.CONFIG.BABY_NAMES.length, 'names, state:', votingState);
    }
    
    function createNameItems(names) {
        const list = document.getElementById('name-list');
        list.innerHTML = '';
        names.forEach((name, i) => {
            const item = document.createElement('div');
            item.className = 'name-item';
            item.innerHTML = `
                <div class="name">${name}</div>
                <button class="heart-btn" onclick="window.voting.toggle('${name}', this)">🤍</button>
                <div class="vote-count" id="count-${i}">0 votes</div>
            `;
            list.appendChild(item);
        });
    }
    
    function restoreVotingState() {
        const state = loadVotingState();
        
        if (state.hasVoted && votingState.initialized) {
            // User already voted - show their votes and disable voting
            showAlreadyVotedMessage();
            disableVoting();
            return;
        }
        
        // Restore selected votes
        votingState.selected = state.selected || [];
        
        // Update UI to reflect restored state
        const buttons = document.querySelectorAll('.heart-btn');
        buttons.forEach((btn, i) => {
            const name = window.CONFIG.BABY_NAMES[i];
            if (votingState.selected.includes(name)) {
                btn.textContent = '❤️';
                btn.classList.add('liked');
            }
        });
        
        // Update submit button
        const submitBtn = document.getElementById('vote-submit');
        if (submitBtn) {
            submitBtn.disabled = votingState.selected.length === 0;
        }
    }
    
    function showAlreadyVotedMessage() {
        const nameList = document.getElementById('name-list');
        if (!nameList) return;
        
        // Add already voted message
        const msgEl = document.createElement('div');
        msgEl.className = 'form-success-message';
        msgEl.id = 'already-voted-message';
        msgEl.innerHTML = `<strong>You've already voted!</strong><br>Your choices: ${votingState.selected.join(', ')} ❤️`;
        
        // Insert before the name list
        nameList.parentNode.insertBefore(msgEl, nameList);
        
        // Highlight selected items
        const buttons = document.querySelectorAll('.heart-btn');
        buttons.forEach((btn, i) => {
            const name = window.CONFIG.BABY_NAMES[i];
            if (votingState.selected.includes(name)) {
                btn.textContent = '❤️';
                btn.classList.add('liked');
            }
        });
    }
    
    function disableVoting() {
        const buttons = document.querySelectorAll('.heart-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        const submitBtn = document.getElementById('vote-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Already Voted ✅';
        }
    }
    
    function toggleVote(name, button) {
        // Check if already voted
        if (votingState.hasVoted) {
            return; // Don't allow changes after voting
        }
        
        const idx = votingState.selected.indexOf(name);
        if (idx > -1) {
            votingState.selected.splice(idx, 1);
            button.textContent = '🤍';
            button.classList.remove('liked');
        } else {
            if (votingState.selected.length >= votingState.maxVotes) {
                alert('Max 3 votes');
                return;
            }
            votingState.selected.push(name);
            button.textContent = '❤️';
            button.classList.add('liked');
        }
        
        // Save state to localStorage
        saveVotingState({ selected: votingState.selected, hasVoted: false });
        
        document.getElementById('vote-submit').disabled = votingState.selected.length === 0;
    }
    
    async function handleSubmit(event) {
        event.preventDefault();
        
        if (votingState.hasVoted) {
            return; // Already voted
        }
        
        if (votingState.selected.length === 0) return alert('Select at least one');
        
        // Get guest name from storage or prompt
        let name = getGuestName();
        if (!name) {
            name = prompt('Your name:');
            if (!name) return alert('Name required');
        }
        
        try {
            showLoading();
            
            await window.API.submitVote({
                name: name.trim(),
                names: votingState.selected
            });
            
            // Mark as voted and save state
            votingState.hasVoted = true;
            saveVotingState({ selected: votingState.selected, hasVoted: true });
            
            hideLoading();
            
            // Show inline success message
            showVotingSuccessMessage();
            
            // Disable further voting
            disableVoting();
            
        } catch (error) {
            hideLoading();
            alert('Error submitting vote: ' + error.message);
        }
    }
    
    function showVotingSuccessMessage() {
        // Remove any existing success messages
        const existingMsg = document.querySelector('.form-success-message:not(#already-voted-message)');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        // Find the name-list container
        const nameList = document.getElementById('name-list');
        if (!nameList) return;
        
        // Create success message element
        const msgEl = document.createElement('div');
        msgEl.className = 'form-success-message';
        msgEl.innerHTML = `<strong>Thank you for voting!</strong><br>Your choices: ${votingState.selected.join(', ')} ❤️`;
        
        // Insert after the name list
        nameList.parentNode.insertBefore(msgEl, nameList.nextSibling);
    }
    
    function showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    function showError() {
        document.getElementById('name-list').innerHTML = 
            '<p style="color:red; padding:20px;">Error: Failed to load names. Please refresh.</p>';
    }
    
    // Export
    window.voting = { toggle: toggleVote, state: votingState };
    window.initializeVoting = function() {
        console.log('🗳️ initializeVoting() called from main.js');
        // Check CONFIG is ready before calling init, or wait for it
        if (window.CONFIG && window.CONFIG.BABY_NAMES) {
            console.log('✅ CONFIG available, calling init()');
            init();
        } else {
            console.warn('⚠️ CONFIG not ready when initializeVoting() called, waiting...');
            // Wait for CONFIG to become available
            let attempts = 0;
            const check = () => {
                if (window.CONFIG && window.CONFIG.BABY_NAMES) {
                    console.log('✅ CONFIG available (attempt ' + attempts + '), calling init()');
                    init();
                } else if (attempts++ > 100) {
                    console.error('❌ CONFIG never became available');
                    showError();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        }
    };
    window.votingInitialized = true;
    
    console.log('🗳️ Voting module v2.0 loaded and ready');
})();
