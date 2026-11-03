'use client';

import { NextIntlClientProvider } from 'next-intl';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { NoInternetPage } from '@/features/system-pages/components/no-internet-page/NoInternetPage';
import { themeScript } from '@/shared/theme/theme-script';
import '@/shared/theme/tokens.css';
import './globals.css';
import messages from '../../messages/en.json';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
          <NoInternetPage onRetry={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
