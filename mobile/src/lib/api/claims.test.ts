import { describe, expect, it } from 'vitest';
import { normalizeClaimMessage } from './claims';

describe('normalizeClaimMessage', () => {
  it('trims but keeps real text', () => {
    expect(normalizeClaimMessage('  I am the owner ')).toBe('I am the owner');
  });

  it('treats empty / whitespace-only / nullish as omitted', () => {
    expect(normalizeClaimMessage('   ')).toBeUndefined();
    expect(normalizeClaimMessage('')).toBeUndefined();
    expect(normalizeClaimMessage(undefined)).toBeUndefined();
    expect(normalizeClaimMessage(null)).toBeUndefined();
  });
});
