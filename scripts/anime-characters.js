/**
 * Baby Shower App - Anime Character System
 * "Digital Living Room" - Character-based hospitality
 */

(function() {
    'use strict';

    console.log('[AnimeCharacters] loading...');

    /**
     * Anime Character Manager
     * Handles rendering, emotions, and interactions for anime-style characters
     */
    const AnimeCharacterManager = {
        characters: {},
        currentHost: null,
        initialized: false,

        /**
         * Initialize anime character system
         */
        init: function() {
            if (this.initialized) {
                console.log('[AnimeCharacters] already initialized');
                return;
            }

            console.log('[AnimeCharacters] initializing...');

            // Check if CONFIG.ANIME_CHARACTERS exists
            if (!window.CONFIG || !window.CONFIG.ANIME_CHARACTERS) {
                console.error('[AnimeCharacters] CONFIG.ANIME_CHARACTERS not found');
                return;
            }

            // Store character configurations
            this.characters = window.CONFIG.ANIME_CHARACTERS;

            // Add welcome banner
            this.addWelcomeBanner();

            // Add anime hosts to main page
            this.addAnimeHosts();

            // Add floating characters
            this.addFloatingCharacters();

            // Enhance activity cards
            this.enhanceActivityCards();

            // Add mom vs dad game characters
            this.addMomVsDadCharacters();

            this.initialized = true;
            console.log('[AnimeCharacters] initialized successfully');
        },

        /**
         * Create SVG anime character icon
         * @param {string} characterId - Character ID (mom, dad, baby, pig, sheep, etc.)
         * @param {string} size - Size class (tiny, small, medium, large, xlarge, hero)
         * @param {string} emotion - Emotion state (happy, excited, thinking, etc.)
         * @returns {string} HTML string
         */
        createCharacterIcon: function(characterId, size = 'medium', emotion = 'happy') {
            const charConfig = this.characters[characterId] || this.characters.farm[characterId];
            if (!charConfig) {
                console.warn('[AnimeCharacters] character not found:', characterId);
                return '';
            }

            const colors = charConfig.colors || {};
            const primaryColor = colors.primary || '#9CAF88';
            const secondaryColor = colors.secondary || '#F4E4BC';
            const accentColor = colors.accent || '#E8C4A0';
            const skinColor = colors.skin || '#FFE4C4';
            const eyeColor = colors.eyes || '#6B5B95';

            // Create SVG based on character type
            let svgContent = '';

            if (characterId === 'mom' || characterId === 'dad' || characterId === 'baby') {
                svgContent = this.createChibiSVG(characterId, {
                    primary: primaryColor,
                    secondary: secondaryColor,
                    accent: accentColor,
                    skin: skinColor,
                    eyes: eyeColor
                }, emotion);
            } else {
                // Farm animals - simpler emoji-based approach
                svgContent = this.createFarmAnimalSVG(characterId, charConfig.emoji || '🐷');
            }

            return `
                <div class="anime-character ${size} emotion-${emotion}" data-character="${characterId}" data-emotion="${emotion}">
                    ${svgContent}
                    <div class="anime-sparkle">✨</div>
                    <div class="anime-sparkle">✨</div>
                    <div class="anime-sparkle">✨</div>
                    <div class="anime-sparkle">✨</div>
                </div>
            `;
        },

        /**
         * Create chibi-style SVG for human characters
         */
        createChibiSVG: function(characterType, colors, emotion) {
            // Different hair styles for mom/dad
            const hairStyle = characterType === 'mom'
                ? `<ellipse cx="50" cy="25" rx="40" ry="30" fill="${colors.primary}"/>
                   <ellipse cx="30" cy="35" rx="15" ry="25" fill="${colors.primary}"/>
                   <ellipse cx="70" cy="35" rx="15" ry="25" fill="${colors.primary}"/>`
                : characterType === 'dad'
                ? `<rect x="15" y="15" width="70" height="35" rx="10" fill="${colors.primary}"/>
                   <rect x="10" y="25" width="15" height="40" rx="5" fill="${colors.primary}"/>
                   <rect x="75" y="25" width="15" height="40" rx="5" fill="${colors.primary}"/>`
                : `<circle cx="50" cy="30" r="28" fill="${colors.primary}"/>`; // Baby

            // Different face shapes
            const faceShape = characterType === 'baby'
                ? `<circle cx="50" cy="50" r="35" fill="${colors.skin}"/>`
                : `<ellipse cx="50" cy="55" rx="35" ry="38" fill="${colors.skin}"/>`;

            // Eyes with emotion
            const eyeStyle = this.getEyeStyle(emotion, colors.eyes);

            // Mouth with emotion
            const mouthStyle = this.getMouthStyle(emotion, colors.skin);

            // Blush for baby/mom
            const blush = characterType === 'mom' || characterType === 'baby'
                ? `<ellipse cx="32" cy="65" rx="8" ry="5" fill="rgba(255, 182, 193, 0.5)"/>
                   <ellipse cx="68" cy="65" rx="8" ry="5" fill="rgba(255, 182, 193, 0.5)"/>`
                : '';

            return `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <!-- Hair -->
                    ${hairStyle}
                    <!-- Face -->
                    ${faceShape}
                    <!-- Blush -->
                    ${blush}
                    <!-- Eyes -->
                    ${eyeStyle}
                    <!-- Mouth -->
                    ${mouthStyle}
                </svg>
            `;
        },

        /**
         * Get eye style based on emotion
         */
        getEyeStyle: function(emotion, color) {
            const eyeStyles = {
                happy: `
                    <ellipse cx="38" cy="50" rx="8" ry="10" fill="white"/>
                    <ellipse cx="62" cy="50" rx="8" ry="10" fill="white"/>
                    <circle cx="38" cy="52" r="5" fill="${color}"/>
                    <circle cx="62" cy="52" r="5" fill="${color}"/>
                    <circle cx="40" cy="49" r="2" fill="white"/>
                    <circle cx="64" cy="49" r="2" fill="white"/>
                `,
                excited: `
                    <ellipse cx="38" cy="50" rx="10" ry="12" fill="white"/>
                    <ellipse cx="62" cy="50" rx="10" ry="12" fill="white"/>
                    <circle cx="38" cy="52" r="6" fill="${color}"/>
                    <circle cx="62" cy="52" r="6" fill="${color}"/>
                    <circle cx="40" cy="49" r="2" fill="white"/>
                    <circle cx="64" cy="49" r="2" fill="white"/>
                    <path d="M 35 42 Q 38 38 41 42" stroke="${color}" stroke-width="1.5" fill="none"/>
                    <path d="M 59 42 Q 62 38 65 42" stroke="${color}" stroke-width="1.5" fill="none"/>
                `,
                thinking: `
                    <ellipse cx="38" cy="52" rx="7" ry="8" fill="white"/>
                    <ellipse cx="62" cy="52" rx="7" ry="8" fill="white"/>
                    <circle cx="38" cy="54" r="4" fill="${color}"/>
                    <circle cx="62" cy="54" r="4" fill="${color}"/>
                    <circle cx="39" cy="52" r="1.5" fill="white"/>
                    <circle cx="63" cy="52" r="1.5" fill="white"/>
                `,
                surprised: `
                    <circle cx="38" cy="50" r="9" fill="white"/>
                    <circle cx="62" cy="50" r="9" fill="white"/>
                    <circle cx="38" cy="50" r="6" fill="${color}"/>
                    <circle cx="62" cy="50" r="6" fill="${color}"/>
                    <circle cx="40" cy="48" r="2" fill="white"/>
                    <circle cx="64" cy="48" r="2" fill="white"/>
                `
            };

            return eyeStyles[emotion] || eyeStyles.happy;
        },

        /**
         * Get mouth style based on emotion
         */
        getMouthStyle: function(emotion, color) {
            const mouthStyles = {
                happy: `<path d="M 40 68 Q 50 78 60 68" stroke="#E07A5F" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
                excited: `<ellipse cx="50" cy="70" rx="8" ry="6" fill="#E07A5F"/>`,
                thinking: `<path d="M 45 70 L 55 70" stroke="#E07A5F" stroke-width="2" stroke-linecap="round"/>`,
                surprised: `<ellipse cx="50" cy="72" rx="5" ry="6" fill="#E07A5F"/>`,
                proud: `<path d="M 42 70 Q 50 75 58 70" stroke="#E07A5F" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
            };

            return mouthStyles[emotion] || mouthStyles.happy;
        },

        /**
         * Create farm animal SVG
         */
        createFarmAnimalSVG: function(animalType, emoji) {
            return `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <text x="50" y="70" font-size="60" text-anchor="middle" filter="drop-shadow(0 4px 8px rgba(156, 175, 136, 0.3))">${emoji}</text>
                </svg>
            `;
        },

        /**
         * Add welcome banner with anime character
         */
        addWelcomeBanner: function() {
            const welcomeSection = document.getElementById('welcome-section');
            if (!welcomeSection) return;

            const banner = document.createElement('div');
            banner.className = 'anime-welcome-banner';
            banner.innerHTML = `
                <div class="anime-welcome-character">
                    ${this.createCharacterIcon('mom', 'xlarge', 'welcoming')}
                </div>
                <div class="anime-welcome-content">
                    <h2 class="anime-welcome-title">Welcome to Our Baby Shower! 🌸</h2>
                    <p class="anime-welcome-subtitle">We're so excited to celebrate with you!</p>
                </div>
            `;

            const heroSection = welcomeSection.querySelector('.hero-section');
            if (heroSection) {
                heroSection.insertBefore(banner, heroSection.firstChild);
            }
        },

        /**
         * Add anime hosts to main page
         */
        addAnimeHosts: function() {
            const activitiesContainer = document.getElementById('activities-container');
            if (!activitiesContainer) return;

            // Create mom host
            const momHost = document.createElement('div');
            momHost.className = 'anime-host-container';
            momHost.innerHTML = `
                <div class="anime-host-avatar">
                    ${this.createCharacterIcon('mom', 'large', 'welcoming')}
                </div>
                <div class="anime-host-content">
                    <div class="anime-host-name">
                        <span>${this.characters.mom.name}</span>
                        <span class="anime-sparkle">✨</span>
                    </div>
                    <div class="anime-host-role">${this.characters.mom.role}</div>
                    <p class="anime-host-message">${this.getRandomPhrase('mom')}</p>
                </div>
            `;

            // Create dad host
            const dadHost = document.createElement('div');
            dadHost.className = 'anime-host-container';
            dadHost.innerHTML = `
                <div class="anime-host-avatar">
                    ${this.createCharacterIcon('dad', 'large', 'excited')}
                </div>
                <div class="anime-host-content">
                    <div class="anime-host-name">
                        <span>${this.characters.dad.name}</span>
                        <span class="anime-sparkle">✨</span>
                    </div>
                    <div class="anime-host-role">${this.characters.dad.host}</div>
                    <p class="anime-host-message">${this.getRandomPhrase('dad')}</p>
                </div>
            `;

            const activitiesHeading = activitiesContainer.querySelector('.activities-heading');
            if (activitiesHeading) {
                activitiesHeading.parentNode.insertBefore(momHost, activitiesHeading.nextSibling);
                activitiesHeading.parentNode.insertBefore(dadHost, momHost.nextSibling);
            }
        },

        /**
         * Add floating anime characters
         */
        addFloatingCharacters: function() {
            const welcomeSection = document.getElementById('welcome-section');
            if (!welcomeSection) return;

            const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
            const characters = ['baby', 'pig', 'sheep', 'chicken'];

            positions.forEach((position, index) => {
                const floatingChar = document.createElement('div');
                floatingChar.className = `anime-floating-character anime-character medium ${position}`;
                floatingChar.innerHTML = this.createCharacterIcon(characters[index], 'medium', 'happy');
                floatingChar.style.animationDelay = `${index * 0.5}s`;
                welcomeSection.appendChild(floatingChar);
            });
        },

        /**
         * Enhance activity cards with anime characters
         */
        enhanceActivityCards: function() {
            const activityCards = document.querySelectorAll('.activity-card');
            if (!activityCards.length) return;

            const characterMap = {
                'guestbook': 'mom',
                'pool': 'dad',
                'quiz': 'baby',
                'advice': 'mom',
                'voting': 'baby',
                'mom-vs-dad': 'dad'
            };

            activityCards.forEach(card => {
                const section = card.dataset.section;
                const characterId = characterMap[section] || 'baby';
                const cardIcon = card.querySelector('.card-icon');

                if (cardIcon) {
                    const animeIcon = this.createCharacterIcon(characterId, 'large', 'happy');
                    cardIcon.innerHTML = animeIcon;
                    cardIcon.classList.add('anime-character-wrapper');
                }
            });
        },

        /**
         * Add Mom vs Dad game characters
         */
        addMomVsDadCharacters: function() {
            const gameSection = document.getElementById('mom-vs-dad-section');
            if (!gameSection) return;

            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;

            // Add character selection for game
            const characterSelection = document.createElement('div');
            characterSelection.className = 'anime-character-selection';
            characterSelection.innerHTML = `
                <h3 class="anime-selection-title">Choose Your Champion! 🎮</h3>
                <div class="anime-selection-options">
                    <div class="anime-selection-option" data-choice="mom">
                        ${this.createCharacterIcon('mom', 'xlarge', 'happy')}
                        <span class="anime-selection-name">Team Mom</span>
                    </div>
                    <div class="anime-selection-option" data-choice="dad">
                        ${this.createCharacterIcon('dad', 'xlarge', 'excited')}
                        <span class="anime-selection-name">Team Dad</span>
                    </div>
                </div>
            `;

            gameContainer.appendChild(characterSelection);
        },

        /**
         * Get random phrase for character
         */
        getRandomPhrase: function(characterId) {
            const charConfig = this.characters[characterId];
            if (!charConfig || !charConfig.phrases) {
                return 'Welcome!';
            }

            const phrases = charConfig.phrases;
            const randomIndex = Math.floor(Math.random() * phrases.length);
            return phrases[randomIndex];
        },

        /**
         * Update character emotion
         */
        setEmotion: function(element, emotion) {
            if (!element) return;

            // Remove existing emotion classes
            element.classList.remove('emotion-happy', 'emotion-excited', 'emotion-thinking',
                                 'emotion-surprised', 'emotion-proud', 'emotion-celebrating',
                                 'emotion-welcoming', 'emotion-loving');

            // Add new emotion class
            element.classList.add(`emotion-${emotion}`);
            element.dataset.emotion = emotion;

            // Add animation class
            element.classList.add('anime-character-success');
            setTimeout(() => {
                element.classList.remove('anime-character-success');
            }, 1000);
        },

        /**
         * Create speech bubble for character
         */
        createSpeechBubble: function(message, characterId = 'mom') {
            return `
                <div class="anime-speech-bubble" data-character="${characterId}">
                    ${message}
                </div>
            `;
        },

        /**
         * Show loading state for character
         */
        showLoading: function(element) {
            if (!element) return;
            element.classList.add('anime-character-loading');
        },

        /**
         * Hide loading state for character
         */
        hideLoading: function(element) {
            if (!element) return;
            element.classList.remove('anime-character-loading');
        },

        /**
         * Show error state for character
         */
        showError: function(element) {
            if (!element) return;
            element.classList.add('anime-character-error');
            setTimeout(() => {
                element.classList.remove('anime-character-error');
            }, 500);
        }
    };

    // Make AnimeCharacterManager globally accessible
    window.AnimeCharacters = AnimeCharacterManager;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AnimeCharacterManager.init());
    } else {
        AnimeCharacterManager.init();
    }

    console.log('[AnimeCharacters] loaded!');
})();
