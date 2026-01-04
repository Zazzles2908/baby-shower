/**
 * Baby Shower App - Mom vs Dad Game Enhanced UX
 * Improvements: Partner icons, leave game button, better error handling, personalization
 * Follows IIFE pattern and attaches to window.MomVsDadEnhanced
 */

(function() {
    'use strict';

    console.log('[MomVsDadEnhanced] Enhanced UX module loading...');

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const PARTNER_CONFIG = {
        mom: {
            name: 'Michelle',
            icon: '🌸',
            color: '#FFB6C1',
            gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)'
        },
        dad: {
            name: 'Jazeel',
            icon: '🐸',
            color: '#98D8C8',
            gradient: 'linear-gradient(135deg, #98D8C8 0%, #B8E6D0 100%)'
        }
    };

    // =====================================================
    // PRIVATE STATE
    // =====================================================

    let currentScreen = 'join';
    let gameState = null;
    let leaveGameTimer = null;

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================

    /**
     * Create partner badge HTML
     */
    function createPartnerBadge(partner) {
        const config = PARTNER_CONFIG[partner];
        if (!config) return '';

        return `
            <div class="partner-badge ${partner}-partner">
                <span class="partner-icon">${config.icon}</span>
                <span class="partner-name">${partner === 'mom' ? 'Mom' : 'Dad'}: ${config.name}</span>
            </div>
        `;
    }

    /**
     * Create couple display HTML
     */
    function createCoupleDisplay() {
        return `
            <div class="couple-display">
                <div class="couple-avatar mom-avatar">
                    <span>${PARTNER_CONFIG.mom.icon}</span>
                </div>
                <div class="couple-and">&</div>
                <div class="couple-avatar dad-avatar">
                    <span>${PARTNER_CONFIG.dad.icon}</span>
                </div>
                <div class="couple-names">
                    <div class="couple-title">${PARTNER_CONFIG.mom.name} & ${PARTNER_CONFIG.dad.name}</div>
                    <div class="couple-subtitle">Baby Shower March 2026</div>
                </div>
            </div>
        `;
    }

    /**
     * Create leave game button HTML
     */
    function createLeaveButton(text = 'Leave Game', small = false) {
        const sizeClass = small ? 'game-leave-btn-small' : '';
        return `
            <button
                type="button"
                id="btn-leave-game"
                class="game-leave-btn ${sizeClass}"
                aria-label="Leave game and return to menu"
            >
                <span class="game-leave-icon">🚪</span>
                <span class="game-leave-text">${text}</span>
            </button>
        `;
    }

    /**
     * Create enhanced game error message
     */
    function createGameErrorMessage(title, message, actionText, actionCallback) {
        return `
            <div class="game-error-message">
                <div class="game-error-title">${title}</div>
                <div class="game-error-text">${message}</div>
                ${actionText ? `
                    <div class="game-error-action">
                        <button type="button" class="game-error-action-btn">
                            <span>🔄</span>
                            ${actionText}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create game status indicator
     */
    function createGameStatusIndicator(status, text) {
        const statusClass = status === 'active' ? 'active' :
                          status === 'waiting' ? 'waiting' : 'error';

        return `
            <div class="game-status-indicator">
                <span class="status-dot ${statusClass}"></span>
                <span>${text}</span>
            </div>
        `;
    }

    /**
     * Add heart animation to button
     */
    function addHeartAnimation(button) {
        button.classList.add('heart-button');

        // Create floating heart effect on click
        button.addEventListener('click', () => {
            const heart = document.createElement('span');
            heart.textContent = '❤️';
            heart.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
                pointer-events: none;
                animation: heartFloatUp 0.8s ease-out forwards;
            `;
            button.appendChild(heart);

            setTimeout(() => heart.remove(), 800);
        });
    }

    /**
     * Trigger floating particles
     */
    function triggerFloatingParticles(particleType = 'heart', count = 10) {
        // Check if container already exists
        let container = document.querySelector('.floating-particles');
        if (!container) {
            container = document.createElement('div');
            container.className = 'floating-particles';
            document.body.appendChild(container);
        }

        // Clear existing particles
        container.innerHTML = '';

        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `float-particle article-${particleType}`;

            const emoji = getParticleEmoji(particleType);
            particle.textContent = emoji;

            // Random positioning and animation
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 50}%;
                animation-delay: ${i * 0.1}s;
                animation-duration: ${1.5 + Math.random() * 1}s;
            `;

            container.appendChild(particle);
        }

        // Clean up particles after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }

    /**
     * Get emoji for particle type
     */
    function getParticleEmoji(type) {
        const emojis = {
            'heart': ['❤️', '💕', '💖', '💗'],
            'star': ['⭐', '✨', '🌟', '💫'],
            'sparkle': ['✨', '💫', '🌟'],
            'flower': ['🌸', '🌺', '🌷', '🌼'],
            'leaf': ['🍃', '🌿', '🌱']
        };
        const list = emojis[type] || emojis['heart'];
        return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Create lock button with enhanced UI
     */
    function createLockButton(parent, isLocked = false) {
        const config = PARTNER_CONFIG[parent];
        const lockIcon = isLocked ? '🔒' : '🔓';
        const lockText = isLocked ? `${config.name} Locked` : `Lock ${config.name}'s Answer`;

        return `
            <button
                type="button"
                id="btn-lock-${parent}"
                class="lock-btn ${isLocked ? 'locked' : ''}"
                aria-label="${lockText}"
                ${isLocked ? 'disabled' : ''}
            >
                <span class="lock-icon">${lockIcon}</span>
                <span class="lock-text">${lockText}</span>
            </button>
        `;
    }

    /**
     * Show game error with enhanced styling
     */
    function showGameError(title, message, actionText = null, actionCallback = null) {
        // Find existing error container or create new one
        let errorContainer = document.querySelector('.game-error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'game-error-container';
            errorContainer.style.cssText = 'margin: 20px 0;';
        }

        // Insert after the game card
        const gameCard = document.querySelector('.game-card');
        if (gameCard && gameCard.parentNode) {
            gameCard.parentNode.insertBefore(errorContainer, gameCard.nextSibling);
        } else {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(errorContainer);
            }
        }

        // Create and insert error message
        errorContainer.innerHTML = createGameErrorMessage(
            title,
            message,
            actionText,
            actionCallback
        );

        // Attach action button click handler
        if (actionCallback) {
            const actionBtn = errorContainer.querySelector('.game-error-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    actionCallback();
                    errorContainer.innerHTML = '';
                });
            }
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 10000);

        // Log error for debugging
        console.error(`[MomVsDadEnhanced] Game Error: ${title}`, message);
    }

    /**
     * Clear game errors
     */
    function clearGameErrors() {
        const errorContainer = document.querySelector('.game-error-container');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }

    /**
     * Handle leave game action
     */
    function handleLeaveGame() {
        console.log('[MomVsDadEnhanced] Leaving game...');

        // Confirm with user (unless already confirmed)
        const confirmed = confirm(
            'Are you sure you want to leave the game?\n\n' +
            'Your progress in the current round will be lost, but you can rejoin anytime.'
        );

        if (!confirmed) {
            return;
        }

        try {
            // Stop any active subscriptions/polling
            if (window.MomVsDad && typeof window.MomVsDad.unsubscribeFromGame === 'function') {
                window.MomVsDad.unsubscribeFromGame();
            }

            // Clear game state
            gameState = null;
            currentScreen = 'join';

            // Trigger confetti farewell effect
            triggerFloatingParticles('star', 15);

            // Return to main menu
            if (window.API && typeof window.API.showSection === 'function') {
                window.API.showSection('welcome-section');
            }

            console.log('[MomVsDadEnhanced] Game left successfully');

        } catch (error) {
            console.error('[MomVsDadEnhanced] Error leaving game:', error);

            // Show enhanced error message with retry option
            showGameError(
                'Could Not Leave Game',
                `Something went wrong: ${error.message}. Please try refreshing the page.`,
                'Refresh Page',
                () => location.reload()
            );
        }
    }

    /**
     * Initialize enhanced join screen
     */
    function initializeEnhancedJoinScreen() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        // Add couple display to join screen
        const joinScreen = document.querySelector('#game-join-screen');
        if (joinScreen) {
            const header = joinScreen.querySelector('.game-header');
            if (header) {
                header.insertAdjacentHTML('afterend', createCoupleDisplay());
            }
        }

        // Add leave button (hidden initially)
        const joinForm = document.querySelector('#game-join-form');
        if (joinForm) {
            const leaveBtnHTML = createLeaveButton('Back to Main Menu', true);
            joinForm.insertAdjacentHTML('afterend', leaveBtnHTML);

            // Attach leave button handler
            const leaveBtn = document.getElementById('btn-leave-game');
            if (leaveBtn) {
                leaveBtn.addEventListener('click', handleLeaveGame);
            }
        }
    }

    /**
     * Initialize enhanced voting screen
     */
    function initializeEnhancedVotingScreen() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        // Add partner badges to game header
        const votingScreen = document.querySelector('#game-voting-screen');
        if (votingScreen) {
            const votingContainer = votingScreen.querySelector('.game-voting-container');
            if (votingContainer) {
                // Insert partner header
                const partnerHeader = `
                    <div class="game-header-partners">
                        <div class="game-header-partner">
                            <span class="game-header-icon">${PARTNER_CONFIG.mom.icon}</span>
                            <span class="game-header-name">${PARTNER_CONFIG.mom.name}</span>
                        </div>
                        <div class="game-header-vs">VS</div>
                        <div class="game-header-partner">
                            <span class="game-header-icon">${PARTNER_CONFIG.dad.icon}</span>
                            <span class="game-header-name">${PARTNER_CONFIG.dad.name}</span>
                        </div>
                    </div>
                `;
                votingContainer.insertAdjacentHTML('afterbegin', partnerHeader);
            }

            // Add leave button at bottom
            const adminPanel = votingScreen.querySelector('.game-admin-panel');
            if (adminPanel) {
                adminPanel.insertAdjacentHTML('afterend', createLeaveButton('Leave Game'));
            } else {
                const gameInfo = votingScreen.querySelector('.game-info');
                if (gameInfo) {
                    gameInfo.insertAdjacentHTML('afterend', createLeaveButton('Leave Game'));
                }
            }
        }

        // Attach leave button handler
        const leaveBtn = document.getElementById('btn-leave-game');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', handleLeaveGame);
        }

        // Enhance vote buttons with heart animations
        const btnVoteMom = document.getElementById('btn-vote-mom');
        const btnVoteDad = document.getElementById('btn-vote-dad');

        if (btnVoteMom) {
            addHeartAnimation(btnVoteMom);
            // Add partner icon to button
            const voteIcon = btnVoteMom.querySelector('.vote-icon');
            if (voteIcon) {
                voteIcon.textContent = `${PARTNER_CONFIG.mom.icon} ${voteIcon.textContent}`;
            }
        }

        if (btnVoteDad) {
            addHeartAnimation(btnVoteDad);
            // Add partner icon to button
            const voteIcon = btnVoteDad.querySelector('.vote-icon');
            if (voteIcon) {
                voteIcon.textContent = `${PARTNER_CONFIG.dad.icon} ${voteIcon.textContent}`;
            }
        }

        // Enhance admin panel lock buttons
        const btnLockMom = document.getElementById('btn-lock-mom');
        const btnLockDad = document.getElementById('btn-lock-dad');

        if (btnLockMom) {
            const originalHTML = btnLockMom.innerHTML;
            btnLockMom.innerHTML = createLockButton('mom');
            btnLockMom.innerHTML = btnLockMom.querySelector('.lock-btn').outerHTML;
        }

        if (btnLockDad) {
            const originalHTML = btnLockDad.innerHTML;
            btnLockDad.innerHTML = createLockButton('dad');
            btnLockDad.innerHTML = btnLockDad.querySelector('.lock-btn').outerHTML;
        }
    }

    /**
     * Initialize enhanced results screen
     */
    function initializeEnhancedResultsScreen() {
        const resultsScreen = document.querySelector('#game-results-screen');
        if (!resultsScreen) return;

        // Add partner badges to results
        const resultsHeader = resultsScreen.querySelector('.results-header');
        if (resultsHeader) {
            const partnerBadgesHTML = `
                <div style="display:flex; justify-content:center; gap:15px; margin-bottom:20px;">
                    ${createPartnerBadge('mom')}
                    ${createPartnerBadge('dad')}
                </div>
            `;
            resultsHeader.insertAdjacentHTML('afterbegin', partnerBadgesHTML);
        }

        // Add leave button
        const resultsActions = resultsScreen.querySelector('.results-actions');
        if (resultsActions) {
            resultsActions.insertAdjacentHTML('beforebegin', createLeaveButton('End Game Session'));
        } else {
            const finalResults = resultsScreen.querySelector('.game-final-results');
            if (finalResults) {
                finalResults.insertAdjacentHTML('beforebegin', createLeaveButton('End Game Session'));
            }
        }

        // Attach leave button handler
        const leaveBtn = document.getElementById('btn-leave-game');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', handleLeaveGame);
        }

        // Trigger celebration particles when results shown
        const crowdChoice = resultsScreen.querySelector('.crowd-choice');
        if (crowdChoice) {
            triggerFloatingParticles('sparkle', 20);
        }
    }

    /**
     * Enhance welcome screen hero section
     */
    function enhanceWelcomeScreen() {
        const welcomeSection = document.getElementById('welcome-section');
        if (!welcomeSection) return;

        const heroContent = welcomeSection.querySelector('.hero-content');
        if (heroContent) {
            // Update hero title with couple names
            const heroTitle = heroContent.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.innerHTML = `
                    <span style="display:inline-flex; align-items:center; gap:10px;">
                        🌸 ${PARTNER_CONFIG.mom.name}
                        <span style="color:var(--color-accent);">&</span>
                        ${PARTNER_CONFIG.dad.name} 🐸
                    </span>
                    <br>
                    <span style="font-size:0.7em; font-weight:400;">Baby Shower</span>
                `;
                heroTitle.classList.add('cute-heading');
            }
        }
    }

    /**
     * Watch for screen changes and enhance them
     */
    function watchForScreenChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for new screens
                            if (node.id === 'game-join-screen') {
                                initializeEnhancedJoinScreen();
                            } else if (node.id === 'game-voting-screen') {
                                initializeEnhancedVotingScreen();
                            } else if (node.id === 'game-results-screen') {
                                initializeEnhancedResultsScreen();
                            }
                        }
                    });
                }
            });
        });

        // Start observing the game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            observer.observe(gameContainer, {
                childList: true,
                subtree: true
            });
        }

        return observer;
    }

    /**
     * Attach enhanced UX to existing buttons
     */
    function attachEnhancedUX() {
        // Add heart animations to submit buttons
        const submitButtons = document.querySelectorAll('.submit-btn');
        submitButtons.forEach((btn) => {
            addHeartAnimation(btn);
            btn.classList.add('heart-active');
        });

        // Add heart animations to activity cards
        const activityCards = document.querySelectorAll('.activity-card');
        activityCards.forEach((card) => {
            card.classList.add('sparkle-container');

            // Trigger sparkle on hover
            card.addEventListener('mouseenter', () => {
                triggerFloatingParticles('sparkle', 5);
            });
        });
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================

    /**
     * Initialize enhanced UX module
     */
    function init() {
        console.log('[MomVsDadEnhanced] Initializing enhanced UX...');

        // Enhance welcome screen immediately
        enhanceWelcomeScreen();

        // Attach enhancements to existing UI elements
        if (document.readyState === 'complete') {
            attachEnhancedUX();
        } else {
            document.addEventListener('DOMContentLoaded', attachEnhancedUX);
        }

        // Watch for screen changes in game container
        const observer = watchForScreenChanges();

        // Log initialization complete
        console.log('[MomVsDadEnhanced] Enhanced UX initialized');

        // Return cleanup function
        return () => {
            observer.disconnect();
            console.log('[MomVsDadEnhanced] Enhanced UX cleanup complete');
        };
    }

    // =====================================================
    // PUBLIC API EXPORT
    // =====================================================

    window.MomVsDadEnhanced = {
        // Initialization
        init: init,

        // Partner configuration
        partners: PARTNER_CONFIG,

        // Utility functions
        createPartnerBadge: createPartnerBadge,
        createCoupleDisplay: createCoupleDisplay,
        createLeaveButton: createLeaveButton,
        showGameError: showGameError,
        clearGameErrors: clearGameErrors,

        // Particle effects
        triggerFloatingParticles: triggerFloatingParticles,

        // Screen enhancements
        initializeEnhancedJoinScreen: initializeEnhancedJoinScreen,
        initializeEnhancedVotingScreen: initializeEnhancedVotingScreen,
        initializeEnhancedResultsScreen: initializeEnhancedResultsScreen,
        enhanceWelcomeScreen: enhanceWelcomeScreen,

        // Leave game handler
        handleLeaveGame: handleLeaveGame,

        // Utilities
        addHeartAnimation: addHeartAnimation
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
