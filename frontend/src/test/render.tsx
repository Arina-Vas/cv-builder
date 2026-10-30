import { MockedProvider } from '@apollo/client/testing/react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { ThemeProvider } from '@/shared/theme/theme-provider';

type ApolloMocks = ComponentProps<typeof MockedProvider>['mocks'];

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: ApolloMocks;
}

export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], ...options }: RenderWithProvidersOptions = {},
) {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </MockedProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...options }),
  };
}
