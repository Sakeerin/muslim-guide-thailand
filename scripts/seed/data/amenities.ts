type PlaceType = 'restaurant' | 'mosque' | 'prayer_room' | 'hotel' | 'attraction' | 'shop';

interface AmenitySeed {
  key: string;
  icon: string;
  appliesTo: PlaceType[];
  sortOrder: number;
  name: { th: string; en: string; ms?: string; id?: string; ar?: string };
}

export const AMENITIES: AmenitySeed[] = [
  { key: 'prayer_room', icon: 'prayer', appliesTo: ['restaurant', 'hotel', 'attraction', 'shop'], sortOrder: 1, name: { th: 'ห้องละหมาด', en: 'Prayer room', ms: 'Surau', id: 'Musala', ar: 'مصلى' } },
  { key: 'wudu', icon: 'droplets', appliesTo: ['restaurant', 'mosque', 'prayer_room', 'hotel'], sortOrder: 2, name: { th: 'ที่อาบน้ำละหมาด', en: 'Wudu area', ms: 'Tempat Wuduk', id: 'Tempat Wudu', ar: 'مكان وضوء' } },
  { key: 'women_section', icon: 'users', appliesTo: ['mosque', 'prayer_room'], sortOrder: 3, name: { th: 'พื้นที่สตรี', en: "Women's section", ms: 'Ruang Wanita', id: 'Area Wanita', ar: 'قسم نساء' } },
  { key: 'separate_kitchen', icon: 'chef-hat', appliesTo: ['restaurant', 'hotel'], sortOrder: 4, name: { th: 'ครัว/ภาชนะแยก', en: 'Separate kitchen', ms: 'Dapur Berasingan', id: 'Dapur Terpisah', ar: 'مطبخ منفصل' } },
  { key: 'family_room', icon: 'sofa', appliesTo: ['restaurant', 'hotel'], sortOrder: 5, name: { th: 'ห้อง/โซนครอบครัว', en: 'Family room', ms: 'Ruang Keluarga', id: 'Ruang Keluarga', ar: 'غرفة عائلية' } },
  { key: 'bidet_spray', icon: 'shower-head', appliesTo: ['restaurant', 'mosque', 'prayer_room', 'hotel', 'attraction'], sortOrder: 6, name: { th: 'ห้องน้ำมีสายฉีด', en: 'Bidet spray', ms: 'Bidet', id: 'Semprotan Bidet', ar: 'شطاف' } },
  { key: 'parking', icon: 'car', appliesTo: ['restaurant', 'mosque', 'prayer_room', 'hotel', 'attraction', 'shop'], sortOrder: 7, name: { th: 'ที่จอดรถ', en: 'Parking', ms: 'Tempat Letak Kereta', id: 'Parkir', ar: 'موقف سيارات' } },
  { key: 'wifi', icon: 'wifi', appliesTo: ['restaurant', 'hotel'], sortOrder: 8, name: { th: 'WiFi', en: 'WiFi', ms: 'WiFi', id: 'WiFi', ar: 'واي فاي' } },
  { key: 'credit_card', icon: 'credit-card', appliesTo: ['restaurant', 'hotel', 'shop'], sortOrder: 9, name: { th: 'รับบัตรเครดิต', en: 'Accepts cards', ms: 'Terima Kad', id: 'Terima Kartu', ar: 'يقبل البطاقات' } },
  { key: 'delivery', icon: 'bike', appliesTo: ['restaurant'], sortOrder: 10, name: { th: 'มีเดลิเวอรี่', en: 'Delivery', ms: 'Penghantaran', id: 'Pesan Antar', ar: 'توصيل' } },
  { key: 'open_late', icon: 'moon', appliesTo: ['restaurant'], sortOrder: 11, name: { th: 'เปิดดึก', en: 'Open late', ms: 'Buka Lewat Malam', id: 'Buka Larut Malam', ar: 'يفتح لوقت متأخر' } },
  { key: 'visitor_friendly', icon: 'landmark', appliesTo: ['mosque'], sortOrder: 12, name: { th: 'เปิดให้เยี่ยมชม', en: 'Open to visitors', ms: 'Terbuka untuk Pelawat', id: 'Terbuka untuk Pengunjung', ar: 'مفتوح للزوار' } },
];
