# Muslim Guide Thailand

A web + PWA + admin platform helping Muslim travelers find **verified** halal
restaurants, mosques, prayer rooms and attractions across Thailand — with
prayer times per the official Chularajmontri tables, qibla, and 5 languages.

> Positioning: *"Halal Navi for Thailand"* — every listing shows **who verified
> its halal status, with what evidence, and when.**

## Stack

Next.js 16 (App Router) · TypeScript · Drizzle ORM · PostgreSQL 16 + PostGIS ·
Better Auth (staff) · next-intl (th/en/ms/id/ar, RTL) · Tailwind v4 ·
MapLibre + OpenFreeMap · adhan-js · Serwist (PWA) · Vitest.

See [docs/decisions.md](docs/decisions.md) for the full rationale and legal-by-design notes.

## Getting started

```bash
pnpm install
cp .env.example .env              # adjust secrets

pnpm dev:services                 # PostGIS + Mailpit via Docker
pnpm db:migrate                   # apply drizzle/*.sql
SEED_DEMO=1 pnpm db:seed          # cities + categories + amenities (+ demo places)

# create a staff account (invite-only; no public sign-up)
pnpm tsx scripts/create-staff.ts you@example.com "YourPassword123" "Your Name" admin

pnpm dev                          # http://localhost:3000
```

Public site: `/{locale}` (e.g. `/en`, `/th`, `/ar`). Admin: `/admin`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed reference data (`SEED_DEMO=1` adds demo places) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm import:osm-mosques` | One-off mosque seed from OpenStreetMap (ODbL, L4) |

## Layout

```
src/
  app/[locale]/     public site (5 languages, RTL for ar)
  app/admin/        staff back-office (auth-guarded, not localized)
  app/api/v1/       REST API — the contract shared with the future native app
  server/db/        Drizzle schema + client
  server/services/  business logic (no next/* imports)
  lib/              prayer/qibla/hijri, opening-hours, i18n content, validators
  i18n/             next-intl routing + request config
scripts/            db migrate, seed, create-staff, OSM import
docs/               product spec, architecture, data/compliance, decisions
```

## Data & trust model

Halal status is shown at four levels — **CICOT-certified**, **Muslim-owned**,
**Muslim-friendly**, **unverified** — always with the verification source and
last-verified date. The platform never renders the CICOT mark itself; L1
evidence is a photo of the real certificate plus its number and expiry. See
[docs/decisions.md](docs/decisions.md).

## Compliance

PDPA (religion is sensitive data — no religion field; core features need no
login), MDES 24-hour notice-and-takedown (`/{locale}/legal/takedown` → admin
SLA queue), and defamation-safe reporting are built in from day one.
