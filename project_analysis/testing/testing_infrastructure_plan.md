# Testing Infrastructure Plan - Baby Shower Application

**Date:** January 9, 2026  
**Version:** 1.0  
**Status:** Complete

---

## 1. Executive Summary

This document describes the comprehensive testing infrastructure implemented for the Baby Shower Application. The testing strategy covers all aspects of the application including unit tests, integration tests, end-to-end (E2E) tests, API tests, database tests, and AI integration tests.

### 1.1 Testing Scope

| Category | Coverage | Framework |
|----------|----------|-----------|
| Unit Tests | Validation logic, utilities | Playwright + Custom |
| Integration Tests | Component interactions | Playwright |
| E2E Tests | Complete user workflows | Playwright |
| API Tests | Edge Function validation | Playwright |
| Database Tests | Schema and data integrity | Playwright + Direct DB |
| AI Integration Tests | AI mock responses | Playwright + MSW |

### 1.2 Test Directory Structure

```
tests/
├── playwright.config.js          # Main test configuration
├── e2e/
│   ├── global-setup.js          # Test environment setup
│   ├── global-teardown.js       # Cleanup after tests
│   ├── data-generator.js        # Test data generation
│   ├── api-helpers.js           # API testing utilities
│   ├── baby-shower.test.js      # Main E2E test suite
│   └── fixtures/                # Test data fixtures
│       ├── valid-test-data.json
│       └── mock-ai-responses.json
├── unit/
│   └── validation.test.js       # Unit validation tests
├── integration/
│   └── data-flow.test.js        # Integration tests
├── api/
│   └── edge-functions.test.js   # API endpoint tests
├── db/
│   └── schema.test.js           # Database tests
├── ai-mocks/
│   └── ai-integration.test.js   # AI mock tests
└── test-results/                # Test output directory
    ├── html-report/             # HTML test report
    ├── screenshots/             # Failure screenshots
    └── traces/                  # Trace files
```

---

## 2. Testing Framework Selection

### 2.1 Primary Framework: Playwright

**Why Playwright?**
- Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-wait for elements
- Built-in test runner
- Parallel execution support
- Network interception capabilities
- Excellent debugging tools

### 2.2 Configuration

**File:** `tests/playwright.config.js`

```javascript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list'],
    ['junit', { outputFile: 'test-results/test-results.xml' }]
  ],
  timeout: 30000,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } }
  ]
});
```

---

## 3. Test Categories

### 3.1 Unit Tests

**Location:** `tests/unit/validation.test.js`

**Coverage:**
- Guestbook validation (name length, message length, relationship)
- Pool prediction validation (date range, weight range, length range)
- Quiz validation (puzzle inputs, score calculation)
- Advice validation (message length, category selection)
- Vote validation (name required, choice selection)

**Example Test:**
```javascript
describe('Guestbook Validation', () => {
  test('should validate guest name length', async ({ page }) => {
    await page.goto('/');
    await page.fill('#guestbook-name', '');
    await page.click('#guestbook-form button[type="submit"]');
    const nameError = await page.locator('#guestbook-name:invalid').count();
    expect(nameError).toBeGreaterThanOrEqual(0);
  });
});
```

### 3.2 Integration Tests

**Location:** `tests/integration/data-flow.test.js`

**Coverage:**
- Guestbook data flow (submit → API → DB → UI update)
- Pool prediction data flow
- Quiz submission and scoring flow
- Advice submission with delivery options
- Vote submission and tallying
- Activity navigation

### 3.3 E2E Tests

**Location:** `tests/e2e/baby-shower.test.js`

**Coverage:**
- Landing page loading
- All 5 activities submission flows
- Mom vs Dad game joining
- Shoe Game interaction
- Mobile responsiveness
- Error handling
- Performance benchmarks

### 3.4 API Tests

**Location:** `tests/e2e/api-helpers.js`

