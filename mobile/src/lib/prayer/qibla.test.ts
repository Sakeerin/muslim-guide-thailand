import { describe, expect, it } from 'vitest';
import {
  compassPoint,
  distanceToKaabaKm,
  normalizeDeg,
  qiblaBearing,
  relativeRotation,
} from './qibla';

describe('qiblaBearing (parity with adhan)', () => {
  it('matches known bearings from true north', () => {
    // Bangkok is the parity anchor — identical to adhan Qibla() to 1e-13
    expect(qiblaBearing(13.7563, 100.5018)).toBeCloseTo(286.8846, 2);
    expect(qiblaBearing(6.54, 101.28)).toBeCloseTo(290.9, 1); // Yala (south)
  });

  it('returns a value in [0, 360)', () => {
    const b = qiblaBearing(-33.8688, 151.2093); // Sydney
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('distanceToKaabaKm', () => {
  it('is ~6450 km (great-circle) from Bangkok', () => {
    const d = distanceToKaabaKm(13.7563, 100.5018);
    expect(d).toBeGreaterThan(6400);
    expect(d).toBeLessThan(6500);
  });
});

describe('normalizeDeg', () => {
  it('wraps into [0, 360)', () => {
    expect(normalizeDeg(-10)).toBe(350);
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(360)).toBe(0);
    expect(normalizeDeg(45)).toBe(45);
  });
});

describe('relativeRotation', () => {
  it('is qibla minus heading, wrapped', () => {
    expect(relativeRotation(10, 350)).toBe(20);
    expect(relativeRotation(0, 90)).toBe(270);
    expect(relativeRotation(286.9, 0)).toBeCloseTo(286.9, 5);
  });
});

describe('compassPoint', () => {
  it('maps degrees to the 8-point compass', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(45)).toBe('NE');
    expect(compassPoint(90)).toBe('E');
    expect(compassPoint(270)).toBe('W');
    expect(compassPoint(315)).toBe('NW');
    expect(compassPoint(360)).toBe('N');
  });
});
