import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import type enMessages from '../../messages/en.json';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { mergeMessages } from './merge-messages';
import { negotiateLocale } from './negotiate-locale';

type Messages = typeof enMessages;

const loadMessages = async (locale: Locale): Promise<Messages> =>
  ((await import(`../../messages/${locale}.json`)) as { default: Messages }).default;

/** The language chosen in Settings; without one, the browser language; otherwise English. */
const resolveLocale = async (): Promise<Locale> => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) {
    return stored;
  }
  return negotiateLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE;
};

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  const fallback = await loadMessages('en');
  const messages = locale === 'en' ? fallback : mergeMessages(fallback, await loadMessages(locale));

  return { locale, messages };
});
