/**
 * Baby Shower App - Comprehensive Playwright Configuration
 * Testing infrastructure for all components: Guestbook, Pool, Quiz, Advice, Voting, Games
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory configuration
  testDir: './tests/e2e',
  
  // Fully parallelize tests for faster execution
  fullyParallel: true,
  
  // Retry failed tests (more retries in CI)
  retries: process.env.CI ? 2 : 0,
  
  // Workers for parallel execution
  workers: process.env.CI ? 4 : undefined,
  
  // Reporter configuration - Multiple reporters for different needs
  reporter: [
    // HTML report for local development
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    // JSON report for CI/CD integration
    ['json', { 
      outputFile: 'test-results/test-results.json',
      outputMode: 'append'
    }],
    // List reporter for terminal output
    ['list'],
    // JUnit reporter for CI systems
    ['junit', { 
      outputFile: 'test-results/test-results.xml' 
    }]
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
  video: 'retain-on-failure',
  
  // Projects for different browsers and device configurations
  projects: [
    // === Desktop Browsers ===
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
    
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000
      }
    },
    
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000
      }
    },
    
    // === Mobile Browsers ===
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
        actionTimeout: 10000
      }
    },
    
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        browserName: 'webkit',
        actionTimeout: 10000
      }
    },
    
    // === Tablet ===
    {
      name: 'tablet',
      use: {
        ...devices['iPad Mini'],
        browserName: 'chromium',
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
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    
    // API base URL for Edge Functions
    API_BASE_URL: process.env.API_BASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1',
    
    // AI API Keys (for testing with mocks)
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || '',
    Z_AI_API_KEY: process.env.Z_AI_API_KEY || '',
    KIMI_API_KEY: process.env.KIMI_API_KEY || '',
    
    // Test data prefix for data isolation
    TEST_DATA_PREFIX: process.env.TEST_DATA_PREFIX || 'test_e2e_',
    
    // Test configuration
    TEST_CONFIG: {
      timeout: 10000,
      retryAttempts: 3,
      dataIsolation: true,
      useMocks: process.env.USE_MOCKS === 'true'
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
    
    // Screenshot comparison settings
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2
    },
    
    // Number assertions
    toBeGreaterThan: {
      interval: 100
    }
  },
  
  // Exit code zero even if tests fail (for reporting)
  preserveOutput: 'always',
  
  // Filter for specific test files
  testMatch: '**/*.test.js',
  
  // Ignore files that are not tests
  testIgnore: ['**/*.spec.js', '**/*.ignore.js', '**/archive/**'],
  
  // Maximum test failures before stopping
  maxFailures: process.env.CI ? 50 : 10
});
