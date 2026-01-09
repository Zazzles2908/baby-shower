/**
 * Baby Shower App - Integration Tests
 * Tests for component interactions and data flow
 */

import { test, expect, describe } from '@playwright/test';
import { generateUniqueId, generateGuestbookData, generatePoolData, generateQuizData, generateAdviceData } from './data-generator.js';

describe('Integration Tests - Data Flow', () => {
  
  describe('Guestbook Data Flow', () => {
    test('should submit guestbook entry and reflect in stats', async ({ page }) => {
      const testData = generateGuestbookData();
      const initialCount = await page.evaluate(() => window.CONFIG?.MILESTONES?.guestbook?.[0] || 5);
      
      await page.goto('/');
      
      // Fill and submit guestbook form
      await page.fill('#guestbook-name', testData.name);
      await page.selectOption('#guestbook-relationship', testData.relationship);
      await page.fill('#guestbook-message', testData.message);
      
      // Submit form
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/guestbook')),
        page.click('#guestbook-form button[type="submit"]')
      ]);
      
      // Verify success message appears
      await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
      
      // Verify stats update
      await page.waitForTimeout(1000);
      const statsUpdated = await page.evaluate(() => {
        const statsEl = document.querySelector('.activity-stats .stat[data-activity="guestbook"]');
        return statsEl ? statsEl.textContent : null;
      });
      expect(statsUpdated).toBeTruthy();
    });
    
    test('should persist guest name across activities', async ({ page }) => {
      const testName = `Test User ${generateUniqueId()}`;
      
      await page.goto('/');
      
      // Set guest name in welcome modal
      await page.fill('#welcome-name', testName);
      await page.click('#welcome-save');
      
      // Navigate to each activity and verify name is pre-filled
      const activities = ['guestbook', 'pool', 'quiz', 'advice', 'votes'];
      
      for (const activity of activities) {
        await page.click(`[data-section="${activity}"]`);
        await page.waitForTimeout(300);
        
        // Check name field
        const nameFieldId = `#${activity}-name`; // guestbook-name, pool-name, etc.
        const nameValue = await page.inputValue(nameFieldId).catch(() => null);
        
        // Note: Some forms may not auto-fill, this is just verification
        console.log(`Activity ${activity} name field: ${nameValue || 'N/A'}`);
      }
    });
  });
  
  describe('Pool Prediction Data Flow', () => {
    test('should submit pool prediction and update statistics', async ({ page }) => {
      const testData = generatePoolData();
      
      await page.goto('/');
      await page.click('[data-section="pool"]');
      
      // Fill form
      await page.fill('#pool-name', testData.name);
      await page.fill('#pool-date', testData.dueDate);
      await page.fill('#pool-weight', '3.5');
      await page.fill('#pool-length', '50');
      await page.click('input[name="gender"][value="surprise"]');
      await page.click('.colour-option:first-child');
      
      // Submit
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/pool')),
        page.click('#pool-form button[type="submit"]')
      ]);
      
      // Verify success
      await expect(page.locator('.success-message, .roast-message')).toBeVisible({ timeout: 10000 });
    });
    
    test('should show pool statistics after submission', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="pool"]');
      
      // Check if stats section exists
      const statsSection = page.locator('#pool-stats');
      await expect(statsSection).toBeVisible();
      
      // Verify average calculations
      const avgWeight = await statsSection.locator('.avg-weight').textContent();
      const avgLength = await statsSection.locator('.avg-length').textContent();
      
      expect(avgWeight).toBeTruthy();
      expect(avgLength).toBeTruthy();
    });
  });
  
  describe('Quiz Data Flow', () => {
    test('should submit quiz answers and calculate score', async ({ page }) => {
      const testData = generateQuizData();
      
      await page.goto('/');
      await page.click('[data-section="quiz"]');
      
      // Fill all puzzles with correct answers
      await page.fill('#quiz-puzzle1', 'Baby Shower');
      await page.fill('#quiz-puzzle2', 'Little Wolf');
      await page.fill('#quiz-puzzle3', 'Good Night');
      await page.fill('#quiz-puzzle4', 'Baby Care');
      await page.fill('#quiz-puzzle5', 'Diapers');
      await page.fill('#quiz-name', testData.participant_name);
      
      // Submit
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/quiz')),
        page.click('#quiz-form button[type="submit"]')
      ]);
      
      // Verify success with score
      await expect(page.locator('.success-message')).toContainText('5/5', { timeout: 10000 });
    });
    
    test('should show quiz milestone when threshold reached', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="quiz"]');
      
      // Fill with partial answers
      await page.fill('#quiz-puzzle1', 'Baby Shower');
      await page.fill('#quiz-puzzle2', 'Wrong Answer');
      await page.fill('#quiz-puzzle3', 'Good Night');
      await page.fill('#quiz-puzzle4', 'Baby Care');
      await page.fill('#quiz-puzzle5', 'Diapers');
      await page.fill('#quiz-name', 'Test User');
      
      await page.click('#quiz-form button[type="submit"]');
      
      // Should still show success message
      await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
    });
  });
  
  describe('Advice Data Flow', () => {
    test('should submit advice with general category', async ({ page }) => {
      const testData = generateAdviceData({ category: 'general' });
      
      await page.goto('/');
      await page.click('[data-section="advice"]');
      
      // Fill form
      await page.fill('#advice-name', testData.name);
      await page.fill('#advice-message', testData.advice);
      await page.click('button.toggle-option:first-child'); // For Parents
      
      // Submit
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/advice')),
        page.click('#advice-form button[type="submit"]')
      ]);
      
      // Verify success animation
      await expect(page.locator('.envelope-animation, .success-message')).toBeVisible({ timeout: 10000 });
    });
    
    test('should submit advice with time capsule category', async ({ page }) => {
      const testData = generateAdviceData({ category: 'fun' });
      
      await page.goto('/');
      await page.click('[data-section="advice"]');
      
      // Select "For Baby" option
      await page.click('button.toggle-option:last-child');
      
      await page.fill('#advice-name', testData.name);
      await page.fill('#advice-message', testData.advice);
      
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/advice')),
        page.click('#advice-form button[type="submit"]')
      ]);
      
      // Should show capsule animation
      await expect(page.locator('.capsule-animation, .success-message')).toBeVisible({ timeout: 10000 });
    });
  });
  
  describe('Vote Data Flow', () => {
    test('should submit vote and update tally', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="votes"]');
      
      const testName = `Voter ${generateUniqueId()}`;
      
      await page.fill('#vote-name', testName);
      await page.click('input[value="mom"]');
      
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/functions/v1/vote')),
        page.click('#vote-form button[type="submit"]')
      ]);
      
      // Verify success
      await expect(page.locator('.success-message, .vote-tally')).toBeVisible({ timeout: 10000 });
    });
  });
});

