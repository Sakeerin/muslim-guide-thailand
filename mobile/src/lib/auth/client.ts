import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { API_BASE_URL } from '@/lib/config';
import { setTokenProvider } from '@/lib/api/client';

const TOKEN_KEY = 'muslimguide.bearer_token';

/**
 * Better Auth client for the native app. The expo plugin persists the session
 * cookie in SecureStore; we additionally capture the `set-auth-token` header so
 * the /api/v1 client can send `Authorization: Bearer <token>` on protected
 * calls (reviews/consent — enabled later). Core browsing needs no auth (PDPA).
 */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'muslimguide',
      storagePrefix: 'muslimguide',
      storage: SecureStore,
    }),
  ],
  fetchOptions: {
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
  },
});

export function getBearerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearBearerToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Feed stored bearer tokens to the /api/v1 client (pure module, no expo import).
setTokenProvider(getBearerToken);
