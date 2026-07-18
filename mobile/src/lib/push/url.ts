import { LOCALES } from '@/lib/i18n/locale';

/**
 * Turn a server announcement URL (which carries a locale prefix, e.g.
 * "/th/ramadan") into an in-app route path ("/ramadan"). Strips the origin,
 * query/hash, and a leading locale segment. Falls back to "/". Pure.
 */
export function pushPathFromUrl(url: string | undefined | null): string {
  if (typeof url !== 'string' || !url) return '/';
  const path = url.replace(/^[a-z]+:\/\/[^/]+/i, '').split(/[?#]/)[0] || '/';
  const segments = path.split('/').filter(Boolean); // ["th","ramadan"]
  if (segments.length > 0 && (LOCALES as readonly string[]).includes(segments[0]!)) {
    segments.shift();
  }
  return '/' + segments.join('/');
}
