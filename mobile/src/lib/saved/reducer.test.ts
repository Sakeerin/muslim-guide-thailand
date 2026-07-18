import { describe, expect, it } from 'vitest';
import { addSaved, isSaved, removeSaved, toggleSaved, type SavedState } from './reducer';

const a = { slug: 'a-restaurant', name: 'A' };
const b = { slug: 'b-mosque', name: 'B' };

describe('saved reducer', () => {
  it('toggles a place on and off by slug', () => {
    let s: SavedState = [];
    s = toggleSaved(s, a);
    expect(isSaved(s, 'a-restaurant')).toBe(true);
    s = toggleSaved(s, a);
    expect(isSaved(s, 'a-restaurant')).toBe(false);
  });

  it('add is idempotent (no duplicates)', () => {
    const s = addSaved(addSaved([], a), a);
    expect(s).toHaveLength(1);
  });

  it('remove only removes the matching slug', () => {
    const s = removeSaved([a, b], 'a-restaurant');
    expect(s).toEqual([b]);
  });

  it('does not mutate the input state', () => {
    const original: SavedState = [a];
    const next = toggleSaved(original, b);
    expect(original).toEqual([a]);
    expect(next).toHaveLength(2);
  });
});
