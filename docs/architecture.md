# สถาปัตยกรรมเทคนิคฉบับสมบูรณ์ — แพลตฟอร์มไกด์ฮาลาลสำหรับนักท่องเที่ยวมุสลิมในประเทศไทย

ออกแบบบนฐานงานวิจัยทั้ง 6 รายการ + gap analysis (PDPA ศาสนา=ข้อมูลอ่อนไหว, หมิ่นประมาทอาญา, MDES 24-hr takedown, ป.อาญา ม.272-273, มาตรฐานสำนักจุฬาราชมนตรี, ODbL, ต้นทุนแผนที่) และแกนกลยุทธ์ "Halal Navi ของประเทศไทย + SEO-first + trust level พร้อมหลักฐาน"

## สรุปการตัดสินใจทั้งหมด (Decision Summary)

| ชั้น | เลือก | เหตุผลสั้น |
|---|---|---|
| Repo | Next.js app เดียว (App Router) + service layer แยกชัด | ทีมเล็ก deploy เดียว, ยังแตกเป็น monorepo ได้ทีหลัง |
| ORM | Drizzle ORM + drizzle-kit | PostGIS/GiST/trigram ต้องเขียน SQL จริง — Prisma ทำไม่ได้ดี |
| Auth | Better Auth (Drizzle adapter) | 3 role + bearer token plugin รองรับ native app ภายหลัง |
| ไฟล์/รูป | Cloudflare R2 (public + private bucket) + sharp ตอน upload | egress ฟรี, ใบรับรองเก็บ private ตาม PDPA |
| Search | Meilisearch (self-host) + pg_trgm ใน PG | ตัดคำไทย/อาหรับได้ (charabia), มี _geo ในตัว |
| State | RSC + TanStack Query + Zustand + nuqs | client state น้อยที่สุด |
| UI | Tailwind CSS v4 (logical properties) + shadcn/ui (Radix DirectionProvider) | RTL ได้จริงด้วย `dir` + `ms-/me-/ps-/pe-` |
| Validation | Zod (schema แชร์ form + API) | มาตรฐานเดียวทั้งระบบ |
| API | Service layer → RSC เรียกตรง + REST `/api/v1` (Zod validate) + Server Actions เฉพาะฟอร์ม admin/merchant | native app ใช้ REST เดิมได้ทันที |
| DB | PostgreSQL 16 + PostGIS + pg_trgm | ตามงานวิจัย: geography + GiST + ST_DWithin |
| แผนที่ | MapLibre GL JS + OpenFreeMap | ต้นทุน 0 ช่วง MVP |
| เวลาละหมาด | adhan-js (client/offline) + ตารางสำนักจุฬาราชมนตรี 77 จังหวัด (server, ingest รายปี) | official-first, คำนวณเป็น fallback |
| PWA | Serwist + IndexedDB "city pack" | offline: เมืองหลัก + เวลาละหมาด + กิบลัต |
| i18n | next-intl, path prefix `/{locale}/`, JSONB ต่อ field ใน DB | 5 ภาษา th/en/ms/id/ar (RTL) |
| Hosting | VPS (Vultr Bangkok หรือ Hetzner SGP) + Docker + Dokploy + Cloudflare ฟรี + Managed PG (DigitalOcean SGP) | ~$50-85/เดือน, latency ไทย/อาเซียนดี, ข้อมูลอยู่ในภูมิภาค (ง่ายต่อ PDPA) |

---

## 1. โครงสร้าง Repo

### เปรียบเทียบ

| ประเด็น | (ก) Next.js app เดียว | (ข) Turborepo monorepo |
|---|---|---|
| ความเร็วเริ่มต้น | สูงมาก — config ชุดเดียว (TS, ESLint, Tailwind, i18n) | ช้ากว่า — ต้องดูแล pipeline, package versioning, tsconfig หลายชุด |
| Deploy | 1 artifact, 1 domain (ดีต่อ SEO + cookie auth ชุดเดียว) | 2-3 artifacts, ต้องแชร์ auth ข้าม app |
| แชร์โค้ด (schema, zod, i18n) | import ตรงจาก `src/` | ต้องทำ `packages/*` + build ordering |
| ทีมเล็ก (2-4 dev) | เหมาะ | overhead ไม่คุ้มจนกว่าทีม >6 หรือ release cadence ต่างกันจริง |
| ทางขยาย native app | ได้เท่ากัน — native กิน REST `/api/v1` ไม่ได้กินโค้ด web | ได้ (แชร์ `packages/validators` กับ RN) แต่ค่อยย้ายตอนนั้นก็ทัน |

**เลือก (ก) Next.js app เดียว** — เงื่อนไขสำคัญคือวินัย 2 ข้อที่ทำให้ไม่ปิดทางขยาย: (1) business logic ทั้งหมดอยู่ใน `src/server/services/*` ที่ไม่ import อะไรจาก Next.js เลย (รับ input ผ่าน plain args, คืน plain objects) — วันที่ต้องแตกเป็น monorepo หรือย้าย API ไป service แยก แค่ยกโฟลเดอร์นี้ออก (2) ทุกอย่างที่ native app จะใช้ ต้องผ่าน `/api/v1` เท่านั้น ห้ามมี logic ฝังใน Server Actions ที่ REST เรียกไม่ได้ (Server Actions เป็นแค่ wrapper บาง ๆ เรียก service เดียวกัน)

### Directory tree

