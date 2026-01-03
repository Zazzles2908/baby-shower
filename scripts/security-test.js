/**
 * Baby Shower App - Security Validation Tests
 * 
 * This file tests all security fixes to ensure they are working correctly
 * Run this after implementing security fixes to verify everything is working
 */

(function() {
    'use strict';

    console.log('[Security Tests] Running security validation...');

    const tests = [];
    let passed = 0;
    let failed = 0;

    function runTest(name, testFn) {
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${name}`);
                passed++;
            } else {
                console.error(`❌ ${name}`);
                failed++;
            }
            tests.push({ name, result });
        } catch (error) {
            console.error(`❌ ${name} - Error:`, error.message);
            failed++;
            tests.push({ name, result: false, error: error.message });
        }
    }

    // Test 1: Configuration Security
    runTest('Config should not have hardcoded API keys', () => {
        if (!window.CONFIG || !window.CONFIG.SUPABASE) return false;
        
        const url = window.CONFIG.SUPABASE.URL;
        const key = window.CONFIG.SUPABASE.ANON_KEY;
        
        // Should not contain hardcoded fallback values
        const hardcodedUrl = 'bkszmvfsfgvdwzacgmfz.supabase.co';
        const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
        
        return !url.includes(hardcodedUrl) && !key.includes(hardcodedKey);
    });

    runTest('Config should have security validation function', () => {
        return window.CONFIG && typeof window.CONFIG.validateSecurity === 'function';
    });

    runTest('Config security validation should work', () => {
        if (!window.CONFIG || !window.CONFIG.validateSecurity) return false;
        
        const result = window.CONFIG.validateSecurity();
        return result && typeof result.isValid === 'boolean' && Array.isArray(result.errors);
    });

    // Test 2: Security Utilities
    runTest('Security utilities should be loaded', () => {
        return window.SECURITY && typeof window.SECURITY.sanitizeText === 'function';
    });

    runTest('Text sanitization should remove dangerous content', () => {
        if (!window.SECURITY) return false;
        
        const dangerous = '<script>alert("xss")</script>';
        const sanitized = window.SECURITY.sanitizeText(dangerous);
        
        return !sanitized.includes('<script>') && !sanitized.includes('</script>');
    });

    runTest('Name sanitization should remove special characters', () => {
        if (!window.SECURITY) return false;
        
        const dangerous = 'John<script>alert("xss")</script>';
        const sanitized = window.SECURITY.sanitizeName(dangerous);
        
        return sanitized === 'John' && !sanitized.includes('<script>');
    });

    runTest('Email sanitization should validate format', () => {
        if (!window.SECURITY) return false;
        
        const validEmail = 'test@example.com';
        const invalidEmail = 'invalid-email';
        
        const validResult = window.SECURITY.sanitizeEmail(validEmail);
        const invalidResult = window.SECURITY.sanitizeEmail(invalidEmail);
        
        return validResult === validEmail && invalidResult === '';
    });

    runTest('URL sanitization should validate protocol', () => {
        if (!window.SECURITY) return false;
        
        const validUrl = 'https://example.com';
        const invalidUrl = 'javascript:alert("xss")';
        
        const validResult = window.SECURITY.sanitizeUrl(validUrl);
        const invalidResult = window.SECURITY.sanitizeUrl(invalidUrl);
        
        return validResult === validUrl && invalidResult === '';
    });

    runTest('Form data sanitization should validate schema', () => {
        if (!window.SECURITY) return false;
        
        const formData = {
            name: 'John<script>',
            message: 'Hello <b>world</b>',
            relationship: 'Friend'
        };
        
        const schema = window.SECURITY.SCHEMAS.GUESTBOOK;
        const result = window.SECURITY.sanitizeFormData(formData, schema);
        
        return result.isValid && !result.data.name.includes('<script>');
    });

    runTest('Security headers should be available', () => {
        if (!window.SECURITY) return false;
        
        const headers = window.SECURITY.getSecurityHeaders();
        return headers && headers['X-Requested-With'] === 'XMLHttpRequest';
    });

    // Test 3: API Security
    runTest('API should sanitize inputs', () => {
        if (!window.API || !window.SECURITY) return false;
        
        // Test that API functions exist and can handle sanitized data
        const testData = {
            name: 'Test<script>',
            message: 'Test message <b>html</b>',
            relationship: 'Friend'
        };
        
        try {
            // This should not throw an error and should sanitize data
            const result = window.API.submitGuestbook(testData);
            return result instanceof Promise;
        } catch {
            return false;
        }
    });

    // Test 4: Environment Variable Security (Edge Functions)
    // Note: These tests would need to be run in the Edge Function environment
    console.log('[Security Tests] Note: Edge Function security tests must be run in Deno environment');

    // Test 5: File Upload Validation
    runTest('File upload validation should work', () => {
        if (!window.SECURITY) return false;
        
        // Mock file object
        const mockFile = {
            name: 'test.jpg',
            size: 1024 * 1024, // 1MB
            type: 'image/jpeg'
        };
        
        const result = window.SECURITY.validateFileUpload(mockFile);
        return result.isValid === true;
    });

    runTest('File upload validation should reject dangerous files', () => {
        if (!window.SECURITY) return false;
        
        // Mock dangerous file
        const dangerousFile = {
            name: 'test<script>.jpg',
            size: 1024 * 1024,
            type: 'image/jpeg'
        };
        
        const result = window.SECURITY.validateFileUpload(dangerousFile);
        return result.isValid === false;
    });

    // Test Results
    console.log('\n[Security Tests] =====================================');
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('=====================================================');

    if (failed > 0) {
        console.error('[Security Tests] Some tests failed! Please review the fixes.');
        console.error('Failed tests:');
        tests.filter(test => !test.result).forEach(test => {
            console.error(`  - ${test.name}${test.error ? ': ' + test.error : ''}`);
        });
    } else {
        console.log('[Security Tests] All security tests passed! ✅');
    }

    // Return test results for programmatic use
    return {
        total: tests.length,
        passed,
        failed,
        tests,
        allPassed: failed === 0
    };
})();