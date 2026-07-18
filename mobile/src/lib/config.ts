/**
 * Runtime config. EXPO_PUBLIC_* vars are inlined by Expo at build time.
 * On a physical device this must point at a reachable host (LAN IP or a
 * tunnelled HTTPS URL), never "localhost".
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
