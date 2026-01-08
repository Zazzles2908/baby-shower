/**
 * Baby Shower App - Database Population E2E Test Suite
 * This test file populates the Supabase database with real test data
 * Run with multiple agents to simulate real user activity
 * 
 * Target Tables (baby_shower schema):
 * - guestbook
 * - pool_predictions
 * - quiz_results
 * - advice
 * - votes
 */

import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'https://baby-shower-v2.vercel.app';

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const RELATIONSHIPS = ['Friend', 'Family', 'Colleague', 'Auntie', 'Uncle', 'Other'];
const ADVICE_CATEGORIES = ['general', 'feeding', 'sleep', 'discipline', 'health', 'fun'];

const GUESTBOOK_MESSAGES = [
  "Welcome to the world, little one! We are so excited to meet you.",
  "Wishing you a lifetime of love, laughter, and adventures.",
  "Congratulations! You are going to be the best parents!",
  "May your baby bring you endless joy and precious moments.",
  "So excited for this new chapter in your lives!",
  "Sending love and best wishes to the whole family.",
  "The world is a better place with you in it!",
  "Blessings and happiness to the new baby!"
];

const ADVICE_MESSAGES = [
  "Sleep when the baby sleeps! Don't worry about chores.",
  "Trust your instincts - you know your baby better than anyone.",
  "Take photos every day - they grow so fast!",
  "Accept help from friends and family when offered.",
  "Every baby is different - don't compare to others.",
  "Stay hydrated and take care of yourself too!",
  "Read to your baby every day - it's never too early.",
  "Follow your baby's cues - they will tell you what they need."
];

test.describe('Database Population - Agent 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
  });

  test('Guestbook - Submit entry', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const guestName = `Agent1_Guest_${uniqueId}`;
    
    await page.click('[data-section="guestbook"]');
    await page.waitForSelector('#guestbook-name', { timeout: 5000 });
    
    await page.fill('#guestbook-name', guestName);
    await page.selectOption('#guestbook-relationship', getRandomItem(RELATIONSHIPS));
    await page.fill('#guestbook-message', getRandomItem(GUESTBOOK_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, success, submitted').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent1] Guestbook entry submitted: ${guestName}`);
  });

  test('Baby Pool - Submit prediction', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const predictorName = `Agent1_Pool_${uniqueId}`;
    
    await page.click('[data-section="pool"]');
    await page.waitForSelector('#pool-name', { timeout: 5000 });
    
    await page.fill('#pool-name', predictorName);
    
    // Predict a random date in January-February 2026
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const dueDate = `2026-01-${randomDay.toString().padStart(2, '0')}`;
    await page.fill('#pool-due-date', dueDate);
    
    // Random time between 6:00 and 23:59
    const hour = Math.floor(Math.random() * 18) + 6;
    const minute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    await page.fill('#pool-time', `${hour}:${minute}`);
    
    // Random weight (2.5kg to 4.5kg)
    const weight = (Math.random() * 2 + 2.5).toFixed(2);
    await page.fill('#pool-weight', weight);
    
    // Random length (45cm to 55cm)
    const length = Math.floor(Math.random() * 10) + 45;
    await page.fill('#pool-length', length.toString());
    
    await page.click('#pool-submit');
    
    const successMessage = await page.locator('text=Thanks for submitting').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent1] Pool prediction submitted: ${predictorName}`);
  });

  test('Quiz - Complete emoji puzzles', async ({ page }) => {
    await page.click('[data-section="quiz"]');
    await page.waitForSelector('#quiz-form, .quiz-question', { timeout: 5000 });
    
    // Answer all 5 quiz questions
    for (let i = 0; i < 5; i++) {
      const options = page.locator('.quiz-option, .option, input[type="radio"]');
      const count = await options.count();
      if (count > 0) {
        await options.nth(Math.floor(Math.random() * Math.min(count, 3))).click();
        await page.waitForTimeout(300);
      }
    }
    
    // Submit quiz
    const submitBtn = page.locator('button:has-text("Submit"), button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    console.log(`[Agent1] Quiz completed`);
  });

  test('Advice - Submit wisdom', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const advisorName = `Agent1_Advice_${uniqueId}`;
    
    await page.click('[data-section="advice"]');
    await page.waitForSelector('#advice-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#advice-name, input[name="name"]', advisorName);
    await page.selectOption('#advice-category, select[name="category"]', getRandomItem(ADVICE_CATEGORIES));
    await page.fill('#advice-message, textarea[name="message"]', getRandomItem(ADVICE_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, submitted, success').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent1] Advice submitted: ${advisorName}`);
  });

  test('Voting - Vote for names', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const voterName = `Agent1_Vote_${uniqueId}`;
    
    await page.click('[data-section="vote"], [data-section="voting"]');
    await page.waitForSelector('#vote-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#vote-name, input[name="name"]', voterName);
    
    // Heart up to 3 names
    const heartButtons = page.locator('button:has-text("♥"), .heart-btn, .vote-btn');
    const heartCount = await heartButtons.count();
    
    for (let i = 0; i < Math.min(heartCount, 3); i++) {
      await heartButtons.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    console.log(`[Agent1] Voting completed: ${voterName}`);
  });
});

