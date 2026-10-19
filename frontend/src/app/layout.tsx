import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import type { ReactNode } from 'react';
import { ApolloWrapper } from '@/shared/lib/apollo/apollo-provider';
import { ThemeProvider } from '@/shared/theme/theme-provider';
import { themeScript } from '@/shared/theme/theme-script';
import '@/shared/theme/tokens.css';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CV Builder',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
