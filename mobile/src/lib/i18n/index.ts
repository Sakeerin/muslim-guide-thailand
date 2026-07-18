/* eslint-disable import/no-named-as-default-member -- i18next's default export
   IS the singleton instance; .use()/.changeLanguage() are its methods. */
import { I18nManager } from 'react-native';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@messages/en.json';
import th from '@messages/th.json';
import ms from '@messages/ms.json';
import id from '@messages/id.json';
import ar from '@messages/ar.json';
import { DEFAULT_LOCALE, isRtl, pickLocale, type Locale } from './locale';
import { needsRtlFlip } from './rtl';

// Reuse the web project's catalogs verbatim (single source of truth). Messages
// use single-brace placeholders like "{date}" and no ICU — so i18next just
// needs its interpolation delimiters set to match.
const resources = {
  en: { translation: en },
  th: { translation: th },
  ms: { translation: ms },
  id: { translation: id },
  ar: { translation: ar },
} as const;

const STORAGE_KEY = 'muslimguide.locale';

/** Persisted choice first, then the device's preferred locales, else English. */
export async function resolveInitialLocale(): Promise<Locale> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  const device = Localization.getLocales().map((l) => l.languageTag);
  return pickLocale([stored, ...device]);
}

function applyDirection(locale: string): void {
  const rtl = isRtl(locale);
  I18nManager.allowRTL(rtl);
  if (needsRtlFlip(locale, I18nManager.isRTL)) I18nManager.forceRTL(rtl);
}

export async function initI18n(): Promise<Locale> {
  const locale = await resolveInitialLocale();
  await i18next.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    returnNull: false,
  });
  applyDirection(locale);
  return locale;
}

/**
 * Switch language + persist. Returns whether the app must reload for the change
 * to take full effect (true when the layout direction flips — RTL changes need
 * a restart in React Native).
 */
export async function changeLocale(locale: Locale): Promise<{ needsReload: boolean }> {
  const needsReload = needsRtlFlip(locale, I18nManager.isRTL);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* non-fatal */
  }
  await i18next.changeLanguage(locale);
  I18nManager.allowRTL(isRtl(locale));
  if (needsReload) I18nManager.forceRTL(isRtl(locale));
  return { needsReload };
}

export { i18next };
