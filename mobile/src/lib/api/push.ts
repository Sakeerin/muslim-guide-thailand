import { apiFetch } from './client';

/** Register (or refresh) this device's Expo push token. Anonymous-friendly;
 *  `auth: true` links the device to the account when signed in. */
export function registerExpoPushToken(input: {
  token: string;
  platform?: 'ios' | 'android';
  locale: string;
}): Promise<{ registered: boolean }> {
  return apiFetch<{ registered: boolean }>('/api/v1/push/devices', {
    method: 'POST',
    auth: true,
    body: input,
  });
}

/** Withdraw this device's token (hard delete server-side). */
export function unregisterExpoPushToken(token: string): Promise<{ unregistered: boolean }> {
  return apiFetch<{ unregistered: boolean }>('/api/v1/push/devices/unregister', {
    method: 'POST',
    auth: true,
    body: { token },
  });
}