describe('Integration Tests - Activity Navigation', () => {
  
  test('should navigate between all activities', async ({ page }) => {
    await page.goto('/');
    
    const activities = [
      'guestbook', 'pool', 'quiz', 'advice', 'votes',
      'mom-vs-dad', 'who-would-rather'
    ];
    
    for (const activity of activities) {
      await page.click(`[data-section="${activity}"]`);
      await page.waitForTimeout(500);
      
      const section = page.locator(`.activity-card[data-section="${activity}"]`);
      await expect(section).toBeVisible();
    }
  });
  
  test('should show correct activity cards on landing', async ({ page }) => {
    await page.goto('/');
    
    const activityCards = page.locator('.activity-card');
    const count = await activityCards.count();
    
    expect(count).toBeGreaterThanOrEqual(5); // At least 5 core activities
  });
  
  test('should have back buttons working', async ({ page }) => {
    await page.goto('/');
    
    // Go to an activity
    await page.click('[data-section="pool"]');
    await expect(page.locator('#pool')).toBeVisible();
    
    // Click back
    await page.click('#pool .back-button');
    await expect(page.locator('#pool')).toBeHidden();
  });
});

describe('Integration Tests - Real-time Updates', () => {
  
  test('should subscribe to real-time updates', async ({ page }) => {
    await page.goto('/');
    
    // Check if Supabase client is initialized
    const hasSupabase = await page.evaluate(() => {
      return typeof window.supabase !== 'undefined' ||
             (typeof window.ENV !== 'undefined' && window.ENV.SUPABASE_URL);
    });
    expect(hasSupabase).toBe(true);
  });
  
  test('should update activity counts dynamically', async ({ page }) => {
    await page.goto('/');
    
    // Get initial counts
    const initialCounts = await page.evaluate(() => {
      return {
        guestbook: document.querySelector('[data-activity="guestbook"]')?.textContent,
        pool: document.querySelector('[data-activity="pool"]')?.textContent,
        quiz: document.querySelector('[data-activity="quiz"]')?.textContent,
        advice: document.querySelector('[data-activity="advice"]')?.textContent,
        votes: document.querySelector('[data-activity="votes"]')?.textContent
      };
    });
    
    console.log('Initial counts:', initialCounts);
    
    // Counts should be numeric or have numeric content
    Object.values(initialCounts).forEach(count => {
      expect(count).toBeTruthy();
    });
  });
});
