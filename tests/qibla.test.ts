import { describe, expect, it } from 'vitest';
import {
  bearing,
  compassPoint,
  distanceToKaabaKm,
  qiblaBearing,
} from '@/lib/prayer/qibla';

describe('qiblaBearing', () => {
  // From Bangkok, the qibla is roughly west-north-west (~270-290°).
  it('points roughly WNW from Bangkok', () => {
    const b = qiblaBearing(13.7563, 100.5018);
    expect(b).toBeGreaterThan(260);
    expect(b).toBeLessThan(300);
  });

  it('is within valid bearing range', () => {
    const b = qiblaBearing(7.8804, 98.3923); // Phuket
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('distanceToKaabaKm', () => {
  it('Bangkok → Makkah is roughly 6,700 km', () => {
    const d = distanceToKaabaKm(13.7563, 100.5018);
    expect(d).toBeGreaterThan(6300);
    expect(d).toBeLessThan(7100);
  });

  it('is ~0 at the Kaaba itself', () => {
    expect(distanceToKaabaKm(21.4225241, 39.8261818)).toBeLessThan(1);
  });
});

describe('bearing + compassPoint', () => {
  it('due north is 0°', () => {
    expect(Math.round(bearing(0, 0, 1, 0))).toBe(0);
    expect(compassPoint(0)).toBe('N');
  });

  it('due east is 90°', () => {
    expect(Math.round(bearing(0, 0, 0, 1))).toBe(90);
    expect(compassPoint(90)).toBe('E');
  });

  it('maps quadrants correctly', () => {
    expect(compassPoint(45)).toBe('NE');
    expect(compassPoint(225)).toBe('SW');
    expect(compassPoint(359)).toBe('N');
  });
});
