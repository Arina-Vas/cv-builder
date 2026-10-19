import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ApolloWrapper } from '@/shared/lib/apollo/apollo-provider';

export const metadata: Metadata = {
  title: 'CV Builder',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
