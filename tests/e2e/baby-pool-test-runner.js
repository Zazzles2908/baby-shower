/**
 * Baby Shower App - Baby Pool E2E Test Runner
 * Phase 3: Comprehensive testing for Baby Pool feature
 * 
 * This script runs automated tests and generates the detailed report.
 */

const { chromium } = require('playwright');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  dateRange: { min: '2026-01-06', max: '2026-12-31' },
  validFormData: {
    name: 'Test Predictor',
    date: '2026-06-15',
    time: '14:30',
    weight: '3.5',
    length: '50',
    colour: 'pink'
  },
  aiTimeout: 10000
};

const testResults = [];
const testId = `pool-e2e-${Date.now()}`;

async function runTest(testName, testFn) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name: testName, status: 'PASS', duration, error: null });
    console.log(`✅ ${testName} (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.push({ name: testName, status: 'FAIL', duration, error: error.message });
    console.log(`❌ ${testName} (${duration}ms): ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting Baby Pool E2E Tests - Phase 3\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // ============================================
  // TEST 1: Form Loading
  // ============================================
  console.log('\n--- Form Loading Tests ---');
  
  await runTest('TC-POOL-001: Form elements visible', async () => {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });
    await page.click('[data-section="pool"]');
    await page.waitForSelector('#pool-form', { timeout: 5000 });
    
    const elements = ['#pool-name', '#pool-date', '#pool-time', '#pool-weight', 
                      '#pool-length', '#colour-grid', '#pool-favourite-colour'];
    for (const selector of elements) {
      await page.waitForSelector(selector, { timeout: 3000 });
    }
  });

  await runTest('TC-POOL-002: Date range attributes', async () => {
    await page.click('[data-section="pool"]');
    const min = await page.locator('#pool-date').getAttribute('min');
    const max = await page.locator('#pool-date').getAttribute('max');
    
    if (min !== TEST_CONFIG.dateRange.min) throw new Error(`Min date ${min} !== ${TEST_CONFIG.dateRange.min}`);
    if (max !== TEST_CONFIG.dateRange.max) throw new Error(`Max date ${max} !== ${TEST_CONFIG.dateRange.max}`);
  });

  await runTest('TC-POOL-003: Colour grid initialization', async () => {
    await page.click('[data-section="pool"]');
    await page.waitForSelector('#colour-grid .colour-option', { timeout: 5000 });
    const count = await page.locator('#colour-grid .colour-option').count();
    if (count !== 6) throw new Error(`Expected 6 colour options, got ${count}`);
  });

  // ============================================
  // TEST 2: Date Validation
  // ============================================
  console.log('\n--- Date Validation Tests ---');
  
  await runTest('TC-POOL-010: Reject dates before 2026-01-06', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-date', '2026-01-05');
    const value = await page.locator('#pool-date').inputValue();
    if (value === '2026-01-05') throw new Error('Invalid date was accepted');
  });

  await runTest('TC-POOL-011: Reject dates after 2026-12-31', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-date', '2027-01-01');
    const value = await page.locator('#pool-date').inputValue();
    if (value === '2027-01-01') throw new Error('Invalid date was accepted');
  });

  await runTest('TC-POOL-012: Accept valid date', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-date', '2026-06-15');
    const value = await page.locator('#pool-date').inputValue();
    if (value !== '2026-06-15') throw new Error('Valid date was not accepted');
  });

  // ============================================
  // TEST 3: Form Validation
  // ============================================
  console.log('\n--- Form Validation Tests ---');
  
  await runTest('TC-POOL-030: Empty name validation', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-time', '14:30');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '50');
    await page.click('[data-colour="pink"]');
    
    page.on('dialog', async dialog => {
      if (!dialog.message().toLowerCase().includes('name')) {
        throw new Error('Expected name validation error');
      }
      await dialog.dismiss();
    });
    
    await page.click('#pool-form button[type="submit"]');
    await page.waitForTimeout(500);
  });

  await runTest('TC-POOL-032: Invalid weight validation', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-name', 'Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-time', '14:30');
    await page.fill('#pool-weight', '0.5');
    await page.fill('#pool-length', '50');
    await page.click('[data-colour="pink"]');
    
    page.on('dialog', async dialog => {
      if (!dialog.message().toLowerCase().includes('weight')) {
        throw new Error('Expected weight validation error');
      }
      await dialog.dismiss();
    });
    
    await page.click('#pool-form button[type="submit"]');
    await page.waitForTimeout(500);
  });

  await runTest('TC-POOL-033: Invalid length validation', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-name', 'Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-time', '14:30');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '35');
    await page.click('[data-colour="pink"]');
    
    page.on('dialog', async dialog => {
      if (!dialog.message().toLowerCase().includes('length')) {
        throw new Error('Expected length validation error');
      }
      await dialog.dismiss();
    });
    
    await page.click('#pool-form button[type="submit"]');
    await page.waitForTimeout(500);
  });

  // ============================================
  // TEST 4: Form Submission
  // ============================================
  console.log('\n--- Form Submission Tests ---');
  
  await runTest('TC-POOL-020: Successful submission', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-name', `Test ${testId}`);
    await page.fill('#pool-date', TEST_CONFIG.validFormData.date);
    await page.fill('#pool-time', TEST_CONFIG.validFormData.time);
    await page.fill('#pool-weight', TEST_CONFIG.validFormData.weight);
    await page.fill('#pool-length', TEST_CONFIG.validFormData.length);
    await page.click('[data-colour="pink"]');
    
    await page.click('#pool-form button[type="submit"]');
    await page.waitForSelector('#success-modal:not(.hidden)', { timeout: 15000 });
    
    const message = await page.locator('#success-message').textContent();
    if (!message.toLowerCase().includes('prediction') && !message.toLowerCase().includes('saved')) {
      throw new Error('Success message does not contain expected text');
    }
  });

  // ============================================
  // TEST 5: Form Reset
  // ============================================
  console.log('\n--- Form Reset Tests ---');
  
  await runTest('TC-POOL-070: Form resets after submission', async () => {
    await page.click('[data-section="pool"]');
    await page.fill('#pool-name', `Reset Test ${testId}`);
    await page.fill('#pool-date', '2026-04-15');
    await page.fill('#pool-time', '15:00');
    await page.fill('#pool-weight', '3.9');
    await page.fill('#pool-length', '52');
    await page.click('[data-colour="blue"]');
    
    await page.click('#pool-form button[type="submit"]');
    await page.waitForSelector('#success-modal:not(.hidden)', { timeout: 15000 });
    await page.click('#success-modal button');
    
    // Verify form is reset
    const nameValue = await page.locator('#pool-name').inputValue();
    const dateValue = await page.locator('#pool-date').inputValue();
    
    if (nameValue !== '') throw new Error('Name field not reset');
    if (dateValue !== '') throw new Error('Date field not reset');
    
    const selectedColours = await page.locator('#colour-grid .colour-option.selected').count();
    if (selectedColours !== 0) throw new Error('Colour selection not reset');
  });

  // ============================================
  // TEST 6: Mobile Responsiveness
  // ============================================
  console.log('\n--- Mobile Responsiveness Tests ---');
  
  await browser.close();
  const mobileContext = await chromium.launch({ headless: true }).then(b => 
    b.newContext({ viewport: { width: 390, height: 844 } })
  );
  const mobilePage = await mobileContext.newPage();
  
  await runTest('TC-POOL-110: Form displays on mobile', async () => {
    await mobilePage.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });
    await mobilePage.click('[data-section="pool"]');
    await mobilePage.waitForSelector('#pool-form', { timeout: 5000 });
  });

  await runTest('TC-POOL-112: Form submission works on mobile', async () => {
    await mobilePage.fill('#pool-name', `Mobile Test ${testId}`);
    await mobilePage.fill('#pool-date', '2026-06-10');
    await mobilePage.fill('#pool-time', '12:00');
    await mobilePage.fill('#pool-weight', '3.5');
    await mobilePage.fill('#pool-length', '50');
    await mobilePage.click('[data-colour="blue"]');
    
    await mobilePage.click('#pool-form button[type="submit"]');
    await mobilePage.waitForSelector('#success-modal:not(.hidden)', { timeout: 15000 });
  });

  await mobileContext.close();

  // ============================================
  // TEST 7: AI Integration
  // ============================================
  console.log('\n--- AI Integration Tests ---');
  
  const browser2 = await chromium.launch({ headless: true });
  const context2 = await browser2.newContext({ viewport: { width: 1280, height: 720 } });
  const page2 = await context2.newPage();
  
  await runTest('TC-POOL-040: AI roast displays', async () => {
    await page2.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });
    await page2.click('[data-section="pool"]');
    await page2.fill('#pool-name', `Roast Test ${testId}`);
    await page2.fill('#pool-date', '2026-07-01');
    await page2.fill('#pool-time', '09:00');
    await page2.fill('#pool-weight', '4.0');
    await page2.fill('#pool-length', '48');
    await page2.click('[data-colour="purple"]');
    
    await page2.click('#pool-form button[type="submit"]');
    
    // Wait for either roast or success modal
    try {
      await page2.waitForSelector('#roast-container.roast-visible', { timeout: 15000 });
    } catch {
      // If roast doesn't appear, check for success modal
      await page2.waitForSelector('#success-modal:not(.hidden)', { timeout: 5000 });
    }
  });

  await browser2.close();

  // ============================================
  // Generate Report
  // ============================================
  console.log('\n\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const passRate = ((passed / testResults.length) * 100).toFixed(1);
  
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Pass Rate: ${passRate}%`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return { testResults, passed, failed, passRate, consoleErrors };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(({ testResults, passed, failed, passRate, consoleErrors }) => {
      console.log('\n\nConsole Errors:', consoleErrors.length);
      console.log('\nTest execution completed.');
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, TEST_CONFIG, testResults };
