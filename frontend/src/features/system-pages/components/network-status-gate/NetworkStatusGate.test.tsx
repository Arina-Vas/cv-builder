import { ApolloClient, ApolloLink, InMemoryCache, gql } from '@apollo/client';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { networkStatus } from '@/shared/lib/network/network-status';
import { createNetworkErrorLink } from '@/shared/lib/apollo/network-error-link';
import { IntlProvider, renderWithProviders } from '@/test/render';
import { NetworkStatusGate } from './NetworkStatusGate';

const NO_INTERNET_MESSAGE =
  "Something went wrong. We're already working on fixing it. Please try again.";

// Real operations from backend/schema.gql, so the IDE GraphQL plugin validates them; the response is mocked
const ME = gql`
  query Me {
    me {
      id
    }
  }
`;

function MeQuery() {
  useQuery(ME);
  return null;
}

function setBrowserOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

function renderGate() {
  return renderWithProviders(
    <NetworkStatusGate>
      <label>
        Name
        <input />
      </label>
    </NetworkStatusGate>,
  );
}

describe('NetworkStatusGate', () => {
  afterEach(() => {
    networkStatus.clearFailure();
  });

  it('renders the app while online', () => {
    renderGate();

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    expect(screen.queryByText(NO_INTERNET_MESSAGE)).not.toBeInTheDocument();
  });

  it('shows the No Internet page when the browser goes offline and hides it when back online', () => {
    renderGate();

    setBrowserOnline(false);
    expect(screen.getByRole('heading', { name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByText(NO_INTERNET_MESSAGE)).toBeInTheDocument();

    setBrowserOnline(true);
    expect(screen.queryByText(NO_INTERNET_MESSAGE)).not.toBeInTheDocument();
  });

  it('shows the page when a query could not reach the backend, keeping entered values', async () => {
    const { user } = renderGate();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');

    act(() => networkStatus.reportFailure());
    expect(screen.getByText(NO_INTERNET_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.queryByText(NO_INTERNET_MESSAGE)).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
  });

  it('refetches failed queries when the browser comes back online', async () => {
    const backend = vi
      .fn()
      .mockImplementationOnce(() => throwError(() => new TypeError('Failed to fetch')))
      .mockImplementation(() => of({ data: { me: { __typename: 'User', id: 'ada' } } }));
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([createNetworkErrorLink(), new ApolloLink(backend)]),
    });
    render(
      <IntlProvider>
        <ApolloProvider client={client}>
          <NetworkStatusGate>
            <MeQuery />
          </NetworkStatusGate>
        </ApolloProvider>
      </IntlProvider>,
    );

    await screen.findByText(NO_INTERNET_MESSAGE);
    expect(backend).toHaveBeenCalledOnce();

    setBrowserOnline(true);

    await waitFor(() => expect(backend).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(NO_INTERNET_MESSAGE)).not.toBeInTheDocument());
  });

  it('stays on the page if the retried query fails again', async () => {
    const backend = vi.fn(() => throwError(() => new TypeError('Failed to fetch')));
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([createNetworkErrorLink(), new ApolloLink(backend)]),
    });
    const user = userEvent.setup();
    render(
      <IntlProvider>
        <ApolloProvider client={client}>
          <NetworkStatusGate>
            <MeQuery />
          </NetworkStatusGate>
        </ApolloProvider>
      </IntlProvider>,
    );

    await screen.findByText(NO_INTERNET_MESSAGE);
    expect(backend).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(backend).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled());
    expect(screen.getByText(NO_INTERNET_MESSAGE)).toBeInTheDocument();
  });
});
