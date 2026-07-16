import { test, expect } from '@playwright/test';

test('Arabic locale sets <html dir="rtl"> and computed rtl', async ({ page }) => {
  await page.goto('/ar');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'ar');
  await expect
    .poll(() => html.evaluate((el) => getComputedStyle(el).direction))
    .toBe('rtl');
});

for (const locale of ['en', 'th', 'ms', 'id'] as const) {
  test(`LTR locale /${locale} sets dir="ltr"`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
}
