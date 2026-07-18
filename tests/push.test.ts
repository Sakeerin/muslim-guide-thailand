import { describe, expect, it } from 'vitest';
import { WebPushError } from 'web-push';
import {
  buildAnnouncementPayload,
  isExpiredPushStatus,
  isExpoPushToken,
  isPushTopic,
  shouldPrunePushError,
  urlBase64ToUint8Array,
} from '@/lib/push';

describe('urlBase64ToUint8Array', () => {
  it('decodes url-safe base64 without padding', () => {
    // bytes [0xFF, 0xE0] → standard base64 "/+A=" → url-safe "_-A"
    expect(Array.from(urlBase64ToUint8Array('_-A'))).toEqual([255, 224]);
  });

  it('round-trips a simple value', () => {
    // "Hi" = [72,105] → "SGk=" → url-safe unpadded "SGk"
    expect(Array.from(urlBase64ToUint8Array('SGk'))).toEqual([72, 105]);
  });

  it('produces a 65-byte P-256 key from a real VAPID public key', () => {
    const key =
      'BHvs3wAQ5Kdj7EXcRx4jI3MjeaEXqhxcdBVpivW2QJ-hI4XCAbys7p9aizmTzOpg9d2RQ7aAyH4n7Vkgfb2ESXk';
    const bytes = urlBase64ToUint8Array(key);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4); // uncompressed EC point prefix
  });
});

describe('isExpiredPushStatus', () => {
  it('is true for 404 and 410 (gone)', () => {
    expect(isExpiredPushStatus(404)).toBe(true);
    expect(isExpiredPushStatus(410)).toBe(true);
  });

  it('is false for transient/other statuses and undefined', () => {
    expect(isExpiredPushStatus(429)).toBe(false);
    expect(isExpiredPushStatus(500)).toBe(false);
    expect(isExpiredPushStatus(201)).toBe(false);
    expect(isExpiredPushStatus(undefined)).toBe(false);
  });
});

describe('shouldPrunePushError', () => {
  it('prunes on a real WebPushError with 404/410', () => {
    expect(shouldPrunePushError(new WebPushError('gone', 410, {}, '', 'https://x/y'))).toBe(true);
    expect(shouldPrunePushError(new WebPushError('nf', 404, {}, '', 'https://x/y'))).toBe(true);
  });

  it('does NOT prune on transient/other statuses', () => {
    expect(shouldPrunePushError(new WebPushError('rate', 429, {}, '', 'https://x/y'))).toBe(false);
    expect(shouldPrunePushError(new WebPushError('boom', 500, {}, '', 'https://x/y'))).toBe(false);
  });

  it('does NOT prune on network errors or non-errors (never delete a valid sub)', () => {
    expect(shouldPrunePushError(new Error('EPROTO'))).toBe(false); // no statusCode
    expect(shouldPrunePushError({ statusCode: '410' })).toBe(false); // string, not number
    expect(shouldPrunePushError(null)).toBe(false);
    expect(shouldPrunePushError(undefined)).toBe(false);
  });
});

describe('isExpoPushToken', () => {
  it('accepts ExponentPushToken and ExpoPushToken shapes', () => {
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[xyz-789]')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isExpoPushToken('')).toBe(false);
    expect(isExpoPushToken('ExponentPushToken[]')).toBe(false); // empty body
    expect(isExpoPushToken('fcm:abc')).toBe(false);
    expect(isExpoPushToken('https://fcm.googleapis.com/x')).toBe(false); // a web-push endpoint
    expect(isExpoPushToken(42)).toBe(false);
    expect(isExpoPushToken(null)).toBe(false);
  });
});

describe('isPushTopic', () => {
  it('accepts known topics', () => {
    expect(isPushTopic('ramadan')).toBe(true);
    expect(isPushTopic('eid')).toBe(true);
    expect(isPushTopic('events')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isPushTopic('marketing')).toBe(false);
    expect(isPushTopic('')).toBe(false);
    expect(isPushTopic(undefined)).toBe(false);
    expect(isPushTopic(42)).toBe(false);
  });
});

describe('buildAnnouncementPayload', () => {
  const content = {
    title: { en: 'Ramadan is coming', th: 'รอมฎอนกำลังจะมาถึง' },
    body: { en: 'Begins soon', th: 'เริ่มเร็ว ๆ นี้' },
    path: '/ramadan',
    tag: 'ramadan-1448',
  };

  it('resolves the requested locale and prefixes the URL', () => {
    expect(buildAnnouncementPayload(content, 'th')).toEqual({
      title: 'รอมฎอนกำลังจะมาถึง',
      body: 'เริ่มเร็ว ๆ นี้',
      url: '/th/ramadan',
      icon: undefined,
      tag: 'ramadan-1448',
      lang: 'th',
    });
  });

  it('falls back to en when the locale is missing but still uses the locale in the URL', () => {
    const p = buildAnnouncementPayload(content, 'ms');
    expect(p.title).toBe('Ramadan is coming');
    expect(p.url).toBe('/ms/ramadan');
    expect(p.lang).toBe('ms');
  });

  it('defaults the URL path to "/" and lang to "en"', () => {
    const p = buildAnnouncementPayload({ title: { en: 'Hi' }, body: { en: 'Yo' } }, '');
    expect(p.url).toBe('/en/');
    expect(p.lang).toBe('en');
  });

  it('normalizes a path missing its leading slash', () => {
    const p = buildAnnouncementPayload({ title: { en: 'Hi' }, body: { en: 'Yo' }, path: 'islamic-calendar' }, 'en');
    expect(p.url).toBe('/en/islamic-calendar');
  });
});
