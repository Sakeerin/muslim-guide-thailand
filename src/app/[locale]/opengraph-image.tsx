import { ImageResponse } from 'next/og';

export const alt = 'Muslim Guide Thailand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default site OG image (code-generated, flexbox-only per next/og constraints).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0f766e 0%, #065f46 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 34, opacity: 0.85 }}>Muslim Guide Thailand</div>
        <div style={{ display: 'flex', marginTop: 16, fontSize: 60, fontWeight: 700, lineHeight: 1.15 }}>
          Verified halal places & prayer times across Thailand
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 28, opacity: 0.8 }}>
          🕌 mosques · 🍽️ halal food · 🧭 qibla · 🕐 prayer times
        </div>
      </div>
    ),
    { ...size },
  );
}
