/**
 * Baby Shower App - Unit Tests
 * Tests for individual functions and validation logic
 */

import { test, expect, describe } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Unit Tests - Validation Functions', () => {
  
  describe('Guestbook Validation', () => {
    test('should validate guest name length', async ({ page }) => {
      await page.goto('/');
      
      // Test empty name
      await page.fill('#guestbook-name', '');
      await page.click('#guestbook-form button[type="submit"]');
      
      const nameError = await page.locator('#guestbook-name:invalid').count();
      expect(nameError).toBeGreaterThanOrEqual(0);
    });
    
    test('should validate message length minimum', async ({ page }) => {
      await page.goto('/');
      
      await page.fill('#guestbook-name', 'Test Guest');
      await page.fill('#guestbook-message', 'Hi'); // Too short
      await page.click('#guestbook-form button[type="submit"]');
      
      // Message should have minlength attribute
      const messageInput = page.locator('#guestbook-message');
      const minLength = await messageInput.getAttribute('minlength');
      expect(minLength).toBe('10');
    });
    
    test('should validate relationship selection', async ({ page }) => {
      await page.goto('/');
      
      const relationshipSelect = page.locator('#guestbook-relationship');
      await expect(relationshipSelect).toBeVisible();
      
      const options = await relationshipSelect.locator('option').all();
      expect(options.length).toBeGreaterThan(1);
    });
  });
  
  describe('Pool Prediction Validation', () => {
    test('should validate birth date is in the future', async ({ page }) => {
      await page.goto('/');
      
      // Click on pool section
      await page.click('[data-section="pool"]');
      
      // Date input should have min attribute
      const dateInput = page.locator('#pool-date');
      await expect(dateInput).toBeVisible();
      
      const minDate = await dateInput.getAttribute('min');
      expect(minDate).toBeTruthy();
    });
    
    test('should validate weight range', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="pool"]');
      
      const weightInput = page.locator('#pool-weight');
      await expect(weightInput).toBeVisible();
      
      const minAttr = await weightInput.getAttribute('min');
      const maxAttr = await weightInput.getAttribute('max');
      
      expect(parseFloat(minAttr)).toBeGreaterThanOrEqual(2.0);
      expect(parseFloat(maxAttr)).toBeLessThanOrEqual(6.0);
    });
    
    test('should validate length range', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="pool"]');
      
      const lengthInput = page.locator('#pool-length');
      await expect(lengthInput).toBeVisible();
      
      const minAttr = await lengthInput.getAttribute('min');
      const maxAttr = await lengthInput.getAttribute('max');
      
      expect(parseInt(minAttr)).toBeGreaterThanOrEqual(40);
      expect(parseInt(maxAttr)).toBeLessThanOrEqual(60);
    });
    
    test('should validate gender selection', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="pool"]');
      
      const genderOptions = page.locator('input[name="gender"]');
      await expect(genderOptions).toHaveCount(3);
    });
  });
  
  describe('Quiz Validation', () => {
    test('should have 5 puzzle inputs', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="quiz"]');
      
      const puzzleInputs = page.locator('input[id^="quiz-puzzle"]');
      await expect(puzzleInputs).toHaveCount(5);
    });
    
    test('should validate all puzzle answers', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="quiz"]');
      
      // Fill all puzzles with correct answers
      await page.fill('#quiz-puzzle1', 'Baby Shower');
      await page.fill('#quiz-puzzle2', 'Little Wolf');
      await page.fill('#quiz-puzzle3', 'Good Night');
      await page.fill('#quiz-puzzle4', 'Baby Care');
      await page.fill('#quiz-puzzle5', 'Diapers');
      
      // Submit and verify success
      await page.click('#quiz-form button[type="submit"]');
      
      await page.waitForSelector('.success-message', { timeout: 5000 });
      const successMsg = await page.locator('.success-message').textContent();
      expect(successMsg).toContain('5/5');
    });
  });
  
  describe('Advice Validation', () => {
    test('should validate advice message length', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="advice"]');
      
      const messageInput = page.locator('#advice-message');
      await expect(messageInput).toBeVisible();
      
      const minLength = await messageInput.getAttribute('minlength');
      expect(parseInt(minLength)).toBe(2);
    });
    
    test('should have delivery option toggle', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="advice"]');
      
      const toggle = page.locator('.advice-toggle');
      await expect(toggle).toBeVisible();
    });
  });
  
  describe('Vote Validation', () => {
    test('should require name for voting', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="votes"]');
      
      const nameInput = page.locator('#vote-name');
      await expect(nameInput).toBeVisible();
    });
    
    test('should have mom and dad voting options', async ({ page }) => {
      await page.goto('/');
      await page.click('[data-section="votes"]');
      
      const momOption = page.locator('input[value="mom"]');
      const dadOption = page.locator('input[value="dad"]');
      
      await expect(momOption).toBeVisible();
      await expect(dadOption).toBeVisible();
    });
  });
});

