import type { MetadataRoute } from 'next';

// Root-level metadata route (NOT under [locale]) — served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Muslim Guide Thailand — Halal Places & Prayer Times',
    short_name: 'Muslim Guide TH',
    description: 'ค้นหาร้านฮาลาล มัสยิด ห้องละหมาด เวลาละหมาด และกิบลัตทั่วไทย',
    start_url: '/en',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f766e',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'เวลาละหมาด / Prayer times', url: '/en/prayer-times' },
      { name: 'ใกล้ฉัน / Near me', url: '/en/nearby' },
      { name: 'กิบลัต / Qibla', url: '/en/qibla' },
    ],
  };
}
