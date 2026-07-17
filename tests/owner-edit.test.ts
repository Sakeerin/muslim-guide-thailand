import { describe, expect, it } from 'vitest';
import { OWNER_EDITABLE_FIELDS, ownerEditSchema } from '@/lib/validators/claim';

describe('owner-editable field allowlist', () => {
  it('never includes halal status/source or verification fields', () => {
    // Trust level must stay a staff decision — owners can't propose it.
    for (const forbidden of ['halalStatus', 'halalSource', 'status', 'verificationMethod', 'ownerUserId']) {
      expect(OWNER_EDITABLE_FIELDS as readonly string[]).not.toContain(forbidden);
    }
  });

  it('covers the descriptive fields owners can manage', () => {
    expect(OWNER_EDITABLE_FIELDS).toEqual(
      expect.arrayContaining(['description', 'phone', 'website', 'openingHours', 'priceRange']),
    );
  });
});

describe('ownerEditSchema', () => {
  it('accepts a valid descriptive edit', () => {
    const r = ownerEditSchema.safeParse({
      placeId: '11111111-1111-4111-8111-111111111111',
      phone: '021234567',
      priceRange: 2,
    });
    expect(r.success).toBe(true);
  });

  it('strips halal fields (not in schema) so they cannot be proposed', () => {
    const r = ownerEditSchema.safeParse({
      placeId: '11111111-1111-4111-8111-111111111111',
      halalStatus: 'cicot_certified',
      phone: '021234567',
    } as Record<string, unknown>);
    expect(r.success).toBe(true);
    // parsed output must not carry halalStatus through
    if (r.success) expect('halalStatus' in r.data).toBe(false);
  });

  it('rejects an invalid price range', () => {
    const r = ownerEditSchema.safeParse({
      placeId: '11111111-1111-4111-8111-111111111111',
      priceRange: 9,
    });
    expect(r.success).toBe(false);
  });
});
