import { Locale as LocaleEnum } from '@/common/graphql/locale.enum';

/** `'en' | 'fr' | …`: the values of the GraphQL `Locale` enum, so the list of languages lives in one place. */
export type Locale = `${LocaleEnum}`;
export const LOCALES: readonly Locale[] = Object.values(LocaleEnum);
export const DEFAULT_LOCALE: Locale = 'en';

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/**
 * Picks the app language from an `Accept-Language` header, e.g. `ru-RU,ru;q=0.9,en;q=0.8` → `ru`.
 * The frontend sends the language chosen in the app; without a choice the browser sends its own
 * languages. Only the primary subtag counts (`pt-BR` → `pt`); anything unknown falls back to English.
 * The value only picks a translation, so trusting the client here grants nothing.
 */
export const negotiateLocale = (header: string | string[] | undefined): Locale => {
  const value = Array.isArray(header) ? header.join(',') : (header ?? '');

  const ranked = value
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        language: tag.trim().split('-')[0]?.toLowerCase() ?? '',
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter(({ language, quality }) => language && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { language } of ranked) {
    if (isLocale(language)) {
      return language;
    }
  }
  return DEFAULT_LOCALE;
};
