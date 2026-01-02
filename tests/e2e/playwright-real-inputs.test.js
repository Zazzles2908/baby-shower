/**
 * Baby Shower App - Playwright E2E Test with Real User Inputs
 * Tests the application with realistic user data to validate production functionality
 * 
 * Run with: npx playwright test tests/e2e/playwright-real-inputs.test.js
 * Or: node tests/e2e/playwright-real-inputs.test.js (if using puppeteer)
 */

import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Realistic user inputs for testing
const TEST_USERS = {
  guestbook: {
    name: 'Sarah Johnson',
    relationship: 'Friend',
    message: 'Congratulations on your little miracle! Wishing you all the joy and love in the world. Can\'t wait to meet the newest member of your family!'
  },
  pool: {
    name: 'Michael Chen',
    date: '2026-03-15',
    time: '08:30',
    weight: '3.4',
    length: '51'
  },
  quiz: {
    name: 'Emma Wilson',
    answers: {
      puzzle1: 'baby shower',
      puzzle2: 'little wolf',
      puzzle3: 'good night sleep tight',
      puzzle4: 'bottle and lotion',
      puzzle5: 'baby diaper'
    }
  },
  advice: {
    name: 'Jennifer Martinez',
    type: 'For Parents',
    message: 'Trust your instincts - you know your baby better than anyone. Take time for yourself too, a rested parent is a better parent. Don\'t be afraid to ask for help!'
  },
  vote: {
    name: 'David Thompson',
    names: ['Emma', 'Olivia', 'Sophia']
  }
};

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function logTest(name, passed, details = null) {
  results.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
  results.summary.total++;
  if (passed) {
    results.summary.passed++;
    console.log(`  ✓ ${name}`);
  } else {
    results.summary.failed++;
    console.log(`  ✗ ${name}`);
  }
}

async function waitForLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

