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

## Still deferred to later Phase 2 (not launch blockers)
Full import pipeline (TAT/CICOT + dedupe UI), review photo upload (needs object
storage), Meilisearch, city-pack offline downloads, guides/itineraries,
Ramadan mode, hotel type, push notifications.
