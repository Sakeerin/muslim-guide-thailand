/**
 * Map an /api/v1 error `code` to a leaf key in the `errors` i18n namespace
 * (use with `useTranslations('errors')`). Pure + framework-free so it unit-tests
 * without React.
 *
 * Codes that drive UI state rather than a flash message — `consent_required`
 * (show the consent checkbox) and `already_claimed` (show the claimed state) —
 * are handled by the component and never reach here. The network/no-response
 * case is likewise the caller's (`'network'`), since there is no code to map.
 */
export function errorMessageKey(code: string | undefined | null): string {
  switch (code) {
    case 'rate_limited':
      return 'rateLimited';
    case 'feature_disabled':
      return 'featureDisabled';
    case 'validation_error':
      return 'validation';
    default:
      return 'generic';
  }
}
