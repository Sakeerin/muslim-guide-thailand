# Launch Checklist — Muslim Guide Thailand

Gate before the public MVP launch. Grouped by owner. Anything under
**Blocker** must be done; **Should** is strongly recommended.

## Legal / compliance (Blocker)
- [ ] Privacy policy drafted by counsel and **human-translated** into th/en/ms/id/ar
      (religion is PDPA sensitive data). Replace the placeholder at `/legal/privacy`.
- [ ] Terms of use reviewed by counsel; replace placeholder at `/legal/terms`.
- [ ] Notice-and-takedown channel live (`/legal/takedown`) with a named on-call
      handler and the 24h SLA runbook (MDES). Do a timed takedown drill.
- [ ] Confirm the platform never renders the CICOT mark as its own graphic
      (Criminal Code s.272-273) — badges + certificate photos only.
- [ ] Access/traffic logs retained 90 days (Computer Crime Act s.26) on the VPS.
- [ ] Company structure decision recorded: directory + affiliate booking needs no
      TAT licence; selling tour packages would (51% Thai ownership).

## Data / trust (Blocker)
- [ ] Replace **sample** prayer-time tables with the official สำนักจุฬาราชมนตรี
      tables (`pnpm import:prayer-times <file.csv>`); remove `--sample` rows.
- [ ] Replace **sample** `islamic_events` (Ramadan/Eid) with official
      moon-sighting announcements.
- [ ] Launch coverage target met: Bangkok verified 300–400 + each other city 40–80,
      mosques seeded (`pnpm import:osm-mosques`, ODbL attribution shown).
- [ ] `cert-expiry` cron scheduled daily; alert channel wired (email/Telegram —
      NOT LINE Notify, discontinued Mar 2025).
- [ ] Every published L1/L2 place passed 4-eyes review.

## Infra / ops (Blocker)
- [ ] App and Postgres in the **same region** (SGP or BKK) — no cross-border hop.
- [ ] Managed Postgres backups + PostGIS confirmed; migrations run on deploy.
- [ ] Cloudflare R2 buckets: `public-media` (CDN) + `private-docs` (certificates,
      object versioning on). Private bucket never publicly readable.
- [ ] Secrets set in prod (BETTER_AUTH_SECRET rotated, DATABASE_URL, SITE_URL).
- [ ] Map fallback runbook: OpenFreeMap has no SLA → MapTiler key ready to swap.
- [ ] Staff accounts created invite-only (`scripts/create-staff.ts`); no public sign-up.

## Quality gates (Blocker)
- [ ] CI green: lint, typecheck, unit (`pnpm test`), build, E2E (`pnpm e2e`).
- [ ] Production build verified: `pnpm build && pnpm start`, service worker active,
      Lighthouse PWA installable, offline reload serves cached page / `/offline.html`.
- [ ] Qibla tested on real iOS + Android devices (permission flow + sensor-free fallback).
- [ ] RTL reviewed by an Arabic reader on a real device.
- [ ] Prayer times cross-checked against official announcements for ≥3 provinces.

## SEO / analytics (Should)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin (drives sitemap, OG, hreflang).
- [ ] Submit `/sitemap.xml` to Google Search Console; verify hreflang.
- [ ] Umami configured (`NEXT_PUBLIC_UMAMI_*`); confirm events fire
      (`click_navigate`, `click_call`, `save_place`) and zero-result logging populates.
- [ ] OG images render for home + a place (share-preview check).

## Partnerships / growth (Should)
- [ ] Outreach started: CICOT, Halal Science Center (Chulalongkorn), TAT.
- [ ] User interviews with MS/ID/GCC travelers before freezing v2 scope.

## Reviews & public accounts (Phase 2 — shipped month 5)
- [ ] **NEEDS-LEGAL-REVIEW**: the risk-keyword list in `src/lib/review-moderation.ts`
      (th/en/ms/id/ar) must be reviewed & signed off by counsel before reviews are
      enabled in production. It decides what gets held for pre-moderation.
- [ ] Confirm reviews stay OFF (or behind a flag) until the keyword list + review
      guidelines are legally approved.
- [ ] Moderator rota for the review queue (risk-flagged first); halal accusations
      routed to the confidential report queue, never published as reviews.
- [ ] Decide on email verification for public sign-up before opening reviews widely
      (spam/abuse); add rate limiting on review + sign-up endpoints.
- [ ] Privacy policy covers public accounts + review publication (consent is logged
      with a policy version — keep the version in sync with the published policy).

## Merchant claim & owner management (Phase 2 — shipped month 6)
- [ ] Field-verify ownership before approving a claim (phone/email/on-site) —
      approval grants the claimant management of the listing.
- [ ] Confirm owners can never change halal status/verification: owner edits are
      moderated and limited to the field allowlist (`OWNER_EDITABLE_FIELDS`);
      trust level stays a staff decision.
- [ ] Moderator rota covers the merchant queue (`/admin/merchant`): claims +
      owner edits, alongside reviews/reports/takedowns.
