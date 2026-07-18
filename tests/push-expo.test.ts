import { describe, expect, it } from 'vitest';
import type { ExpoPushTicket } from 'expo-server-sdk';
import { classifyExpoTicket, toExpoMessage } from '@/lib/push-expo';

const content = {
  title: { en: 'Ramadan is coming', th: 'รอมฎอนกำลังจะมาถึง' },
  body: { en: 'Begins soon', th: 'เริ่มเร็ว ๆ นี้' },
  path: '/ramadan',
  tag: 'ramadan-1448',
};

describe('toExpoMessage', () => {
  it('maps the localized payload to an Expo message', () => {
    const m = toExpoMessage('ExponentPushToken[abc]', content, 'th');
    expect(m.to).toBe('ExponentPushToken[abc]');
    expect(m.title).toBe('รอมฎอนกำลังจะมาถึง');
    expect(m.body).toBe('เริ่มเร็ว ๆ นี้');
    expect(m.channelId).toBe('announcements');
    expect(m.data).toMatchObject({ url: '/th/ramadan', tag: 'ramadan-1448', lang: 'th' });
  });

  it('mirrors the collapse tag on both platforms', () => {
    const m = toExpoMessage('ExponentPushToken[abc]', content, 'en');
    expect(m.tag).toBe('ramadan-1448');
    expect(m.collapseId).toBe('ramadan-1448');
  });

  it('omits tag/collapseId when there is no tag, and falls back locale', () => {
    const m = toExpoMessage('ExponentPushToken[abc]', { title: { en: 'Hi' }, body: { en: 'Yo' } }, 'ms');
    expect(m.tag).toBeUndefined();
    expect(m.collapseId).toBeUndefined();
    expect(m.title).toBe('Hi'); // ms → en fallback
    expect(m.data).toMatchObject({ url: '/ms/', tag: null });
  });
});

describe('classifyExpoTicket', () => {
  it('is sent for an ok ticket', () => {
    expect(classifyExpoTicket({ status: 'ok', id: 'r1' } as ExpoPushTicket)).toBe('sent');
  });

  it('prunes only on DeviceNotRegistered', () => {
    expect(
      classifyExpoTicket({
        status: 'error',
        message: 'gone',
        details: { error: 'DeviceNotRegistered' },
      } as ExpoPushTicket),
    ).toBe('prune');
  });

  it('is failed (not pruned) for transient errors', () => {
    expect(
      classifyExpoTicket({
        status: 'error',
        message: 'slow down',
        details: { error: 'MessageRateExceeded' },
      } as ExpoPushTicket),
    ).toBe('failed');
    expect(classifyExpoTicket({ status: 'error', message: 'x' } as ExpoPushTicket)).toBe('failed');
  });
});
