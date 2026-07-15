# Architecture Decision Record — Muslim Guide Thailand

Source of truth for cross-cutting decisions. These were settled after
research → 3-perspective design → adversarial review. Change only with a
recorded reason.

## Confirmed with the project owner (do not change without asking)
- **Stack**: JS/TS, Next.js (App Router) single app + Node. PWA first, native app later.
- **Data sourcing (phased)**: team keying → open-data import → owner claims → user submissions.
- **MVP scope**: 7 cities — Bangkok, Phuket, Chiang Mai, Pattaya, Krabi, Hat Yai, Ayutthaya.
- **Languages**: th, en, ms, id, ar (RTL).

## Technical decisions
1. **Single Next.js app**, not a monorepo. All business logic in `src/server/services/*`
   (must not import `next/*`); everything the PWA/native app needs goes through REST `/api/v1`.
2. **Drizzle ORM + SQL migrations** (not Prisma) — PostGIS/GiST/trigram/partial indexes.
3. **PostgreSQL 16 + PostGIS** — `geography(Point,4326)`, GiST, `ST_DWithin` + KNN (`<->`).
4. **Better Auth, staff-only in MVP** (admin/editor/moderator, invite-only via `scripts/create-staff.ts`).
   No public login, no merchant portal, no social OAuth in MVP (scope + PDPA).
5. **Search: pg_trgm in MVP** (+ synonym map for ar/ms/id → category/city planned).
   Meilisearch deferred to Phase 2.
6. **Maps: MapLibre + OpenFreeMap** (free). Runbook fallback → MapTiler key (OpenFreeMap has no SLA).
7. **i18n: next-intl**, path prefix `/{locale}/`, JSONB per-field content + `translation_meta`.
   Locale pages are generated only when a human-reviewed translation exists (avoid thin content).
8. **Prayer times: official-first.** Chularajmontri tables (`prayer_times_official`, ingested yearly)
   take precedence; `adhan-js` is the labelled "calculated (approximate)" fallback.
   Default method Singapore (Fajr 20°/Isha 18°), madhab Shafi'i. API takes a province code, never coordinates.
9. **Qibla: sensor-free by default** — degrees from true north + map arrow (works offline / iOS without permission).
10. **PWA: Serwist**, offline = app shell + current-month prayer table + saved places + viewed pages (cache-on-view).
11. **Analytics: Umami (cookieless)** + custom events (planned month 4): `search_zero_result`, `click_navigate`, `click_call`, `save_place`.
12. **Hosting: VPS + Docker + Dokploy + Cloudflare.** App and DB MUST be in the same region.
    Keep access logs 90 days (Computer Crime Act s.26).
13. **Compliance alerts: email + Telegram** (NOT LINE Notify — discontinued Mar 2025).

## Legal-by-design (built into MVP)
- **PDPA**: religion is sensitive data — no religion field anywhere, core features work without login,
  location computed on-device, one-off "near me" query not tied to identity.
- **Halal trust**: 4 levels (L1 CICOT-certified / L2 Muslim-owned / L3 Muslim-friendly / L4 unverified),
  always shown with the verification source + `last_verified_at`. Never render the CICOT mark itself
  (Criminal Code s.272-273); evidence is a photo of the real certificate + number + expiry, cross-checked
  against halal.or.th. Expired → auto-downgrade. Disputed → show "under re-verification", never the accusation.
- **MDES notice-and-takedown**: 24h SLA computed in the DB (`takedown_requests.sla_deadline_at`).
  "Hide immediately" is a reversible suspension; the default action when undecided at the deadline. All actions audited.
- **Reviews (Phase 2)**: two channels — public reviews (experience only) vs. confidential
  "halal concern" reports routed silently to the admin queue (defamation-safe). Hybrid moderation;
  keyword list must be lawyer-reviewed before launch.
- **`published_unverified`** status: government-registry mosques may be public with an unverified badge;
  never used for restaurants.

## Adversarial-review resolutions carried into code
- Mosque data: one-off OSM seed script (`scripts/import/osm-mosques.ts`), L4 + ODbL attribution,
  75 m cross-source dedupe. Full import pipeline is Phase 2.
- Schema carries `verification_method`, `verified_by`, `next_review_due`, `disputed`, and a real-column
  submissions queue (`category`, `assignee_id`, `is_confidential`, `acknowledged_at`, `resolved_at`, `resolution`).
- `field_consents` table stores PDPA consent from business owners (who are not system users).
- App + DB co-located region; qibla has a non-sensor fallback; takedown honeypot + affirm-truth on the form.

## Detailed design docs
- [product-spec.md](product-spec.md) · [architecture.md](architecture.md) · [data-compliance.md](data-compliance.md)
