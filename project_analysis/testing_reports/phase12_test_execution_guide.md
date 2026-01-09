# Phase 12 Test Execution Guide

## Quick Start

```bash
# Start the development server
npm run dev &

# Wait for server to start, then run tests
npm test -- tests/e2e/phase12-performance-error-handling.test.js
```

## Test Categories

### 1. Page Load Performance
Tests: FCP, LCP, TTI, DOM load, full page load
```bash
npm test -- --grep "Page Load Performance"
```

### 2. API Response Times
Tests: Guestbook, Pool, Quiz, Advice, Vote, AI endpoints
```bash
npm test -- --grep "API Response Times"
```

### 3. Network Failure Handling
Tests: Network disconnect, form errors, timeouts, 500/404 errors
```bash
npm test -- --grep "Network Failure Handling"
```

### 4. Offline Mode
Tests: Offline functionality, messaging, reconnection
```bash
npm test -- --grep "Offline Mode Behavior"
```

### 5. Form Validation
Tests: Guestbook, Pool, Quiz, Advice validation
```bash
npm test -- --grep "Form Validation Error Messages"
```

### 6. Loading States
Tests: Loading overlay, submission states, success/milestone modals
```bash
npm test -- --grep "Loading States and Spinners"
```

### 7. Timeout Handling
Tests: Form timeout, API timeout, slow network
```bash
npm test -- --grep "Timeout Handling"
```

### 8. Memory Tests
Tests: Memory leaks, console errors, JS execution
```bash
npm test -- --grep "Memory Usage and Leak Detection"
```

### 9. Error Recovery
Tests: Form reset, page recovery, retry, data preservation
```bash
npm test -- --grep "Error Recovery"
```

### 10. Graceful Degradation
Tests: AI unavailable, JS disabled, resources missing, accessibility
```bash
npm test -- --grep "Graceful Degradation"
```

### 11. Concurrency Tests
Tests: Rapid submissions, section access, no race conditions
```bash
npm test -- --grep "Concurrent User Scenarios"
```

### 12. Resource Optimization
Tests: Network requests, 404s, caching, images
```bash
npm test -- --grep "Resource Loading Optimization"
```

### 13. Error Logging
Tests: Console logging, API errors, sensitive info, friendly messages
```bash
npm test -- --grep "Error Logging and Reporting"
```

### 14. Security Tests
Tests: SQL injection, XSS, API key exposure
```bash
npm test -- --grep "Security Error Handling"
```

### 15. Performance Summary
Tests: Generate performance report
```bash
npm test -- --grep "Performance Summary"
```

## Browser-Specific Testing

```bash
# Chromium only
npm test -- --project=chromium

# Firefox only
npm test -- --project=firefox

# WebKit only
npm test -- --project=webkit

# All browsers
npm test -- --project=chromium --project=firefox --project=webkit
```

## Mobile Testing

```bash
# Mobile Chrome (Pixel 5)
npm test -- --project=mobile-chrome

# Mobile Safari (iPhone 12)
npm test -- --project=mobile-safari
```

## Debug Mode

```bash
# With UI
npm test -- --ui

# Headed (show browser)
npm test -- --headed

# Debug mode
npm test -- --debug
```

## Test Results

Results are saved to:
- HTML Report: `test-results/html-report/index.html`
- JSON Report: `test-results/test-results.json`
- JUnit XML: `test-results/test-results.xml`
- Screenshots: `test-results/screenshots/`

## Expected Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| FCP | < 1.5s | First Contentful Paint |
| LCP | < 3.0s | Largest Contentful Paint |
| TTI | < 2.5s | Time to Interactive |
| API | < 2.0s | API response time |
| AI | < 10.0s | AI endpoint response |

## Common Issues

### No Tests Found
Ensure the test file is in `tests/e2e/` and ends with `.test.js`

### Server Not Running
Start the dev server: `npm run dev`

### Environment Variables
Ensure `.env.local` is configured with Supabase credentials

### Timeout Errors
Increase timeout: `--timeout=60000`

## Continuous Integration

```yaml
# .github/workflows/test.yml
- name: Run Phase 12 Tests
  run: npm test -- tests/e2e/phase12-performance-error-handling.test.js
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Test Maintenance

- Update test data in `tests/e2e/fixtures/valid-test-data.json`
- Modify mock responses in `tests/e2e/fixtures/mock-ai-responses.json`
- Adjust thresholds in the test file as needed

## Report Location

Full report: `project_analysis/testing_reports/phase12_performance_error_handling_report.md`
JSON summary: `project_analysis/testing_reports/phase12_performance_error_handling_report.json`