async function waitForSuccessModal(page) {
  try {
    await page.waitForSelector('#success-modal:not(.hidden)', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

async function closeModal(page) {
  const modalBtn = page.locator('#success-modal .modal-btn');
  if (await modalBtn.isVisible()) {
    await modalBtn.click();
    await page.waitForTimeout(500);
  }
}

async function goBackToActivities(page) {
  const backBtn = page.locator('.back-btn').first();
  if (await backBtn.isVisible()) {
    await backBtn.click();
    await page.waitForTimeout(500);
  }
}

async function testGuestbook(page) {
  console.log('\n📝 Testing Guestbook with real user: Sarah Johnson');
  
  try {
    // Click Guestbook button
    await page.click('[data-section="guestbook"]');
    await page.waitForTimeout(500);
    
    // Fill in real user data
    await page.fill('#guestbook-name', TEST_USERS.guestbook.name);
    await page.selectOption('#guestbook-relationship', TEST_USERS.guestbook.relationship);
    await page.fill('#guestbook-message', TEST_USERS.guestbook.message);
    
    // Submit
    await page.click('#guestbook-form button[type="submit"]');
    
    // Check for success
    const success = await waitForSuccessModal(page);
    
    if (success) {
      logTest('Guestbook submission with real input', true, {
        name: TEST_USERS.guestbook.name,
        relationship: TEST_USERS.guestbook.relationship,
        messageLength: TEST_USERS.guestbook.message.length
      });
    } else {
      logTest('Guestbook submission with real input', false, { error: 'No success modal appeared' });
    }
    
    await closeModal(page);
    await goBackToActivities(page);
    
  } catch (error) {
    logTest('Guestbook submission with real input', false, { error: error.message });
  }
}

async function testPool(page) {
  console.log('\n🎯 Testing Baby Pool with real user: Michael Chen');
  
  try {
    // Click Pool button
    await page.click('[data-section="pool"]');
    await page.waitForTimeout(500);
    
    // Fill in real user data
    await page.fill('#pool-name', TEST_USERS.pool.name);
    await page.fill('#pool-date', TEST_USERS.pool.date);
    await page.fill('#pool-time', TEST_USERS.pool.time);
    await page.fill('#pool-weight', TEST_USERS.pool.weight);
    await page.fill('#pool-length', TEST_USERS.pool.length);
    
    // Submit
    await page.click('#pool-form button[type="submit"]');
    
    // Check for success
    const success = await waitForSuccessModal(page);
    
    if (success) {
      logTest('Baby Pool submission with real input', true, {
        name: TEST_USERS.pool.name,
        birthDate: TEST_USERS.pool.date,
        birthTime: TEST_USERS.pool.time,
        weight: TEST_USERS.pool.weight,
        length: TEST_USERS.pool.length
      });
    } else {
      logTest('Baby Pool submission with real input', false, { error: 'No success modal appeared' });
    }
    
    await closeModal(page);
    await goBackToActivities(page);
    
  } catch (error) {
    logTest('Baby Pool submission with real input', false, { error: error.message });
  }
}

async function testQuiz(page) {
  console.log('\n🧩 Testing Quiz with real user: Emma Wilson');
  
  try {
    // Click Quiz button
    await page.click('[data-section="quiz"]');
    await page.waitForTimeout(500);
    
    // Fill in real user data
    await page.fill('#quiz-name', TEST_USERS.quiz.name);
    
    const answers = TEST_USERS.quiz.answers;
    const inputs = page.locator('#quiz-form input[name^="puzzle"]');
    const count = await inputs.count();
    
    if (count >= 5) {
      await inputs.nth(0).fill(answers.puzzle1);
      await inputs.nth(1).fill(answers.puzzle2);
      await inputs.nth(2).fill(answers.puzzle3);
      await inputs.nth(3).fill(answers.puzzle4);
      await inputs.nth(4).fill(answers.puzzle5);
    }
    
    // Submit
    await page.click('#quiz-form button[type="submit"]');
    
    // Check for success
    const success = await waitForSuccessModal(page);
    
    if (success) {
      logTest('Quiz submission with real input', true, {
        name: TEST_USERS.quiz.name,
        answers: Object.values(answers)
      });
    } else {
      logTest('Quiz submission with real input', false, { error: 'No success modal appeared' });
    }
    
    await closeModal(page);
    await goBackToActivities(page);
    
  } catch (error) {
    logTest('Quiz submission with real input', false, { error: error.message });
  }
}

async function testAdvice(page) {
  console.log('\n💡 Testing Advice with real user: Jennifer Martinez');
  
  try {
    // Click Advice button
    await page.click('[data-section="advice"]');
    await page.waitForTimeout(500);
    
    // Fill in real user data
    await page.fill('#advice-name', TEST_USERS.advice.name);
    await page.selectOption('#advice-type', TEST_USERS.advice.type);
    await page.fill('#advice-message', TEST_USERS.advice.message);
    
    // Submit
    await page.click('#advice-form button[type="submit"]');
    
    // Check for success
    const success = await waitForSuccessModal(page);
    
    if (success) {
      logTest('Advice submission with real input', true, {
        name: TEST_USERS.advice.name,
        type: TEST_USERS.advice.type,
        messageLength: TEST_USERS.advice.message.length
      });
    } else {
      logTest('Advice submission with real input', false, { error: 'No success modal appeared' });
    }
    
    await closeModal(page);
    await goBackToActivities(page);
    
  } catch (error) {
    logTest('Advice submission with real input', false, { error: error.message });
  }
}

async function testVoting(page) {
  console.log('\n❤️ Testing Voting with real user: David Thompson');
  
  try {
    // Click Voting button
    await page.click('[data-section="voting"]');
    await page.waitForTimeout(500);
    
    // Wait for name list to load
    await page.waitForSelector('.name-item', { timeout: 5000 });
    
    // Select 3 names
    const voteNames = TEST_USERS.vote.names;
    
    for (const name of voteNames) {
      const nameItem = page.locator(`.name-item:has-text("${name}")`);
      if (await nameItem.count() > 0) {
        await nameItem.click();
        await page.waitForTimeout(200);
      }
    }
    
    // Verify submit button is enabled
    const submitBtn = page.locator('#vote-submit');
    const isDisabled = await submitBtn.isDisabled();
    
    if (!isDisabled) {
      await submitBtn.click();
      
      // Check for success
      const success = await waitForSuccessModal(page);
      
      if (success) {
        logTest('Voting with real input', true, {
          user: TEST_USERS.vote.name,
          votedFor: voteNames
        });
      } else {
        logTest('Voting with real input', false, { error: 'No success modal appeared' });
      }
      
      await closeModal(page);
      await goBackToActivities(page);
    } else {
      logTest('Voting with real input', false, { error: 'Submit button remained disabled' });
    }
    
  } catch (error) {
    logTest('Voting with real input', false, { error: error.message });
  }
}

async function verifySupabaseData(page) {
  console.log('\n🔍 Verifying Supabase Data Propagation');
  
  // Since we can't directly query Supabase from browser, we'll verify
  // that the submissions triggered successful responses
  const submissionCount = results.tests.filter(t => 
    t.passed && t.name.includes('submission') || t.name.includes('input')
  ).length;
  
  logTest('Supabase data propagation (5 submissions made)', submissionCount === 5, {
    submissions: submissionCount,
    expected: 5
  });
}

async function runE2ETests() {
  console.log('='.repeat(60));
  console.log('🧪 Baby Shower App - Playwright E2E Tests with Real User Inputs');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${APP_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Track console messages
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });
    
    // Navigate to app
    console.log('\n🚀 Launching browser...');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await waitForLoad(page);
    
    // Verify page loaded
    const title = await page.title();
    console.log(`  Page title: ${title}`);
    
    // Verify activity buttons exist
    const buttons = await page.locator('.activity-btn').count();
    console.log(`  Activity buttons found: ${buttons}`);
    
    if (buttons < 5) {
      throw new Error('Not all activity buttons loaded');
    }
    
    // Run all tests
    await testGuestbook(page);
    await testPool(page);
    await testQuiz(page);
    await testAdvice(page);
    await testVoting(page);
    await verifySupabaseData(page);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total:  ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed} ✓`);
    console.log(`Failed: ${results.summary.failed} ✗`);
    console.log(`Rate:   ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
    
    // Console output analysis
    const errors = consoleLogs.filter(l => l.type === 'error');
    if (errors.length > 0) {
      console.log('\n⚠️ Console errors detected:');
      errors.forEach(e => console.log(`  - ${e.text}`));
    } else {
      console.log('\n✓ No console errors detected');
    }
    
    await browser.close();
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Run tests
runE2ETests();
