# Baby Shower App - E2E Testing Suite

Comprehensive end-to-end testing suite for the Baby Shower app using Playwright.

## 📁 Test Structure

```
tests/
├── playwright.config.js         # Playwright configuration
├── README.md                    # This file
└── e2e/
    ├── baby-shower.test.js      # Main test suite (all test cases)
    ├── data-generator.js        # Test data generation utilities
    ├── api-helpers.js           # API testing helpers
    ├── global-setup.js          # Global test setup
    └── global-teardown.js       # Global test teardown
```

## 🧪 Test Suites

The test suite covers 6 major categories:

### 1. Frontend Functionality
- App loads without console errors
- Navigation between all sections
- Form rendering for each activity type
- Form validation on client side

### 2. API Integration
- Guestbook submission API
- Vote submission API
- Pool prediction API
- Quiz submission API
- Advice submission API

### 3. Database Verification
- Data appears in `public.submissions` table
- Schema structure verification (activity_data nesting)
- Trigger migration to `internal.event_archive`

### 4. Error Handling
- Validation errors (empty fields, invalid dates)
- Network error handling
- Form validation messages
- Invalid authorization

### 5. Form Validation
- Required field validation
- Invalid input prevention
- Client-side validation feedback

### 6. Complete Data Flow
- Frontend → API → Database flow
- End-to-end data verification for all activities

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

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co

# API Base URL (auto-configured)
API_BASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1
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
```

### Run Specific Test Suites

```bash
# API Integration tests
npm run test:api

# Frontend tests
npm run test:frontend

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

## ⚙️ Configuration

### Playwright Config

Edit `tests/playwright.config.js` to customize:

- Test timeout (default: 30s)
- Browser selection
- Parallel execution
- Retry behavior
- Reporter settings

### Test Data

Edit `tests/e2e/data-generator.js` to modify:

- Default test data templates
- Random data generation logic
- Invalid test data scenarios

## 🔧 API Endpoints Tested

| Activity | Endpoint | Method |
|----------|----------|--------|
| Guestbook | `https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook` | POST |
| Vote | `https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/vote` | POST |
| Pool | `https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/pool` | POST |
| Quiz | `https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/quiz` | POST |
| Advice | `https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/advice` | POST |

## 📝 Test Data Structure

### Guestbook Data
```javascript
{
  name: "Test Guest",
  message: "Hello World!",
  relationship: "friend"
}
```

### Vote Data
```javascript
{
  names: ["Alice", "Bob"],
  voteCount: 2
}
```

### Pool Data
```javascript
{
  name: "Test Predictor",
  prediction: "2026-02-15",
  dueDate: "2026-02-15"
}
```

### Quiz Data
```javascript
{
  answers: [0, 1, 2],
  score: 3,
  totalQuestions: 3
}
```

### Advice Data
```javascript
{
  name: "Test Advisor",
  advice: "Stay calm and carry on.",
  category: "general"
}
```

## 🐛 Debugging

### Debug Mode

```bash
npm run test:debug
```

### Verbose Logging

Add to `playwright.config.js`:
```javascript
reporter: [
  ['list', { verbose: true }],
  ['html']
]
```

### Take Screenshots on Failure

```javascript
// In playwright.config.js
use: {
  screenshot: 'only-on-failure'
}
```

## 🧹 Cleanup

```bash
# Clean test artifacts
npm run test:clean

# Generate test data (standalone)
npm run test:generate
```

## 📈 Coverage

The test suite verifies:

- ✅ All 5 activity types (guestbook, voting, pool, quiz, advice)
- ✅ Frontend form rendering and validation
- ✅ API endpoints and responses
- ✅ Database schema and data structure
- ✅ Error handling and validation
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari)
- ✅ Mobile responsiveness
- ✅ Complete data flow

## 🔒 Security Notes

- Tests use the Supabase anonymous key (safe for client-side)
- No service role key is used in tests
- Test data is automatically isolated using unique IDs
- Cleanup scripts remove test artifacts

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Baby Shower App Architecture](../ARCHITECTURE.md)

## 🤝 Contributing

1. Add tests for new features
2. Ensure all tests pass before submitting PR
3. Update documentation as needed
4. Follow the existing test patterns
