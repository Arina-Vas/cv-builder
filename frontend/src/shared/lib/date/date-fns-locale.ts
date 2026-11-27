import type { Locale as DateFnsLocale } from 'date-fns';
import { de, enUS, es, fr, it, pl, pt, ru, uk } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';

/** App language → `date-fns` locale: month and week-day names, first day of the week. */
export const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = {
  en: enUS,
  fr,
  de,
  it,
  pl,
  pt,
  ru,
  es,
  uk,
};

export const getDateFnsLocale = (locale: string): DateFnsLocale =>
  DATE_FNS_LOCALES[isLocale(locale) ? locale : DEFAULT_LOCALE];

/** `date-fns` locale of the current app language (`next-intl`). */
export const useDateFnsLocale = (): DateFnsLocale => getDateFnsLocale(useLocale());