```
muslim-guide-thai/
├─ .github/workflows/
│  ├─ ci.yml                     # lint + typecheck + unit + integration
│  └─ deploy.yml                 # build image → GHCR → Dokploy webhook
├─ docker/
│  ├─ Dockerfile                 # next build standalone, multi-stage
│  └─ docker-compose.dev.yml     # postgis:16 + meilisearch + mailpit
├─ drizzle/                      # SQL migrations (gen โดย drizzle-kit, แก้มือได้)
│  ├─ 0000_init.sql
│  └─ 0001_prayer_times.sql
├─ messages/                     # UI strings (ICU)
│  ├─ th.json  en.json  ms.json  id.json  ar.json
├─ public/
│  ├─ icons/                     # PWA icons ทุกขนาด + maskable
│  └─ fonts/                     # Noto Sans Thai, IBM Plex Sans Arabic (self-host)
├─ scripts/                      # รันด้วย tsx — read/import อย่างเดียว ไม่ deploy
│  ├─ import/
│  │  ├─ osm-mosques.ts          # Overpass → staging (เก็บ source_ref ตาม ODbL)
│  │  ├─ tat-places.ts           # TAT Data API / Tourism Directory
│  │  └─ gdcatalog-mosques.ts    # CSV มัสยิดกรมการศาสนา
│  └─ prayer-times/
│     └─ import-official.ts      # CSV ตารางสำนักจุฬาฯ → prayer_times_official
├─ src/
│  ├─ app/
│  │  ├─ [locale]/                       # public, 5 ภาษา
│  │  │  ├─ layout.tsx                   # <html lang dir> + NextIntlClientProvider
│  │  │  ├─ page.tsx                     # home
│  │  │  ├─ search/page.tsx
│  │  │  ├─ map/page.tsx                 # MapLibre full-screen (client)
│  │  │  ├─ prayer-times/[city]/page.tsx
│  │  │  ├─ qibla/page.tsx
│  │  │  ├─ [city]/page.tsx              # หน้าเมือง (programmatic SEO)
│  │  │  ├─ [city]/[category]/page.tsx   # เช่น /en/phuket/halal-restaurants
│  │  │  ├─ place/[slug]/page.tsx        # หน้า listing + JSON-LD
│  │  │  ├─ guides/[slug]/page.tsx       # บทความ/itinerary
│  │  │  ├─ saved/page.tsx               # wishlist (local-first)
│  │  │  └─ (auth)/login, register, account/
│  │  ├─ admin/                          # ไม่ localize (th/en พอ) — กัน crawl ด้วย robots+auth
│  │  │  ├─ layout.tsx                   # guard role admin/moderator
│  │  │  ├─ places/  moderation/  certifications/
│  │  │  ├─ takedowns/                   # SLA dashboard 24 ชม. (MDES)
│  │  │  ├─ reviews/  translations/  imports/  users/  audit/
│  │  ├─ merchant/                       # portal เจ้าของร้าน (claim, แก้ข้อมูล → เข้าคิว)
│  │  ├─ api/
│  │  │  ├─ auth/[...all]/route.ts       # Better Auth handler
│  │  │  └─ v1/                          # สัญญาเดียวกับ native app ในอนาคต
│  │  │     ├─ places/route.ts           # GET list (filter/geo), POST (merchant)
│  │  │     ├─ places/[id]/route.ts
│  │  │     ├─ search/route.ts           # proxy → Meilisearch
│  │  │     ├─ prayer-times/route.ts     # official-first + fallback calculated
│  │  │     ├─ reviews/route.ts
│  │  │     ├─ submissions/route.ts      # แจ้งข้อมูลผิด/ร้านปิด (ไม่ใช่รีวิว)
│  │  │     ├─ offline/cities/[slug]/route.ts   # city pack JSON
│  │  │     └─ uploads/sign/route.ts     # presigned R2
│  │  ├─ sw.ts                           # Serwist service worker
│  │  ├─ manifest.ts  sitemap.ts  robots.ts
│  ├─ server/                            # ห้าม import next/* ในโฟลเดอร์นี้
│  │  ├─ db/
│  │  │  ├─ client.ts
│  │  │  └─ schema/                      # drizzle schema แยกโดเมน
│  │  │     ├─ places.ts  certifications.ts  reviews.ts
│  │  │     ├─ moderation.ts             # submissions, takedowns, audit
│  │  │     ├─ prayer.ts  taxonomy.ts  auth.ts  consent.ts
│  │  ├─ services/                       # business logic ล้วน (unit-testable)
│  │  │  ├─ places.ts  search-sync.ts  reviews.ts  moderation.ts
│  │  │  ├─ certifications.ts  takedowns.ts  prayer-times.ts
│  │  │  ├─ media.ts  audit.ts  offline-pack.ts
│  │  ├─ auth.ts                         # Better Auth config + role helpers
│  │  ├─ search/meili.ts
│  │  └─ storage/r2.ts
│  ├─ lib/
│  │  ├─ validators/                     # Zod — แชร์ client/server/native ในอนาคต
│  │  │  ├─ place.ts  review.ts  submission.ts  prayer.ts
│  │  ├─ prayer/                         # ใช้ได้ทั้ง client (offline) และ server
│  │  │  ├─ adhan.ts                     # wrapper adhan-js: method ไทย default
│  │  │  ├─ qibla.ts  hijri.ts
│  │  ├─ opening-hours.ts                # "เปิดอยู่ตอนนี้" (Asia/Bangkok)
│  │  └─ i18n-content.ts                 # resolve JSONB: locale → en → th
│  ├─ i18n/
│  │  ├─ routing.ts                      # locales, localePrefix 'always'
│  │  └─ request.ts
│  ├─ components/
│  │  ├─ ui/          # shadcn/ui
│  │  ├─ map/  place/  prayer/  reviews/  admin/
│  │  └─ halal-badge.tsx                 # แสดง "แหล่งที่มาการยืนยัน" เสมอ
│  ├─ stores/                            # zustand: map-ui, offline, prefs
│  ├─ hooks/                             # use-prayer-times, use-geolocation, use-qibla-compass
│  └─ middleware.ts                      # next-intl + auth guard /admin /merchant
├─ e2e/                                  # Playwright
├─ tests/                                # Vitest unit + integration (testcontainers)
├─ drizzle.config.ts  next.config.ts  .env.example  package.json (pnpm)
```

