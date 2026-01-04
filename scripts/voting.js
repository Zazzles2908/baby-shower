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
        
        // Update submit button state and helper text
        updateVoteButtonState();
        
        // Fetch current vote counts from server
        fetchAndDisplayVoteCounts();
        
        votingState.initialized = true;
        console.log('✅ Voting initialized with', window.CONFIG.BABY_NAMES.length, 'names, state:', votingState);
    }
    
    // ========================================
    // VOTE COUNT INITIALIZATION
    // ========================================
    
    // Fetch current vote counts from server and display them
    async function fetchAndDisplayVoteCounts() {
        try {
            // Show loading state on vote counts
            showVoteCountsLoading();
            
            // Fetch vote counts from API
            const voteData = await window.API.getVoteCounts();
            
            if (voteData && voteData.results) {
                // Initialize vote counts from server response
                voteData.results.forEach(result => {
                    voteCounts[result.name] = result.count;
                });
                
                // Display the vote counts
                voteData.results.forEach(result => {
                    displayVoteCount(result.name, result.count, voteData.totalVotes);
                });
                
                console.log('✅ Vote counts loaded:', voteCounts, 'Total:', voteData.totalVotes);
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to fetch vote counts (will use realtime):', error.message);
            // Keep showing 0 votes, realtime updates will catch new votes
            // This is graceful degradation - the app still works
        } finally {
            hideVoteCountsLoading();
        }
    }
    
    // Show loading state on vote count elements
    function showVoteCountsLoading() {
        const countElements = document.querySelectorAll('.vote-count');
        const progressBars = document.querySelectorAll('.vote-progress-bar');
        
        countElements.forEach(el => {
            el.classList.add('loading');
        });
        
        progressBars.forEach(el => {
            el.classList.add('loading');
        });
    }
    
    // Hide loading state on vote count elements
    function hideVoteCountsLoading() {
        const countElements = document.querySelectorAll('.vote-count');
        const progressBars = document.querySelectorAll('.vote-progress-bar');
        
        countElements.forEach(el => {
            el.classList.remove('loading');
        });
        
        progressBars.forEach(el => {
            el.classList.remove('loading');
        });
    }
    
    // Display a single vote count (called during initialization)
    function displayVoteCount(name, count, totalVotes) {
        const nameItems = document.querySelectorAll('.name-item');
        let foundItem = null;
        
        nameItems.forEach((item) => {
            const nameEl = item.querySelector('.name');
            if (nameEl && nameEl.textContent === name) {
                foundItem = item;
            }
        });
        
        if (!foundItem) {
            console.warn('Could not find name item for:', name);
            return;
        }
        
        const countEl = foundItem.querySelector('.vote-count');
        const progressEl = foundItem.querySelector('.vote-progress-bar');
        
        if (countEl) {
            countEl.textContent = count + ' vote' + (count !== 1 ? 's' : '');
        }
        
        if (progressEl && totalVotes > 0) {
            const percentage = Math.round((count / totalVotes) * 100);
            progressEl.style.width = percentage + '%';
            progressEl.classList.remove('initial-load'); // Already loaded from server
        }
    }
    
    function createNameItems(names) {
        const list = document.getElementById('name-list');
        list.innerHTML = '';
        names.forEach((name, i) => {
            const item = document.createElement('div');
            item.className = 'name-item';
            // Use event delegation by attaching click handler to parent, or use safe inline handler
            item.innerHTML = `
                <div class="name">${name}</div>
                <button class="heart-btn" data-name="${name}">🤍</button>
                <div class="vote-count" id="count-${i}">0 votes</div>
                <div class="vote-progress-bar-container">
                    <div class="vote-progress-bar initial-load" id="progress-${i}" style="width: 0%"></div>
                </div>
            `;
            list.appendChild(item);
        });
        
        // Attach click handlers after elements are created
        const heartButtons = list.querySelectorAll('.heart-btn');
        heartButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.getAttribute('data-name');
                if (window.voting && window.voting.toggle) {
                    window.voting.toggle(name, this);
                } else {
                    console.error('Voting module not ready');
                }
            });
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
        
        // Update submit button and helper text
        updateVoteButtonState();
    }
    
    function updateVoteButtonState() {
        const submitBtn = document.getElementById('vote-submit');
        const helperText = document.getElementById('vote-helper');
        
        if (!submitBtn || !helperText) return;
        
        const selectedCount = votingState.selected.length;
        const remainingVotes = votingState.maxVotes - selectedCount;
        
        if (votingState.hasVoted) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('data-tooltip', 'You already voted!');
            helperText.textContent = 'You already voted ✅';
        } else if (selectedCount === 0) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('data-tooltip', 'Select at least 1 name');
            helperText.textContent = 'Select up to 3 names to vote';
        } else if (selectedCount >= votingState.maxVotes) {
            submitBtn.disabled = false;
            submitBtn.setAttribute('data-tooltip', 'You\'ve selected 3 names!');
            helperText.textContent = 'Perfect! Submit your votes ❤️';
            helperText.classList.add('updated');
            setTimeout(() => helperText.classList.remove('updated'), 500);
        } else {
            submitBtn.disabled = false;
            submitBtn.setAttribute('data-tooltip', `Select ${remainingVotes} more name${remainingVotes !== 1 ? 's' : ''}`);
            helperText.textContent = `Select ${remainingVotes} more name${remainingVotes !== 1 ? 's' : ''} or submit`;
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
            submitBtn.setAttribute('data-tooltip', 'You already voted!');
        }
        
        // Update helper text
        const helperText = document.getElementById('vote-helper');
        if (helperText) {
            helperText.textContent = 'You already voted ✅';
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
        
        // Update submit button and helper text
        updateVoteButtonState();
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
            
            const response = await window.API.submitVote({
                name: name.trim(),
                selected_names: votingState.selected
            });
            
            // Check for 50-submission milestone
            if (response?.milestone?.triggered) {
                triggerMilestoneCelebration(response.milestone);
            }
            
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
    
    // ========================================
    // SUPABASE REALTIME VOTING INTEGRATION
    // ========================================
    
    // Vote counts state for realtime updates
    const voteCounts = {};
    
    // Create Supabase client for realtime (if not already created)
    function getSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        
        const supabaseUrl = window.CONFIG?.SUPABASE?.URL;
        const supabaseKey = window.CONFIG?.SUPABASE?.ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase config not available for realtime');
            return null;
        }
        
        // Create client (assumes @supabase/supabase-js is loaded)
        if (typeof supabase !== 'undefined') {
            window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase realtime client created');
            return window.supabaseClient;
        }
        
        console.warn('Supabase library not loaded');
        return null;
    }
    
    // Update vote count display with animation
    function updateVoteCount(name, count) {
        // Find the name item by looking for the name text
        const nameItems = document.querySelectorAll('.name-item');
        let foundItem = null;
        let itemIndex = -1;
        
        nameItems.forEach((item, index) => {
            const nameEl = item.querySelector('.name');
            if (nameEl && nameEl.textContent === name) {
                foundItem = item;
                itemIndex = index;
            }
        });
        
        if (!foundItem) {
            console.warn('Could not find name item for:', name);
            return;
        }
        
        const countEl = foundItem.querySelector('.vote-count');
        const progressEl = foundItem.querySelector('.vote-progress-bar');
        
        if (countEl) {
            // Update the count
            countEl.textContent = count + ' vote' + (count !== 1 ? 's' : '');
            
            // Add animation class
            countEl.classList.add('vote-count-updated');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                countEl.classList.remove('vote-count-updated');
            }, 1000);
            
            // Also animate the parent item
            foundItem.classList.add('vote-item-updated');
            setTimeout(() => {
                foundItem.classList.remove('vote-item-updated');
            }, 1000);
        }
        
        // Update progress bar
        if (progressEl) {
            // Calculate total votes across all names
            const totalCounts = Object.values(voteCounts);
            const totalVotes = totalCounts.reduce((sum, val) => sum + val, 0) || 1; // Avoid division by zero
            
            const percentage = Math.round((count / totalVotes) * 100);
            
            // Add pulse animation to progress bar
            progressEl.classList.add('updating');
            setTimeout(() => {
                progressEl.classList.remove('updating');
                progressEl.classList.remove('initial-load'); // Remove initial animation after first update
            }, 800);
            
            // Set the actual width (this happens after animation starts)
            requestAnimationFrame(() => {
                progressEl.style.width = percentage + '%';
            });
        }
    }
    
    // Handle new vote submission from realtime
    function handleNewVote(payload) {
        const newVote = payload.new;
        
        if (!newVote || !newVote.activity_data) {
            return;
        }
        
        const votedNames = newVote.activity_data.names;
        if (!Array.isArray(votedNames)) {
            return;
        }
        
        // Increment vote counts for each voted name
        votedNames.forEach(name => {
            voteCounts[name] = (voteCounts[name] || 0) + 1;
            updateVoteCount(name, voteCounts[name]);
        });
        
        console.log('🗳️ Vote update received:', votedNames, voteCounts);
    }
    
    // Subscribe to realtime voting updates
    function initializeRealtimeVoting() {
        const client = getSupabaseClient();
        if (!client) {
            console.warn('Realtime voting not available - no Supabase client');
            return null;
        }
        
        try {
            const channel = client
                .channel('voting-updates-' + Date.now())
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'submissions',
                    filter: 'activity_type=eq.voting'
                }, (payload) => {
                    handleNewVote(payload);
                })
                .subscribe((status) => {
                    console.log('🗳️ Realtime voting subscription status:', status);
                });
            
            console.log('✅ Subscribed to voting realtime updates');
            return channel;
        } catch (error) {
            console.error('Failed to subscribe to voting realtime:', error);
            return null;
        }
    }
    
    // Initialize realtime after voting is initialized
    function initializeVotingRealtime() {
        // Wait a bit for DOM to be ready, then subscribe
        setTimeout(() => {
            initializeRealtimeVoting();
        }, 1000);
    }
    
    // Call realtime initialization after init
    const originalInit = init;
    init = function() {
        originalInit();
        initializeVotingRealtime();
    };
    
    window.votingInitialized = true;
    
    console.log('🗳️ Voting module v2.0 loaded and ready');
})();
