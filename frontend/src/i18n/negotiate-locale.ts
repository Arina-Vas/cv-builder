import { isLocale, type Locale } from './config';

/**
 * Picks the first app language from an `Accept-Language` header the browser sends,
 * e.g. `ru-RU,ru;q=0.9,en;q=0.8` → `ru`. Only the primary subtag counts (`pt-BR` → `pt`).
 * Returns undefined when none of the browser languages is supported.
 * The backend picks the email language the same way: `backend/src/common/i18n/locale.ts`.
 */
export const negotiateLocale = (header: string | null | undefined): Locale | undefined => {
  const ranked = (header ?? '')
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

  return ranked.map(({ language }) => language).find(isLocale);
};
