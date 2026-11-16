export const LOCALES = ['en', 'fr', 'de', 'it', 'pl', 'pt', 'ru', 'es', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'locale';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
