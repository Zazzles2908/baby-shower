# Baby Shower App - Testing Infrastructure

Comprehensive testing infrastructure for the Baby Shower Application using Playwright. Covers unit tests, integration tests, E2E tests, API tests, database tests, and AI integration tests with mocks.

## 📁 Test Structure

```
tests/
├── playwright.config.js          # Main Playwright configuration
├── README.md                     # This file
├── e2e/                          # End-to-End tests
│   ├── global-setup.js          # Test environment setup
│   ├── global-teardown.js       # Cleanup after tests
│   ├── data-generator.js        # Test data generation utilities
│   ├── api-helpers.js           # API testing helper classes
│   ├── baby-shower.test.js      # Main E2E test suite
│   ├── database-population.test.js
│   ├── comprehensive-game-verification.test.js
│   ├── playwright-real-inputs.test.js
│   ├── test-suite.js
│   └── fixtures/                # Test data fixtures
│       ├── valid-test-data.json
│       └── mock-ai-responses.json
├── unit/                        # Unit tests
│   └── validation.test.js       # Validation function tests
├── integration/                 # Integration tests
│   └── data-flow.test.js        # Component interaction tests
├── api/                         # API tests
│   └── edge-functions.test.js   # Edge Function tests
├── db/                          # Database tests
│   └── schema.test.js           # Schema and data integrity tests
├── ai-mocks/                    # AI integration tests with mocks
│   └── ai-integration.test.js   # AI API mock tests
└── test-results/                # Test output (generated)
    ├── html-report/             # HTML test report
    ├── screenshots/             # Failure screenshots
    └── traces/                  # Trace files
```

## 🧪 Test Categories

### 1. Unit Tests (`tests/unit/`)
- Validation logic for all forms
- Configuration verification
- Utility function tests
- Form behavior tests

### 2. Integration Tests (`tests/integration/`)
- Data flow between components
- Activity navigation
- Real-time updates
- Cross-component interactions

### 3. E2E Tests (`tests/e2e/`)
- Complete user workflows
- All 5 activities submission flows
- Mom vs Dad game
- Shoe Game
- Error handling
- Performance benchmarks

### 4. API Tests (`tests/e2e/api-helpers.js`)
- Guestbook Edge Function
- Pool Edge Function
- Quiz Edge Function
- Advice Edge Function
- Vote Edge Function
- Game Edge Functions

### 5. Database Tests (`tests/db/`)
- Schema validation
- RLS policies
- Constraints enforcement
- Data integrity

### 6. AI Integration Tests (`tests/ai-mocks/`)
- MiniMax API mock responses
- Z.AI (GLM-4.7) scenario generation
- Kimi (K2) roast commentary
- Fallback behavior
- Error handling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Playwright browsers

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:install

# Or install specific browsers
npm run test:install:chromium
npm run test:install:firefox
npm run test:install:webkit
```

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API Keys (for testing)
MINIMAX_API_KEY=your-minimax-key
Z_AI_API_KEY=your-z-ai-key
KIMI_API_KEY=your-kimi-key

# Test Configuration
TEST_DATA_PREFIX=test_e2e_
USE_MOCKS=false
```

## 🏃 Running Tests

### Run All Tests

```bash
# Run all tests with default configuration
npm test

# Run with UI mode
npm run test:ui

# Run in headed mode
npm run test:headed

# Run in debug mode
npm run test:debug
```

### Run Specific Test Categories

```bash
# Frontend functionality tests
npm run test:frontend

# API integration tests
npm run test:api

# Database verification tests
npm run test:db

# Error handling tests
npm run test:errors

# Data flow tests
npm run test:flow
```

### Run by Browser

```bash
# Chrome/Chromium
npm run test:chromium

# Firefox
npm run test:firefox

# Safari (WebKit)
npm run test:webkit

# Mobile browsers
npm run test:mobile
```

### CI/CD

```bash
# Run all browsers for CI
npm run test:ci
```

## 📊 Test Data Management

### Data Generators

```javascript
import { 
  generateUniqueId,
  generateGuestbookData,
  generatePoolData,
  generateQuizData,
  generateAdviceData 
} from './data-generator.js';

// Generate unique test data
const guestbookData = generateGuestbookData({
  name: 'Custom Name',
  relationship: 'friend'
});

const poolData = generatePoolData({
  name: 'Predictor Name',
  dueDate: '2026-06-15'
});
```

### Available Data Generators

| Function | Description |
|----------|-------------|
| `generateUniqueId(prefix)` | Creates unique test IDs |
| `generateGuestbookData(overrides)` | Guestbook test data |
| `generateVoteData(overrides)` | Vote test data |
| `generatePoolData(overrides)` | Pool prediction data |
| `generateQuizData(overrides)` | Quiz answers data |
| `generateAdviceData(overrides)` | Advice submission data |
| `generateAllTestData(overrides)` | All test data at once |
| `generateInvalidData()` | Invalid data for error testing |
| `generateNetworkErrorScenarios()` | Network error scenarios |

### Test Fixtures

**Valid Test Data** (`tests/e2e/fixtures/valid-test-data.json`):
- Valid and invalid data for all activities
- Field-specific test cases

**Mock AI Responses** (`tests/e2e/fixtures/mock-ai-responses.json`):
- MiniMax API responses
- Z.AI scenario generation
- Kimi roast commentary

## 🔧 API Testing

