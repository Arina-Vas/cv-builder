import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import type enMessages from '../../messages/en.json';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { mergeMessages } from './merge-messages';

type Messages = typeof enMessages;

const loadMessages = async (locale: Locale): Promise<Messages> =>
  ((await import(`../../messages/${locale}.json`)) as { default: Messages }).default;

export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;

  const fallback = await loadMessages('en');
  const messages = locale === 'en' ? fallback : mergeMessages(fallback, await loadMessages(locale));

  return { locale, messages };
});
