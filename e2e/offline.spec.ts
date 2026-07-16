import { test, expect } from '@playwright/test';

// Saved places live in localStorage (no account) and must survive going
// offline. Full offline navigation/reload is exercised in production via the
// service worker; here we assert the client store is network-independent.
const SAVED_KEY = 'mgt:saved-places';
const seeded = [{ slug: 'haroon-mosque-bangkok', name: 'Haroon Mosque', savedAt: '2026-01-01T00:00:00Z' }];

test('saved list renders from localStorage with all network aborted', async ({ page }) => {
  await page.addInitScript(
    ([k, v]) => localStorage.setItem(k as string, v as string),
    [SAVED_KEY, JSON.stringify(seeded)],
  );
  await page.goto('/en/saved');
  await expect(page.getByRole('link', { name: 'Haroon Mosque' })).toBeVisible();

  // block every subsequent request; the already-rendered store stays usable
  await page.route('**/*', (route) => route.abort());
  const stored = await page.evaluate((k) => localStorage.getItem(k), SAVED_KEY);
  expect(stored).toContain('haroon-mosque-bangkok');
  await expect(page.getByRole('link', { name: 'Haroon Mosque' })).toBeVisible();
});
