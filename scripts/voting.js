// Baby Shower App - Name Voting (Clean Rebuild)
(function() {
    'use strict';
    
    console.log('🗳️ Voting module v1.0 loading...');
    
    // State management
    const votingState = {
        selected: [],
        maxVotes: 3,
        initialized: false
    };
    
    // Initialize voting when DOM is ready
    function init() {
        if (votingState.initialized) return;
        
        const nameList = document.getElementById('name-list');
        const submitBtn = document.getElementById('vote-submit');
        
        if (!nameList || !submitBtn) {
            console.error('❌ Voting elements not found');
            return;
        }
        
        // Wait for config
        waitForConfig(() => {
            if (!window.CONFIG || !window.CONFIG.BABY_NAMES) {
                nameList.innerHTML = '<p style="color:red">Configuration error</p>';
                return;
            }
            
            // Clear and populate
            nameList.innerHTML = '';
            window.CONFIG.BABY_NAMES.forEach((name, index) => {
                const item = createNameItem(name, index);
                nameList.appendChild(item);
            });
            
            submitBtn.addEventListener('click', handleSubmit);
            submitBtn.disabled = true;
            
            votingState.initialized = true;
            console.log('✅ Voting initialized with', window.CONFIG.BABY_NAMES.length, 'names');
        });
    }
    
    // Wait for config with timeout
    function waitForConfig(callback, maxAttempts = 100) {
        if (window.CONFIG && window.CONFIG.BABY_NAMES) {
            callback();
            return;
        }
        
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.CONFIG && window.CONFIG.BABY_NAMES) {
                clearInterval(interval);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('❌ CONFIG never loaded');
            }
        }, 50);
    }
    
    // Create name item element
    function createNameItem(name, index) {
        const item = document.createElement('div');
        item.className = 'name-item';
        item.innerHTML = `
            <div class="name">${name}</div>
            <button class="heart-btn" onclick="window.voting.toggle('${name}', this)">🤍</button>
            <div class="vote-count" id="count-${index}">0 votes</div>
        `;
        return item;
    }
    
    // Toggle vote for a name
    function toggleVote(name, button) {
        const idx = votingState.selected.indexOf(name);
        
        if (idx > -1) {
            votingState.selected.splice(idx, 1);
            button.textContent = '🤍';
            button.classList.remove('liked');
        } else {
            if (votingState.selected.length >= votingState.maxVotes) {
                alert(`Max ${votingState.maxVotes} votes allowed`);
                return;
            }
            votingState.selected.push(name);
            button.textContent = '❤️';
            button.classList.add('liked');
        }
        
        document.getElementById('vote-submit').disabled = votingState.selected.length === 0;
    }
    
    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        if (votingState.selected.length === 0) {
            alert('Please select at least one name');
            return;
        }
        
        const name = prompt('Enter your name:');
        if (!name || !name.trim()) {
            alert('Name is required');
            return;
        }
        
        const data = {
            name: name.trim(),
            selectedNames: votingState.selected
        };
        
        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.result === 'success') {
                alert(`Thanks ${name}! Your votes were saved!`);
                reset();
                // Refresh stats
                if (window.loadVoteStats) window.loadVoteStats();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Submit failed:', error);
            alert('Network error. Please try again.');
        }
    }
    
    // Reset form
    function reset() {
        votingState.selected = [];
        document.querySelectorAll('.heart-btn').forEach(btn => {
            btn.textContent = '🤍';
            btn.classList.remove('liked');
        });
        document.getElementById('vote-submit').disabled = true;
    }
    
    // Expose globally
    window.voting = {
        init: init,
        toggle: toggleVote,
        state: votingState
    };
    
    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('🗳️ Voting module loaded and ready');
})();
