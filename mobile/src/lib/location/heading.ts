import * as Location from 'expo-location';
import { pickHeading, shouldEmitHeading } from './heading-math';

/** User coordinates for the qibla calculation. */
export interface Fix {
  latitude: number;
  longitude: number;
}

/**
 * One-off location read for the qibla bearing. Coordinates stay on the device
 * (used only to compute bearing/distance locally) and are never sent to the
 * server — PDPA data minimization. Returns null if permission is denied, so the
 * caller falls back to the manual/sensor-free layer. Getting a fix also seeds
 * trueHeading on Android (declination needs a location fix).
 */
export async function getQiblaFix(): Promise<Fix | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

/**
 * Subscribe to the compass heading. Prefers trueHeading, throttles to ~1° of
 * change. Returns a cleanup function to call in a useEffect teardown; returns
 * null if the heading stream can't be started (caller keeps the static arrow).
 */
export async function subscribeHeading(
  onHeading: (deg: number) => void,
): Promise<(() => void) | null> {
  try {
    let last: number | null = null;
    const sub = await Location.watchHeadingAsync((h) => {
      const deg = pickHeading(h);
      if (!shouldEmitHeading(last, deg)) return;
      last = deg;
      onHeading(deg);
    });
    return () => sub.remove();
  } catch {
    return null;
  }
}
