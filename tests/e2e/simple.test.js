import { test, expect } from '@playwright/test';

test('simple test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Baby Shower/i);
});