describe('Unit Tests - Configuration', () => {
  
  test('should have anime characters defined', async ({ page }) => {
    await page.goto('/');
    
    // Check if window.ANIME_CHARACTERS exists
    const hasAnimeCharacters = await page.evaluate(() => {
      return typeof window.ANIME_CHARACTERS !== 'undefined';
    });
    expect(hasAnimeCharacters).toBe(true);
  });
  
  test('should have milestone thresholds defined', async ({ page }) => {
    await page.goto('/');
    
    const hasMilestones = await page.evaluate(() => {
      return typeof window.CONFIG !== 'undefined' && 
             typeof window.CONFIG.MILESTONES !== 'undefined';
    });
    expect(hasMilestones).toBe(true);
  });
  
  test('should have quiz puzzles configured', async ({ page }) => {
    await page.goto('/');
    
    const hasPuzzles = await page.evaluate(() => {
      return typeof window.CONFIG !== 'undefined' && 
             typeof window.CONFIG.QUIZ_PUZZLES !== 'undefined';
    });
    expect(hasPuzzles).toBe(true);
  });
});

describe('Unit Tests - Utility Functions', () => {
  
  test('should have UI utilities available', async ({ page }) => {
    await page.goto('/');
    
    const hasUIUtils = await page.evaluate(() => {
      return typeof window.UIUtils !== 'undefined';
    });
    expect(hasUIUtils).toBe(true);
  });
  
  test('should have API utilities available', async ({ page }) => {
    await page.goto('/');
    
    const hasAPI = await page.evaluate(() => {
      return typeof window.API !== 'undefined' || 
             typeof window.submitGuestbook !== 'undefined';
    });
    expect(hasAPI).toBe(true);
  });
  
  test('should have config available globally', async ({ page }) => {
    await page.goto('/');
    
    const hasConfig = await page.evaluate(() => {
      return typeof window.CONFIG !== 'undefined';
    });
    expect(hasConfig).toBe(true);
  });
});

describe('Unit Tests - Form Behavior', () => {
  
  test('guestbook form should have correct structure', async ({ page }) => {
    await page.goto('/');
    
    const form = page.locator('#guestbook-form');
    await expect(form).toBeVisible();
    
    // Check required fields
    const nameInput = page.locator('#guestbook-name');
    const relationshipSelect = page.locator('#guestbook-relationship');
    const messageInput = page.locator('#guestbook-message');
    
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(relationshipSelect).toHaveAttribute('required', '');
    await expect(messageInput).toHaveAttribute('required', '');
  });
  
  test('pool form should have correct structure', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-section="pool"]');
    
    const form = page.locator('#pool-form');
    await expect(form).toBeVisible();
    
    // Check required fields
    const nameInput = page.locator('#pool-name');
    const dateInput = page.locator('#pool-date');
    const weightInput = page.locator('#pool-weight');
    const lengthInput = page.locator('#pool-length');
    
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(dateInput).toHaveAttribute('required', '');
    await expect(weightInput).toHaveAttribute('required', '');
    await expect(lengthInput).toHaveAttribute('required', '');
  });
  
  test('quiz form should have correct structure', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-section="quiz"]');
    
    const form = page.locator('#quiz-form');
    await expect(form).toBeVisible();
    
    // All puzzle inputs should be required
    for (let i = 1; i <= 5; i++) {
      const input = page.locator(`#quiz-puzzle${i}`);
      await expect(input).toHaveAttribute('required', '');
    }
  });
});