---

## 2. เครื่องมือแต่ละชั้น พร้อมเหตุผล

### ORM: Drizzle (ชนะ Prisma)
- แกนของระบบคือ query ที่ Prisma ไม่รองรับ native: `geography(Point,4326)`, `ST_DWithin`, KNN `<->`, `GIN gin_trgm_ops`, partial index — Prisma ต้องประกาศ `Unsupported("geography")` แล้วเขียน `$queryRaw` เกือบทุกจุด เท่ากับเสียประโยชน์ ORM ตรงหัวใจของแอป
- Drizzle: migration เป็นไฟล์ SQL ตรง ๆ (เติม `CREATE INDEX ... USING GIST` ได้เอง), `customType` สำหรับ geography, `sql` operator แทรกได้ทุก query, ไม่มี engine binary — image เล็ก start เร็ว
- ข้อแลก: DX มือใหม่ชันกว่า Prisma เล็กน้อย — ยอมรับได้เพราะทีมต้องเข้าใจ SQL/PostGIS อยู่ดี

### Auth: Better Auth
- ครบ 3 role ในระบบเดียว: `user` (นักท่องเที่ยว), `merchant` (เจ้าของร้าน), `admin`/`moderator` — ใช้ admin plugin จัดการ role + ban, ส่วนสิทธิ์ระดับ listing ใช้ `places.owner_user_id` + ตาราง `place_claims`
- Social login: Google + Apple (นักท่องเที่ยว), LINE ผ่าน generic OAuth (ร้านค้าไทย), email/password สำรอง
- Bearer token plugin → native app ใช้ auth ตัวเดิมผ่าน `/api/v1` ได้เลย ไม่ต้องรื้อ
- จุด PDPA: ใช้ฟีเจอร์หลัก (ค้นหา, เวลาละหมาด, กิบลัต, ดู listing) ได้โดย **ไม่ต้อง login**; ไม่มี field ศาสนาในโปรไฟล์เด็ดขาด (การสมัครใช้แอปไม่บังคับระบุศาสนา = เลี่ยงการเก็บ sensitive data โดยไม่จำเป็น); consent ขอแยกเป็นราย purpose และ log ลง `consent_logs`

### รูปภาพ / ไฟล์ใบรับรอง
- **Cloudflare R2** 2 buckets: `public-media` (รูปร้าน/รีวิว — ผ่าน Cloudflare CDN custom domain) และ `private-docs` (รูป/PDF ใบรับรองฮาลาล, หลักฐาน claim — เข้าถึงด้วย presigned GET เฉพาะ admin/เจ้าของ)
- Upload: client ขอ presigned URL (`/api/v1/uploads/sign`) → PUT ตรงเข้า R2 → server job ใช้ **sharp** สร้าง 4 ขนาด (thumb 160 / card 480 / hero 1200 / original) เป็น WebP + เก็บ blurhash — ตัดปัญหา image optimization cost ของ Vercel/Next ทั้งก้อน
- เหตุผล R2: egress ฟรี (รูปคือ traffic หลักของ directory), S3-compatible (ย้ายได้), อยู่หลัง Cloudflare อยู่แล้ว

### Search: Meilisearch (ชนะ PG FTS)
- ตัวตัดสิน: **ภาษาไทยไม่มีเว้นวรรค** — `tsvector` ของ PostgreSQL ตัดคำไทยไม่ได้ (ต้องพึ่ง extension ภายนอกที่ไม่มีบน managed PG) และ Arabic ต้อง normalize อีก ในขณะที่ Meilisearch ใช้ charabia ตัดคำ th/ar/ja ได้ในตัว + typo tolerance + `_geo` filter/sort ใช้ทำ "ค้นหา + ใกล้ฉัน" ในคำขอเดียว
- เหตุผลไม่เลือก Typesense: ความสามารถใกล้กัน แต่ Meili ตัวเดียว (single binary, RAM ~ไม่กี่ร้อย MB ที่สเกลหมื่น listing) รันบน VPS เดียวกับแอปได้ฟรี และ ecosystem JS แน่นกว่า
- แบ่งหน้าที่: **Meilisearch = ค้นหาสาธารณะ** (index `places`: name ทุก locale, category, city, halal_status, amenities, `_geo`, rating — filterable ครบ) / **PostGIS = คำตอบเชิงภูมิศาสตร์ที่ต้อง authoritative** (nearby ในหน้า place, city pack) / **pg_trgm = dedupe ตอน import OSM/TAT + quick search ใน admin**
- Sync: service `search-sync.ts` upsert เข้า Meili หลัง write สำเร็จ + cron reindex เต็มทุกคืน (กัน drift — ไม่ต้องทำ queue infra ช่วง MVP)

