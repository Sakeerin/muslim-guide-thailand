# Muslim Guide Thailand — Native app (Expo)

React Native / Expo client that consumes the web project's `/api/v1` REST API and
Better Auth. **Isolated project**: it has its own `package.json`, lockfile and
toolchain, and is intentionally *not* part of the web app's pnpm workspace, so it
never affects the Next.js build. Use **npm** here (not pnpm).

- Expo SDK **57** · React Native **0.86** · React **19.2** · expo-router **v7** · TypeScript **6**
- New Architecture is always on in SDK 57 (no config needed).

## Screens

Home · Map (MapLibre + OpenFreeMap, clustered GeoJSON) · Search + list
(query/type/halal filters, load-more) · Place detail + trust panel + **reviews** ·
Prayer times (per province) · Qibla compass (expo-location heading + sensor-free
fallback) · Saved (AsyncStorage) · **Account / sign-in / sign-up** · **Q&A** (ask/answer,
moderated) · i18n (5 langs) + RTL.

Place detail now covers the full public surface: trust · reviews · **Q&A** ·
claim. Q&A reuses the reviews moderation + `review_publication` consent (403 →
inline consent gate); answers are only allowed on published questions.

### Push (Ramadan/Eid announcements)
- Native push uses **Expo push tokens** (`expo-notifications`), a separate
  transport from the web's Web Push. The existing admin announce + cron fan out
  to **both** — the server `broadcast()` sends web-push and Expo in one call.
- The opt-in (`PushOptIn`, on the Prayer tab) requests permission on a tap and
  registers the token at `POST /api/v1/push/devices`. Consent + PDPA mirror the
  web (consent on the row for anonymous; `consent_logs` when signed in).
- **Inert until set up**: it needs a **custom dev build** (Expo Go can't do
  remote push since SDK 53), an **EAS `projectId`** (`eas init` — none committed,
  so the component renders nothing here), and FCM (Android) / APNs (iOS)
  credentials via EAS. Tapping a notification deep-links off `data.url`.

### Reviews & consent
- Reviewing requires a Better Auth account (bearer token in SecureStore). Core
  browsing needs no login (PDPA).
- Sign-up records `privacy_policy` + `review_publication` PDPA consent. Posting a
  review without that consent 403s (`consent_required`); the review form then
  shows an inline consent checkbox and retries — consent is always enforced
  **server-side**. Published-review reads come from `GET /api/v1/places/:slug/reviews`.
- **Claim**: places with no owner show "Own this place? Claim it" (sign-in gated).
  The claim (contact + optional message) posts to `POST /api/v1/places/:slug/claim`
  and lands in the admin queue. The client never sends the server's `website`
  honeypot; already-claimed (409) is handled.

### Map & Qibla notes
- Map uses `@maplibre/maplibre-react-native` (v11, New-Architecture-only) with the
  same keyless OpenFreeMap "liberty" style as the web. **Requires a custom dev
  build** (`expo run:ios`/`run:android` or EAS) — it cannot run in Expo Go.
- Qibla uses `expo-location` `watchHeadingAsync` (prefers `trueHeading`). The
  bearing is a pure reimplementation of adhan's `Qibla()` (proven identical), so
  the flagship "degrees from north + distance" always shows even with no compass /
  permission denied. User coordinates never leave the device (PDPA).

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL to a reachable host (LAN IP / tunnel)
npm start              # Expo dev server (press i / a, or scan in Expo Go / dev-client)
```

`EXPO_PUBLIC_API_URL` must point at the running web app. On a physical device this
must be a LAN IP (e.g. `http://192.168.1.20:3000`) or a tunnelled HTTPS URL —
`localhost` resolves to the phone itself.

## Verify (works on Windows, no simulator needed)

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint-config-expo
npm run test        # vitest — PURE logic only (see below)
npm run doctor      # expo-doctor: dependency/config checks
```

Unit tests cover only **pure** modules that never import `react-native`/`expo-*`
(`src/lib/api/envelope`, `.../client` buildUrl, `.../places` query builder,
`i18n/locale`+`content`+`rtl`, `trust/halal`, `saved/reducer`, `prayer/format`,
`format/number`). Screens and native adapters (i18n init, saved store, auth,
SecureStore, RTL flip) are verified on a real device.

## Architecture

| Layer | Where | Notes |
|---|---|---|
| API | `src/lib/api/*` | `apiFetch` reads the `{ data, error }` envelope; bearer token injected via `setTokenProvider` |
| Types | `src/types/api.ts` | mirror the web contract; re-declared (never import server code into the RN bundle) |
| i18n | `src/lib/i18n/*` + `@messages` alias | reuses the web `messages/*.json` verbatim (single source of truth); Arabic → RTL |
| Trust | `src/lib/trust/halal.ts` | 4-level halal taxonomy + `isFeatured` (mirrors the web) |
| Saved | `src/lib/saved/*` | pure reducer + zustand/AsyncStorage store |
| Auth | `src/lib/auth/client.ts` | Better Auth expo client; token in SecureStore |
| Routes | `app/*` | expo-router (file-based); tabs = Home / Prayer / Saved |

## Notes / gotchas

- `total` from `GET /api/v1/places` is a pagination hint (`items.length + offset`),
  **not** an absolute count — pagination ends when a page returns fewer than `limit`.
- RTL: switching to/from Arabic flips layout direction and needs an app **restart**
  to fully apply (React Native `I18nManager` limitation).
- The messages catalog lives outside this project; `metro.config.js` watches
  `../messages` so Metro can bundle it.
