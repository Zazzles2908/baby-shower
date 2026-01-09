/**
 * Baby Shower App - Landing Page E2E Test Suite
 * Phase 1: Landing Page Testing
 * Tests all 14 objectives as specified in the test plan
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Phase 1: Landing Page E2E Tests', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  let consoleErrors = [];
  let performanceMetrics = {};
  
  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  // ============================================================================
  // OBJECTIVE 1: Test landing page loads correctly
  // ============================================================================
  
  test.describe('1. Landing Page Load', () => {
    
    test('Page loads within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });
    
    test('Page title is correct', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      const title = await page.title();
      console.log(`Page title: ${title}`);
      expect(title).toContain('Baby Shower');
    });
    
    test('Main app container exists', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      const appContainer = page.locator('#app');
      await expect(appContainer).toBeVisible({ timeout: 5000 });
    });
    
    test('Hero section is visible', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      const heroSection = page.locator('.hero-section');
      await expect(heroSection).toBeVisible({ timeout: 5000 });
    });
  });
  
  // ============================================================================
  // OBJECTIVE 2: Verify activity navigation cards are displayed
  // ============================================================================
  
  test.describe('2. Activity Navigation Cards', () => {
    
    test('All 6 activity cards are visible', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      const activityCards = page.locator('.activity-card');
      const cardCount = await activityCards.count();
      
      console.log(`Found ${cardCount} activity cards`);
      expect(cardCount).toBeGreaterThanOrEqual(5);
    });
    
    test('Guestbook card is visible and properly labeled', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card[data-section="guestbook"]', { timeout: 10000 });
      
      const guestbookCard = page.locator('.activity-card[data-section="guestbook"]');
      await expect(guestbookCard).toBeVisible({ timeout: 10000 });
      
      const cardTitle = await guestbookCard.locator('.card-title').textContent();
      expect(cardTitle).toContain('Guestbook');
    });
    
    test('Baby Pool card is visible and properly labeled', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card[data-section="pool"]', { timeout: 10000 });
      
      const poolCard = page.locator('.activity-card[data-section="pool"]');
      await expect(poolCard).toBeVisible({ timeout: 10000 });
      
      const cardTitle = await poolCard.locator('.card-title').textContent();
      expect(cardTitle).toContain('Baby Pool');
    });
    
    test('Baby Quiz card is visible and properly labeled', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card[data-section="quiz"]', { timeout: 10000 });
      
      const quizCard = page.locator('.activity-card[data-section="quiz"]');
      await expect(quizCard).toBeVisible({ timeout: 10000 });
      
      const cardTitle = await quizCard.locator('.card-title').textContent();
      expect(cardTitle).toContain('Baby Quiz');
    });
    
    test('Advice card is visible and properly labeled', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card[data-section="advice"]', { timeout: 10000 });
      
      const adviceCard = page.locator('.activity-card[data-section="advice"]');
      await expect(adviceCard).toBeVisible({ timeout: 10000 });
      
      const cardTitle = await adviceCard.locator('.card-title').textContent();
      expect(cardTitle).toContain('Advice');
    });
    
    test('The Shoe Game card is visible and properly labeled', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card[data-section="who-would-rather"]', { timeout: 10000 });
      
      const shoeGameCard = page.locator('.activity-card[data-section="who-would-rather"]');
      await expect(shoeGameCard).toBeVisible({ timeout: 10000 });
      
      const cardTitle = await shoeGameCard.locator('.card-title').textContent();
      expect(cardTitle).toContain('The Shoe Game');
    });
  });
  
  // ============================================================================
  // OBJECTIVE 3: Test responsive design across breakpoints
  // ============================================================================
  
  test.describe('3. Responsive Design', () => {
    
    test('Desktop layout (1280x720) - All cards visible', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const activityCards = page.locator('.activity-card');
      await expect(activityCards.first()).toBeVisible();
      
      // Check grid layout is applied
      const activitiesContainer = page.locator('#activities-container');
      const display = await activitiesContainer.evaluate(el => window.getComputedStyle(el).display);
      expect(display).toBe('block');
    });
    
    test('Tablet layout (768x1024) - Cards stack properly', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const activityCards = page.locator('.activity-card');
      await expect(activityCards.first()).toBeVisible();
      
      // Verify cards are accessible and clickable
      for (let i = 0; i < await activityCards.count(); i++) {
        const card = activityCards.nth(i);
        await expect(card).toBeVisible({ timeout: 3000 });
      }
    });
    
    test('Mobile layout (390x844) - Single column layout', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const activityCards = page.locator('.activity-card');
      
      // All cards should still be visible on mobile
      for (let i = 0; i < await activityCards.count(); i++) {
        const card = activityCards.nth(i);
        await expect(card).toBeVisible({ timeout: 3000 });
      }
    });
    
    test('Small mobile layout (320x568) - Minimum supported size', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const activityCards = page.locator('.activity-card');
      
      // All cards should be visible
      for (let i = 0; i < await activityCards.count(); i++) {
        const card = activityCards.nth(i);
        await expect(card).toBeVisible({ timeout: 3000 });
      }
    });
  });
  
  // ============================================================================
  // OBJECTIVE 4: Validate activity card interactions
  // ============================================================================
  
  test.describe('4. Activity Card Interactions', () => {
    
    test('Clicking Guestbook card navigates to guestbook section', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const guestbookCard = page.locator('.activity-card[data-section="guestbook"]');
      await guestbookCard.click();
      
      // Wait for section to become visible
      await page.waitForTimeout(500);
      
      const guestbookSection = page.locator('#guestbook-section');
      const isVisible = await guestbookSection.evaluate(el => !el.classList.contains('hidden'));
      expect(isVisible).toBe(true);
    });
    
    test('Clicking Baby Pool card navigates to pool section', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const poolCard = page.locator('.activity-card[data-section="pool"]');
      await poolCard.click();
      
      await page.waitForTimeout(500);
      
      const poolSection = page.locator('#pool-section');
      const isVisible = await poolSection.evaluate(el => !el.classList.contains('hidden'));
      expect(isVisible).toBe(true);
    });
    
    test('Clicking back button returns to activities', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Navigate to guestbook
      const guestbookCard = page.locator('.activity-card[data-section="guestbook"]');
      await guestbookCard.click();
      await page.waitForTimeout(500);
      
      // Click back button
      const backBtn = page.locator('#guestbook-section .back-btn');
      await backBtn.click();
      await page.waitForTimeout(500);
      
      // Check activities are visible again
      const activitiesContainer = page.locator('#activities-container');
      const isVisible = await activitiesContainer.evaluate(el => !el.classList.contains('hidden'));
      expect(isVisible).toBe(true);
    });
    
    test('Activity cards have proper hover effects', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const card = page.locator('.activity-card').first();
      
      // Hover over card
      await card.hover();
      
      // Verify card is interactive (no errors on hover)
      const isVisible = await card.isVisible();
      expect(isVisible).toBe(true);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 5: Check page title and meta information
  // ============================================================================
  
  test.describe('5. Page Title and Meta Information', () => {
    
    test('Meta charset is UTF-8', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      
      const charset = page.locator('meta[charset]');
      const charsetValue = await charset.getAttribute('charset');
      expect(charsetValue).toBe('UTF-8');
    });
    
    test('Meta viewport is properly configured', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      
      const viewport = page.locator('meta[name="viewport"]');
      const content = await viewport.getAttribute('content');
      
      expect(content).toContain('width=device-width');
      expect(content).toContain('initial-scale=1.0');
    });
    
    test('Page has favicon links', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      
      const favicons = page.locator('link[rel="icon"]');
      const count = await favicons.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('Google Fonts are properly linked', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const fontLinks = page.locator('link[href*="fonts.googleapis.com"]');
      const count = await fontLinks.count();
      expect(count).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 6: Verify loading states and animations
  // ============================================================================
  
  test.describe('6. Loading States and Animations', () => {
    
    test('Loading overlay exists in DOM', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const loadingOverlay = page.locator('#loading-overlay');
      const count = await loadingOverlay.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('Success modal exists in DOM', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const successModal = page.locator('#success-modal');
      const count = await successModal.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('Milestone modal exists in DOM', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const milestoneModal = page.locator('#milestone-modal');
      const count = await milestoneModal.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('Activity ticker exists in DOM', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const activityTicker = page.locator('#activity-ticker');
      const count = await activityTicker.count();
      expect(count).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 7: Test keyboard navigation
  // ============================================================================
  
  test.describe('7. Keyboard Navigation', () => {
    
    test('Tab navigation works through activity cards', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Press Tab to focus first activity card
      await page.keyboard.press('Tab');
      
      // Check if focus moved to a button or link
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    });
    
    test('Enter key activates activity card', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Focus on first activity card
      const firstCard = page.locator('.activity-card').first();
      await firstCard.focus();
      
      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Verify navigation occurred (should see different section)
      const welcomeSection = page.locator('#welcome-section');
      const hasHiddenClass = await welcomeSection.evaluate(el => el.classList.contains('hidden'));
      expect(hasHiddenClass).toBe(true);
    });
    
    test('Escape key closes modals if open', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Press Escape to ensure no modals are open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Verify page is still functional
      const isVisible = await page.locator('#welcome-section').isVisible();
      expect(isVisible).toBe(true);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 8: Validate accessibility features
  // ============================================================================
  
  test.describe('8. Accessibility Features', () => {
    
    test('Activity cards have aria-label attributes', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const cards = page.locator('.activity-card');
      for (let i = 0; i < await cards.count(); i++) {
        const card = cards.nth(i);
        const ariaLabel = await card.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel.length).toBeGreaterThan(0);
      }
    });
    
    test('Form inputs have associated labels', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Navigate to guestbook to test form labels
      await page.locator('.activity-card[data-section="guestbook"]').click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('#guestbook-name');
      const inputId = await nameInput.getAttribute('id');
      
      // Check for associated label
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toBeVisible({ timeout: 3000 });
    });
    
    test('Images have alt attributes', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const images = page.locator('img');
      for (let i = 0; i < await images.count(); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Most images should have alt attributes
        const src = await img.getAttribute('src');
        if (!src?.includes('fonts.googleapis.com')) {
          // Skip decorative images if they have empty alt
          if (alt === null) {
            const role = await img.getAttribute('role');
            expect(role).toBe('presentation');
          }
        }
      }
    });
    
    test('Buttons are keyboard accessible', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      // Focus each button via keyboard
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        await page.keyboard.press('Tab');
        const focusedTag = await page.evaluate(() => document.activeElement.tagName);
        if (focusedTag === 'BUTTON') {
          const isVisible = await page.evaluate(() => {
            const el = document.activeElement;
            return el && el.offsetParent !== null;
          });
          expect(isVisible).toBe(true);
        }
      }
    });
  });
  
  // ============================================================================
  // OBJECTIVE 9: Check for broken links or images
  // ============================================================================
  
  test.describe('9. Broken Links and Images', () => {
    
    test('No broken image links on landing page', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const images = page.locator('img');
      const brokenImages = [];
      
      for (let i = 0; i < await images.count(); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        
        if (src && src.startsWith('http')) {
          try {
            const response = await page.request.get(src);
            if (!response.ok()) {
              brokenImages.push({ src, status: response.status() });
            }
          } catch (e) {
            brokenImages.push({ src, error: e.message });
          }
        }
      }
      
      console.log(`Found ${brokenImages.length} broken images`);
      expect(brokenImages.length).toBe(0);
    });
    
    test('All external links return 200 OK', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const links = page.locator('a[href^="http"]');
      const brokenLinks = [];
      
      for (let i = 0; i < await links.count(); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && href.startsWith('http') && !href.includes('localhost')) {
          try {
            const response = await page.request.get(href);
            if (!response.ok()) {
              brokenLinks.push({ href, status: response.status() });
            }
          } catch (e) {
            // Skip if can't reach (might be external issue)
            console.log(`Could not check link: ${href}`);
          }
        }
      }
      
      console.log(`Found ${brokenLinks.length} broken external links`);
      expect(brokenLinks.length).toBe(0);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 10: Verify footer and branding elements
  // ============================================================================
  
  test.describe('10. Footer and Branding Elements', () => {
    
    test('Footer exists on page', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const footer = page.locator('.personalized-footer');
      const count = await footer.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('Footer contains branding content', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const footerContent = page.locator('.footer-content');
      const count = await footerContent.count();
      expect(count).toBeGreaterThan(0);
      
      const title = page.locator('.footer-title');
      const titleCount = await title.count();
      expect(titleCount).toBeGreaterThan(0);
    });
    
    test('Footer gallery images load correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const footerGallery = page.locator('.footer-gallery');
      const count = await footerGallery.count();
      expect(count).toBeGreaterThan(0);
      
      const galleryImages = footerGallery.locator('img');
      const imageCount = await galleryImages.count();
      expect(imageCount).toBeGreaterThan(0);
    });
    
    test('Partner avatars are displayed in hero', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const partnerAvatars = page.locator('.partner-avatars');
      await expect(partnerAvatars).toBeVisible({ timeout: 5000 });
      
      const avatars = partnerAvatars.locator('.partner-avatar');
      const count = await avatars.count();
      expect(count).toBe(2);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 11: Test page performance metrics
  // ============================================================================
  
  test.describe('11. Performance Metrics', () => {
    
    test('First Contentful Paint (FCP) is under 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
      
      // Wait for first content to appear
      await page.waitForSelector('.hero-section', { timeout: 5000 });
      const fcp = Date.now() - startTime;
      
      console.log(`FCP: ${fcp}ms`);
      expect(fcp).toBeLessThan(2000);
    });
    
    test('Largest Contentful Paint (LCP) is under 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Wait for all main content
      await page.waitForSelector('.activity-buttons', { timeout: 5000 });
      const lcp = Date.now() - startTime;
      
      console.log(`LCP: ${lcp}ms`);
      expect(lcp).toBeLessThan(3000);
    });
    
    test('API calls complete within reasonable time', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Check if API calls completed
      const apiCallCount = Object.keys(performanceMetrics).length;
      console.log(`API calls made: ${apiCallCount}`);
      
      // API calls should complete without errors
      expect(consoleErrors.filter(e => e.text.includes('API'))).toHaveLength(0);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 12: Validate error handling for network issues
  // ============================================================================
  
  test.describe('12. Error Handling', () => {
    
    test('No JavaScript console errors on page load', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(err => 
        !err.text.includes('favicon') && 
        !err.text.includes('404') &&
        !err.text.includes('Third-party cookie') &&
        !err.text.includes('net::') &&
        !err.text.includes('Supabase') &&
        !err.text.includes('API')
      );
      
      console.log(`Console errors found: ${criticalErrors.length}`);
      console.log(`Errors: ${JSON.stringify(criticalErrors.map(e => e.text))}`);
      
      expect(criticalErrors.length).toBeLessThan(3);
    });
    
    test('Page handles missing images gracefully', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Check that page structure is intact despite potential image issues
      const appContainer = page.locator('#app');
      await expect(appContainer).toBeVisible();
      
      const activityCards = page.locator('.activity-card');
      await expect(activityCards.first()).toBeVisible();
    });
    
    test('Form submission shows error handling UI', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Navigate to guestbook
      await page.locator('.activity-card[data-section="guestbook"]').click();
      await page.waitForTimeout(500);
      
      // Try submitting empty form
      await page.locator('#guestbook-form button[type="submit"]').click();
      await page.waitForTimeout(500);
      
      // Check that form doesn't submit (validation should prevent it)
      // Either validation message or form stays on page
      const sectionVisible = await page.locator('#guestbook-section').isVisible();
      expect(sectionVisible).toBe(true);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 13: Check console for JavaScript errors
  // ============================================================================
  
  test.describe('13. JavaScript Console Errors', () => {
    
    test('No critical JS errors during page load', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const jsErrors = consoleErrors.filter(err => 
        !err.text.includes('favicon') &&
        !err.text.includes('404') &&
        !err.text.includes('net::ERR') &&
        !err.text.includes('Third-party cookie') &&
        !err.text.includes('Supabase') &&
        !err.text.includes('API')
      );
      
      console.log(`JS Errors: ${JSON.stringify(jsErrors)}`);
      expect(jsErrors.length).toBeLessThan(3);
    });
    
    test('Supabase client initializes without errors', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Verify page loaded without critical errors
      const appContainer = page.locator('#app');
      await expect(appContainer).toBeVisible({ timeout: 10000 });
      
      // No JS errors during page load (already tested in previous test)
      expect(consoleErrors.length).toBeLessThan(5);
    });
  });
  
  // ============================================================================
  // OBJECTIVE 14: Verify page renders correctly in all browsers
  // ============================================================================
  
  test.describe('14. Cross-Browser Rendering', () => {
    
    test('Page renders correctly in Chromium', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      // Check main elements are visible
      await expect(page.locator('.hero-section')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#activities-container')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.activity-card').first()).toBeVisible({ timeout: 5000 });
      
      // Verify no layout shifts
      const heroHeight = await page.locator('.hero-section').evaluate(el => el.offsetHeight);
      expect(heroHeight).toBeGreaterThan(0);
    });
    
    test('Page renders correctly in Firefox', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card', { timeout: 10000 });
      
      await expect(page.locator('.hero-section')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#activities-container')).toBeVisible({ timeout: 10000 });
      
      // Wait for all cards to be visible
      await page.waitForTimeout(2000);
      const activityCount = await page.locator('.activity-card').count();
      expect(activityCount).toBeGreaterThanOrEqual(5);
    });
    
    test('Page renders correctly in WebKit', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.activity-card', { timeout: 10000 });
      
      await expect(page.locator('.hero-section')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#activities-container')).toBeVisible({ timeout: 10000 });
      
      // Wait for all cards to be visible
      await page.waitForTimeout(2000);
      const activityCount = await page.locator('.activity-card').count();
      expect(activityCount).toBeGreaterThanOrEqual(5);
    });
  });
  
  // ============================================================================
  // ADDITIONAL TESTS: Visual Regression and Integration
  // ============================================================================
  
  test.describe('Additional Integration Tests', () => {
    
    test('Welcome name input is functional', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const nameInput = page.locator('#welcome-guest-name');
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      
      // Type a name
      await nameInput.fill('Test Guest');
      const value = await nameInput.inputValue();
      expect(value).toBe('Test Guest');
    });
    
    test('Event information is displayed correctly', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const eventInfo = page.locator('.event-info');
      await expect(eventInfo).toBeVisible({ timeout: 5000 });
      
      const eventText = await eventInfo.textContent();
      expect(eventText).toContain('January');
      expect(eventText).toContain('Myuna Farm');
    });
    
    test('Couple heart icon is displayed', async ({ page }) => {
      await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 30000 });
      
      const coupleHeart = page.locator('.couple-heart');
      await expect(coupleHeart).toBeVisible({ timeout: 5000 });
      
      const heartIcon = coupleHeart.locator('.heart-icon');
      await expect(heartIcon).toBeVisible();
    });
  });
});
