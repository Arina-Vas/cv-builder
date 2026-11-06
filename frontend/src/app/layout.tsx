import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
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
import { DeviceGuard } from '@/features/system-pages/components/device-guard/DeviceGuard';
import { NetworkStatusGate } from '@/features/system-pages/components/network-status-gate/NetworkStatusGate';

const roboto = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CV Builder',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <ApiErrorToaster />
              <ApolloWrapper>
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