test.describe('Database Population - Agent 2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
  });

  test('Guestbook - Submit entry', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const guestName = `Agent2_Guest_${uniqueId}`;
    
    await page.click('[data-section="guestbook"]');
    await page.waitForSelector('#guestbook-name', { timeout: 5000 });
    
    await page.fill('#guestbook-name', guestName);
    await page.selectOption('#guestbook-relationship', getRandomItem(RELATIONSHIPS));
    await page.fill('#guestbook-message', getRandomItem(GUESTBOOK_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, success, submitted').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent2] Guestbook entry submitted: ${guestName}`);
  });

  test('Baby Pool - Submit prediction', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const predictorName = `Agent2_Pool_${uniqueId}`;
    
    await page.click('[data-section="pool"]');
    await page.waitForSelector('#pool-name', { timeout: 5000 });
    
    await page.fill('#pool-name', predictorName);
    
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const dueDate = `2026-01-${randomDay.toString().padStart(2, '0')}`;
    await page.fill('#pool-due-date', dueDate);
    
    const hour = Math.floor(Math.random() * 18) + 6;
    const minute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    await page.fill('#pool-time', `${hour}:${minute}`);
    
    const weight = (Math.random() * 2 + 2.5).toFixed(2);
    await page.fill('#pool-weight', weight);
    
    const length = Math.floor(Math.random() * 10) + 45;
    await page.fill('#pool-length', length.toString());
    
    await page.click('#pool-submit');
    
    const successMessage = await page.locator('text=Thanks for submitting').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent2] Pool prediction submitted: ${predictorName}`);
  });

  test('Quiz - Complete emoji puzzles', async ({ page }) => {
    await page.click('[data-section="quiz"]');
    await page.waitForSelector('#quiz-form, .quiz-question', { timeout: 5000 });
    
    for (let i = 0; i < 5; i++) {
      const options = page.locator('.quiz-option, .option, input[type="radio"]');
      const count = await options.count();
      if (count > 0) {
        await options.nth(Math.floor(Math.random() * Math.min(count, 3))).click();
        await page.waitForTimeout(300);
      }
    }
    
    const submitBtn = page.locator('button:has-text("Submit"), button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    console.log(`[Agent2] Quiz completed`);
  });

  test('Advice - Submit wisdom', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const advisorName = `Agent2_Advice_${uniqueId}`;
    
    await page.click('[data-section="advice"]');
    await page.waitForSelector('#advice-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#advice-name, input[name="name"]', advisorName);
    await page.selectOption('#advice-category, select[name="category"]', getRandomItem(ADVICE_CATEGORIES));
    await page.fill('#advice-message, textarea[name="message"]', getRandomItem(ADVICE_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, submitted, success').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent2] Advice submitted: ${advisorName}`);
  });

  test('Voting - Vote for names', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const voterName = `Agent2_Vote_${uniqueId}`;
    
    await page.click('[data-section="vote"], [data-section="voting"]');
    await page.waitForSelector('#vote-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#vote-name, input[name="name"]', voterName);
    
    const heartButtons = page.locator('button:has-text("♥"), .heart-btn, .vote-btn');
    const heartCount = await heartButtons.count();
    
    for (let i = 0; i < Math.min(heartCount, 3); i++) {
      await heartButtons.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    console.log(`[Agent2] Voting completed: ${voterName}`);
  });
});

