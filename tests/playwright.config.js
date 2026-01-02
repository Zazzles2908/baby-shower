/**
 * Baby Shower App - Playwright Configuration
 * Comprehensive E2E testing setup for all 5 activity types
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory configuration
  testDir: './tests/e2e',
  
  // Fully parallelize tests for faster execution
  fullyParallel: true,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Workers for parallel execution
  workers: process.env.CI ? 4 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],
  
  // Global timeout for all tests
  timeout: 30000,
  
  // Global setup and teardown
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  
  // Use base URL for frontend tests
  baseURL: 'http://localhost:3000',
  
  // Trace recording for debugging
  trace: 'on-first-retry',
  
  // Screenshot configuration
  screenshot: 'only-on-failure',
  
  // Projects for different browsers
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000,
        baseURL: 'http://localhost:3000'
      }
    },
    
    // Desktop Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000
      }
    },
    
    // Desktop Safari (WebKit)
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000
      }
    },
    
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
        actionTimeout: 10000
      }
    },
    
    // Mobile Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        browserName: 'webkit',
        actionTimeout: 10000
      }
    }
  ],
  
  // WebServer configuration for local development
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  },
  
  // Environment variables available to tests
  use: {
    // Supabase configuration
    SUPABASE_URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    
    // API base URL for Edge Functions
    API_BASE_URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1',
    
    // Test data (will be overridden by environment variables in CI)
    TEST_DATA: {
      guestbook: {
        name: 'Test Guest',
        message: 'Hello World!',
        relationship: 'friend'
      },
      vote: {
        names: ['Alice', 'Bob'],
        voteCount: 2
      },
      pool: {
        name: 'Test Predictor',
        prediction: '2026-02-15',
        dueDate: '2026-02-15'
      },
      quiz: {
        answers: [0, 1, 2],
        score: 3,
        totalQuestions: 3
      },
      advice: {
        name: 'Test Advisor',
        advice: 'Stay calm and carry on.',
        category: 'general'
      }
    },
    
    // Timezone for consistent testing
    timezoneId: 'Australia/Sydney',
    
    // Ignore HTTPS errors (for local development)
    ignoreHTTPSErrors: true,
    
    // Storage state for authenticated tests
    storageState: './e2e/.auth/state.json'
  },
  
  // Configure expectations for assertions
  expect: {
    // Timeout for assertions
    timeout: 5000,
    
    // Custom expectations
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2
    }
  },
  
  // Exit code zero even if tests fail (for reporting)
  preserveOutput: 'always',
  
  // Filter for specific test files
  testMatch: '**/*.test.js',
  
  // Ignore files that are not tests
  testIgnore: ['**/*.spec.js', '**/*.ignore.js'],
  
  // TypeScript configuration for tests
  typescript: {
    // Use the project's tsconfig
    tsconfigPath: './tsconfig.json'
  }
});
