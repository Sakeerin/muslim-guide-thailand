import { test, expect } from '@playwright/test';

test('serves web app manifest with icons and shortcuts', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toContain('Muslim Guide');
  expect(m.icons.length).toBeGreaterThanOrEqual(2);
  expect(m.display).toBe('standalone');
});

test('serves robots.txt and sitemap.xml (not redirected to a locale)', async ({ request }) => {
  const robots = await request.get('/robots.txt', { maxRedirects: 0 });
  expect(robots.status()).toBe(200);

  const sitemap = await request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('hreflang="ar"');
  expect(xml).toContain('hreflang="th"');
});

test('serves the offline fallback and service worker', async ({ request }) => {
  expect((await request.get('/offline.html')).status()).toBe(200);
  const sw = await request.get('/sw.js');
  expect(sw.status()).toBe(200);
  expect(await sw.text()).toContain('mgt-shell');
});