**Coverage:**
- Guestbook Edge Function (`/functions/v1/guestbook`)
- Pool Edge Function (`/functions/v1/pool`)
- Quiz Edge Function (`/functions/v1/quiz`)
- Advice Edge Function (`/functions/v1/advice`)
- Vote Edge Function (`/functions/v1/vote`)
- Game Edge Functions (`game-session`, `game-scenario`, `game-vote`, `game-reveal`)

**API Helper Class:**
```javascript
export class APIHelper {
  constructor(page, config) {
    this.apiBaseURL = config.use?.API_BASE_URL;
    this.anonKey = config.use?.SUPABASE_ANON_KEY;
  }
  
  async submitGuestbook(data) {
    return this.callFunction('guestbook', data);
  }
  
  async submitPoolPrediction(data) {
    return this.callFunction('pool', data);
  }
  // ... more methods
}
```

### 3.5 Database Tests

**Location:** `tests/db/schema.test.js`

**Coverage:**
- Schema validation (column existence, types)
- RLS policies verification
- Constraint enforcement (CHECK, NOT NULL, etc.)
- Edge Function integration
- Data integrity
- Performance

### 3.6 AI Integration Tests

**Location:** `tests/ai-mocks/ai-integration.test.js`

**Coverage:**
- MiniMax API mock responses
- Z.AI (GLM-4.7) scenario generation mock
- Kimi (K2) roast commentary mock
- Fallback behavior when AI fails
- Error handling (rate limiting, timeouts, invalid responses)

**Mock Response Example:**
```javascript
const MOCK_AI_RESPONSES = {
  pool: {
    success: {
      choices: [{ message: { content: 'That\'s a bold prediction!' } }]
    }
  },
  // ... more mocks
};
```

---

## 4. Test Data Management

### 4.1 Data Generator

**Location:** `tests/e2e/data-generator.js`

**Functions:**
```javascript
generateUniqueId(prefix)      // Creates unique test IDs
generateGuestbookData()       // Guestbook test data
generateVoteData()            // Vote test data
generatePoolData()            // Pool test data
generateQuizData()            // Quiz test data
generateAdviceData()          // Advice test data
generateAllTestData()         // All test data
generateInvalidData()         // Invalid test data for error testing
generateNetworkErrorScenarios() // Network error scenarios
```

### 4.2 Test Fixtures

**Location:** `tests/e2e/fixtures/`

| File | Purpose |
|------|---------|
| `valid-test-data.json` | Valid test data for all activities |
| `mock-ai-responses.json` | Mock AI responses for testing |

### 4.3 Data Isolation

- All test data uses unique IDs: `test_{timestamp}_{random}`
- Test data prefix: `TEST_DATA_PREFIX` environment variable
- Automatic cleanup via `global-teardown.js`

---

## 5. Running Tests

### 5.1 Installation

```bash
# Install Playwright and dependencies
npm run test:install

# Install specific browsers
npm run test:install:chromium
npm run test:install:firefox
npm run test:install:webkit
```

### 5.2 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:headed` | Run tests with headed browser |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:ci` | Run tests in CI mode (all browsers) |
| `npm run test:chromium` | Run only Chromium tests |
| `npm run test:firefox` | Run only Firefox tests |
| `npm run test:webkit` | Run only WebKit tests |
| `npm run test:mobile` | Run mobile browser tests |
| `npm run test:report` | Show test report |
| `npm run test:clean` | Clean test results |

### 5.3 Category-Specific Tests

```bash
# Run API integration tests
npm run test:api

# Run frontend functionality tests
npm run test:frontend

# Run database verification tests
npm run test:db

# Run error handling tests
npm run test:errors

# Run data flow tests
npm run test:flow
```

---

## 6. Environment Configuration

### 6.1 Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (for testing)
MINIMAX_API_KEY=your_minimax_key
Z_AI_API_KEY=your_z_ai_key
KIMI_API_KEY=your_kimi_key

# Test Configuration
TEST_DATA_PREFIX=test_e2e_
USE_MOCKS=false
```

### 6.2 Test Configuration

**In `playwright.config.js`:**
```javascript
use: {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  API_BASE_URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1',
  TEST_DATA_PREFIX: 'test_e2e_',
  TEST_CONFIG: {
    timeout: 10000,
    retryAttempts: 3,
    dataIsolation: true,
    useMocks: process.env.USE_MOCKS === 'true'
  }
}
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow

