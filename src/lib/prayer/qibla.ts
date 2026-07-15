import { Coordinates, Qibla } from 'adhan';

/** The Kaaba, Makkah. */
export const KAABA = { latitude: 21.4225241, longitude: 39.8261818 } as const;

const EARTH_RADIUS_KM = 6371;

/**
 * Qibla bearing in degrees from TRUE NORTH for a location.
 * Sensor-free by design: this value also drives the map-arrow fallback,
 * which must work when DeviceOrientation is unavailable (iOS permission
 * denied, broken magnetometer) or offline.
 */
export function qiblaBearing(latitude: number, longitude: number): number {
  return Qibla(new Coordinates(latitude, longitude));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
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
 * Initial great-circle bearing (degrees from true north) from one point to
 * another — used for offline "1.2 km NE" hints in list view.
 */
export function bearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const φ1 = toRad(fromLat);
  const φ2 = toRad(toLat);
  const Δλ = toRad(toLng - fromLng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export function compassPoint(deg: number): CompassPoint {
  const points: CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}
