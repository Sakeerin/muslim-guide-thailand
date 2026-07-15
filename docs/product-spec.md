ผมอ่านงานวิจัยครบทั้ง 6 รายการและ gapAnalysis แล้ว (ไฟล์ wuoqrjlqm.output ทั้ง 471 บรรทัด) และยืนยันว่า repo ที่ D:\Claude\muslim-guide-thai ว่างเปล่า ต่อไปนี้คือ product specification ฉบับสมบูรณ์

---

# Product Specification: แพลตฟอร์มไกด์ฮาลาลสำหรับนักท่องเที่ยวมุสลิมในประเทศไทย

**ชื่อชั่วคราว:** "HalalThai Guide" (ต้องตรวจสอบเครื่องหมายการค้าก่อนใช้จริง — ระวังคำว่า "ฮาลาล" คู่กับตราสัญลักษณ์ที่คล้ายตรา กอท. ตาม ป.อาญา ม.272-273)

**Positioning หนึ่งประโยค:** "Halal Navi ของประเทศไทย" — directory เชิงลึกเฉพาะไทยที่ทุก listing บอกได้ว่า *ใครยืนยันว่าฮาลาล ด้วยหลักฐานอะไร เมื่อไหร่* พร้อมเวลาละหมาด/กิบลัตตามมาตรฐานสำนักจุฬาราชมนตรี ใน 5 ภาษา

**หลักการออกแบบ 5 ข้อ (ยึดตลอดทุกฟีเจอร์):**
1. **Trust-first:** ไม่ติด badge ฮาลาลเอง — แสดง "แหล่งที่มาของการยืนยัน + หลักฐาน + วันที่ตรวจสอบล่าสุด" เสมอ
2. **Web/SEO-first:** ทุกข้อมูลต้องอยู่บนเว็บ SSR ครบเท่ากับใน PWA (บทเรียนจาก Makan ที่เว็บพัง)
3. **ใช้ได้โดยไม่ต้อง login:** ฟีเจอร์หลักทั้งหมดไม่บังคับสมัครสมาชิก (PDPA — ศาสนาเป็นข้อมูลอ่อนไหว, data minimization)
4. **Offline-tolerant:** เวลาละหมาด/กิบลัต/รายการที่บันทึกไว้ ต้องใช้ได้ตอนไม่มีเน็ต
5. **Legal-by-design:** ระบบรีวิว/รายงาน/takedown ออกแบบรับกฎหมายไทย (หมิ่นประมาทอาญา, MDES 24 ชม.) ตั้งแต่ MVP

---

## 1. User Personas และ User Journey

### Persona 1: "อามีนะห์" — ครอบครัวมาเลเซีย (ตลาดใหญ่สุด ~4.5 ล้านคน/ปี)
- อายุ 35, มาจาก Johor/KL, มาไทยปีละ 1-2 ครั้ง (หาดใหญ่ กรุงเทพ เบตง), เดินทางกับครอบครัว 4-6 คน, บางทริปขับรถเข้าทางด่านสะเดา
- ภาษา: มาเลย์ (รูมี) + อังกฤษ, ค้น Google ว่า "makanan halal bangkok", "tempat solat platinum mall"
- ความเคร่ง: ต้องการร้านที่มั่นใจได้จริง คุ้นกับมาตรฐาน JAKIM จึง**เข้าใจและให้ค่ากับใบรับรอง กอท. (CICOT)** มากกว่านักท่องเที่ยวชาติอื่น
- Pain: ไม่รู้ว่าร้านไหน "ฮาลาลจริง" นอกย่านที่คุ้น, หาห้องละหมาดในห้าง/ปั๊มยาก, งบปานกลาง อยากรู้ราคาก่อน
- อุปกรณ์: Android เป็นหลัก, ใช้ Google Maps + TikTok + คำบอกเล่าในกลุ่ม Facebook/WhatsApp

### Persona 2: "ดีน่า" — นักท่องเที่ยวอินโดนีเซียรุ่นใหม่ (ตลาดโตเร็ว)
- อายุ 26, มากับเพื่อน 3-4 คน หลังวันหยุดอีด/ปลายปี, สาย content — เจอที่เที่ยวจาก TikTok/Instagram แล้วค่อยหาข้อมูลต่อ
- ภาษา: อินโดนีเซีย + อังกฤษพอใช้, งบประหยัด สนใจ street food, ตลาด, คาเฟ่ถ่ายรูปสวย
- ความเคร่ง: หลีกหมูและแอลกอฮอล์แน่นอน แต่ยอมรับระดับ "Muslim-owned / no pork" ได้ถ้าข้อมูลชัด
- Pain: ไม่รู้ว่าร้านดังใน TikTok ฮาลาลไหม, ต้องการแผนเที่ยวสำเร็จรูปราคาประหยัด, เน็ตจำกัด (eSIM ราคาถูก) → offline สำคัญ

### Persona 3: "คอลิด" — ครอบครัว GCC ใช้จ่ายสูง (~100,000-110,000 บาท/ทริป, พัก ~14 วัน)
- อายุ 42 จากริยาด/ดูไบ มาช่วง มิ.ย.-ส.ค. กับครอบครัวใหญ่, พักกรุงเทพ+พัทยา/ภูเก็ต
- ภาษา: **อาหรับ (RTL) เป็นหลัก** อังกฤษรอง, ค้นด้วยคำอาหรับ เช่น "مطعم حلال بانكوك"
- ต้องการ: ร้านอาหารระดับกลาง-หรูที่ฮาลาล, ความเป็นส่วนตัวของครอบครัว (family room), กิจกรรมสำหรับเด็ก, โรงแรมที่มีอาหารเช้าฮาลาล, ไม่อ่อนไหวเรื่องราคาแต่อ่อนไหวเรื่องความน่าเชื่อถือและภาษา
- Pain: เว็บ/แอปแทบไม่มีภาษาอาหรับ, ชื่อร้านไทยอ่านไม่ออก, ต้องการเบอร์โทร/ปุ่มนำทางกดได้ทันที