### State management
- อ่านข้อมูล: Server Components เรียก service ตรง (ไม่มี HTTP hop) — หน้า SEO ทั้งหมดเป็น RSC + ISR
- Client: **TanStack Query** เฉพาะจุด dynamic (แผนที่ pan → โหลด markers, infinite scroll, ผล search) / **Zustand** สำหรับ UI state ข้ามหน้า (สถานะ offline pack, ตั้งค่า prayer method, map viewport) / **nuqs** ผูก filter กับ URL (แชร์ลิงก์ผลกรองได้ = ดีต่อ SEO/UX)

### UI: Tailwind CSS v4 + shadcn/ui
- RTL คือเงื่อนไขบังคับ: Tailwind ใช้ logical properties (`ms-*`, `pe-*`, `start-*`) เป็นค่า default ของโค้ดทั้งโปรเจกต์ (ตั้ง lint rule ห้าม `ml-/pl-`), Radix มี `DirectionProvider dir="rtl"` ครอบทั้งแอปตาม locale
- shadcn/ui = โค้ดอยู่ใน repo แก้ได้เอง ไม่ติด lib version, ฟอนต์ self-host: Noto Sans Thai + Inter + IBM Plex Sans Arabic

### Validation: Zod
- Schema เดียวต่อ resource ใน `src/lib/validators/` ใช้ 3 ที่: react-hook-form (client), Server Actions, REST `/api/v1` — อนาคต native app import ชุดเดียวกันผ่าน package แตกออก

### API pattern: Hybrid (ตัดสินแล้ว)
- **ไม่ใช้ tRPC**: ผู้บริโภค API ในอนาคตคือ native app + partner ภายนอก (TAT/โรงแรม) + ต้องการ HTTP caching/CDN บน GET สาธารณะ — REST ตอบโจทย์กว่า และ tRPC เพิ่ม coupling ที่ทีมเล็กไม่จำเป็น
- **REST `/api/v1`** (Next Route Handlers + Zod parse ทุก input, error envelope มาตรฐานเดียว) สำหรับทุกอย่างที่ client-side/native/PWA ต้องเรียก
- **Server Actions** เฉพาะฟอร์มใน admin/merchant (mutation ภายใน ไม่ใช่สัญญาสาธารณะ) — ทุก action เป็น wrapper 3 บรรทัดเรียก service เดียวกับ REST

---

## 3. Database Schema (PostgreSQL 16 + PostGIS)