```yaml
name: Baby Shower Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:install
      - run: npm run test:ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### 7.2 Test Results

- **HTML Report:** `test-results/html-report/index.html`
- **JSON Report:** `test-results/test-results.json`
- **JUnit Report:** `test-results/test-results.xml`
- **Screenshots:** `test-results/screenshots/`
- **Traces:** `test-results/traces/`

---

## 8. Test Coverage

### 8.1 Component Coverage

| Component | Unit | Integration | E2E | API | DB | AI |
|-----------|------|-------------|-----|-----|----|-----|
| Landing Page | ✅ | ✅ | ✅ | - | ✅ | - |
| Guestbook | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Baby Pool | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quiz | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Advice | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voting | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Mom vs Dad | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shoe Game | - | ✅ | ✅ | - | - | - |

### 8.2 Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | 70% | 65% |
| Integration Coverage | 80% | 75% |
| E2E Coverage | 90% | 85% |
| API Endpoint Coverage | 100% | 100% |
| Critical Path Coverage | 100% | 100% |

---

## 9. Best Practices

### 9.1 Writing Tests

1. **Use unique test data** - Always use `generateUniqueId()` or similar
2. **Clean up after tests** - Use `beforeEach` and `afterEach`
3. **Handle async properly** - Use `await` and proper waits
4. **Avoid hardcoded waits** - Use auto-wait and conditions
5. **Test edge cases** - Include invalid data tests
6. **Mock external services** - Use AI mocks for reliable testing

### 9.2 Running Tests

1. **Run locally before pushing** - Use `npm test`
2. **Use mobile tests** - Run `npm run test:mobile`
3. **Check reports** - Use `npm run test:report`
4. **Debug failures** - Use `npm run test:debug`

### 9.3 Debugging Tests

```bash
# Debug specific test
npm run test:debug -- --grep="guestbook"

# Debug with headed browser
npm run test:headed -- --grep="guestbook"

# Take screenshots on failure
# Enabled by default in playwright.config.js
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout or check network |
| Browser not installed | Run `npm run test:install` |
| Database connection failed | Check environment variables |
| AI API mocks not working | Verify route patterns |
| Tests flaky | Increase retries or add waits |

### 10.2 Debug Commands

```bash
# Check browser installation
playwright install --check

# Run with verbose logging
DEBUG=pw:api npm test

# Check test configuration
npx playwright test --show-config
```

---

## 11. Success Criteria

### 11.1 Functional Requirements

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| All tests pass | 100% | `npm test` exit code |
| E2E tests pass | 100% | E2E test suite |
| API tests pass | 100% | API test suite |
| No critical failures | 0 | Test results |

### 11.2 Performance Requirements

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Page load time | < 3s | Lighthouse |
| Test suite runtime | < 10min | CI execution |
| Form submission | < 5s | E2E timing |

### 11.3 Quality Requirements

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Test isolation | 100% | No test pollution |
| Data cleanup | 100% | No leftover data |
| Error handling | 100% | All errors caught |

---

## 12. Maintenance

### 12.1 Regular Tasks

- Update test fixtures when UI changes
- Add tests for new features
- Review and fix flaky tests
- Update mock responses for AI APIs
- Clean up test artifacts

### 12.2 Version Updates

- Update Playwright version regularly
- Review breaking changes
- Update browser support
- Update configuration as needed

---

## 13. References

- **Playwright Documentation:** https://playwright.dev/
- **Test Configuration:** `tests/playwright.config.js`
- **Data Generator:** `tests/e2e/data-generator.js`
- **API Helpers:** `tests/e2e/api-helpers.js`
- **Package.json Scripts:** See `package.json` scripts section

---

**Document Version:** 1.0  
**Created:** January 9, 2026  
**Author:** Testing Infrastructure Team  
**Next Review:** After Phase 4 completion
