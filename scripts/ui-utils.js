/**
 * UI Utilities for Baby Shower App
 * Provides reusable functions for loading states, error messages, and success feedback
 */

(function() {
    'use strict';

    console.log('[UIUtils] loading...');

    /**
     * Set loading state on a button
     * @param {HTMLElement} button - Button element
     * @param {string} loadingText - Text to show while loading
     */
    function setButtonLoading(button, loadingText = 'Submitting...') {
        if (!button) {
            console.warn('[UIUtils] setButtonLoading: button not found');
            return;
        }

        // Save original text and state
        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;

        // Disable button and add loading class
        button.disabled = true;
        button.classList.add('api-loading');

        // Update text with spinner
        button.innerHTML = `<span class="button-spinner"></span> ${loadingText}`;

        console.log('[UIUtils] Button loading state set');
    }

    /**
     * Remove loading state from a button
     * @param {HTMLElement} button - Button element
     */
    function clearButtonLoading(button) {
        if (!button) {
            console.warn('[UIUtils] clearButtonLoading: button not found');
            return;
        }

        // Restore original text
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }

        // Restore original disabled state (if it was disabled before loading)
        if (button.dataset.originalDisabled === 'true') {
            button.disabled = true;
        } else {
            button.disabled = false;
        }

        // Remove loading class
        button.classList.remove('api-loading');

        console.log('[UIUtils] Button loading state cleared');
    }

    /**
     * Show inline error message in a form
     * @param {HTMLFormElement} form - Form element
     * @param {string} message - Error message to display
     * @param {boolean} autoRemove - Whether to auto-remove after 10 seconds
     */
    function showInlineError(form, message, autoRemove = true) {
        if (!form) {
            console.warn('[UIUtils] showInlineError: form not found');
            return;
        }

        // Remove existing error messages
        const existing = form.querySelector('.inline-error');
        if (existing) existing.remove();

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'inline-error';
        errorDiv.innerHTML = `
            <span class="inline-error-icon">⚠️</span>
            <span class="inline-error-text">${escapeHtml(message)}</span>
            <button type="button" class="inline-error-dismiss" onclick="this.parentElement.remove()" aria-label="Close error">✕</button>
        `;

        // Insert at the top of the form
        form.insertBefore(errorDiv, form.firstChild);

        // Trigger animation
        requestAnimationFrame(() => {
            errorDiv.classList.add('show');
        });

        // Auto-remove after 10 seconds
        if (autoRemove) {
            setTimeout(() => {
                errorDiv.classList.add('hide');
                setTimeout(() => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 400);
            }, 10000);
        }

        console.log('[UIUtils] Inline error message shown:', message);
    }

    /**
     * Show inline success message in a form
     * @param {HTMLFormElement} form - Form element
     * @param {string} message - Success message to display
     * @param {boolean} autoRemove - Whether to auto-remove after 5 seconds
     */
    function showInlineSuccess(form, message, autoRemove = true) {
        if (!form) {
            console.warn('[UIUtils] showInlineSuccess: form not found');
            return;
        }

        // Remove existing success messages
        const existing = form.querySelector('.inline-success');
        if (existing) existing.remove();

        // Create success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'inline-success';
        successDiv.innerHTML = `
            <span class="inline-success-icon">✨</span>
            <span class="inline-success-text">${escapeHtml(message)}</span>
            <button type="button" class="inline-success-dismiss" onclick="this.parentElement.remove()" aria-label="Close success">✕</button>
        `;

        // Insert at the top of the form
        form.insertBefore(successDiv, form.firstChild);

        // Trigger animation
        requestAnimationFrame(() => {
            successDiv.classList.add('show');
        });

        // Auto-remove after 5 seconds
        if (autoRemove) {
            setTimeout(() => {
                successDiv.classList.add('hide');
                setTimeout(() => {
                    if (successDiv.parentElement) {
                        successDiv.remove();
                    }
                }, 400);
            }, 5000);
        }

        console.log('[UIUtils] Inline success message shown:', message);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    function escapeHtml(text) {
        if (typeof text !== 'string') {
            console.warn('[UIUtils] escapeHtml: non-string input');
            return String(text);
        }

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set field error state
     * @param {HTMLElement} input - Input field
     * @param {string} message - Error message
     */
    function setFieldError(input, message) {
        if (!input) {
            console.warn('[UIUtils] setFieldError: input not found');
            return;
        }

        // Find form group
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Add error class to form group
        formGroup.classList.add('error');

        // Remove existing error message
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add error message
        if (message) {
            const errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            errorEl.textContent = message;
            formGroup.appendChild(errorEl);
        }

        // Focus the input
        input.focus();

        console.log('[UIUtils] Field error set for:', input.name, message);
    }

    /**
     * Clear field error state
     * @param {HTMLElement} input - Input field
     */
    function clearFieldError(input) {
        if (!input) {
            console.warn('[UIUtils] clearFieldError: input not found');
            return;
        }

        // Find form group
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Remove error class
        formGroup.classList.remove('error');

        // Remove error message
        const errorEl = formGroup.querySelector('.field-error');
        if (errorEl) errorEl.remove();

        console.log('[UIUtils] Field error cleared for:', input.name);
    }

    /**
     * Validate form with inline errors
     * @param {HTMLFormElement} form - Form to validate
     * @returns {boolean} - True if valid
     */
    function validateFormWithErrors(form) {
        if (!form) {
            console.warn('[UIUtils] validateFormWithErrors: form not found');
            return false;
        }

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        let firstInvalidField = null;

        // Clear all existing field errors
        inputs.forEach(input => {
            clearFieldError(input);
        });

        // Validate each required field
        inputs.forEach(input => {
            const value = input.value.trim();
            const isRadio = input.type === 'radio';
            const isCheckbox = input.type === 'checkbox';

            // Skip radio/checkbox groups (handle differently)
            if (isRadio || isCheckbox) {
                const name = input.name;
                const group = form.querySelectorAll(`input[name="${name}"]`);
                let checked = false;
                group.forEach(radio => {
                    if (radio.checked) checked = true;
                });

                if (!checked) {
                    isValid = false;
                    if (!firstInvalidField) firstInvalidField = group[0];
                }
                return;
            }

            // Check if field is empty
            if (!value) {
                isValid = false;
                setFieldError(input, 'This field is required');
                if (!firstInvalidField) firstInvalidField = input;
            } else {
                // Check minimum length (data-min-length attribute)
                const minLength = input.dataset.minLength || 0;
                if (value.length < parseInt(minLength)) {
                    isValid = false;
                    setFieldError(input, `Minimum ${minLength} characters required`);
                    if (!firstInvalidField) firstInvalidField = input;
                }

                // Check maximum length (data-max-length attribute)
                const maxLength = input.dataset.maxLength || 0;
                if (maxLength && value.length > parseInt(maxLength)) {
                    isValid = false;
                    setFieldError(input, `Maximum ${maxLength} characters allowed`);
                    if (!firstInvalidField) firstInvalidField = input;
                }
            }
        });

        // Focus first invalid field
        if (firstInvalidField) {
            firstInvalidField.focus();
        }

        console.log('[UIUtils] Form validation result:', isValid);
        return isValid;
    }

    /**
     * Wrap form submission with loading states
     * @param {HTMLFormElement} form - Form element
     * @param {Function} submitFn - Submit function
     * @param {string} successMessage - Success message
     * @param {string} loadingText - Loading text
     * @returns {Promise} - Submit promise
     */
    async function submitWithLoading(form, submitFn, successMessage, loadingText = 'Submitting...') {
        if (!form) {
            console.warn('[UIUtils] submitWithLoading: form not found');
            return;
        }

        // Clear any existing messages
        const existingError = form.querySelector('.inline-error');
        const existingSuccess = form.querySelector('.inline-success');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();

        // Validate form
        if (!validateFormWithErrors(form)) {
            return;
        }

        // Get submit button
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            // Set loading state
            setButtonLoading(submitBtn, loadingText);

            // Call submit function
            const result = await submitFn();

            // Show success message
            showInlineSuccess(form, successMessage);

            return result;
        } catch (error) {
            // Clear loading state
            clearButtonLoading(submitBtn);

            // Show error message
            const errorMessage = error.message || 'Something went wrong. Please try again.';
            showInlineError(form, errorMessage);

            // Re-throw error for caller to handle
            throw error;
        } finally {
            // Ensure button is re-enabled if caller catches error
            if (submitBtn && submitBtn.classList.contains('api-loading')) {
                clearButtonLoading(submitBtn);
            }
        }
    }

    // Public API
    window.UIUtils = {
        setButtonLoading,
        clearButtonLoading,
        showInlineError,
        showInlineSuccess,
        escapeHtml,
        setFieldError,
        clearFieldError,
        validateFormWithErrors,
        submitWithLoading
    };

    console.log('[UIUtils] loaded and ready');
})();