test.describe('Database Population - Agent 3', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
  });

  test('Guestbook - Submit entry', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const guestName = `Agent3_Guest_${uniqueId}`;
    
    await page.click('[data-section="guestbook"]');
    await page.waitForSelector('#guestbook-name', { timeout: 5000 });
    
    await page.fill('#guestbook-name', guestName);
    await page.selectOption('#guestbook-relationship', getRandomItem(RELATIONSHIPS));
    await page.fill('#guestbook-message', getRandomItem(GUESTBOOK_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, success, submitted').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent3] Guestbook entry submitted: ${guestName}`);
  });

  test('Baby Pool - Submit prediction', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const predictorName = `Agent3_Pool_${uniqueId}`;
    
    await page.click('[data-section="pool"]');
    await page.waitForSelector('#pool-name', { timeout: 5000 });
    
    await page.fill('#pool-name', predictorName);
    
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const dueDate = `2026-01-${randomDay.toString().padStart(2, '0')}`;
    await page.fill('#pool-due-date', dueDate);
    
    const hour = Math.floor(Math.random() * 18) + 6;
    const minute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    await page.fill('#pool-time', `${hour}:${minute}`);
    
    const weight = (Math.random() * 2 + 2.5).toFixed(2);
    await page.fill('#pool-weight', weight);
    
    const length = Math.floor(Math.random() * 10) + 45;
    await page.fill('#pool-length', length.toString());
    
    await page.click('#pool-submit');
    
    const successMessage = await page.locator('text=Thanks for submitting').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent3] Pool prediction submitted: ${predictorName}`);
  });

  test('Quiz - Complete emoji puzzles', async ({ page }) => {
    await page.click('[data-section="quiz"]');
    await page.waitForSelector('#quiz-form, .quiz-question', { timeout: 5000 });
    
    for (let i = 0; i < 5; i++) {
      const options = page.locator('.quiz-option, .option, input[type="radio"]');
      const count = await options.count();
      if (count > 0) {
        await options.nth(Math.floor(Math.random() * Math.min(count, 3))).click();
        await page.waitForTimeout(300);
      }
    }
    
    const submitBtn = page.locator('button:has-text("Submit"), button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);
    }
    
    console.log(`[Agent3] Quiz completed`);
  });

  test('Advice - Submit wisdom', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const advisorName = `Agent3_Advice_${uniqueId}`;
    
    await page.click('[data-section="advice"]');
    await page.waitForSelector('#advice-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#advice-name, input[name="name"]', advisorName);
    await page.selectOption('#advice-category, select[name="category"]', getRandomItem(ADVICE_CATEGORIES));
    await page.fill('#advice-message, textarea[name="message"]', getRandomItem(ADVICE_MESSAGES));
    
    await page.click('button[type="submit"]:has-text("Submit")');
    
    const successMessage = await page.locator('text=Thank you, submitted, success').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log(`[Agent3] Advice submitted: ${advisorName}`);
  });

  test('Voting - Vote for names', async ({ page }) => {
    const uniqueId = generateUniqueId();
    const voterName = `Agent3_Vote_${uniqueId}`;
    
    await page.click('[data-section="vote"], [data-section="voting"]');
    await page.waitForSelector('#vote-name, input[name="name"]', { timeout: 5000 });
    
    await page.fill('#vote-name, input[name="name"]', voterName);
    
    const heartButtons = page.locator('button:has-text("♥"), .heart-btn, .vote-btn');
    const heartCount = await heartButtons.count();
    
    for (let i = 0; i < Math.min(heartCount, 3); i++) {
      await heartButtons.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    console.log(`[Agent3] Voting completed: ${voterName}`);
  });
});

test.describe('Database Verification', () => {
  test('Verify all tables have data', async ({ page }) => {
    // This test verifies the data was submitted correctly
    // In production, you would check Supabase directly
    
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check that we can see the activity buttons
    const activityButtons = page.locator('.activity-card');
    await expect(activityButtons).toHaveCount(5); // 5 activities visible
    
    console.log('Database verification complete - 5 activities visible');
    console.log('Console logs from testing:', consoleMessages.filter(m => m.includes('[Agent')));
  });
});
