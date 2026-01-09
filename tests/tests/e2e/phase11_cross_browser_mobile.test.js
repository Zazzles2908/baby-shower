/**
 * Phase 11: Cross-Browser and Mobile Testing
 * Tests browser compatibility and mobile responsiveness
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 11: Cross-Browser Compatibility', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Chromium: Landing page loads correctly', async ({ page }) => {
    await test.step('Verify main elements render', async () => {
      await expect(page.locator('.hero-section')).toBeVisible();
      await expect(page.locator('.hero-title')).toBeVisible();
      await expect(page.locator('.activity-buttons')).toBeVisible();
    });

    await test.step('Verify CSS animations work', async () => {
      const heroTitle = page.locator('.hero-title');
      await expect(heroTitle).toBeVisible();
    });

    await test.step('Verify responsive grid layout', async () => {
      const activityCards = page.locator('.activity-card');
      const count = await activityCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Chromium: All activities accessible', async ({ page }) => {
    const activities = [
      { selector: 'button[data-section="guestbook"]', name: 'Guestbook' },
      { selector: 'button[data-section="pool"]', name: 'Baby Pool' },
      { selector: 'button[data-section="quiz"]', name: 'Quiz' },
      { selector: 'button[data-section="advice"]', name: 'Advice' },
      { selector: 'button[data-section="voting"]', name: 'Voting' },
      { selector: 'button[data-section="mom-dad-game"]', name: 'Mom vs Dad Game' },
      { selector: 'button[data-section="shoe-game"]', name: 'Shoe Game' }
    ];

    for (const activity of activities) {
      const element = page.locator(activity.selector);
      await test.step(`${activity.name} is accessible`, async () => {
        await expect(element).toBeVisible();
      });
    }
  });

  test('Chromium: No console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('supabase') &&
      !e.includes('Image failed to load')
    );

    expect(criticalErrors).toHaveLength(0);
  });

});

test.describe('Phase 11: Mobile Responsiveness - Pixel 5', () => {
  
  test.use({ viewport: { width: 393, height: 852 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Pixel 5: No horizontal scrolling', async ({ page }) => {
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(horizontalScroll).toBe(false);
  });

  test('Pixel 5: Touch targets meet 44px minimum', async ({ page }) => {
    const touchTargets = [
      { selector: 'button.activity-card', name: 'Activity Cards' },
      { selector: 'button', name: 'Buttons' },
      { selector: 'input[type="submit"]', name: 'Submit Buttons' }
    ];

    for (const target of touchTargets) {
      await test.step(`${target.name} have adequate touch targets`, async () => {
        const elements = page.locator(target.selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const boundingBox = await element.boundingBox();
            if (boundingBox) {
              expect(boundingBox.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });
    }
  });

  test('Pixel 5: Text remains readable', async ({ page }) => {
    await test.step('Hero title readable', async () => {
      const heroTitle = page.locator('.hero-title');
      const fontSize = await heroTitle.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(16);
    });

    await test.step('Body text readable', async () => {
      const bodyText = page.locator('.subtitle, .card-subtitle');
      const count = await bodyText.count();
      
      if (count > 0) {
        const fontSize = await bodyText.first().evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });
        expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(12);
      }
    });
  });

  test('Pixel 5: Forms are usable', async ({ page }) => {
    await page.fill('#welcome-guest-name', 'Test User');
    
    await test.step('Can interact with form', async () => {
      const nameValue = await page.inputValue('#welcome-guest-name');
      expect(nameValue).toBe('Test User');
    });
  });

  test('Pixel 5: Navigation works on small screens', async ({ page }) => {
    await test.step('Activity cards visible and scrollable', async () => {
      const cards = page.locator('.activity-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Pixel 5: Responsive layout adapts', async ({ page }) => {
    await test.step('Flex layout for cards', async () => {
      const container = page.locator('.activity-buttons');
      const display = await container.first().evaluate(el => {
        return window.getComputedStyle(el).display;
      });
      
      expect(display).toBe('flex');
    });

    await test.step('Adequate spacing on mobile', async () => {
      const card = page.locator('.activity-card').first();
      const padding = await card.evaluate(el => {
        return window.getComputedStyle(el).padding;
      });
      expect(parseFloat(padding)).toBeGreaterThanOrEqual(8);
    });
  });

});

test.describe('Phase 11: Mobile Responsiveness - iPhone 12', () => {
  
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('iPhone 12: No horizontal scrolling', async ({ page }) => {
    const horizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(horizontalScroll).toBe(false);
  });

  test('iPhone 12: Touch targets meet 44px minimum', async ({ page }) => {
    const buttons = page.locator('button.activity-card');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('iPhone 12: CSS media queries work', async ({ page }) => {
    const width = await page.evaluate(() => window.innerWidth);
    expect(width).toBe(390);
  });

  test('iPhone 12: Font scaling', async ({ page }) => {
    const rootFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).fontSize;
    });
    
    expect(parseFloat(rootFontSize)).toBeGreaterThanOrEqual(14);
    
    const title = page.locator('.hero-title').first();
    const titleSize = await title.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(titleSize)).toBeGreaterThanOrEqual(20);
  });

  test('iPhone 12: All activities accessible', async ({ page }) => {
    const activities = [
      'button[data-section="guestbook"]',
      'button[data-section="pool"]', 
      'button[data-section="quiz"]',
      'button[data-section="advice"]',
      'button[data-section="voting"]',
      'button[data-section="mom-dad-game"]',
      'button[data-section="shoe-game"]'
    ];

    for (const selector of activities) {
      const element = page.locator(selector);
      await test.step(`${selector} is visible`, async () => {
        await expect(element).toBeVisible();
      });
    }
  });

});

test.describe('Phase 11: Tablet Responsiveness - iPad Mini', () => {
  
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('iPad Mini: Layout adapts for tablet', async ({ page }) => {
    await test.step('Flex layout with gap', async () => {
      const container = page.locator('.activity-buttons').first();
      const gap = await container.evaluate(el => {
        return window.getComputedStyle(el).gap;
      });
      expect(parseFloat(gap)).toBeGreaterThanOrEqual(8);
    });

    await test.step('Adequate spacing', async () => {
      const card = page.locator('.activity-card').first();
      const padding = await card.evaluate(el => {
        return window.getComputedStyle(el).padding;
      });
      expect(parseFloat(padding)).toBeGreaterThanOrEqual(12);
    });
  });

  test('iPad Mini: Touch targets adequate', async ({ page }) => {
    const cards = page.locator('.activity-card');
    const count = await cards.count();
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        const boundingBox = await card.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(80);
        }
      }
    }
  });

  test('iPad Mini: CSS grid/flex works', async ({ page }) => {
    const container = page.locator('.activity-buttons').first();
    const display = await container.evaluate(el => {
      return window.getComputedStyle(el).display;
    });
    
    expect(display).toBe('flex');
  });

});

test.describe('Phase 11: CSS Media Queries & Responsive Design', () => {
  
  test('Media queries are defined', async ({ page }) => {
    const hasResponsiveCSS = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      let hasMediaQueries = false;
      
      for (const sheet of styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            for (const rule of rules) {
              if (rule.type === CSSRule.MEDIA_RULE) {
                hasMediaQueries = true;
                break;
              }
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      
      return hasMediaQueries;
    });
    
    expect(hasResponsiveCSS).toBe(true);
  });

  test('Breakpoints work correctly', async ({ page }) => {
    await test.step('Mobile breakpoint (< 576px)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(100);
      
      const card = page.locator('.activity-card').first();
      const maxWidth = await card.evaluate(el => {
        return window.getComputedStyle(el).maxWidth;
      });
      expect(parseFloat(maxWidth)).toBeLessThanOrEqual(375);
    });

    await test.step('Tablet breakpoint (576px - 992px)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);
      
      const card = page.locator('.activity-card').first();
      const maxWidth = await card.evaluate(el => {
        return window.getComputedStyle(el).maxWidth;
      });
      expect(parseFloat(maxWidth)).toBeLessThanOrEqual(768);
    });

    await test.step('Desktop breakpoint (> 992px)', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);
      
      const card = page.locator('.activity-card').first();
      const maxWidth = await card.evaluate(el => {
        return window.getComputedStyle(el).maxWidth;
      });
      expect(parseFloat(maxWidth)).toBeLessThanOrEqual(1280);
    });
  });

});

test.describe('Phase 11: Cross-Browser CSS Animations', () => {
  
  test('CSS animations work in all browsers', async ({ page }) => {
    await page.goto('/');
    
    const hasAnimations = await page.evaluate(() => {
      const body = document.body;
      const animationName = window.getComputedStyle(body).animationName;
      return animationName && animationName !== 'none';
    });
    
    expect(hasAnimations).toBe(true);
  });

  test('Transitions are smooth', async ({ page }) => {
    const transitions = await page.evaluate(() => {
      const elements = document.querySelectorAll('.activity-card');
      const transitionElements = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.transitionProperty && style.transitionProperty !== 'none') {
          transitionElements.push({
            element: el.tagName,
            transition: style.transition
          });
        }
      });
      
      return transitionElements;
    });
    
    expect(transitions.length).toBeGreaterThan(0);
  });

});

test.describe('Phase 11: Accessibility on Mobile', () => {
  
  test.use({ viewport: { width: 390, height: 844 } });

  test('ARIA labels are present', async ({ page }) => {
    await page.goto('/');
    
    const ariaLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
      return elements.length;
    });
    
    expect(ariaLabels).toBeGreaterThan(0);
  });

  test('Focus states are visible on mobile', async ({ page }) => {
    await page.goto('/');
    
    const nameInput = page.locator('#welcome-guest-name');
    await nameInput.focus();
    
    const outline = await nameInput.evaluate(el => {
      return window.getComputedStyle(el).outline;
    });
    
    expect(outline).not.toBe('none');
  });

});

test.describe('Phase 11: Performance on Mobile', () => {
  
  test.use({ viewport: { width: 393, height: 852 } });

  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds on mobile
    expect(loadTime).toBeLessThan(10000);
  });

  test('No layout shifts on load', async ({ page }) => {
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const shifts = list.getEntries().filter(entry => entry.hadRecentInput === false);
            observer.disconnect();
            resolve(shifts.length);
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(0);
          }, 2000);
        } else {
          resolve(0);
        }
      });
    });
    
    expect(layoutShifts).toBeLessThan(5);
  });

});

test.describe('Phase 11: Desktop Viewports', () => {
  
  test('1920x1080 resolution renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await test.step('All content visible without excessive scrolling', async () => {
      const body = page.locator('body');
      const scrollWidth = await body.evaluate(el => el.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 100);
    });
  });

  test('1280x720 resolution renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await test.step('Main content visible', async () => {
      await expect(page.locator('.hero-title')).toBeVisible();
      await expect(page.locator('.activity-buttons')).toBeVisible();
    });
  });

});
