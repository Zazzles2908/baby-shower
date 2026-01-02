// This is the actual fix - single instance, no race conditions
(function() {
    'use strict';
    
    // Prevent multiple instances
    if (window.votingInitialized) {
        console.log('Voting already initialized, skipping');
        return;
    }
    
    console.log('🗳️ Voting module v2.0 loading...');
    
    const votingState = {
        selected: [],
        maxVotes: 3,
        initialized: false
    };
    
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
        submitBtn.disabled = true;
        
        votingState.initialized = true;
        console.log('✅ Voting initialized with', window.CONFIG.BABY_NAMES.length, 'names');
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
    
    function toggleVote(name, button) {
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
        document.getElementById('vote-submit').disabled = votingState.selected.length === 0;
    }
    
    async function handleSubmit(event) {
        event.preventDefault();
        if (votingState.selected.length === 0) return alert('Select at least one');
        
        const name = prompt('Your name:');
        if (!name) return alert('Name required');
        
        try {
            await window.API.submitVote({
                name: name.trim(),
                names: votingState.selected
            });
            
            alert('Thanks ' + name + '!');
            votingState.selected = [];
            document.querySelectorAll('.heart-btn').forEach(btn => {
                btn.textContent = '🤍';
                btn.classList.remove('liked');
            });
            document.getElementById('vote-submit').disabled = true;
        } catch (error) {
            alert('Error submitting vote: ' + error.message);
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
