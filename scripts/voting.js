// Baby Shower App - Name Voting (FIXED v1.1)

(function() {
    'use strict';
    
    console.log('🗳️ Voting module v1.1 loading...');
    
    // State management
    const votingState = {
        selected: [],
        maxVotes: 3,
        initialized: false
    };
    
    // Initialize immediately when called
    function init() {
        console.log('🗳️ init() called');
        
        if (votingState.initialized) {
            console.log('Already initialized');
            return;
        }
        
        const nameList = document.getElementById('name-list');
        const submitBtn = document.getElementById('vote-submit');
        
        if (!nameList || !submitBtn) {
            console.error('❌ Required elements not found');
            return;
        }
        
        // Check if CONFIG is already available
        if (window.CONFIG && window.CONFIG.BABY_NAMES) {
            console.log('✅ CONFIG already available');
            createNameItems(CONFIG.BABY_NAMES);
            bindEvents();
        } else {
            console.log('⏳ Waiting for CONFIG...');
            waitForConfig(100); // 100 attempts = 5 seconds
        }
    }
    
    // Wait for CONFIG with timeout
    function waitForConfig(maxAttempts = 100) {
        let attempts = 0;
        
        function check() {
            attempts++;
            
            if (window.CONFIG && window.CONFIG.BABY_NAMES) {
                console.log('✅ CONFIG now available (attempt ' + attempts + ')');
                createNameItems(CONFIG.BABY_NAMES);
                bindEvents();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ CONFIG failed to load after ' + maxAttempts + ' attempts');
                const nameList = document.getElementById('name-list');
                if (nameList) {
                    nameList.innerHTML = '<p style="color:red;">Error: Baby names failed to load</p>';
                }
                return;
            }
            
            setTimeout(check, 50);
        }
        
        check();
    }
    
    // Create name items
    function createNameItems(names) {
        const nameList = document.getElementById('name-list');
        nameList.innerHTML = '';
        
        names.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'name-item';
            item.innerHTML = `
                <div class="name">${name}</div>
                <button class="heart-btn" onclick="window.voting.toggle('${name}', this)">🤍</button>
                <div class="vote-count" id="count-${index}">0 votes</div>
            `;
            nameList.appendChild(item);
        });
        
        console.log('✅ Created', names.length, 'name items');
    }
    
    // Bind events
    function bindEvents() {
        const submitBtn = document.getElementById('vote-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmit);
            submitBtn.disabled = true;
        }
        votingState.initialized = true;
        console.log('✅ Events bound, voting ready');
    }
    
    // Toggle vote
    function toggleVote(name, button) {
        console.log('❤️ toggleVote:', name);
        
        const idx = votingState.selected.indexOf(name);
        
        if (idx > -1) {
            votingState.selected.splice(idx, 1);
            button.textContent = '🤍';
            button.classList.remove('liked');
        } else {
            if (votingState.selected.length >= votingState.maxVotes) {
                alert(`You can only vote for ${votingState.maxVotes} names`);
                return;
            }
            votingState.selected.push(name);
            button.textContent = '❤️';
            button.classList.add('liked');
        }
        
        const submitBtn = document.getElementById('vote-submit');
        if (submitBtn) {
            submitBtn.disabled = votingState.selected.length === 0;
        }
    }
    
    // Handle submit
    async function handleSubmit(event) {
        console.log('🗳️ handleSubmit called');
        event.preventDefault();
        
        if (votingState.selected.length === 0) {
            alert('Please select at least one name');
            return;
        }
        
        const name = prompt('Please enter your name:');
        if (!name || !name.trim()) {
            alert('Name is required');
            return;
        }
        
        const data = {
            name: name.trim(),
            selectedNames: votingState.selected
        };
        
        console.log('🗳️ Submitting:', data);
        
        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('✅ Submit result:', result);
            
            if (result.result === 'success') {
                alert(`Thanks ${name}! Your votes were saved!`);
                reset();
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Submit failed:', error);
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
        const submitBtn = document.getElementById('vote-submit');
        if (submitBtn) submitBtn.disabled = true;
    }
    
    // Expose globally
    window.initializeVoting = init;
    window.voting = {
        toggle: toggleVote,
        reset: reset,
        state: votingState
    };
    
    console.log('🗳️ Voting module v1.1 loaded');
})();
