import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES } from './config';

type Messages = { [key: string]: string | Messages };

const MESSAGES_DIR = join(__dirname, '../../messages');

const load = (locale: string): Messages =>
  JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')) as Messages;

/** `{ a: { b: 'x' } }` → `{ 'a.b': 'x' }` */
const flatten = (messages: Messages, prefix = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );

// `{name}`, `{count, plural, …}` and `<b>`: an ICU argument is one identifier followed by `}` or `,`,
// so the text of a plural branch (`{Too many attempts…}`, `{# мову}`) never matches
const ARGUMENT = /\{\s*([A-Za-z_]\w*)\s*[,}]/g;
const TAG = /<\/?(\w+)>/g;

const argumentsOf = (message: string): string =>
  [...new Set([...message.matchAll(ARGUMENT), ...message.matchAll(TAG)].map((match) => match[1]))]
    .sort()
    .join();

const english = flatten(load(DEFAULT_LOCALE));
const translations = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

describe('messages', () => {
  it('has one messages file for every supported locale and nothing else', () => {
    const files = readdirSync(MESSAGES_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));

    expect(files.sort()).toEqual([...LOCALES].sort());
  });

  it('names every supported locale for the Language select', () => {
    for (const locale of LOCALES) expect(english[`settings.locales.${locale}`]).toBeTruthy();
  });

  describe.each(translations)('%s.json', (locale) => {
    const translated = flatten(load(locale));

    it('has exactly the keys of en.json', () => {
      expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
    });

    it('keeps the placeholders and tags of every English message', () => {
      const broken = Object.keys(english).filter(
        (key) => argumentsOf(english[key] ?? '') !== argumentsOf(translated[key] ?? ''),
      );

      expect(broken).toEqual([]);
    });
  });
});
