/**
 * Qibla + geodesy. PURE (no native, no adhan) so it unit-tests on any machine.
 * `qiblaBearing` is a hand-reimplementation of adhan's Qibla() — numerically
 * identical (great-circle initial bearing to the Kaaba), so the native app and
 * the web app show the same direction.
 */

/** The Kaaba, Makkah. */
export const KAABA = { latitude: 21.4225241, longitude: 39.8261818 } as const;

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Wrap any angle into [0, 360). */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Qibla bearing in degrees from TRUE NORTH. Sensor-free by design: this value
 * also drives the static-arrow fallback, which must work when the compass is
 * unavailable (permission denied, no magnetometer) or offline.
 */
export function qiblaBearing(latitude: number, longitude: number): number {
  const dLng = toRad(KAABA.longitude - longitude);
  const term1 = Math.sin(dLng);
  const term2 = Math.cos(toRad(latitude)) * Math.tan(toRad(KAABA.latitude));
  const term3 = Math.sin(toRad(latitude)) * Math.cos(dLng);
  return normalizeDeg(toDeg(Math.atan2(term1, term2 - term3)));
}

/** Great-circle distance in km (haversine). */
export function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function distanceToKaabaKm(latitude: number, longitude: number): number {
  return distanceKm(latitude, longitude, KAABA.latitude, KAABA.longitude);
}

/**
 * Rotation to apply to a north-up compass arrow so it points at the qibla,
 * given the direction the device is currently facing. When no live heading is
 * available, callers pass 0 to show the absolute bearing from north.
 */
export function relativeRotation(qibla: number, deviceHeading: number): number {
  return normalizeDeg(qibla - deviceHeading);
}

export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export function compassPoint(deg: number): CompassPoint {
  const points: CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(normalizeDeg(deg) / 45) % 8]!;
}
