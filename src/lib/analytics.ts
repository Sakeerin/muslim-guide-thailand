'use client';

/**
 * Privacy-friendly analytics. Wraps Umami (cookieless, self-hosted). All calls
 * are no-ops unless NEXT_PUBLIC_UMAMI_WEBSITE_ID is configured, so nothing is
 * sent in dev or before analytics is wired up. We never attach personal data
 * or a religion signal to events (PDPA).
 */

type EventName = 'click_navigate' | 'click_call' | 'save_place' | 'search_zero_result';

interface UmamiApi {
  track: (event: string, data?: Record<string, unknown>) => void;
}

export function track(event: EventName, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const umami = (window as unknown as { umami?: UmamiApi }).umami;
  if (umami?.track) {
    try {
      umami.track(event, data);
    } catch {
      /* analytics must never break the app */
    }
  }
}
