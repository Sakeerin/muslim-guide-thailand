import { test, expect } from '@playwright/test';

// Requires SEED_DEMO=1 (mosques Haroon/Java). 'mosque' resolves via the
// synonym layer to type=mosque, so results are deterministic.
test('search resolves a synonym and opens a place detail page', async ({ page }) => {
  await page.goto('/en/search');
  const q = page.locator('input[name="q"]');
  await q.fill('mosque');
  await q.press('Enter');

  await expect(page).toHaveURL(/\/en\/search\?.*q=mosque/);

  const firstResult = page.locator('a[href*="/place/"]').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(page).toHaveURL(/\/en\/place\/[a-z0-9-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('place detail shows the trust box', async ({ page }) => {
  await page.goto('/en/place/demo-krua-halal-sukhumvit');
  // trust box is a section with aria-label = the trust level name
  const trustBox = page.locator('section[aria-label]').first();
  await expect(trustBox).toBeVisible();
  // scope the "how we verify" link to the trust box (a footer link also exists)
  await expect(trustBox.getByRole('link', { name: /how we verify/i })).toBeVisible();
});
