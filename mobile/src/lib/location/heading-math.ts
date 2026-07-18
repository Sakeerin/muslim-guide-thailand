/**
 * Pure heading helpers (no expo-location import) so they unit-test on any
 * machine. The RN adapter (heading.ts) wires these to the native sensor.
 */

/** A compass heading sample. Mirrors expo-location's LocationHeadingObject. */
export interface HeadingSample {
  trueHeading: number;
  magHeading: number;
}

/**
 * Prefer trueHeading (the OS has already applied magnetic declination). It is
 * -1 when unavailable (no location permission / no GPS fix on Android), so we
 * fall back to magnetic north — never double-correct declination.
 */
export function pickHeading(sample: HeadingSample): number {
  return sample.trueHeading >= 0 ? sample.trueHeading : sample.magHeading;
}

/**
 * watchHeadingAsync has no built-in throttling and can flood the JS thread.
 * Emit only when the heading moved at least `thresholdDeg`, accounting for the
 * 359°→0° wrap. `previous == null` (first sample) always emits.
 */
export function shouldEmitHeading(
  previous: number | null,
  next: number,
  thresholdDeg = 1,
): boolean {
  if (previous == null) return true;
  const diff = Math.abs(((next - previous + 540) % 360) - 180);
  return diff >= thresholdDeg;
}