### Persona 4: "ฟาริด" — มุสลิมไทยเที่ยวในประเทศ (ฐานผู้ใช้ประจำ + ผู้สร้างข้อมูล)
- อายุ 30 จากกรุงเทพ/สามจังหวัด, ขับรถเที่ยวเชียงใหม่/เขาใหญ่/หัวหิน, ใช้ภาษาไทย
- ความเคร่ง: หลากหลาย — บางคนเอาเฉพาะตรา กอท. บางคนรับ "มุสลิมทำ"
- คุณค่าต่อแพลตฟอร์ม: เป็นกลุ่มที่**ใช้เวลาละหมาด/ปฏิทินอิสลามทุกวัน** (retention) และเป็นผู้รายงานข้อมูลผิด/แนะนำร้านที่ดีที่สุด → เป็นเครื่องยนต์ความสดของข้อมูล
- Pain: แอปเวลาละหมาด global คลาดจากประกาศสำนักจุฬาราชมนตรี, ไม่มี directory ร้านต่างจังหวัดที่เชื่อได้

### User Journey (ก่อน–ระหว่าง–หลังทริป)

**ก่อนทริป (1-8 สัปดาห์ก่อนเดินทาง) — ช่องทางหลัก: Google/SEO**
1. ค้น "halal food phuket" / "makanan halal bangkok" / "مطاعم حلال بوكيت" → เจอหน้า programmatic SEO ของเรา (หน้ารวมเมือง+หมวดในภาษาของเขา)
2. อ่านหน้ารวมเมือง → เข้า listing detail → เห็น trust badge + หลักฐาน → เริ่มเชื่อถือ
3. กด "บันทึก" ร้าน/มัสยิดเข้ารายการของฉัน (เก็บใน local storage ไม่ต้องสมัคร) → เห็น prompt "ติดตั้งแอปไว้ใช้ตอนไม่มีเน็ต" → ติดตั้ง PWA
4. ดูไกด์เมือง/แผนเที่ยว (Phase 2) ประกอบการวางแผน
- **เมตริกช่วงนี้:** organic sessions, PWA install rate, จำนวน saved places ต่อ session

**ระหว่างทริป — ช่องทางหลัก: PWA บนมือถือ**
1. เปิดแอป → หน้าแรกแสดง: เวลาละหมาดถัดไปของจังหวัดที่อยู่, ปุ่ม "ใกล้ฉัน", รายการที่บันทึกไว้
2. เที่ยง: กด "ร้านฮาลาลใกล้ฉัน + เปิดตอนนี้" → แผนที่/รายการ → กดนำทาง (deep link ไป Google Maps/Grab)
3. บ่าย: อยู่ในห้าง → ค้น "ห้องละหมาด" → เจอ listing บอกชั้น/โซน/แยกชาย-หญิง/มีที่อาบน้ำละหมาด
4. เย็น: เน็ตหลุดบนเกาะ → เวลาละหมาด+กิบลัต+รายการที่บันทึกยังใช้ได้ (offline)
5. เจอข้อมูลผิด (ร้านปิด/ย้าย) → กด "รายงานข้อมูล" 30 วินาทีเสร็จ
- **เมตริกช่วงนี้:** DAU ช่วง peak season, near-me searches, การใช้เวลาละหมาด, report submissions

**หลังทริป**
1. MVP: แชร์ลิงก์ร้านให้เพื่อน/กลุ่ม WhatsApp (ปุ่มแชร์ + OG image สวย), ตอบแบบสำรวจสั้น
2. Phase 2: เขียนรีวิว + อัปโหลดรูป (ผ่าน pre-moderation), รายการที่บันทึกกลายเป็น "ทริปของฉัน" ที่แชร์ได้
3. กลับมาใช้ซ้ำทริปหน้า (มาเลเซียมาไทยถี่ — repeat usage สูง)

---

## 2. Feature List: MVP / Phase 2 / Phase 3

### MVP (~3-4 เดือน, ทีมเล็ก) — "Directory ที่เชื่อถือได้ + เครื่องมือละหมาด + 5 ภาษา"

ขอบเขตข้อมูล: **7 เมือง** (กรุงเทพ ภูเก็ต เชียงใหม่ พัทยา กระบี่ หาดใหญ่ อยุธยา), listing เป้าหมาย ~700-1,000 รายการ (admin คีย์เอง), listing type ที่เปิดใช้: **restaurant, mosque, prayer room, attraction (แบบย่อ)**

