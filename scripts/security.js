/**
 * Baby Shower App - Security Utilities
 * 
 * Provides input sanitization and validation functions for security
 * Follows the existing IIFE pattern for frontend scripts
 */

(function() {
    'use strict';

    console.log('[Security] loading...');

    /**
     * Sanitize text input to prevent XSS and injection attacks
     * @param {string} input - Raw input text
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized text
     */
    function sanitizeText(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        const {
            maxLength = 1000,
            allowNewlines = true,
            allowBasicFormatting = false,
            stripHtml = true
        } = options;

        let sanitized = input;

        // Basic HTML stripping
        if (stripHtml) {
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            sanitized = sanitized.replace(/<[^>]+>/g, '');
        }

        // Remove dangerous characters and patterns
        sanitized = sanitized
            .replace(/[<>]/g, '') // Remove angle brackets entirely
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onload, etc.)
            .replace(/data:\s*text\/html/gi, '') // Remove data URLs
            .replace(/vbscript:/gi, '') // Remove vbscript protocol
            .replace(/livescript:/gi, ''); // Remove livescript protocol

        // Handle newlines
        if (!allowNewlines) {
            sanitized = sanitized.replace(/[\r\n]/g, ' ');
        }

        // Trim and check length
        sanitized = sanitized.trim();
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength).trim();
        }

        return sanitized;
    }

    /**
     * Sanitize name input (stricter than general text)
     * @param {string} name - Raw name input
     * @returns {string} Sanitized name
     */
    function sanitizeName(name) {
        if (typeof name !== 'string') {
            return '';
        }

        let sanitized = name.trim();
        
        // Remove any non-alphabetic characters except spaces, hyphens, and apostrophes
        sanitized = sanitized.replace(/[^a-zA-Z\s\-\']/g, '');
        
        // Remove multiple spaces
        sanitized = sanitized.replace(/\s+/g, ' ');
        
        // Limit length
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100).trim();
        }
        
        return sanitized;
    }

    /**
     * Sanitize email input
     * @param {string} email - Raw email input
     * @returns {string} Sanitized email or empty string if invalid
     */
    function sanitizeEmail(email) {
        if (typeof email !== 'string') {
            return '';
        }

        const sanitized = email.trim().toLowerCase();
        
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(sanitized)) {
            return '';
        }
        
        // Additional security checks
        if (sanitized.length > 254) { // RFC 5321 limit
            return '';
        }
        
        // Check for suspicious patterns
        if (sanitized.includes('..') || sanitized.includes(' ') || sanitized.includes('<') || sanitized.includes('>')) {
            return '';
        }
        
        return sanitized;
    }

    /**
     * Sanitize URL input
     * @param {string} url - Raw URL input
     * @returns {string} Sanitized URL or empty string if invalid
     */
    function sanitizeUrl(url) {
        if (typeof url !== 'string') {
            return '';
        }

        const sanitized = url.trim();
        
        // Check for valid URL protocol
        const allowedProtocols = ['http:', 'https:'];
        let parsedUrl;
        
        try {
            parsedUrl = new URL(sanitized);
        } catch {
            return '';
        }
        
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            return '';
        }
        
        // Additional security checks
        if (sanitized.length > 2048) { // Reasonable URL length limit
            return '';
        }
        
        // Check for suspicious patterns
        if (sanitized.includes('<') || sanitized.includes('>')) {
            return '';
        }
        
        return sanitized;
    }

    /**
     * Validate and sanitize form data
     * @param {Object} formData - Raw form data
     * @param {Object} schema - Validation schema
     * @returns {Object} Sanitized data and validation errors
     */
    function sanitizeFormData(formData, schema) {
        const sanitized = {};
        const errors = [];

        for (const [field, config] of Object.entries(schema)) {
            const rawValue = formData[field];
            
            if (config.required && (!rawValue || rawValue.toString().trim() === '')) {
                errors.push(`${config.label || field} is required`);
                continue;
            }

            if (!rawValue) {
                sanitized[field] = config.defaultValue || '';
                continue;
            }

            let sanitizedValue;

            switch (config.type) {
                case 'name':
                    sanitizedValue = sanitizeName(rawValue);
                    break;
                case 'email':
                    sanitizedValue = sanitizeEmail(rawValue);
                    break;
                case 'url':
                    sanitizedValue = sanitizeUrl(rawValue);
                    break;
                case 'text':
                    sanitizedValue = sanitizeText(rawValue, {
                        maxLength: config.maxLength || 1000,
                        allowNewlines: config.allowNewlines !== false,
                        stripHtml: config.stripHtml !== false
                    });
                    break;
                default:
                    sanitizedValue = sanitizeText(rawValue, {
                        maxLength: config.maxLength || 1000
                    });
            }

            // Check minimum length if specified
            if (config.minLength && sanitizedValue.length < config.minLength) {
                errors.push(`${config.label || field} must be at least ${config.minLength} characters`);
                continue;
            }

            // Check maximum length if specified
            if (config.maxLength && sanitizedValue.length > config.maxLength) {
                errors.push(`${config.label || field} must be no more than ${config.maxLength} characters`);
                continue;
            }

            sanitized[field] = sanitizedValue;
        }

        return {
            data: sanitized,
            errors,
            isValid: errors.length === 0
        };
    }

    /**
     * Security headers for API requests
     * @returns {Object} Security headers
     */
    function getSecurityHeaders() {
        return {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        };
    }

    /**
     * Validate file upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    function validateFileUpload(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
            allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
        } = options;

        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        }

        // Check MIME type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
        }

        // Check file extension
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
        }

        // Check for suspicious filename
        if (file.name.includes('<') || file.name.includes('>') || file.name.includes('..')) {
            errors.push('Filename contains invalid characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Public API
    window.SECURITY = {
        sanitizeText,
        sanitizeName,
        sanitizeEmail,
        sanitizeUrl,
        sanitizeFormData,
        getSecurityHeaders,
        validateFileUpload,
        
        // Common validation schemas
        SCHEMAS: {
            GUESTBOOK: {
                name: { type: 'name', required: true, label: 'Name', minLength: 2, maxLength: 100 },
                relationship: { type: 'text', required: true, label: 'Relationship', maxLength: 50 },
                message: { type: 'text', required: true, label: 'Message', minLength: 10, maxLength: 1000, allowNewlines: true }
            },
            VOTE: {
                names: { type: 'text', required: true, label: 'Selected names' }
            },
            POOL: {
                name: { type: 'name', required: true, label: 'Name', maxLength: 100 },
                prediction: { type: 'text', required: true, label: 'Prediction', maxLength: 200 },
                dueDate: { type: 'text', required: true, label: 'Due date' }
            },
            QUIZ: {
                answers: { type: 'text', required: true, label: 'Answers' },
                score: { type: 'text', required: true, label: 'Score' }
            },
            ADVICE: {
                advice: { type: 'text', required: true, label: 'Advice', minLength: 10, maxLength: 1000, allowNewlines: true },
                category: { type: 'text', required: true, label: 'Category', maxLength: 50 }
            }
        }
    };

    console.log('[Security] loaded successfully');
})();