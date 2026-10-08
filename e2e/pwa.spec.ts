import { test, expect } from '@playwright/test';

test('serves web app manifest with icons and shortcuts', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toContain('Muslim Guide');
  expect(m.icons.length).toBeGreaterThanOrEqual(2);
  expect(m.display).toBe('standalone');
  // Root manifest is the default-locale (en) fallback.
  expect(m.lang).toBe('en');
  expect(m.shortcuts[0].name).toBe('Prayer times');
});

// Each locale serves its own localized manifest at /{locale}/manifest.webmanifest,
// with a native-language description, shortcut names, lang and dir.
const localizedManifests = [
  { locale: 'en', dir: 'ltr', prayerTimes: 'Prayer times', descFragment: 'halal' },
  { locale: 'th', dir: 'ltr', prayerTimes: 'เวลาละหมาด', descFragment: 'ฮาลาล' },
  { locale: 'ar', dir: 'rtl', prayerTimes: 'مواقيت الصلاة', descFragment: 'الحلال' },
] as const;

for (const { locale, dir, prayerTimes, descFragment } of localizedManifests) {
  test(`serves a localized manifest for ${locale}`, async ({ request }) => {
    const res = await request.get(`/${locale}/manifest.webmanifest`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const m = await res.json();

    expect(m.name).toContain('Muslim Guide'); // brand stays literal
    expect(m.lang).toBe(locale);
    expect(m.dir).toBe(dir);
    expect(m.start_url).toBe(`/${locale}`);
    expect(m.description).toContain(descFragment);
    expect(m.shortcuts[0].name).toBe(prayerTimes);
    expect(m.shortcuts[0].url).toBe(`/${locale}/prayer-times`);
  });
}

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
