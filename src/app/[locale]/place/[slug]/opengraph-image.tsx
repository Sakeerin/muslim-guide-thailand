import { ImageResponse } from 'next/og';
import { getPlaceBySlug } from '@/server/services/places';
import { resolveI18n } from '@/lib/i18n-content';
import { isRtl } from '@/i18n/routing';

export const alt = 'Muslim Guide Thailand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TRUST_LABEL: Record<string, string> = {
  cicot_certified: 'Halal certified (CICOT)',
  muslim_owned: 'Muslim-owned',
  muslim_friendly: 'Muslim-friendly',
  unverified: 'Not yet verified',
};

// Per-place OG image. BREAKING v16: params is a Promise → await it.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const place = await getPlaceBySlug(slug);
  const name = place ? resolveI18n(place.name as never, locale) : 'Muslim Guide Thailand';
  const trust = place ? (TRUST_LABEL[place.halalStatus] ?? '') : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 72,
          background: 'linear-gradient(135deg, #0f766e 0%, #065f46 100%)',
          color: '#ffffff',
          direction: isRtl(locale) ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, opacity: 0.85 }}>Muslim Guide Thailand</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
          {name}
        </div>
        {trust && (
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              alignSelf: 'flex-start',
              padding: '10px 24px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              fontSize: 30,
            }}
          >
            {trust}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
