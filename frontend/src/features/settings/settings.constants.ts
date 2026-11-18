import { LOCALE_COOKIE, type Locale } from '@/i18n/config';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Stores the chosen language for a year; the server reads it in `i18n/request.ts` on the next render. */
export const saveLocale = (locale: Locale): void => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
};