หมายเหตุ: ตาราง auth (`user`, `session`, `account`, `verification`) generate โดย Better Auth (id เป็น `text`) — ด้านล่างคือตารางโดเมนหลัก เขียนเป็น SQL (= เนื้อ migration `drizzle/0000_init.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE place_type      AS ENUM ('restaurant','mosque','prayer_room','hotel','attraction','shop','other');
-- ระดับความเชื่อมั่นฮาลาล: แสดงคู่กับ "แหล่งที่มาการยืนยัน" เสมอ ห้ามแพลตฟอร์มติดเอง
CREATE TYPE halal_status    AS ENUM ('cicot_certified','muslim_owned','muslim_friendly','halal_menu_available','unverified');
CREATE TYPE halal_source    AS ENUM ('cicot_certificate','owner_declaration','community_verified','imported','none');
CREATE TYPE content_status  AS ENUM ('draft','pending_review','published','archived','removed');
CREATE TYPE cert_status     AS ENUM ('pending','verified','rejected','expired');
CREATE TYPE review_status   AS ENUM ('pending','published','hidden','removed');
CREATE TYPE submission_status AS ENUM ('pending','approved','rejected');
CREATE TYPE takedown_status AS ENUM ('received','in_review','content_removed','rejected','escalated');

CREATE TABLE cities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,          -- 'bangkok','phuket','chiang-mai',...
  name          jsonb NOT NULL,                -- {"th":"กรุงเทพฯ","en":"Bangkok","ar":"بانكوك",...}
  province_code text NOT NULL,                 -- คีย์เชื่อมตารางเวลาละหมาดรายจังหวัด
  center        geography(Point,4326) NOT NULL,
  is_offline_ready boolean NOT NULL DEFAULT false,  -- เปิด city pack ให้ดาวน์โหลด
  sort_order    int NOT NULL DEFAULT 0
);

CREATE TABLE places (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          place_type NOT NULL,
  slug          text NOT NULL UNIQUE,          -- latin ภาษาเดียว ใช้ทุก locale
  name          jsonb NOT NULL,                -- i18n ต่อ field
  description   jsonb NOT NULL DEFAULT '{}',
  address       jsonb NOT NULL DEFAULT '{}',   -- {"th": "...", "en": "..."} + landmark/BTS
  city_id       uuid REFERENCES cities(id),
  district      text,
  geog          geography(Point,4326) NOT NULL,
  phone text, website text, line_id text, google_maps_url text,
  opening_hours jsonb,                         -- {"mon":[["07:00","21:00"]], ...}
  price_range   smallint,                      -- 1-4
  halal_status  halal_status NOT NULL DEFAULT 'unverified',
  halal_source  halal_source NOT NULL DEFAULT 'none',
  serves_alcohol boolean,                      -- filter แบบ Halal Navi
  attributes    jsonb NOT NULL DEFAULT '{}',   -- ต่อ type: mosque:{women_section,wudu} hotel:{qibla_in_room,halal_breakfast}
  avg_rating    numeric(3,2),
  review_count  int NOT NULL DEFAULT 0,
  status        content_status NOT NULL DEFAULT 'draft',
  data_source   text NOT NULL DEFAULT 'admin', -- 'admin'|'osm'|'tat'|'gdcatalog'|'owner'|'user'
  source_ref    text,                          -- osm id / tat id → attribution ตาม ODbL
  translation_meta jsonb NOT NULL DEFAULT '{}',-- {"en":{"mt":true,"reviewed":false},...}
  last_verified_at timestamptz,                -- แสดงบนหน้าเว็บ (trust signal)
  owner_user_id text REFERENCES "user"(id),    -- merchant ที่ claim สำเร็จ
  created_by    text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Index หัวใจของระบบ
CREATE INDEX places_geog_gist   ON places USING GIST (geog);
CREATE INDEX places_city_type   ON places (city_id, type) WHERE status = 'published';
CREATE INDEX places_halal       ON places (halal_status)  WHERE status = 'published';
CREATE INDEX places_name_th_trgm ON places USING GIN ((name->>'th') gin_trgm_ops);
CREATE INDEX places_name_en_trgm ON places USING GIN ((name->>'en') gin_trgm_ops);
CREATE INDEX places_attrs_gin   ON places USING GIN (attributes jsonb_path_ops);

CREATE TABLE categories (              -- ~29 หมวดอาหาร + หมวดของ type อื่น
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, name jsonb NOT NULL,
  place_type place_type NOT NULL, parent_id uuid REFERENCES categories(id),
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE place_categories (
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, category_id)
);

CREATE TABLE amenities (               -- prayer_room, wudu, bidet_spray, parking, wifi, ...
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, name jsonb NOT NULL, icon text,
  applies_to place_type[] NOT NULL
);
CREATE TABLE place_amenities (
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  amenity_id uuid REFERENCES amenities(id) ON DELETE CASCADE,
  value boolean NOT NULL DEFAULT true, detail jsonb,   -- เช่น ห้องละหมาด: {"floor":"3","gender_separated":true}
  PRIMARY KEY (place_id, amenity_id)
);

-- ใบรับรองฮาลาล: หลักฐานคือหัวใจ (ป.อาญา ม.272-273 — แสดงเฉพาะที่ verify แล้ว)
CREATE TABLE halal_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  certifying_body text NOT NULL DEFAULT 'CICOT',
  cert_number text,
  issued_at date, expires_at date,
  evidence_file_key text,              -- private R2 bucket เท่านั้น
  status cert_status NOT NULL DEFAULT 'pending',
  submitted_by text REFERENCES "user"(id),
  verified_by  text REFERENCES "user"(id),
  verified_at timestamptz, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cert_expiry_idx ON halal_certifications (expires_at) WHERE status = 'verified';
CREATE INDEX cert_place_idx  ON halal_certifications (place_id);

-- รีวิว: pre-moderation สำหรับข้อความเสี่ยงหมิ่นประมาทอาญา
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id  text NOT NULL REFERENCES "user"(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text, lang text,
  status review_status NOT NULL DEFAULT 'pending',
  risk_flag boolean NOT NULL DEFAULT false,  -- ตรวจ keyword กล่าวหา ("ไม่ฮาลาลจริง","หลอก") → บังคับ manual approve
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);
CREATE INDEX reviews_place_idx ON reviews (place_id, status, created_at DESC);
CREATE INDEX reviews_mod_queue ON reviews (created_at) WHERE status = 'pending';

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  review_id uuid REFERENCES reviews(id) ON DELETE SET NULL,
  r2_key text NOT NULL, kind text NOT NULL DEFAULT 'photo',  -- photo|menu|cert(private)
  width int, height int, blur_hash text, alt jsonb DEFAULT '{}',
  status content_status NOT NULL DEFAULT 'published',
  uploaded_by text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- คิวเดียวรวมทุกงานตรวจ: เพิ่มร้าน/แก้ไข/claim/แจ้งข้อมูลผิด (แยกจากรีวิวสาธารณะ — ลดความเสี่ยงประจาน)
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,                  -- 'new_place'|'place_edit'|'claim'|'data_report'
  place_id uuid REFERENCES places(id),
  payload jsonb NOT NULL,              -- diff/ข้อมูลเสนอ + หลักฐาน claim (file keys)
  submitted_by text REFERENCES "user"(id),
  status submission_status NOT NULL DEFAULT 'pending',
  reviewed_by text REFERENCES "user"(id), reviewed_at timestamptz, review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_queue ON submissions (status, created_at) WHERE status = 'pending';

-- MDES notice-and-takedown: SLA 24 ชม. เป็นข้อมูลใน DB ไม่ใช่ post-it
CREATE TABLE takedown_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,          -- 'review'|'media'|'place'
  content_id uuid NOT NULL,
  requester_name text, requester_contact text NOT NULL,
  reason text NOT NULL, legal_reference text,
  received_at timestamptz NOT NULL DEFAULT now(),
  sla_deadline_at timestamptz NOT NULL,        -- received_at + 24h (คำนวณตอน insert)
  status takedown_status NOT NULL DEFAULT 'received',
  action_taken text, actioned_at timestamptz,
  handled_by text REFERENCES "user"(id)
);
CREATE INDEX takedown_open ON takedown_requests (sla_deadline_at)
  WHERE status IN ('received','in_review');

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text, actor_role text,
  action text NOT NULL,                -- 'place.update','cert.verify','takedown.remove',...
  entity_type text NOT NULL, entity_id text NOT NULL,
  diff jsonb, ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity ON audit_logs (entity_type, entity_id, created_at DESC);

-- PDPA: consent granular + log
CREATE TABLE consent_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  consent_key text NOT NULL,           -- 'geolocation'|'marketing'|'review_publication'
  granted boolean NOT NULL, policy_version text NOT NULL,
  ip inet, created_at timestamptz NOT NULL DEFAULT now()
);

-- เวลาละหมาดทางการ 77 จังหวัด (~28k แถว/ปี — จิ๋วมาก)
CREATE TABLE prayer_times_official (
  province_code text NOT NULL,
  gdate date NOT NULL,
  imsak time, fajr time NOT NULL, sunrise time,
  dhuhr time NOT NULL, asr time NOT NULL, maghrib time NOT NULL, isha time NOT NULL,
  source_year int NOT NULL,
  source_note text,                    -- 'ประกาศสำนักจุฬาราชมนตรี พ.ศ. ...'
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (province_code, gdate)
);

-- วันสำคัญอิสลามตามประกาศดูดวงจันทร์ทางการ (override ค่าคำนวณ)
CREATE TABLE islamic_events (
  key text PRIMARY KEY,                -- 'ramadan_start_1448','eid_fitr_1448'
  gdate date NOT NULL, hijri_date text,
  source text NOT NULL DEFAULT 'สำนักจุฬาราชมนตรี',
  announced_at timestamptz
);
```

Query หลัก "ใกล้ฉัน": `WHERE status='published' AND ST_DWithin(geog, ST_MakePoint($lng,$lat)::geography, $radius) ORDER BY geog <-> ST_MakePoint($lng,$lat)::geography LIMIT 20` — ใช้ GiST ทั้ง filter และ KNN

---

## 4. PWA Strategy

- **Service worker: Serwist** (`@serwist/next` — ตัวสืบทอด next-pwa ที่ maintain อยู่) — precache app shell + offline fallback page; runtime caching: หน้า HTML `NetworkFirst`, `/api/v1/*` GET `StaleWhileRevalidate` (สั้น), ฟอนต์/ไอคอน `CacheFirst`, map tiles OpenFreeMap `CacheFirst` จำกัดจำนวน entry (best-effort ไม่สัญญา offline map เต็มรูปแบบใน MVP)
- **Offline city pack (ฟีเจอร์ตั้งใจ ไม่ใช่แค่ cache)**: ผู้ใช้กด "บันทึกเมืองนี้ไว้ใช้ออฟไลน์" → โหลด `/api/v1/offline/cities/{slug}` = JSON ก้อนเดียว (listing published แบบ compact: ชื่อ i18n, พิกัด, หมวด, halal_status+source, เวลาเปิด, เบอร์โทร + มัสยิด/ห้องละหมาดทั้งจังหวัด + ตารางเวลาละหมาดทางการล่วงหน้า 60 วัน) → เก็บ **IndexedDB (Dexie)** พร้อม version/timestamp; UI list/detail/prayer อ่านจาก IndexedDB เมื่อ offline
- **เวลาละหมาด + กิบลัต offline ได้ 100%**: adhan-js คำนวณในเครื่อง + ตารางทางการที่ cache ไว้ (ดูข้อ 6), กิบลัตใช้ `Qibla()` + DeviceOrientation — ศูนย์ network
- **Installability**: `manifest.ts` (maskable icons, shortcuts: "เวลาละหมาด", "ใกล้ฉัน", "กิบลัต"), custom install prompt หลังผู้ใช้ engage (ไม่เด้งทันที), คู่มือ Add to Home Screen สำหรับ iOS
- **Push notification: เฟส 3** (หลัง MVP) — Web Push VAPID สำหรับประกาศรอมฎอน/อีดตามประกาศทางการ + ใบรับรองร้านที่ save ไว้หมดอายุ; ไม่ทำ adhan alarm บนเว็บ (ข้อจำกัด background ของ browser — เก็บไว้เป็นจุดขายแอป native) — ระบุตรง ๆ ใน scope
- **Background Sync (เฟส 2)**: คิวรีวิว/submission ที่เขียนตอน offline

---

## 5. i18n (th / en / ms / id / ar)

- **next-intl v4 + App Router**: segment `[locale]`, `localePrefix: 'always'` → URL แบบ **path prefix** `/en/bangkok/halal-restaurants` (ไม่ใช้ subdomain: รวม domain authority ก้อนเดียว, deploy/cert เดียว, hreflang จัดการง่าย) + `hreflang` alternates ทุกหน้า + sitemap แยก locale; `defaultLocale: 'en'` (x-default สำหรับนักท่องเที่ยว) detect ครั้งแรกจาก Accept-Language แล้วจำใน cookie
- **Slug ภาษาเดียว** (latin transliteration) ทุก locale ใช้ slug เดียวกัน — ตัดปัญหา slug 5 ชุด/หน้า ช่วง MVP
- **RTL**: `<html lang={locale} dir={locale==='ar'?'rtl':'ltr'}>` + Radix `DirectionProvider` + Tailwind logical properties ทั้ง codebase (lint ห้าม `ml-/mr-/pl-/pr-`) + flip ไอคอนทิศทาง; ตัวเลข/เวลา render ด้วย `Intl` บังคับ `numberingSystem: 'latn'` เพื่อความสม่ำเสมอของเบอร์โทร/ราคา
- **UI strings**: `messages/{locale}.json` (ICU — รองรับ plural 6 รูปของอาหรับ), CI มี test เช็ค key ครบทุกภาษา
- **เนื้อหา DB (JSONB ต่อ field)**: ภาษาต้นทาง th หรือ en; `translation_meta` ต่อแถวเก็บสถานะ `{locale: {mt, reviewed}}`; admin มีแท็บภาษาใน form + ปุ่ม "แปลอัตโนมัติ" (batch job เรียก LLM/Google Translation API — DeepL ไม่ครบ th/ms) เติมภาษาที่ขาดเป็น draft `mt:true` ให้คนตรวจ; render ผ่าน helper เดียว `resolveI18n(field, locale)` fallback: locale → en → th (ห้าม fallback เงียบโดยไม่มีตัวช่วยกลาง)

---

## 6. สถาปัตยกรรมเวลาละหมาด / กิบลัต / ปฏิทินอิสลาม

หลักการ: **"ทางการมาก่อน คำนวณเป็น fallback และบอกแหล่งที่มาเสมอ"** (ผิดไม่ได้ — กระทบการถือศีลอดจริง)

1. **ชั้นทางการ (server)**: ingest ตารางสำนักจุฬาราชมนตรี 77 จังหวัด ปีละครั้ง — ประกาศเป็น PDF → `scripts/prayer-times/import-official.ts` แปลง (กึ่ง manual) → CSV → หน้า admin import ที่ validate ด้วย Zod + sanity check (วันครบทั้งปี, เทียบ diff กับค่าคำนวณ adhan — ต่างเกิน ~5 นาทีให้ warning ก่อน commit) → ตาราง `prayer_times_official`
2. **การ serve**: `GET /api/v1/prayer-times?province=BKK&from=&to=` → คืน official ถ้ามี (`source:"official"` + `source_note`) / ไม่มีคืนค่าคำนวณฝั่ง server ด้วย adhan-js ชุด parameter เดียวกับ client (`source:"calculated"`) — ข้อมูลเปลี่ยนปีละครั้ง จึงติด `Cache-Control: immutable` + ETag ให้ CDN ทำงานเต็มที่
3. **ชั้น client/offline**: hook `usePrayerTimes(coords, provinceCode)` ลำดับ: ตาราง official ใน IndexedDB (โหลดทั้งเดือน/ปีของจังหวัดที่ใช้บ่อย + มากับ city pack) → adhan-js คำนวณสด (default: Fajr 20° / Isha 18° ตามแนวอาเซียน, madhab Shafi ตามชุมชนมุสลิมไทย, ผู้ใช้ปรับ method ได้ในหน้า settings) — UI ติดป้ายแหล่งที่มาเสมอ: "ตามประกาศสำนักจุฬาราชมนตรี" vs "ค่าคำนวณ (โดยประมาณ)"
4. **กิบลัต**: `Qibla(coordinates)` จาก adhan-js + DeviceOrientation compass — offline ล้วน ไม่มี API call
5. **ปฏิทินฮิจเราะห์/รอมฎอน/อีด**: ค่าคำนวณ (Umm al-Qura เป็น baseline แสดงผล) + **override ด้วย `islamic_events`** ที่ admin กรอกคืนประกาศดูดวงจันทร์ทางการไทย — banner/หน้าเว็บสลับเป็นวันที่ทางการทันที (โหมดรอมฎอน: เวลาอิมซาก/อิฟตอร์ + ร้านเปิดช่วงซะฮูร เป็นฟีเจอร์เฟส 2 แต่ schema รองรับแล้ว)

---

## 7. Deployment + ค่าใช้จ่าย MVP

### เปรียบเทียบ
- **Vercel + Neon (SGP)**: DX ดีสุด แต่ (1) Meilisearch ต้องมี server อยู่ดี (2) ค่า image optimization/function ของ directory ที่รูปเยอะโตเร็ว (3) ควบคุม region ได้แค่ SGP — รวมจริง ~$70-120/เดือนและโตตาม traffic
- **AWS Bangkok (ap-southeast-7)**: latency ดีสุด + ข้อมูลอยู่ในไทย แต่ราคา/ops overhead เกินทีมเล็กช่วง MVP
- **VPS + Docker (เลือก)**: เมื่อยังไงก็ต้องรัน Meilisearch + cron + import scripts การมี box เดียวที่คุมเองคือเส้นทางที่ *ง่ายกว่า* ไม่ใช่ยากกว่า เมื่อใช้ PaaS-on-VPS อย่าง **Dokploy/Coolify** (git push → build → zero-downtime swap, จัดการ env/SSL ให้)

### สถาปัตยกรรม production
- **VPS 4 vCPU / 8GB** (Vultr Bangkok — latency ไทยต่ำสุด หรือ Hetzner Singapore — ถูกสุด): รัน Next.js (standalone container), Meilisearch, cron jobs (cert-expiry alert, takedown SLA alert, reindex, backup)
- **Managed PostgreSQL + PostGIS**: DigitalOcean Managed PG (SGP) เริ่ม $15 — จ่ายเพื่อ backup/failover ที่ทีมเล็กไม่ควรถือเอง (ทางประหยัด: PG ใน Docker + pgBackRest → R2 ประหยัดอีก $15 แลกกับ ops risk — ไม่แนะนำ)
- **Cloudflare (free)**: DNS + CDN + WAF + rate limiting หน้า `/api`; **R2** เก็บรูป/เอกสาร; ISR/ETag ทำให้หน้า SEO ส่วนใหญ่เสิร์ฟจาก edge cache
- ข้อมูลผู้ใช้อยู่ SGP/BKK ทั้งหมด → เรื่อง cross-border transfer ตาม PDPA อธิบายง่าย

### ประมาณการรายเดือน (MVP)

| รายการ | USD/เดือน |
|---|---|
| VPS 4vCPU/8GB (app + Meili + cron) | $24–45 |
| Managed PostgreSQL (DO SGP, 1-2GB) | $15–30 |
| Cloudflare CDN/WAF/DNS | $0 |
| R2 (รูป ~50-100GB + requests) | $1–5 |
| Email (Resend free tier) / Sentry free / Better Stack free | $0 |
| Domain + สำรอง | ~$3 |
| **รวม** | **~$45–85 (≈ 1,600–3,000 บาท)** |

จุดสเกลถัดไป (เมื่อ traffic โต): แยก Meili ออกเป็น box ที่สอง → อัป PG tier → ค่อยพิจารณา multi-node/managed search — ไม่มีการตัดสินใจไหนใน MVP ที่ล็อกตาย

---

## 8. Testing + CI/CD

**Testing pyramid (เน้นจุดที่พังแล้วเจ็บจริง)**
- **Unit (Vitest)**: (1) เวลาละหมาด — golden tests เทียบ adhan-js กับ fixture จากตารางทางการหลายจังหวัด/หลายฤดู (2) `opening-hours.ts` "เปิดอยู่ตอนนี้" รวม timezone Asia/Bangkok + ข้ามเที่ยงคืน (3) `resolveI18n` fallback chain (4) Zod validators (5) risk-keyword detector ของรีวิว (6) test เช็ค messages ครบ key ทั้ง 5 ภาษา
- **Integration (Vitest + Testcontainers `postgis/postgis:16`)**: geo query (ST_DWithin + KNN ordering ถูกต้อง), migration รันขึ้นจากศูนย์ได้, workflow service: submit → approve → publish → audit log ครบ, takedown → content hidden ภายใน transaction
- **E2E (Playwright)**: (1) ค้นหา → หน้า place → แผนที่ (2) smoke ทุก locale — หน้า place render + `dir="rtl"` เมื่อ ar (3) admin อนุมัติ submission (4) รีวิวที่มีคำกล่าวหาต้องไม่เผยแพร่อัตโนมัติ (5) PWA: save city pack → โหมด offline → list/detail/เวลาละหมาดยังใช้ได้
- **Synthetic monitoring บน production**: Playwright ชุดเล็กรันทุกวัน + uptime check หน้า place จริง — บทเรียนตรงจาก Makan ที่หน้า detail พังคา production โดยไม่มีใครรู้

**CI/CD (GitHub Actions)**
1. **PR**: pnpm install (cache) → lint + typecheck → unit → integration (service containers: postgis, meilisearch) → build — ทุกข้อเขียวถึง merge ได้
2. **main**: E2E เต็ม → build Docker image → push GHCR → trigger Dokploy webhook
3. **Deploy**: รัน `drizzle-kit migrate` เป็น pre-start step (migration เขียนแบบ backward-compatible: expand → migrate → contract) → health check → swap
4. **Post-deploy**: smoke E2E ยิงใส่ production + Sentry release tracking
5. **Cron ใน repo เดียวกัน**: แจ้งเตือนใบรับรองใกล้หมดอายุ (30/7 วัน), แจ้ง takedown ใกล้ครบ 24 ชม. (ที่ 12/20 ชม. → LINE Notify/อีเมล admin), reindex Meili รายคืน, backup verify รายสัปดาห์

---

## ลำดับการลงมือ (สรุป)

1. **Foundation**: repo + Docker dev + CI + Drizzle migration แรก + Better Auth + next-intl skeleton (5 ภาษา + RTL)
2. **Places core**: schema + services + admin CRUD + moderation queue + audit + takedown (compliance ต้องมาก่อน UGC)
3. **Public + SEO**: หน้าเมือง/หมวด/place + JSON-LD + sitemap/hreflang + Meilisearch + MapLibre
4. **ศาสนา + PWA**: prayer times (official ingest + adhan-js) + กิบลัต + Serwist + city pack offline
5. **เฟส 2**: merchant portal/claim, import OSM/TAT/GD Catalog, รีวิว UGC (เปิดหลัง moderation พร้อม), โหมดรอมฎอน — **เฟส 3**: push notification, native app กิน `/api/v1` เดิม

### Critical Files for Implementation
- D:\Claude\muslim-guide-thai\drizzle\0000_init.sql — schema + PostGIS/GiST/trigram index ทั้งหมด (รากของทุกอย่าง)
- D:\Claude\muslim-guide-thai\src\server\services\places.ts — business logic กลาง: CRUD, geo query, สถานะฮาลาล+แหล่งที่มา, sync Meilisearch
- D:\Claude\muslim-guide-thai\src\i18n\routing.ts — โครง locale/URL/RTL ที่ทุกหน้า public ขึ้นกับมัน
- D:\Claude\muslim-guide-thai\src\lib\prayer\adhan.ts — wrapper adhan-js + ลำดับ official→calculated ที่แชร์ client/server
- D:\Claude\muslim-guide-thai\src\app\[locale]\place\[slug]\page.tsx — หน้าเรือธง SEO: i18n JSONB, halal badge พร้อมหลักฐาน, JSON-LD, nearby (PostGIS)