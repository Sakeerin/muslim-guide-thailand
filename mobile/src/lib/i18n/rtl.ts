import { isRtl } from './locale';

/**
 * Whether the app's layout direction must flip for this locale. Pure decision
 * function; the actual I18nManager.forceRTL + reload is a side effect performed
 * by the RN adapter (i18n/index.ts) only when this returns true. Separated so
 * the decision can be unit-tested without react-native.
 */
export function needsRtlFlip(locale: string, currentIsRtl: boolean): boolean {
  return isRtl(locale) !== currentIsRtl;
}

export { isRtl };
