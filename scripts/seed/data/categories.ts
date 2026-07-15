type PlaceType = 'restaurant' | 'mosque' | 'prayer_room' | 'attraction';

interface CategorySeed {
  slug: string;
  placeType: PlaceType;
  sortOrder: number;
  name: { th: string; en: string; ms?: string; id?: string; ar?: string };
}

/** Cuisine taxonomy modelled on what works at Makan (~29 cats), trimmed to launch set. */
export const CATEGORIES: CategorySeed[] = [
  // — restaurant cuisines —
  { slug: 'thai', placeType: 'restaurant', sortOrder: 1, name: { th: 'อาหารไทย', en: 'Thai', ms: 'Masakan Thai', id: 'Masakan Thai', ar: 'تايلاندي' } },
  { slug: 'southern-thai', placeType: 'restaurant', sortOrder: 2, name: { th: 'อาหารใต้', en: 'Southern Thai', ms: 'Thai Selatan', id: 'Thai Selatan', ar: 'جنوب تايلاند' } },
  { slug: 'northern-thai', placeType: 'restaurant', sortOrder: 3, name: { th: 'อาหารเหนือ', en: 'Northern Thai', ms: 'Thai Utara', id: 'Thai Utara', ar: 'شمال تايلاند' } },
  { slug: 'isaan', placeType: 'restaurant', sortOrder: 4, name: { th: 'อาหารอีสาน', en: 'Isaan', ms: 'Isaan', id: 'Isaan', ar: 'إيسان' } },
  { slug: 'arab', placeType: 'restaurant', sortOrder: 5, name: { th: 'อาหารอาหรับ', en: 'Arab', ms: 'Arab', id: 'Arab', ar: 'عربي' } },
  { slug: 'indian', placeType: 'restaurant', sortOrder: 6, name: { th: 'อาหารอินเดีย', en: 'Indian', ms: 'India', id: 'India', ar: 'هندي' } },
  { slug: 'malay', placeType: 'restaurant', sortOrder: 7, name: { th: 'อาหารมลายู', en: 'Malay', ms: 'Melayu', id: 'Melayu', ar: 'ملاوي' } },
  { slug: 'indonesian', placeType: 'restaurant', sortOrder: 8, name: { th: 'อาหารอินโดนีเซีย', en: 'Indonesian', ms: 'Indonesia', id: 'Indonesia', ar: 'إندونيسي' } },
  { slug: 'chinese', placeType: 'restaurant', sortOrder: 9, name: { th: 'อาหารจีน', en: 'Chinese', ms: 'Cina', id: 'Tionghoa', ar: 'صيني' } },
  { slug: 'japanese', placeType: 'restaurant', sortOrder: 10, name: { th: 'อาหารญี่ปุ่น', en: 'Japanese', ms: 'Jepun', id: 'Jepang', ar: 'ياباني' } },
  { slug: 'korean', placeType: 'restaurant', sortOrder: 11, name: { th: 'อาหารเกาหลี', en: 'Korean', ms: 'Korea', id: 'Korea', ar: 'كوري' } },
  { slug: 'western', placeType: 'restaurant', sortOrder: 12, name: { th: 'อาหารตะวันตก', en: 'Western', ms: 'Barat', id: 'Barat', ar: 'غربي' } },
  { slug: 'seafood', placeType: 'restaurant', sortOrder: 13, name: { th: 'ซีฟู้ด', en: 'Seafood', ms: 'Makanan Laut', id: 'Hidangan Laut', ar: 'مأكولات بحرية' } },
  { slug: 'noodles', placeType: 'restaurant', sortOrder: 14, name: { th: 'ก๋วยเตี๋ยว', en: 'Noodles', ms: 'Mi', id: 'Mi', ar: 'نودلز' } },
  { slug: 'biryani', placeType: 'restaurant', sortOrder: 15, name: { th: 'ข้าวหมก/ข้าวมัน', en: 'Biryani & Rice', ms: 'Nasi Beriani', id: 'Nasi Briyani', ar: 'برياني وأرز' } },
  { slug: 'grill-shabu', placeType: 'restaurant', sortOrder: 16, name: { th: 'ชาบู/ปิ้งย่าง', en: 'Shabu & Grill', ms: 'Shabu & Panggang', id: 'Shabu & Panggang', ar: 'شابو ومشاوي' } },
  { slug: 'steak-burger', placeType: 'restaurant', sortOrder: 17, name: { th: 'สเต๊ก/เบอร์เกอร์', en: 'Steak & Burger', ms: 'Stik & Burger', id: 'Steak & Burger', ar: 'ستيك وبرغر' } },
  { slug: 'street-food', placeType: 'restaurant', sortOrder: 18, name: { th: 'สตรีทฟู้ด', en: 'Street Food', ms: 'Makanan Jalanan', id: 'Jajanan Kaki Lima', ar: 'طعام الشارع' } },
  { slug: 'roti-dessert', placeType: 'restaurant', sortOrder: 19, name: { th: 'โรตี/ของหวาน', en: 'Roti & Desserts', ms: 'Roti & Pencuci Mulut', id: 'Roti & Makanan Penutup', ar: 'روتي وحلويات' } },
  { slug: 'bakery-cafe', placeType: 'restaurant', sortOrder: 20, name: { th: 'เบเกอรี่/คาเฟ่', en: 'Bakery & Cafe', ms: 'Bakeri & Kafe', id: 'Toko Roti & Kafe', ar: 'مخبز ومقهى' } },
  { slug: 'buffet', placeType: 'restaurant', sortOrder: 21, name: { th: 'บุฟเฟ่ต์', en: 'Buffet', ms: 'Bufet', id: 'Prasmanan', ar: 'بوفيه' } },
  { slug: 'hotel-restaurant', placeType: 'restaurant', sortOrder: 22, name: { th: 'ห้องอาหารโรงแรม', en: 'Hotel Restaurant', ms: 'Restoran Hotel', id: 'Restoran Hotel', ar: 'مطعم فندق' } },

  // — mosque —
  { slug: 'mosque', placeType: 'mosque', sortOrder: 1, name: { th: 'มัสยิด', en: 'Mosque', ms: 'Masjid', id: 'Masjid', ar: 'مسجد' } },
  { slug: 'historic-mosque', placeType: 'mosque', sortOrder: 2, name: { th: 'มัสยิดเก่าแก่/ท่องเที่ยว', en: 'Historic Mosque', ms: 'Masjid Bersejarah', id: 'Masjid Bersejarah', ar: 'مسجد تاريخي' } },

  // — prayer room venues —
  { slug: 'mall-prayer-room', placeType: 'prayer_room', sortOrder: 1, name: { th: 'ห้องละหมาดในห้าง', en: 'Mall Prayer Room', ms: 'Surau Pusat Beli-belah', id: 'Musala Mal', ar: 'مصلى مركز تجاري' } },
  { slug: 'airport-prayer-room', placeType: 'prayer_room', sortOrder: 2, name: { th: 'ห้องละหมาดสนามบิน', en: 'Airport Prayer Room', ms: 'Surau Lapangan Terbang', id: 'Musala Bandara', ar: 'مصلى مطار' } },
  { slug: 'station-prayer-room', placeType: 'prayer_room', sortOrder: 3, name: { th: 'ห้องละหมาดปั๊ม/สถานี', en: 'Station Prayer Room', ms: 'Surau Stesen', id: 'Musala Stasiun/SPBU', ar: 'مصلى محطة' } },

  // — attractions (landmark subset in MVP) —
  { slug: 'beach', placeType: 'attraction', sortOrder: 1, name: { th: 'ชายหาด/เกาะ', en: 'Beach & Islands', ms: 'Pantai & Pulau', id: 'Pantai & Pulau', ar: 'شواطئ وجزر' } },
  { slug: 'market', placeType: 'attraction', sortOrder: 2, name: { th: 'ตลาด', en: 'Markets', ms: 'Pasar', id: 'Pasar', ar: 'أسواق' } },
  { slug: 'culture', placeType: 'attraction', sortOrder: 3, name: { th: 'วัฒนธรรม/ประวัติศาสตร์', en: 'Culture & History', ms: 'Budaya & Sejarah', id: 'Budaya & Sejarah', ar: 'ثقافة وتاريخ' } },
  { slug: 'nature', placeType: 'attraction', sortOrder: 4, name: { th: 'ธรรมชาติ', en: 'Nature', ms: 'Alam Semula Jadi', id: 'Alam', ar: 'طبيعة' } },
  { slug: 'shopping', placeType: 'attraction', sortOrder: 5, name: { th: 'ช้อปปิ้ง', en: 'Shopping', ms: 'Beli-belah', id: 'Belanja', ar: 'تسوق' } },
];
