// Baby Shower App - Advice Capsule Feature

(function() {
    'use strict';

    console.log('[Advice] loading...');

    /**
     * Initialize advice-specific functionality
     */
    function initializeAdvice() {
        setupAdviceToggle();
        setupAdviceSuccessEffects();
    }

    /**
     * Setup advice delivery toggle interaction
     */
    function setupAdviceToggle() {
        const toggleOptions = document.querySelectorAll('.toggle-option');
        const hiddenInput = document.getElementById('advice-type');

        if (!toggleOptions.length || !hiddenInput) {
            console.warn('Advice toggle elements not found');
            return;
        }

        // Ensure hidden input has default value if empty
        if (!hiddenInput.value) {
            hiddenInput.value = 'For Parents';
            console.log('Set default advice type: For Parents');
        }

        // Set initial state based on hidden input value
        const currentValue = hiddenInput.value;
        toggleOptions.forEach(option => {
            const optionValue = option.getAttribute('data-value');
            if (optionValue === currentValue) {
                option.classList.add('selected');
                option.setAttribute('aria-checked', 'true');
            }
        });

        toggleOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                toggleOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.setAttribute('aria-checked', 'false');
                });

                // Add selected class to clicked option
                this.classList.add('selected');
                this.setAttribute('aria-checked', 'true');

                // Update hidden input with selected value
                const selectedValue = this.getAttribute('data-value');
                hiddenInput.value = selectedValue;

                // Play selection animation
                this.classList.remove('toggle-select');
                void this.offsetWidth; // Trigger reflow
                this.classList.add('toggle-select');

                // Log for debugging
                console.log('Advice delivery selected:', selectedValue);
            });

            // Add keyboard support
            option.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    /**
     * Setup advice success effects
     */
    function setupAdviceSuccessEffects() {
        // Listen for successful advice submission
        document.addEventListener('submit', function(e) {
            if (e.target.id === 'advice-form') {
                const adviceType = document.getElementById('advice-type').value;
                const successOverlay = document.getElementById('success-modal');

                // Add success effects when modal shows
                setTimeout(() => {
                    if (adviceType === 'For Parents') {
                        // Envelope seal effect for immediate sharing
                        triggerEnvelopeSuccess();
                    } else {
                        // Time capsule bury effect for 18th birthday
                        triggerCapsuleSuccess();
                    }
                }, 300);
            }
        });
    }

    /**
     * Trigger envelope success animation
     */
    function triggerEnvelopeSuccess() {
        const successIcon = document.getElementById('success-icon');
        if (successIcon) {
            successIcon.innerHTML = '📬';
            successIcon.classList.add('envelope-seal');
        }
    }

    /**
     * Trigger time capsule success animation
     */
    function triggerCapsuleSuccess() {
        const successIcon = document.getElementById('success-icon');
        if (successIcon) {
            successIcon.innerHTML = '🏺';
            successIcon.classList.add('capsule-bury');
        }

        // Add confetti for time capsule
        createAdviceConfetti();
    }

    /**
     * Create advice-specific confetti
     */
    function createAdviceConfetti() {
        const colors = ['#D4AF37', '#87A96B', '#C9A66B', '#FF6B6B', '#4ECDC4'];
        const symbols = ['✨', '💫', '⭐', '🌟'];

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'advice-confetti-particle';
                particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.top = '-50px';
                particle.style.color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';

                document.body.appendChild(particle);

                // Remove particle after animation
                setTimeout(() => {
                    particle.remove();
                }, 2000);
            }, i * 100);
        }
    }

    /**
     * Validate advice form
     * @param {HTMLFormElement} form - Advice form
     * @returns {boolean} Valid or not
     */
    function validateAdviceForm(form) {
        const name = form.querySelector('#advice-name').value.trim();
        const adviceType = form.querySelector('#advice-type').value;
        const message = form.querySelector('#advice-message').value.trim();

        if (!name) {
            alert('Please enter your name');
            return false;
        }

        if (!adviceType) {
            alert('Please select the type of advice');
            return false;
        }

        if (!message) {
            alert('Please enter your message');
            return false;
        }

        if (message.length < 10) {
            alert('Please enter a longer message (at least 10 characters)');
            return false;
        }

        if (message.length > 500) {
            alert('Message is too long (maximum 500 characters)');
            return false;
        }

        return true;
    }

    /**
     * Get advice form data
     * @param {HTMLFormElement} form - Advice form
     * @returns {Object} Form data
     */
    function getAdviceFormData(form) {
        return {
            name: form.querySelector('#advice-name').value.trim(),
            adviceType: form.querySelector('#advice-type').value,
            message: form.querySelector('#advice-message').value.trim()
        };
    }

    /**
     * Reset advice form
     * @param {HTMLFormElement} form - Advice form
     */
    function resetAdviceForm(form) {
        form.reset();
    }

    /**
     * Show advice success message
     * @param {string} name - Guest name
     * @param {string} adviceType - Type of advice
     * @returns {string} Success message
     */
    function getAdviceSuccessMessage(name, adviceType) {
        const forParents = [
            `Thanks ${name}! Your parenting wisdom has been saved!`,
            `Wonderful advice ${name}! This will help us so much!`,
            `${name}, your advice means the world to us! Thank you!`,
            `Parenting tip saved ${name}! We'll treasure this!`
        ];

        const forBaby = [
            `Thanks ${name}! Your wish for baby has been saved!`,
            `Beautiful message ${name}! Baby will love reading this someday!`,
            `${name}, your wish is perfect! We'll save it for baby's 18th birthday!`,
            `Wish saved ${name}! What a thoughtful message!`
        ];

        const messages = adviceType === 'For Parents' ? forParents : forBaby;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Get personal advice progress
     * @returns {number} Number of advice entries
     */
    function getAdviceProgress() {
        return getPersonalProgress('advice');
    }

    /**
     * Check if advice milestone should be shown
     * @param {number} count - Current advice count
     * @returns {string|null} Milestone key or null
     */
    function checkAdviceMilestone(count) {
        if (count === CONFIG.MILESTONES.ADVICE_10) {
            return 'ADVICE_10';
        } else if (count === CONFIG.MILESTONES.ADVICE_20) {
            return 'ADVICE_20';
        }
        return null;
    }

    /**
     * Get advice milestone message
     * @param {number} count - Current advice count
     * @returns {string} Milestone message
     */
    function getAdviceMilestoneMessage(count) {
        if (count === CONFIG.MILESTONES.ADVICE_10) {
            return "10 pieces of advice collected! Parenting pro tip #1: Sleep when the baby sleeps (if you can!).";
        } else if (count === CONFIG.MILESTONES.ADVICE_20) {
            return "20 pieces of advice! This baby will have the best guidance growing up!";
        }
        return "";
    }

    /**
     * Get random parenting tip
     * @returns {string} Parenting tip
     */
    function getParentingTip() {
        const tips = [
            "Sleep when the baby sleeps (if you can!)",
            "Trust your instincts - you know your baby best",
            "It's okay to ask for help",
            "Every baby is different - don't compare",
            "Take photos of everything - they grow so fast",
            "Cherish the small moments",
            "Remember: this too shall pass",
            "Self-care isn't selfish",
            "Perfect parents don't exist, good ones do",
            "Love is the most important thing you can give"
        ];

        return tips[Math.floor(Math.random() * tips.length)];
    }

    // Public API
    window.Advice = {
        init: initializeAdvice,
        validateAdviceForm: validateAdviceForm,
        getAdviceFormData: getAdviceFormData,
        resetAdviceForm: resetAdviceForm,
        getAdviceSuccessMessage: getAdviceSuccessMessage,
        getAdviceProgress: getAdviceProgress,
        checkAdviceMilestone: checkAdviceMilestone,
        getAdviceMilestoneMessage: getAdviceMilestoneMessage,
        getParentingTip: getParentingTip
    };

    // Note: initializeAdvice() will be called when navigating to the advice section
    // through main.js initializeSection() function
})();
