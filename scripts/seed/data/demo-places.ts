/**
 * DEV-ONLY sample data (SEED_DEMO=1). Restaurants are FICTIONAL —
 * we never assert halal claims about real businesses in seed data.
 * Mosques are real, well-known public religious sites (no halal claim involved),
 * coordinates from OpenStreetMap (© OpenStreetMap contributors, ODbL).
 */

export interface DemoPlace {
  type: 'restaurant' | 'mosque' | 'prayer_room';
  slug: string;
  citySlug: string;
  lat: number;
  lng: number;
  name: { th: string; en: string; ms?: string; id?: string; ar?: string };
  address?: { th?: string; en?: string };
  description?: { th?: string; en?: string };
  halalStatus: 'cicot_certified' | 'muslim_owned' | 'muslim_friendly' | 'unverified';
  halalSource:
    | 'cicot_certificate'
    | 'owner_declaration'
    | 'field_verification'
    | 'community_verified'
    | 'imported'
    | 'none';
  status: 'published' | 'published_unverified';
  dataSource: string;
  sourceRef?: string;
  servesAlcohol?: boolean;
  priceRange?: number;
  openingHours?: Record<string, [string, string][]>;
  categorySlugs: string[];
  attributes?: Record<string, unknown>;
}

export const DEMO_PLACES: DemoPlace[] = [
  {
    type: 'restaurant',
    slug: 'demo-krua-halal-sukhumvit',
    citySlug: 'bangkok',
    lat: 13.7387,
    lng: 100.5606,
    name: {
      th: '(ตัวอย่าง) ครัวฮาลาลสุขุมวิท',
      en: '(Demo) Halal Kitchen Sukhumvit',
      ar: '(تجريبي) مطبخ حلال سوخومفيت',
    },
    address: { th: 'ซอยสุขุมวิท 3 กรุงเทพฯ', en: 'Sukhumvit Soi 3, Bangkok' },
    description: {
      th: 'ร้านตัวอย่างสำหรับทดสอบระบบ — ไม่ใช่ร้านจริง',
      en: 'Demo listing for development — not a real restaurant',
    },
    halalStatus: 'cicot_certified',
    halalSource: 'cicot_certificate',
    status: 'published',
    dataSource: 'admin',
    servesAlcohol: false,
    priceRange: 2,
    openingHours: {
      mon: [['10:00', '22:00']],
      tue: [['10:00', '22:00']],
      wed: [['10:00', '22:00']],
      thu: [['10:00', '22:00']],
      fri: [['13:30', '22:00']],
      sat: [['10:00', '22:00']],
      sun: [['10:00', '22:00']],
    },
    categorySlugs: ['thai', 'biryani'],
  },
  {
    type: 'restaurant',
    slug: 'demo-baan-yala-street-food',
    citySlug: 'bangkok',
    lat: 13.7469,
    lng: 100.5349,
    name: {
      th: '(ตัวอย่าง) บ้านยะลา สตรีทฟู้ด',
      en: '(Demo) Baan Yala Street Food',
    },
    address: { th: 'ย่านประตูน้ำ กรุงเทพฯ', en: 'Pratunam, Bangkok' },
    description: {
      th: 'ร้านตัวอย่างสำหรับทดสอบระบบ — เปิดข้ามคืน',
      en: 'Demo listing — overnight opening hours for testing',
    },
    halalStatus: 'muslim_owned',
    halalSource: 'field_verification',
    status: 'published',
    dataSource: 'admin',
    servesAlcohol: false,
    priceRange: 1,
    openingHours: {
      fri: [['18:00', '02:00']],
      sat: [['18:00', '02:00']],
      sun: [['18:00', '01:00']],
    },
    categorySlugs: ['street-food', 'southern-thai'],
  },
  {
    type: 'mosque',
    slug: 'haroon-mosque-bangkok',
    citySlug: 'bangkok',
    lat: 13.7245,
    lng: 100.5158,
    name: {
      th: 'มัสยิดฮารูณ',
      en: 'Haroon Mosque',
      ms: 'Masjid Haroon',
      id: 'Masjid Haroon',
      ar: 'مسجد هارون',
    },
    address: { th: 'เขตบางรัก กรุงเทพฯ', en: 'Bang Rak, Bangkok' },
    description: {
      th: 'มัสยิดเก่าแก่ย่านบางรัก ใกล้ริมแม่น้ำเจ้าพระยา',
      en: 'Historic mosque in the Bang Rak riverside quarter',
    },
    halalStatus: 'unverified',
    halalSource: 'none',
    status: 'published_unverified',
    dataSource: 'osm',
    sourceRef: 'osm:haroon-mosque',
    categorySlugs: ['mosque', 'historic-mosque'],
    attributes: { women_section: true, wudu: true },
  },
  {
    type: 'mosque',
    slug: 'java-mosque-bangkok',
    citySlug: 'bangkok',
    lat: 13.7175,
    lng: 100.5297,
    name: {
      th: 'มัสยิดยะวา',
      en: 'Java Mosque',
      ms: 'Masjid Jawa',
      id: 'Masjid Jawa',
      ar: 'مسجد جاوة',
    },
    address: { th: 'เขตสาทร กรุงเทพฯ', en: 'Sathon, Bangkok' },
    description: {
      th: 'มัสยิดชุมชนชาวชวาในกรุงเทพฯ สร้างสมัยรัชกาลที่ 5',
      en: 'Community mosque founded by Javanese settlers in the reign of Rama V',
    },
    halalStatus: 'unverified',
    halalSource: 'none',
    status: 'published_unverified',
    dataSource: 'osm',
    sourceRef: 'osm:java-mosque',
    categorySlugs: ['mosque', 'historic-mosque'],
    attributes: { wudu: true },
  },
  {
    type: 'prayer_room',
    slug: 'demo-prayer-room-central-mall',
    citySlug: 'bangkok',
    lat: 13.7466,
    lng: 100.5393,
    name: {
      th: '(ตัวอย่าง) ห้องละหมาดห้างเซ็นทรัลเดโม่',
      en: '(Demo) Prayer Room — Central Demo Mall',
    },
    address: { th: 'ชั้น 5 โซนลานจอดรถ', en: '5th floor, near parking zone' },
    description: {
      th: 'ตัวอย่างห้องละหมาดในห้าง สำหรับทดสอบระบบ',
      en: 'Demo mall prayer room for development',
    },
    halalStatus: 'unverified',
    halalSource: 'none',
    status: 'published',
    dataSource: 'admin',
    categorySlugs: ['mall-prayer-room'],
    attributes: { floor: '5', gender_separated: true, wudu: true },
  },
];
