import { ApiRequestError } from './envelope';

/**
 * i18n key (full dotted path in the `errors` namespace) for a caught API error,
 * for use with i18next's `t(...)`. Pure — no react-native / expo imports — so it
 * unit-tests in the plain Node env.
 *
 * `consent_required` / `already_claimed` are intercepted by the caller (they
 * change UI state, not a flash message), so they never reach here. A throw that
 * isn't an ApiRequestError means the request never got a response (fetch reject),
 * which we surface as a connection problem.
 */
export function errorMessageKey(error: unknown): string {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case 'rate_limited':
        return 'errors.rateLimited';
      case 'feature_disabled':
        return 'errors.featureDisabled';
      case 'validation_error':
        return 'errors.validation';
      default:
        return 'errors.generic';
    }
  }
  return 'errors.network';
}