- [ ] Add rate limiting on the claim endpoint (shares the review/sign-up gap).

## Data import pipeline (Phase 2 — shipped month 7)
- [ ] Bootstrap coverage via staging: `pnpm import:osm-mosques` and
      `pnpm import:csv-places` (GD Catalog / TAT / CICOT exports) → review in
      `/admin/import` (import-new / merge / reject). Never bulk-publish blindly.
- [ ] Respect source licences: OSM records carry ODbL attribution (shown in the
      footer + per-listing); keep attribution on any promoted place.
- [ ] Moderator time budgeted for the import queue (dedupe review is manual by
      design — the "likely duplicate" flag assists, doesn't auto-merge).
- [ ] Imported places land as unverified (L4) / draft — field-verify before
      raising trust level (existing verification workflow).

## Ramadan mode (Phase 2 — shipped month 8)
- [ ] Ensure official islamic_events (ramadan_start / eid_fitr per year) are
      loaded before Ramadan — the window, banner, and day count derive from
      them (moon-sighting announcement, not calculation).
- [ ] Sanity-check suhur/iftar against the official prayer table for launch
      cities before Ramadan; the /ramadan page + banner surface them prominently.

## Sponsored / featured listings (Phase 3 — shipped)
- [ ] **Disclosure**: featured placements always render a "Sponsored" label
      (`/admin/featured` sets them). Keep the label — required for ad transparency.
- [ ] **No in-app payment**: the app never collects payment. Featuring is a
      staff-set window; billing/contracts are handled offline. Do not add a
      payment flow without a proper PSP + legal review.
- [ ] **No endorsement**: featuring is orthogonal to halal trust — a sponsored
      place still shows its real halal level and is never implied as endorsed.
      Proximity ("near me") results are never reordered by sponsorship.
- [ ] Featured windows expire automatically (featured_until); no manual cleanup.

## Web Push announcements (Phase 3 — shipped)
- [ ] **Generate VAPID keys once** (`npx web-push generate-vapid-keys --json`)
      and set `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` /
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in prod. Keep the **private key server-only**
      (never `NEXT_PUBLIC_`). Regenerating invalidates every subscription — don't.
- [ ] **PDPA**: push is opt-in via a user gesture; anonymous subscribers' consent
      lives on the `push_subscriptions` row (`consent_policy_version`), signed-in
      users also get a `consent_logs` mirror. Withdrawal hard-deletes the row.
      Consent is **unbundled** from privacy-policy acceptance. Keep it that way.
- [ ] **Announcements only** (Ramadan/Eid), never marketing — enforced by the
      `/admin/announce` copy + topic list. Per-prayer reminders are deferred
      (need a sub-daily scheduler, not the daily cron).
- [ ] **iOS**: Web Push needs a home-screen-installed PWA (iOS 16.4+); the opt-in
      shows Add-to-Home-Screen instructions in a normal Safari tab.
- [ ] Schedule `pnpm cron:push-events` (daily) — broadcasts newly-announced
      `islamic_events` once (`push_sent_at` guards against re-sending). Dead
      endpoints (404/410) are pruned automatically.

## Native app (Phase 3 — foundation shipped)
- [ ] The app lives in `mobile/` (isolated Expo project). It is **excluded** from
      the web `tsconfig`/`eslint`/pnpm-workspace — keep it that way so it never
      enters the web build/CI. Verify the app from inside `mobile/`.
- [ ] Server auth exposes the `bearer()` plugin + `trustedOrigins` (incl. the app
      scheme `muslimguide://`). Set `BETTER_AUTH_TRUSTED_ORIGINS` for any extra
      origins. This is additive — the web cookie flow is unchanged.
- [ ] Ship a real app icon/splash before store submission (none committed yet).
- [ ] The **map** (`@maplibre/maplibre-react-native`, New-Arch-only) needs a
      **custom dev build** — it does not run in Expo Go. Tiles are keyless
      OpenFreeMap (no SLA — same as the web).
- [ ] Device QA before release: RTL (Arabic) layout flip + restart, SecureStore
      bearer sign-in → protected calls, Metro bundling of the shared `../messages`
      catalogs, deep-link scheme ↔ trustedOrigins, map render/cluster/tap, qibla
      live compass (heading permission, trueHeading vs magHeading fallback), and
      the **reviews consent flow** end-to-end (sign-up records consent → post
      review published/held; sign-in-only user hits the 403 consent gate → grants
      → posts), and the **place claim** flow (unowned place → claim → admin queue).
- [ ] `EXPO_PUBLIC_API_URL` points at the production API over HTTPS for release builds.

## Still deferred to later Phase 2/3 (not launch blockers)
Live TAT/CICOT API connectors (CSV export path works today), review photo
upload (needs object storage), Meilisearch, city-pack offline downloads,
guides/itineraries, hotel type + affiliate booking, per-prayer push reminders,
native app (React Native over `/api/v1` + bearer auth), community/Q&A.