| # | ฟีเจอร์ | รายละเอียด | เหตุผล |
|---|---|---|---|
| M1 | ค้นหา + แผนที่ + filter | ค้นข้อความ (ชื่อ/หมวด/ย่าน), แผนที่ MapLibre+OpenFreeMap พร้อม marker clustering, "ใกล้ฉัน" (PostGIS), filter: เมือง, หมวด/ประเภทอาหาร, ระดับความเชื่อมั่นฮาลาล, เปิดตอนนี้, มีห้องละหมาด, ไม่เสิร์ฟแอลกอฮอล์ | Must-have ที่ทุกคู่แข่งสำเร็จมี และเป็นจุดที่ Makan/bangkokhalal ไม่มีบนเว็บ — แซงได้ทันที |
| M2 | Halal trust badge หลายระดับ + หลักฐาน | 4 ระดับ (ดูข้อ 4) แสดงแหล่งยืนยัน + เลขที่/วันหมดอายุใบรับรอง + วันที่ตรวจสอบล่าสุด ทุก listing | ฟีเจอร์เรือธง — pain point อันดับ 1 จากงานวิจัย และคู่แข่งทุกเจ้าอ่อน |
| M3 | Directory มัสยิด + ห้องละหมาด | listing type แยก พร้อม field เฉพาะ (ชั้น/โซน, แยกชาย-หญิง, วุฎูอ์), แสดง "มัสยิด/ห้องละหมาดใกล้เคียง" ในหน้า listing ร้านอาหารทุกหน้า | Need-to-have ตามงานวิจัย; Zabihah พิสูจน์ว่า prayer space ในสถานที่อื่นคือ unique value |
| M4 | เวลาละหมาด + กิบลัต + ปฏิทินฮิจเราะห์ | ตารางทางการสำนักจุฬาราชมนตรี (ingest 77 จังหวัด) เป็นค่า default + adhan-js คำนวณ offline สำรอง (Shafi'i, ปรับ method ได้), เข็มทิศกิบลัตจาก DeviceOrientation, วันสำคัญ/รอมฎอน/อีดตามประกาศดูดวงจันทร์ทางการ | Differentiator ที่แอป global ทำไม่ได้ — ความแม่นตามประกาศไทยคือจุดขายและความรับผิดชอบ |
| M5 | 5 ภาษา + RTL | th/en/ms/id/ar ด้วย next-intl, RTL เต็มรูปแบบสำหรับอาหรับ, language switcher, ชื่อสถานที่หลายภาษา (name_i18n) | ช่องว่างที่ใหญ่ที่สุดของคู่แข่งไทยทุกราย (Makan ไทยล้วน, bangkokhalal ไม่มี switcher) |
| M6 | Programmatic SEO pages | หน้า เมือง×หมวด, เมือง×ย่าน, เมือง×ประเภทอาหาร ต่อ 5 ภาษา + JSON-LD (Restaurant/Mosque/FAQPage) + sitemap.xml + hreflang | กลยุทธ์ acquisition หลัก — นักท่องเที่ยวค้น Google ก่อนเสมอ |
| M7 | PWA + offline บางส่วน | installable, cache: app shell, เมืองที่ดูล่าสุด, saved places, ตารางละหมาดเดือนปัจจุบัน, กิบลัต | นักท่องเที่ยวเน็ตจำกัด; คู่แข่งเกือบทุกเจ้าอ่อนเรื่องนี้ |
| M8 | บันทึกรายการ (ไม่ต้อง login) | saved places ใน localStorage/IndexedDB, แชร์ลิงก์ + OG image | ให้คุณค่า journey ก่อน-ระหว่างทริปโดยไม่แตะ PDPA (ไม่มี account = ไม่เก็บข้อมูลศาสนา) |
| M9 | รายงานข้อมูล (user report) | ปุ่ม "รายงาน" ทุก listing: ร้านปิด/ข้อมูลผิด/ตำแหน่งผิด/ข้อสงสัยเรื่องฮาลาล/รูปไม่เหมาะสม → เข้า admin queue แบบ**ไม่แสดงสาธารณะ** | กลไกความสดของข้อมูล + เลี่ยงความเสี่ยงหมิ่นประมาท (ไม่มีการประจานสาธารณะ) |
| M10 | Admin หลังบ้าน | CRUD listings หลายภาษา, verification workflow, จัดการใบรับรอง+วันหมดอายุ, moderation/report queue, takedown 24 ชม., audit log, analytics พื้นฐาน (ดูข้อ 5) | ข้อมูลคือผลิตภัณฑ์ — หลังบ้านต้องพร้อมก่อนเปิดตัว และ takedown เป็นข้อบังคับกฎหมาย |
| M11 | หน้า trust & compliance | "วิธีตรวจสอบข้อมูลของเรา", About/ทีมงาน, Privacy Policy หลายภาษา (PDPA), Terms, ช่องทางติดต่อ/ร้องเรียน | ความโปร่งใส = trust (จุดที่ bangkokhalal ขาด) + ข้อบังคับ PDPA/MDES |

**แผนงานคร่าว 4 เดือน:** ด.1 = foundation (monorepo, schema, i18n, design system, admin CRUD) / ด.2 = directory+ค้นหา+แผนที่+หน้า SEO / ด.3 = เวลาละหมาด+กิบลัต+PWA offline+RTL / ด.4 = verification workflow, report/takedown, polish, seed ข้อมูล (ทีม content คีย์ขนานตั้งแต่ ด.2)

### Phase 2 (เดือน 5-9) — "เปิดรับข้อมูลจากภายนอก + ชุมชนแบบควบคุม"
| ฟีเจอร์ | เหตุผลที่ไม่อยู่ MVP |
|---|---|
| Import pipeline จาก open data (OSM/Overpass มัสยิด + TAT API + GD Catalog + THIC/CICOT) พร้อมหน้าจอ dedupe/match/approve ใน admin | ต้องมี schema และ verification workflow นิ่งก่อน ไม่งั้นได้ข้อมูลขยะจำนวนมาก; ODbL attribution ต้องออกแบบ |
| ระบบสมาชิก (optional) + sync saved places ข้ามอุปกรณ์ | ต้องทำ PDPA consent flow อย่างประณีต (ศาสนา = sensitive data) — ไม่ควรรีบ |
| รีวิว + เรตติ้ง + รูปจากผู้ใช้ แบบ **pre-moderation ทั้งหมด** + community guidelines | หมิ่นประมาทเป็นคดีอาญาในไทย — ต้องมีทีม moderation จริงก่อนเปิด ไม่ใช่ฟีเจอร์ที่เปิดแล้วปล่อย |
| Owner portal: ลงทะเบียน/claim listing, แก้ข้อมูล-เมนู-เวลาเปิด (ผ่าน approval), ขอ verified | ตรงกับ data source เฟส 3 ที่ยืนยันไว้; ต้องมี traffic ก่อนร้านจึงอยากมา claim |
| Hotel (Muslim-friendly) + Shop เป็น listing type เต็มรูปแบบ + affiliate link จองโรงแรม (ไม่ต้องมี TAT license) | โฟกัส MVP ที่ need-to-have (กิน+ละหมาด) ก่อน good-to-have |
| โหมดรอมฎอน: เวลาอิมซัก/อิฟตอร, ร้านเปิดช่วงซะฮูร/อิฟตอร, ประกาศดูดวงจันทร์ | ฟีเจอร์ตามฤดูกาล — ปล่อยให้ทันรอมฎอนถัดไปหลัง MVP |
| Content hub: ไกด์รายย่าน/แผนเที่ยว 3 วัน ผูกกับ listing + ตารางเปรียบเทียบ + FAQ | สูตร content-to-directory ของ bangkokhalal/Traveloka — ทำหลังมี listing base |
| ค้นหาตามสถานี BTS/MRT/สนามบิน | เลียนแบบ Halal Navi — ต้องเก็บ field transit ครบก่อน |

### Phase 3 (เดือน 10+) — "Ecosystem และรายได้"
| ฟีเจอร์ | เหตุผล |
|---|---|
| แอป native (React Native — แชร์ i18n ผ่าน i18next ถ้าวางแผนไว้) + push notification อะซาน | PWA พิสูจน์ demand ก่อน; push อะซานคือเหตุผลหลักที่ต้องไป native |
| Halal confidence score อัตโนมัติ (แบบ HalalRank) จากหลักฐานหลายแหล่ง | ต้องมีข้อมูล+รีวิวสะสมมากพอจึงคำนวณได้อย่างมีความหมาย |
| B2B/รายได้: featured listing (ติดป้าย "โฆษณา" ชัดเจน), แพ็กเกจ owner แบบ Chonkeang, sponsored guide, partnership TAT/ศูนย์วิทย์ฮาลาลจุฬาฯ/กอท. | โมเดล HappyCow: ฟรีสร้างฐานก่อน แล้วเก็บ B2B — อย่าเก็บเงินผู้ใช้ปลายทาง |
| Trip planner เต็มรูปแบบ (itinerary builder), community Q&A | Engagement ระยะยาว หลังมี user base |
| ขยายครบ 77 จังหวัด + เมืองรอง (เบตง ปัตตานี สตูล เขาใหญ่ หัวหิน) | ขยายตามข้อมูล analytics ว่าผู้ใช้ค้นเมืองไหนแล้วไม่เจอ |
| Public API / ข้อมูลให้พาร์ทเนอร์ | Moat ระยะยาวเมื่อข้อมูล verify แล้วมีมูลค่า |

### Trade-off ที่**ตัดออกจาก MVP โดยเจตนา** และเหตุผล
1. **รีวิวสาธารณะ** — ตัดออก: ความเสี่ยงหมิ่นประมาทอาญา (คดี Wesley Barnes) + ยังไม่มีทีม moderation; MVP ใช้ "รายงานเข้า admin queue" แทน ซึ่งได้ผลลัพธ์เดียวกัน (ข้อมูลสด) โดยไม่มีความเสี่ยง
2. **ระบบสมาชิก/login** — ตัดออก: PDPA ทำให้ account ของแอปมุสลิมมีต้นทุน compliance สูง (explicit consent, consent log, DPO) และ MVP ไม่มีฟีเจอร์ไหนจำเป็นต้องมี account; saved places ใช้ local storage พอ
3. **สั่งอาหาร/delivery/จองโต๊ะ** (แบบ Makan) — ตัดถาวรระยะยาว: เป็นสนามของ Grab/LINE MAN, เพิ่ม ops มหาศาล, ไม่ใช่แกนกลยุทธ์ directory
4. **Hotel เต็มรูปแบบ** — เลื่อนไป Phase 2: โรงแรมไม่มีระบบรับรองฮาลาลทางการ (รับรองเฉพาะครัว) ทำให้ trust model ซับซ้อน + affiliate ต้องเจรจา
5. **Import อัตโนมัติจาก OSM/TAT** — เลื่อนไป Phase 2: คีย์เอง 700-1,000 รายการคุมคุณภาพได้ดีกว่าและเร็วพอสำหรับ 7 เมือง; import โดยไม่มีหน้าจอ dedupe จะทำลายความน่าเชื่อถือ
6. **Google Places enrichment** — ตัด: ต้นทุน $2-40/1,000 requests และห้าม cache ตาม ToS; ใช้ข้อมูลตัวเอง + ลิงก์ออกไป Google Maps สำหรับนำทางแทน
7. **Push notification อะซาน** — เลื่อน: PWA push บน iOS ยังไม่น่าเชื่อถือพอสำหรับเวลาละหมาดที่พลาดไม่ได้ — แสดง countdown ในแอปแทน
8. **Gamification / community feed / Q&A** — เลื่อน: engagement layer มาหลังจากมี utility layer ที่แข็งแรง

---

## 3. Information Architecture

### 3.1 Sitemap เว็บ public (ทุก path มี prefix `/{locale}` = th|en|ms|id|ar พร้อม hreflang ครบ)

```
/                                        หน้าแรก: ค้นหา, เมืองยอดนิยม, เวลาละหมาดจังหวัดปัจจุบัน, listing เด่น
/search?q=&city=&category=&filters=      ผลค้นหา (list + map toggle) — noindex
/nearby                                  ใกล้ฉัน (ขอ geolocation)
│
├─ /cities                               รวมทุกเมือง
├─ /{city}                               ★ City hub: ไฮไลต์, หมวดยอดนิยม, ย่านฮาลาล, เวลาละหมาด, FAQ
│   ├─ /{city}/halal-restaurants         ★ programmatic: เมือง×หมวด (มี filter + map + FAQ + เปรียบเทียบ)
│   │   └─ /{city}/halal-restaurants/{cuisine}   ★ เมือง×ประเภทอาหาร เช่น /bangkok/halal-restaurants/thai
│   ├─ /{city}/mosques                   ★ มัสยิดในเมือง
│   ├─ /{city}/prayer-rooms              ★ ห้องละหมาด (ห้าง/สนามบิน/ปั๊ม)
│   ├─ /{city}/attractions               ★ ที่เที่ยว muslim-friendly
│   └─ /{city}/{district}                ★ เมือง×ย่าน เช่น /bangkok/sukhumvit, /bangkok/ramkhamhaeng
│       └─ /{city}/{district}/halal-restaurants  ★ ย่าน×หมวด (ชั้นลึกสุดของ programmatic SEO)
│
├─ /place/{slug}                         ★ Listing detail (slug คงที่ข้ามภาษา + canonical)
│
├─ /prayer-times                         เลือกจังหวัด
│   └─ /prayer-times/{province}          ★ programmatic 77 จังหวัด: ตารางวันนี้/เดือนนี้ ตามประกาศจุฬาราชมนตรี
├─ /qibla                                เข็มทิศกิบลัต (ทำงาน offline)
├─ /islamic-calendar                     ปฏิทินฮิจเราะห์ + วันสำคัญ + ประกาศดูดวงจันทร์
│
├─ /guides, /guides/{slug}               (Phase 2) content hub
├─ /saved                                รายการที่บันทึก (local)
│
├─ /about                                เกี่ยวกับเรา/ทีมงาน
├─ /how-we-verify                        ★★ อธิบายระดับ trust + วิธีตรวจสอบ + disclaimer — หน้าหัวใจของแบรนด์
├─ /report/{listingId} และ /takedown     ฟอร์มรายงาน / ช่องทางร้องเรียนเนื้อหา (MDES)
├─ /for-business                         (Phase 2) landing สำหรับเจ้าของร้าน
├─ /privacy, /terms, /contact
└─ /offline                              fallback page ของ PWA
```
★ = หน้า programmatic SEO ที่ generate จาก DB — ปริมาณโดยประมาณ MVP: 7 เมือง × 4 หมวด × 5 ภาษา + ~40 ย่าน × 5 ภาษา + 77 จังหวัด × 5 ภาษา + listing ~1,000 × 5 ภาษา ≈ **7,000+ indexable pages** ตั้งแต่วันแรก
กติกา SEO: หน้า listing ภาษาที่ยังไม่มีคำแปล human-reviewed ให้ fallback อังกฤษ + ระบุ `x-default`; หน้า facet ที่ listing < 3 รายการ ให้ noindex กัน thin content

### 3.2 โครงหน้า Admin (`admin.` subdomain หรือ `/admin` — ปิดจาก search engine)

```
/admin
├─ Dashboard                    KPI: coverage, freshness, คิวค้าง, ใบรับรองใกล้หมดอายุ, top zero-result searches
├─ Listings                     ตาราง + filter (type/เมือง/สถานะ/trust level/ความสดข้อมูล)
│   ├─ /new, /{id}/edit         ฟอร์มแยก tab ต่อภาษา + แผนที่ปักหมุด + upload รูป
│   ├─ /{id}/verification       จัดการหลักฐาน trust level + ประวัติการตรวจ
│   └─ /{id}/history            audit log ราย listing
├─ Verification Queue           คิวรอตรวจ: listing ใหม่, ขอเปลี่ยน trust level, หลักฐานใหม่
├─ Certificates                 ทะเบียนใบรับรอง กอท.: เลขที่/วันหมดอายุ/รูป + dashboard หมดอายุใน 30/60/90 วัน
├─ Reports                      คิวรายงานจากผู้ใช้ (แยกประเภท, SLA, assignment)
│   └─ Takedown (legal queue)   คิวเร่งด่วน 24 ชม. + นาฬิกา SLA + log ครบทุก action
├─ Moderation (Phase 2)         รีวิว/รูป/การแก้ไขจาก owner — pre-moderation
├─ Content                      หน้า guide/บทความ/FAQ ต่อเมือง (Phase 2)
├─ Translations                 คิวคำแปลค้าง: field ไหนภาษาไหนยังว่าง + draft จาก MT ให้คนตรวจ
├─ Prayer Data                  อัปโหลด/ตรวจตารางจุฬาราชมนตรีรายปี + ประกาศดูดวงจันทร์ + hijri offset
├─ Import (Phase 2)             OSM/TAT/GD Catalog: preview → dedupe/match → approve
├─ Users & Roles                admin / editor / moderator / translator / viewer
├─ Analytics                    ดูข้อ 5.5
└─ Audit Log                    ทุก mutation ทั้งระบบ (ใคร ทำอะไร เมื่อไหร่ ค่าเก่า/ใหม่)
```

---

## 4. Data Model เชิง Product

### 4.1 Halal Trust Levels (แกนของทั้งระบบ)

| ระดับ | ชื่อ badge (ตัวอย่าง) | เงื่อนไข/หลักฐานที่บังคับ | การแสดงผล |
|---|---|---|---|
| L1 | **รับรองฮาลาล (กอท./CICOT)** | เลขที่ใบรับรอง + วันออก/หมดอายุ + รูปถ่ายใบรับรองหรือป้ายที่ร้าน + (ถ้ามี) ลิงก์ตรวจสอบฐานข้อมูล กอท. — admin ตรวจก่อน publish เท่านั้น | badge เขียวเข้ม + เลขที่ + วันหมดอายุ; **หมดอายุแล้วระบบลดสถานะอัตโนมัติ**เป็น "ใบรับรองหมดอายุ – รอตรวจสอบการต่ออายุ" |
| L2 | **เจ้าของเป็นมุสลิม (Muslim-owned)** | คำยืนยันจากเจ้าของ/การตรวจภาคสนาม/แหล่งข้อมูลชุมชนที่ระบุได้ + admin approve | badge เขียวอ่อน + ระบุแหล่งยืนยัน เช่น "ยืนยันโดยทีมงาน ภาคสนาม มี.ค. 2026" |
| L3 | **Muslim-friendly (มีเมนูรองรับ / ไม่มีหมู)** | ข้อมูลจากร้านหรือทีมงาน ระบุเงื่อนไขชัด (เช่น ครัวแยก/ทะเล-มังสวิรัติ) | badge เหลือง + disclaimer "ไม่ได้รับรองโดยหน่วยงานทางการ โปรดสอบถามร้านเพิ่มเติม" |
| L4 | **ข้อมูลจากชุมชน – ยังไม่ยืนยัน** | มีผู้แนะนำ/พบจากแหล่งเปิด ยังไม่ผ่านการตรวจ | badge เทา "ยังไม่ได้ตรวจสอบ" — ค่า default ของข้อมูล import ทุกชิ้น |

กติกาเหล็ก (จาก gap analysis กฎหมาย): (1) **ห้ามแสดงตราสัญลักษณ์ฮาลาลของ กอท. เป็นกราฟิกของเราเอง** — ใช้ข้อความ+badge ที่เราออกแบบ และแสดง "รูปถ่ายใบรับรองจริง" เป็นหลักฐานแทน จนกว่าจะมีข้อตกลงกับ กอท. (2) ทุก badge ต้องมี tooltip/ลิงก์ไป /how-we-verify (3) ทุก listing แสดง `last_verified_at` + ปุ่มรายงาน

**Attribute chips แยกอิสระจากระดับ** (แสดงเป็น icon ใน UI, ใช้เป็น filter ได้): ไม่เสิร์ฟแอลกอฮอล์ / ไม่มีหมูในเมนู / แยกครัว-ภาชนะ / มีห้องละหมาดในร้าน / มีที่อาบน้ำละหมาด / family room / ห้องน้ำมีสายฉีด (ค่าที่เป็นไปได้: ใช่ | ไม่ | ไม่ทราบ — ไม่บังคับตอบแต่ต้องไม่เดา)

### 4.2 Core fields (ทุก listing type)

| Field | บังคับ? | หมายเหตุ |
|---|---|---|
| type | บังคับ | restaurant / mosque / prayer_room / attraction / hotel / shop |
| slug | บังคับ | คงที่ข้ามภาษา, generate จากชื่ออังกฤษ |
| name_i18n | **th+en บังคับ**, ms/id/ar optional | JSONB; MT ได้แต่ต้องติดธง "รอตรวจ"; ชื่ออาหรับควรทับศัพท์โดยคน |
| description_i18n | en บังคับ (≥ 300 ตัวอักษรเพื่อ SEO), อื่น optional | |
| photos | บังคับ ≥ 1 (หน้าร้าน/อาคาร) | เก็บ attribution/ลิขสิทธิ์ต่อรูป |
| geo (lat/lng) | บังคับ | geography(Point,4326) — ปักหมุดบนแผนที่ใน admin |
| province / city / district | บังคับ (district บังคับเฉพาะกรุงเทพ/เมืองใหญ่) | เป็นแกนของหน้า programmatic |
| address_i18n | th+en บังคับ | |
| opening_hours | optional แต่ "แนะนำอย่างยิ่ง" | structured รายวัน; ใช้คำนวณ "เปิดตอนนี้"; ไม่มี = ไม่ขึ้น filter เปิดตอนนี้ |
| phone / LINE / social / website | optional | |
| transit_access | optional | สถานี BTS/MRT/ARL + นาทีเดิน (ใช้จริง Phase 2 search) |
| status | บังคับ | draft → pending_review → published → archived |
| last_verified_at + verification_source | บังคับก่อน publish | แสดงบนหน้าเว็บเสมอ |
| source_attribution | บังคับถ้ามาจาก import | รองรับ ODbL ของ OSM |

### 4.3 Field เฉพาะราย type

**Restaurant (MVP)** — บังคับ: cuisine_categories (multi-select ชุด ~20-29 หมวดแบบ Makan), **halal_trust_level + หลักฐานตามระดับ**, alcohol_served (yes/no/unknown) | optional: price_range (฿/฿฿/฿฿฿/฿฿฿฿), pork_free, separate_kitchen, amenity chips (ห้องละหมาด, วุฎูอ์, ที่จอดรถ, WiFi, family room, รับบัตร), signature_dishes_i18n, รูปเมนู, late_night/early_morning flag (มื้อรอบละหมาด), delivery links

**Mosque (MVP)** — บังคับ: ชื่อทางการ (th), geo, province, verification_status | optional: ทะเบียนมัสยิด (อ้าง GD Catalog), เวลาละหมาดญุมอะฮ์, พื้นที่สตรี (มี/ไม่มี/ไม่ทราบ), วุฎูอ์, ที่จอดรถ, ความจุ, ประวัติ/สถาปัตยกรรม (สำหรับมัสยิดท่องเที่ยว เช่น ช้างคลาน), เปิดให้ผู้เยี่ยมชมนอกเวลาละหมาดไหม + dress code — *ไม่มี halal level (ไม่เกี่ยว)*

**Prayer room (MVP)** — บังคับ: ชื่อสถานที่แม่ (ห้าง/สนามบิน/ปั๊ม/โรงพยาบาล), venue_type, geo, **location_detail_i18n (ชั้น/โซน/ใกล้อะไร — สำคัญที่สุดของ type นี้)**, gender_separation (แยก/รวม/ไม่ทราบ) | optional: วุฎูอ์ (มี/ไม่มี/ห้องน้ำใกล้เคียง), เวลาเปิด (ตามห้าง), วิธีเข้า (เช่น ขอกุญแจที่ประชาสัมพันธ์), อุปกรณ์ (ผ้าปู/มุศฮัฟ), รูปถ่ายจริง

**Attraction (MVP แบบย่อ)** — บังคับ: ชื่อ, geo, หมวด (ชายหาด/ตลาด/พิพิธภัณฑ์/ธรรมชาติ/ห้าง/วัฒนธรรม), description | optional: ค่าเข้า, เวลาเปิด, dress code/ข้อควรระวังสำหรับมุสลิม, ร้านฮาลาล-ที่ละหมาดใกล้เคียง (คำนวณอัตโนมัติจาก geo — ไม่ต้องคีย์ted), เหมาะกับครอบครัว

**Hotel (Phase 2)** — บังคับ: ชื่อ, geo, ระดับดาว/ประเภท | Muslim-friendly attributes: อาหารเช้าฮาลาล (รับรองครัว กอท. / muslim-friendly / ไม่มี), ผ้าปูละหมาด+ลูกศรกิบลัตในห้อง (ขอได้/มีทุกห้อง/ไม่มี), ไม่มีแอลกอฮอล์ในมินิบาร์, สระส่วนตัว/แยกเพศ, ใกล้มัสยิด (คำนวณ), ร้านฮาลาลใน/ใกล้โรงแรม, affiliate_booking_url — *hotel ใช้คำ "Muslim-friendly" เท่านั้น ไม่ใช้ "โรงแรมฮาลาล" เพราะไม่มีระบบรับรองทางการ*

**Shop (Phase 2/3)** — บังคับ: ชื่อ, geo, ประเภท (ซูเปอร์ฮาลาล/เสื้อผ้ามุสลิม/ของฝาก/ร้านหนังสือ) | optional: สินค้าเด่น, halal_trust_level เฉพาะร้านขายอาหาร

### 4.4 Entity อื่นที่ต้องมี
- **Certificate**: listing_id, เลขที่, ผู้ออก (กอท./กอจ.), issue/expiry date, รูปหลักฐาน, สถานะ (active/expired/pending_renewal/revoked), ประวัติ
- **Report**: listing_id, ประเภท, ข้อความ, รูปแนบ, ช่องทางติดต่อกลับ (optional), สถานะ, ผู้รับผิดชอบ, resolution, timestamps ครบ (เพื่อ SLA/หลักฐานทางกฎหมาย)
- **PrayerTimeTable**: จังหวัด × วัน × 5 เวลา + อิมซัก, source=ประกาศจุฬาราชมนตรี ปี xxxx, เวอร์ชันเอกสาร
- **District/City/Province**: มี slug + คำอธิบาย i18n + hero image (เป็น content ของหน้า programmatic)

---

## 5. ฟีเจอร์ Admin หลังบ้าน (รายละเอียด)

### 5.1 Moderation / Verification Queue
- คิวเดียวรวมทุก inbound: listing ใหม่ (จาก editor), คำขอเปลี่ยน trust level, (Phase 2: การแก้ไขจาก owner, รีวิว, รูป, ข้อมูลจาก import)
- สถานะ: `new → in_review → approved | rejected | needs_info` + assign รายคน + หมายเหตุภายใน
- กติกา publish: listing จะ published ได้ต่อเมื่อ core fields บังคับครบ + ผ่านการ review อย่างน้อย 1 คนที่ไม่ใช่ผู้คีย์ (4-eyes principle สำหรับ L1/L2)
- ทุกการตัดสินใจลง audit log

### 5.2 Certificate Expiry Management
- Dashboard "ใบรับรองใกล้หมดอายุ": bucket 30/60/90 วัน + ตัวกรองรายเมือง
- Auto-task: หมดอายุใน 30 วัน → สร้างงาน "ติดต่อร้าน/ตรวจซ้ำ" ให้ทีม content
- Auto-downgrade: วันหมดอายุถึง → badge เปลี่ยนเป็น "ใบรับรองหมดอายุ – รอตรวจสอบ" อัตโนมัติ (ไม่ปลด listing แต่ลดระดับ) + log
- รอบ re-verify ทั้งระบบ: listing published ทุกชิ้นมี `next_review_due` (default 6 เดือน) — dashboard แสดง "ข้อมูลค้างตรวจ"

### 5.3 User Report Handling
- แยกคิวตามประเภท; ประเภท **"ข้อสงสัยเรื่องสถานะฮาลาล" เป็นคิวลับ** (ไม่แสดงผลสาธารณะใดๆ ระหว่างสอบ) → ขั้นตอน: รับเรื่อง → ตรวจหลักฐาน/โทรสอบ/ภาคสนาม → ผลลัพธ์ = คงเดิม | ลดระดับ | unpublish → บันทึกเหตุผล
- ประเภท "ร้านปิดกิจการ/ข้อมูลผิด": fast-track ให้ editor แก้ได้เลย + ตอบกลับผู้รายงานถ้าให้ช่องทางไว้
- SLA ภายใน: acknowledge 48 ชม., resolve 14 วัน (แสดง aging ในคิว)

### 5.4 Notice-and-Takedown ภายใน 24 ชม. (ข้อบังคับ MDES)
- ช่องทางรับเรื่องเฉพาะ (/takedown + อีเมล legal) → เข้า **legal queue แยกจาก report ปกติ** พร้อม**นาฬิกานับถอยหลัง 24 ชม.**ต่อเคส
- ปุ่ม "Hide immediately": ซ่อนเนื้อหา/รูป/รีวิวชิ้นนั้นจาก public ทันทีแบบ reversible (หยุดความเสี่ยงก่อน แล้วค่อยพิจารณา) — ทำได้ภายในไม่กี่นาที
- ทุก action มี log: ใครกด อะไร เมื่อไหร่ + เก็บสำเนาคำร้อง + template ตอบกลับ → export เป็นรายงาน compliance ได้
- Escalation: เคสเกี่ยวกับข้อกล่าวหาหมิ่นประมาท/ตราฮาลาลปลอม → ธงแดงแจ้งเจ้าของโปรเจกต์/ที่ปรึกษากฎหมายทันที
- มีใน MVP ตั้งแต่วันแรก (แม้ MVP ไม่มีรีวิว — รูป/คำอธิบาย/ข้อมูลร้านก็ถูกร้องเรียนได้)

### 5.5 Analytics Dashboard
- **Data coverage**: จำนวน listing ต่อเมือง×หมวด×ระดับ trust, % ที่ verified, % ข้อมูลสด (< 6 เดือน), จำนวนภาษาที่แปลครบ
- **Demand signals**: top search terms, **zero-result searches ต่อเมือง/ภาษา** (ตัวชี้ว่าควรเก็บข้อมูลอะไรเพิ่ม — สำคัญที่สุด), การใช้ filter
- **Traffic**: sessions ตาม locale/ประเทศ, landing page SEO ที่ทำงาน, PWA installs, การใช้เวลาละหมาด/กิบลัต
- **Ops**: อายุเฉลี่ยของคิว, จำนวน report เข้า/ปิด, takedown SLA compliance 100%?
- **North-star metric แนะนำ:** "จำนวน sessions ที่จบด้วย action (นำทาง/โทร/บันทึก)" — วัดว่าเราพาคนถึงร้านจริง

---

## 6. UX ที่สำคัญ

### 6.1 หน้า Listing Detail (เรียงตามลำดับความสำคัญบนมือถือ)
1. แกลเลอรีรูป (รูปแรก = หน้าร้าน ไม่ใช่รูปอาหาร — ให้จำหน้าร้านได้ตอนเดินหา)
2. ชื่อ (ภาษาผู้ใช้ + ชื่อไทยกำกับเสมอ **เพื่อโชว์คนขับแท็กซี่/Grab ได้**) + หมวด + chip "เปิดอยู่ • ปิด 21:00"
3. **Trust box** (หัวใจของหน้า): badge ระดับ + แหล่งยืนยัน + เลขที่/วันหมดอายุใบรับรอง (L1) + "ตรวจสอบล่าสุด มี.ค. 2026" + ลิงก์ "เราตรวจสอบอย่างไร" + ปุ่มรายงาน
4. แถบ action ติดนิ้ว: **นำทาง** (deep link Google Maps/Grab) | **โทร** | **บันทึก** | **แชร์**
5. ข้อมูลจำเป็น: เวลาเปิดรายวัน (กางได้), ช่วงราคา, ที่อยู่ (ไทย+ภาษาผู้ใช้) + การเดินทาง (BTS/ระยะเดิน)
6. รายละเอียดฮาลาล: แอลกอฮอล์/หมู/ครัวแยก + amenity chips (ห้องละหมาดในร้าน, วุฎูอ์, family room, ที่จอดรถ)
7. เมนูเด่น + รูปเมนู (ถ้ามี)
8. แผนที่ย่อ + **"ละหมาดใกล้ที่นี่"**: มัสยิด/ห้องละหมาด 3 แห่งใกล้สุด + ระยะ (ปรากฏทุก listing ทุก type — signature ของแพลตฟอร์ม)
9. ที่ใกล้เคียง: ร้าน/ที่เที่ยวฮาลาลอื่นในย่าน (internal linking → SEO)
10. Footer ข้อมูล: last verified, แหล่งข้อมูล/attribution, ปุ่มรายงาน (ซ้ำ), (Phase 2: "เป็นเจ้าของร้านนี้? claim ที่นี่")
+ JSON-LD (Restaurant/Mosque + FAQ) ทุกหน้า

### 6.2 Empty States (ออกแบบเป็นระบบ เพราะช่วงแรกข้อมูลยังบาง)
- **ค้นหา/filter ไม่เจอ:** ไม่แสดงหน้าว่างเปล่า — เสนอ (1) ผลลัพธ์เมื่อคลาย filter ("พบ 12 ร้านถ้าไม่กรอง 'เปิดตอนนี้'") (2) รายการใกล้เคียงในรัศมีกว้างขึ้น/เมืองข้างเคียง (3) CTA "แนะนำร้านให้เรา" (ฟอร์มสั้น เข้า admin queue)
- **เมือง/ย่านที่ข้อมูลน้อย:** แสดงสิ่งที่มีเสมอ (มัสยิดจาก seed + เวลาละหมาดจังหวัดใช้ได้เสมอ) + ข้อความตรงไปตรงมา "เรากำลังเก็บข้อมูลเมืองนี้ — มี X รายการที่ตรวจสอบแล้ว" — ความซื่อสัตย์คือ trust
- **zero-result ทุกครั้งถูก log เข้า analytics** เป็นสัญญาณเก็บข้อมูลเพิ่ม
- **ยังไม่บันทึกอะไรใน /saved:** อธิบายประโยชน์ (ใช้ offline ได้) + ลิงก์ไปเมืองยอดนิยม
- **ไม่ให้สิทธิ์ location:** fallback เป็นเลือกเมืองด้วยมือ ไม่ block การใช้งาน (PDPA-friendly)

### 6.3 Offline Behavior ของ PWA
- **ใช้ได้เสมอแม้ offline:** เวลาละหมาด (ตารางจุฬาราชมนตรีของจังหวัดที่ใช้ล่าสุด cache ล่วงหน้าทั้งเดือน + adhan-js คำนวณ fallback ทุกพิกัด), เข็มทิศกิบลัต (sensor ล้วน), รายการที่บันทึก (ข้อมูลเต็ม + รูป thumbnail), หน้าเมือง/listing ที่เปิดดูล่าสุด (~50 รายการล่าสุด)
- **Degrade อย่างสุภาพ:** แผนที่ไม่มี tile → สลับเป็น list view อัตโนมัติ พร้อมระยะทาง+ทิศ (bearing) จากตำแหน่งผู้ใช้ ("1.2 กม. ทางทิศตะวันออกเฉียงเหนือ") ซึ่งคำนวณ offline ได้; รูปที่ไม่ cache → placeholder
- **สื่อสารสถานะ:** banner "ออฟไลน์อยู่ — ข้อมูลอัปเดตล่าสุด 14 ก.ค. 20:31" ไม่หลอกว่าเป็นข้อมูลสด
- **คิวส่งทีหลัง:** รายงานข้อมูล/ฟอร์มที่กรอกตอน offline เก็บใน IndexedDB + Background Sync ส่งเมื่อเน็ตกลับ
- **ขนาด cache มีวินัย:** จำกัด ~30-50 MB, ผู้ใช้เลือก "ดาวน์โหลดเมืองนี้ไว้ใช้ออฟไลน์" ได้เป็นรายเมือง (ปุ่มบนหน้า city hub)

---

## สรุปสิ่งที่ต้องตัดสินใจต่อ (นอกขอบเขต spec นี้)
1. ชื่อแบรนด์ + ตรวจเครื่องหมายการค้า และการออกแบบ badge ที่ไม่ละเมิดตรา กอท.
2. เจรจา/ขอความร่วมมือ กอท., ศูนย์วิทยาศาสตร์ฮาลาล จุฬาฯ, TAT (จังหวะนโยบาย Halal Hub 4 ปี)
3. User interview นักท่องเที่ยว 3 กลุ่ม (MS/ID/GCC) ก่อน freeze UI จริง
4. งบ/SOP ทีมเก็บข้อมูลภาคสนาม 7 เมือง (คอขวดจริงของ MVP ไม่ใช่โค้ด)

---

### Critical Files for Implementation
(repo ยังว่าง — เป็น path ที่เสนอให้สร้างเป็นลำดับแรก)
- D:\Claude\muslim-guide-thai\docs\product-spec.md — บันทึก spec ฉบับนี้เป็น source of truth ของทีม
- D:\Claude\muslim-guide-thai\packages\db\prisma\schema.prisma — data model ทั้งหมด (listing types, trust levels, certificates, reports, prayer tables, audit log)
- D:\Claude\muslim-guide-thai\apps\web\src\i18n\routing.ts — โครง next-intl 5 ภาษา + RTL + locale routing ที่ทุกหน้า public พึ่งพา
- D:\Claude\muslim-guide-thai\apps\web\src\app\[locale]\[city]\[category]\page.tsx — แม่แบบหน้า programmatic SEO (เมือง×หมวด) ซึ่งเป็นแกน acquisition
- D:\Claude\muslim-guide-thai\apps\web\src\app\admin\moderation\page.tsx — moderation/verification/takedown queue หัวใจของความน่าเชื่อถือข้อมูลและ compliance