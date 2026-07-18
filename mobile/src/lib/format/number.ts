/**
 * Distance formatting. Intl-free (Hermes Intl.NumberFormat support is spotty),
 * always latin digits — the unit word ("km"/"m") comes from i18n. Pure.
 */
export function fmtDistance(meters: number): { value: string; unit: 'm' | 'km' } {
  if (!Number.isFinite(meters) || meters < 0) return { value: '—', unit: 'm' };
  if (meters < 950) return { value: String(Math.round(meters)), unit: 'm' };
  const km = meters / 1000;
  return { value: km < 10 ? km.toFixed(1) : String(Math.round(km)), unit: 'km' };
}
