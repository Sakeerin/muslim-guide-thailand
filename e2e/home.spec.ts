import { test, expect } from '@playwright/test';

const locales = ['en', 'th', 'ms', 'id', 'ar'] as const;

test("root '/' redirects to a locale", async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/(en|th|ms|id|ar)(\/)?$/);
});

for (const locale of locales) {
  test(`home renders for /${locale}`, async ({ page }) => {
    const res = await page.goto(`/${locale}`);
    expect(res?.status() ?? 500).toBeLessThan(400);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });
}