### API Helpers

```javascript
import { GuestbookAPI, PoolAPI, QuizAPI, AdviceAPI, VoteAPI } from './api-helpers.js';

const guestbookApi = new GuestbookAPI(request);

const response = await guestbookApi.submitEntry({
  name: 'Test Guest',
  message: 'Test message',
  relationship: 'friend',
  testId: 'unique-test-id'
});

if (response.success) {
  console.log('Success:', response.body);
} else {
  console.error('Error:', response.error);
}
```

### Available API Helpers

| Class | Endpoint | Methods |
|-------|----------|---------|
| `GuestbookAPI` | `guestbook` | `submitEntry()`, `getEntries()` |
| `VoteAPI` | `vote` | `submitVote()`, `getVotes()` |
| `PoolAPI` | `pool` | `submitPrediction()`, `getPredictions()` |
| `QuizAPI` | `quiz` | `submitAnswers()`, `getLeaderboard()` |
| `AdviceAPI` | `advice` | `submitAdvice()`, `getAdvice()` |

### API Endpoints Tested

| Activity | Endpoint | Method |
|----------|----------|--------|
| Guestbook | `/functions/v1/guestbook` | POST |
| Vote | `/functions/v1/vote` | POST |
| Pool | `/functions/v1/pool` | POST |
| Quiz | `/functions/v1/quiz` | POST |
| Advice | `/functions/v1/advice` | POST |
| Game Session | `/functions/v1/game-session` | POST/GET |
| Game Scenario | `/functions/v1/game-scenario` | POST |
| Game Vote | `/functions/v1/game-vote` | POST |
| Game Reveal | `/functions/v1/game-reveal` | POST |

## 📝 Writing New Tests

### E2E Test Template

```javascript
import { test, expect, describe } from '@playwright/test';

describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform expected action', async ({ page }) => {
    // Navigate to feature
    await page.click('[data-section="feature-name"]');

    // Perform action
    await page.fill('#feature-field', 'test value');
    await page.click('#submit-button');

    // Verify result
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
  });
});
```

### Unit Test Template

```javascript
import { test, expect, describe } from '@playwright/test';

describe('Validation Function', () => {
  test('should validate input correctly', async ({ page }) => {
    await page.goto('/');

    // Test validation
    await page.fill('#input-field', 'invalid-value');
    await page.click('#submit-button');

    // Check validation error
    const isInvalid = await page.locator('#input-field:invalid').count();
    expect(isInvalid).toBeGreaterThanOrEqual(0);
  });
});
```

## 📊 Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npm run test:report
```

Or open directly:
```
test-results/html-report/index.html
```

### JSON Report

Machine-readable results:
```
test-results/test-results.json
```

### JUnit Report

CI-compatible XML format:
```
test-results/test-results.xml
```

## ⚙️ Configuration

### Playwright Config

Edit `tests/playwright.config.js` to customize:

- **Timeout:** 30 seconds per test
- **Retries:** 2 retries in CI, 0 locally
- **Reporters:** HTML, JSON, List, JUnit
- **Projects:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Trace:** On first retry
- **Screenshot:** On failure only

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `MINIMAX_API_KEY` | MiniMax API key for AI features |
| `Z_AI_API_KEY` | Z.AI API key for game scenarios |
| `KIMI_API_KEY` | Kimi API key for game roasts |
| `TEST_DATA_PREFIX` | Prefix for test data isolation |
| `USE_MOCKS` | Whether to use AI mocks (`true`/`false`) |

## 🔒 Security Notes

- Tests use the Supabase anonymous key (safe for client-side)
- No service role key is used in tests (except where needed)
- Test data is automatically isolated using unique IDs
- Cleanup scripts remove test artifacts
- AI mocks prevent external API dependency in tests

## 🐛 Debugging

### Debug Mode

```bash
npm run test:debug
```

### Verbose Logging

```bash
DEBUG=pw:api npm test
```

### Take Screenshots on Failure

Enabled by default in `playwright.config.js`:
```javascript
use: {
  screenshot: 'only-on-failure'
}
```

### Clean Test Artifacts

```bash
# Clean test artifacts
npm run test:clean

# Generate test data (standalone)
npm run test:generate
```

## 📈 Coverage

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

## CI/CD Integration

### GitHub Actions

The workflow file is located at `.github/workflows/tests.yml` and includes:

1. **Install & Lint** - Dependencies and linting
2. **Unit Tests** - Validation and utility tests
3. **Integration Tests** - Component interactions
4. **E2E Tests** - All browsers (Chromium, Firefox, WebKit)
5. **Mobile Tests** - Mobile Chrome and Safari
6. **API Tests** - Edge Function validation
7. **Database Tests** - Schema and integrity
8. **Report Generation** - Combined test summary

### Running in CI

```bash
# Set environment variables in GitHub Secrets
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# MINIMAX_API_KEY
# Z_AI_API_KEY
# KIMI_API_KEY

# Push to trigger workflow
git push origin main
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [AGENTS.md](../AGENTS.md) - Development guidelines
- [project_analysis/](../project_analysis/) - System architecture

## 🤝 Contributing

1. Add tests for new features
2. Ensure all tests pass before submitting PR
3. Update documentation as needed
4. Follow the existing test patterns
5. Use data generators for consistent test data

---

**Last Updated:** January 9, 2026  
**Version:** 1.0
