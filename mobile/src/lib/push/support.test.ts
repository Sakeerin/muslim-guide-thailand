import { describe, expect, it } from 'vitest';
import { pushSupport } from './support';

const base = {
  os: 'ios',
  isDevice: true,
  executionEnvironment: 'standalone',
  projectId: 'abc-123',
};

describe('pushSupport', () => {
  it('is ok on a real device, dev/standalone build, with a projectId', () => {
    expect(pushSupport(base)).toBe('ok');
  });

  it('is web on the web platform', () => {
    expect(pushSupport({ ...base, os: 'web' })).toBe('web');
  });

  it('is no-device on a simulator', () => {
    expect(pushSupport({ ...base, isDevice: false })).toBe('no-device');
  });

  it('is expo-go inside the Expo Go client', () => {
    expect(pushSupport({ ...base, executionEnvironment: 'storeClient' })).toBe('expo-go');
  });

  it('is no-project when no EAS project id is configured', () => {
    expect(pushSupport({ ...base, projectId: undefined })).toBe('no-project');
  });
});
