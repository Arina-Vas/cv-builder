import { DEFAULT_LOCALE, negotiateLocale } from './locale';

describe('negotiateLocale', () => {
  it.each([
    ['uk', 'uk'],
    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru'],
    ['pt-BR', 'pt'],
    ['DE-de', 'de'],
    // the browser's first language is not an app language → the next one that is
    ['ja-JP,ja;q=0.9,fr;q=0.5', 'fr'],
    // ranked by quality, not by position
    ['en;q=0.3, es;q=0.8', 'es'],
    // equal quality keeps the browser order
    ['it, pl', 'it'],
  ])('%s → %s', (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });

  it.each([undefined, '', '*', 'ja,zh;q=0.5', 'ru;q=0', 'ru;q=abc'])(
    'falls back to English for %p',
    (header) => {
      expect(negotiateLocale(header)).toBe(DEFAULT_LOCALE);
    },
  );

  it('reads a header that came as several values', () => {
    expect(negotiateLocale(['ja', 'uk;q=0.5'])).toBe('uk');
  });
});
