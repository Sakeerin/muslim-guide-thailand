import type { I18nText } from '@/types/api';

/**
 * MVP launch cities. Mirrors the web seed (scripts/seed/data/cities.ts).
 * provinceCode = ISO 3166-2:TH numeric part, which also keys prayer times.
 * Hardcoded because there is no public /api/v1 provinces endpoint yet.
 */
export interface City {
  slug: string;
  provinceCode: string;
  lat: number;
  lng: number;
  name: I18nText;
}

export const CITIES: readonly City[] = [
  { slug: 'bangkok', provinceCode: '10', lat: 13.7563, lng: 100.5018, name: { th: 'กรุงเทพมหานคร', en: 'Bangkok', ms: 'Bangkok', id: 'Bangkok', ar: 'بانكوك' } },
  { slug: 'phuket', provinceCode: '83', lat: 7.8804, lng: 98.3923, name: { th: 'ภูเก็ต', en: 'Phuket', ms: 'Phuket', id: 'Phuket', ar: 'بوكيت' } },
  { slug: 'chiang-mai', provinceCode: '50', lat: 18.7883, lng: 98.9853, name: { th: 'เชียงใหม่', en: 'Chiang Mai', ms: 'Chiang Mai', id: 'Chiang Mai', ar: 'شيانغ ماي' } },
  { slug: 'pattaya', provinceCode: '20', lat: 12.9236, lng: 100.8825, name: { th: 'พัทยา', en: 'Pattaya', ms: 'Pattaya', id: 'Pattaya', ar: 'باتايا' } },
  { slug: 'krabi', provinceCode: '81', lat: 8.0863, lng: 98.9063, name: { th: 'กระบี่', en: 'Krabi', ms: 'Krabi', id: 'Krabi', ar: 'كرابي' } },
  { slug: 'hat-yai', provinceCode: '90', lat: 7.0086, lng: 100.4747, name: { th: 'หาดใหญ่', en: 'Hat Yai', ms: 'Hat Yai', id: 'Hat Yai', ar: 'هات ياي' } },
  { slug: 'ayutthaya', provinceCode: '14', lat: 14.3532, lng: 100.5689, name: { th: 'พระนครศรีอยุธยา', en: 'Ayutthaya', ms: 'Ayutthaya', id: 'Ayutthaya', ar: 'أيوتايا' } },
];

export const DEFAULT_CITY = CITIES[0]!;
