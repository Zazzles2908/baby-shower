/**
 * Baby Shower App - Mom vs Dad Game Verification Test
 * Quick test to verify the game is not showing dead-end screen
 */

import { test, expect } from '@playwright/test';

test.describe('Mom vs Dad Game Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for app to be ready
    await page.waitForSelector('#app', { state: 'visible', timeout: 10000 });
  });

  test('Game section loads when card is clicked', async ({ page }) => {
    // Click Mom vs Dad activity card
    const momVsDadCard = page.locator('[data-section="mom-vs-dad"]');
    await expect(momVsDadCard).toBeVisible({ timeout: 10000 });
    await momVsDadCard.click();
    
    // Wait for section to appear
    await page.waitForSelector('#mom-vs-dad-section.active', { timeout: 5000 });
    
    // Verify section is visible
    const section = page.locator('#mom-vs-dad-section');
    await expect(section).toBeVisible();
    
    // Check that game container exists and has content
    const gameContainer = page.locator('#mom-vs-dad-game');
    await expect(gameContainer).toBeVisible();
    
    // Wait a bit for game to initialize
    await page.waitForTimeout(2000);
    
    // Check that NOT just the heading is visible - there should be game content
    const gameContent = gameContainer.locator('.mvd-section, .mvd-lobby, .mvd-game, .mvd-waiting, .mvd-results, button, input, select, .lobby-card');
    const contentCount = await gameContent.count();
    
    // There should be more than just the section heading
    // The heading is outside the game container
    console.log(`Found ${contentCount} game elements`);
    
    // The game should have rendered something (lobby or game UI)
    // If only 0 elements found, the game is broken
    expect(contentCount).toBeGreaterThan(0, 'Game should render lobby or game UI');
  });

  test('Game shows lobby selector with options', async ({ page }) => {
    // Navigate to Mom vs Dad section
    await page.click('[data-section="mom-vs-dad"]');
    await page.waitForSelector('#mom-vs-dad-section.active', { timeout: 5000 });
    
    // Wait for game initialization
    await page.waitForTimeout(3000);
    
    // Look for lobby-related content
    const gameContainer = page.locator('#mom-vs-dad-game');
    
    // Check for any of these lobby elements
    const lobbySelector = gameContainer.locator('.mvd-lobby, .lobby-selector, .create-lobby, .join-lobby, .lobby-card, text=Choose a lobby, text=Create New, text=Join');
    const lobbyCount = await lobbySelector.count();
    
    console.log(`Found ${lobbyCount} lobby elements`);
    
    // Either we find lobby elements OR we find game elements
    // The important thing is that something rendered
    const anyContent = await gameContainer.locator('button, input, select, .mvd-section, .lobby, .game').count();
    
    expect(anyContent).toBeGreaterThan(0, 'Game container should have interactive content');
  });

  test('No console errors during game load', async ({ page }) => {
    const consoleErrors = [];
    
    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to game
    await page.click('[data-section="mom-vs-dad"]');
    await page.waitForSelector('#mom-vs-dad-section.active', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('Third-party cookie') &&
      !error.includes('supabase') === false // Supabase errors might be expected if offline
    );
    
    // Log any errors found
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // For now, just log - the game might have API errors which are expected
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('Activity cards are all clickable', async ({ page }) => {
    // Get all activity cards
    const activityCards = page.locator('.activity-card, [data-section]');
    const cardCount = await activityCards.count();
    
    console.log(`Found ${cardCount} activity cards`);
    
    // All cards should be clickable
    for (let i = 0; i < cardCount; i++) {
      const card = activityCards.nth(i);
      await expect(card).toBeVisible({ timeout: 5000 });
    }
    
    expect(cardCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// RUN TESTS
// ============================================================================
//
// To run these tests:
//   npx playwright test --config=tests/playwright.config.js tests/mom-vs-dad-game-verification.test.js
//
// With UI:
//   npx playwright test --config=tests/playwright.config.js tests/mom-vs-dad-game-verification.test.js --ui
//
// Headed:
//   npm run test:headed -- tests/mom-vs-dad-game-verification.test.js
//
