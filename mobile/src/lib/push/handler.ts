import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { pushPathFromUrl } from './url';

// Foreground display behaviour (SDK 57 shape — shouldShowAlert is deprecated).
// Imported for side effect from the root layout.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function routeFromResponse(response: Notifications.NotificationResponse | null): void {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string') {
    // typedRoutes: the target may not exist yet (e.g. /ramadan) → falls to +not-found
    router.push(pushPathFromUrl(url) as Parameters<typeof router.push>[0]);
  }
}

/**
 * Deep-link when a notification is tapped: handles both the cold-start case
 * (app opened from a notification) and taps while running. Call once in the
 * root layout, passing whether the root navigator (<Stack>) is mounted yet —
 * routing before it mounts is silently dropped by expo-router, which would lose
 * the cold-start deep link.
 */
export function useNotificationRouting(navigatorReady: boolean): void {
  useEffect(() => {
    if (!navigatorReady) return; // wait for the <Stack> so router.push isn't dropped
    let handled = false;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!handled && response) {
        handled = true;
        routeFromResponse(response);
      }
    });
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handled = true;
      routeFromResponse(response);
    });
    return () => sub.remove();
  }, [navigatorReady]);
}
