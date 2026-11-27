import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { ApolloWrapper } from '@/shared/lib/apollo/apollo-provider';
import { ApiErrorToaster } from '@/shared/lib/apollo/ApiErrorToaster';
import { ThemeProvider } from '@/shared/theme/theme-provider';
import { themeScript } from '@/shared/theme/theme-script';
import '@/shared/theme/tokens.css';
import './globals.css';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { AuthSync } from '@/features/auth/components/auth-sync/AuthSync';
import { DeviceGuard } from '@/features/system-pages/components/device-guard/DeviceGuard';
import { NetworkStatusGate } from '@/features/system-pages/components/network-status-gate/NetworkStatusGate';

// Roboto is self-hosted: next/font/google breaks on the font URLs Google serves now
// (`/l/font?kit=…&skey=…`). Both files are variable fonts, one per subset, with Google's
// unicode-range, so the browser downloads the cyrillic file only when the page has cyrillic text.
// Two calls because a unicode-range applies to a whole call; globals.css joins them into --font-roboto.
// No metric-adjusted fallback: it would catch cyrillic before the cyrillic face does.
const robotoLatin = localFont({
  src: './fonts/roboto-latin.woff2',
  weight: '300 600',
  display: 'swap',
  variable: '--font-roboto-latin',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});

const robotoCyrillic = localFont({
  src: './fonts/roboto-cyrillic.woff2',
  weight: '300 600',
  display: 'swap',
  variable: '--font-roboto-cyrillic',
  adjustFontFallback: false,
  declarations: [
    { prop: 'unicode-range', value: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' },
  ],
});

export const metadata: Metadata = {
  title: 'CV Builder',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${robotoLatin.variable} ${robotoCyrillic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <ApiErrorToaster />
              <ApolloWrapper>
                <AuthSync />
                <DeviceGuard>
                  <NetworkStatusGate>{children}</NetworkStatusGate>
                </DeviceGuard>
              </ApolloWrapper>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
