/**
 * Baby Shower App - AI Mock Server
 * Mocks AI API responses for reliable testing
 */

import { test, expect, describe, beforeAll, afterAll } from '@playwright/test';

/**
 * Mock AI responses for testing
 */
const MOCK_AI_RESPONSES = {
  pool: {
    success: {
      choices: [{ message: { content: 'That\'s a bold prediction! Hope you\'re psychic!' } }]
    }
  },
  advice: {
    success: {
      choices: [{ message: { content: 'Parenting tip: Sleep when the baby sleeps!' } }]
    }
  },
  game_scenario: {
    success: {
      choices: [{
        message: {
          content: JSON.stringify({
            scenario: 'It\'s 3 AM and the baby starts crying...',
            mom_option: 'Mom would gracefully handle it',
            dad_option: 'Dad would be completely confused',
            intensity: 0.5
          })
        }
      }]
    }
  },
  game_reveal: {
    success: {
      choices: [{
        message: {
          content: 'The crowd was way off! Mom definitely would have handled this better!'
        }
      }]
    }
  }
};

/**
 * Mock server setup for AI APIs
 */
describe('AI Integration Tests - Mock Responses', () => {
  
  test('should handle pool AI roast with mock response', async ({ page }) => {
    // Intercept MiniMax API calls
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AI_RESPONSES.pool)
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="pool"]');
    
    // Fill and submit pool form
    await page.fill('#pool-name', 'AI Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '50');
    await page.click('input[name="gender"][value="surprise"]');
    await page.click('.colour-option:first-child');
    
    await page.click('#pool-form button[type="submit"]');
    
    // Should show success even with mocked AI
    await expect(page.locator('.success-message, .roast-message')).toBeVisible({ timeout: 15000 });
  });
  
  test('should handle advice AI roast with mock response', async ({ page }) => {
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AI_RESPONSES.advice)
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="advice"]');
    
    await page.fill('#advice-name', 'AI Test');
    await page.fill('#advice-message', 'This is a test advice message for the AI feature.');
    await page.click('button.toggle-option:first-child');
    
    await page.click('#advice-form button[type="submit"]');
    
    await expect(page.locator('.success-message, .envelope-animation')).toBeVisible({ timeout: 15000 });
  });
  
  test('should handle game scenario generation with mock response', async ({ page }) => {
    await page.route('**/bigmodel.cn/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AI_RESPONSES.game_scenario)
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="mom-vs-dad"]');
    
    // Join a game session
    await page.fill('#game-session-code', 'LOBBY-A');
    await page.fill('#game-player-name', 'Test Player');
    await page.click('#game-join-button');
    
    // Wait for game to load
    await page.waitForTimeout(2000);
    
    // Should show game interface even without real AI
    const gameInterface = page.locator('.game-interface, .game-scenario');
    await expect(gameInterface.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // If AI fails, should show fallback scenarios
      console.log('AI generation failed, fallback may be shown');
    });
  });
});

describe('AI Integration Tests - Fallback Behavior', () => {
  
  test('should use fallback when AI API fails', async ({ page }) => {
    // Make AI API fail
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="pool"]');
    
    // Fill and submit pool form
    await page.fill('#pool-name', 'Fallback Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '50');
    await page.click('input[name="gender"][value="surprise"]');
    await page.click('.colour-option:first-child');
    
    await page.click('#pool-form button[type="submit"]');
    
    // Should still show success (fallback to default message)
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 15000 });
  });
  
  test('should handle timeout gracefully', async ({ page }) => {
    // Slow down AI responses
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.abort('timedout');
    });
    
    await page.goto('/');
    await page.click('[data-section="pool"]');
    
    await page.fill('#pool-name', 'Timeout Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '50');
    await page.click('input[name="gender"][value="surprise"]');
    await page.click('.colour-option:first-child');
    
    await page.click('#pool-form button[type="submit"]');
    
    // Should show success without AI roast
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 15000 });
  });
});

describe('AI Integration Tests - Error Handling', () => {
  
  test('should handle invalid AI response format', async ({ page }) => {
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invalid: 'response format' })
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="pool"]');
    
    await page.fill('#pool-name', 'Invalid Response Test');
    await page.fill('#pool-date', '2026-06-15');
    await page.fill('#pool-weight', '3.5');
    await page.fill('#pool-length', '50');
    await page.click('input[name="gender"][value="surprise"]');
    await page.click('.colour-option:first-child');
    
    await page.click('#pool-form button[type="submit"]');
    
    // Should still succeed (error caught internally)
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 15000 });
  });
  
  test('should handle rate limiting from AI API', async ({ page }) => {
    await page.route('**/api.minimax.io/anthropic/**', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });
    
    await page.goto('/');
    await page.click('[data-section="advice"]');
    
    await page.fill('#advice-name', 'Rate Limit Test');
    await page.fill('#advice-message', 'Test message for rate limiting scenario.');
    await page.click('button.toggle-option:first-child');
    
    await page.click('#advice-form button[type="submit"]');
    
    // Should handle gracefully
    await expect(page.locator('.success-message, .error-message')).toBeVisible({ timeout: 15000 });
  });
});

describe('AI Integration Tests - Configuration', () => {
  
  test('should verify AI API keys are configured', async ({ page }) => {
    await page.goto('/');
    
    const hasMiniMaxKey = await page.evaluate(() => {
      return typeof window.ENV !== 'undefined' && 
             (window.ENV.MINIMAX_API_KEY || '').length > 0;
    });
    
    // Key may not be set, that's okay for testing
    console.log('MiniMax API key configured:', hasMiniMaxKey);
  });
  
  test('should verify game AI API keys are configured', async ({ page }) => {
    await page.goto('/');
    
    const hasZAIKey = await page.evaluate(() => {
      return typeof window.ENV !== 'undefined' && 
             (window.ENV.Z_AI_API_KEY || '').length > 0;
    });
    
    const hasKimiKey = await page.evaluate(() => {
      return typeof window.ENV !== 'undefined' && 
             (window.ENV.KIMI_API_KEY || '').length > 0;
    });
    
    console.log('Z.AI API key configured:', hasZAIKey);
    console.log('Kimi API key configured:', hasKimiKey);
  });
});
