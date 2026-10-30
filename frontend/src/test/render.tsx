import { MockedProvider } from '@apollo/client/testing/react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { ThemeProvider } from '@/shared/theme/theme-provider';
import messages from '../../messages/en.json';

type ApolloMocks = ComponentProps<typeof MockedProvider>['mocks'];

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: ApolloMocks;
}

export function IntlProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], ...options }: RenderWithProvidersOptions = {},
) {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <IntlProvider>
        <MockedProvider mocks={mocks}>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </MockedProvider>
      </IntlProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...options }),
  };
}
