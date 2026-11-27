import { ApolloClient } from '@apollo/client';
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { mockRouter, usePathname } from '@/test/next-navigation';
import { AuthRoute } from '../../auth.constants';
import { type AuthEvent, broadcastAuthEvent, subscribeToAuthEvents } from '../../lib/auth-channel';
import { AuthSync } from './AuthSync';

// MockedProvider makes its own client, so the spies go on the class
const spyOnClient = () => ({
  clearStore: vi.spyOn(ApolloClient.prototype, 'clearStore').mockResolvedValue([]),
  resetStore: vi.spyOn(ApolloClient.prototype, 'resetStore').mockResolvedValue(null),
});

let spies: ReturnType<typeof spyOnClient>;

const renderOn = (path: string) => {
  usePathname.mockReturnValue(path);
  spies = spyOnClient();
  renderWithProviders(<AuthSync />);
};

// what another tab sends: a separate channel instance, so this one does receive it
const fromAnotherTab = (event: AuthEvent) => broadcastAuthEvent(event);

describe('auth-channel', () => {
  it('delivers login and logout to a subscriber and ignores anything else', async () => {
    const onEvent = vi.fn();
    const unsubscribe = subscribeToAuthEvents(onEvent);

    fromAnotherTab('logout');
    const junk = new BroadcastChannel('cv-builder-auth');
    junk.postMessage({ type: 'junk' });
    junk.close();
    fromAnotherTab('login');

    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(2));
    expect(onEvent).toHaveBeenNthCalledWith(1, 'logout');
    expect(onEvent).toHaveBeenNthCalledWith(2, 'login');
    unsubscribe();
  });

  it('does nothing where BroadcastChannel is missing', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const onEvent = vi.fn();

    expect(() => broadcastAuthEvent('logout')).not.toThrow();
    subscribeToAuthEvents(onEvent)();
    expect(onEvent).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('AuthSync', () => {
  it('clears the cache and goes to Sign In when another tab logs out', async () => {
    renderOn('/cvs');

    fromAnotherTab('logout');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(AuthRoute.signIn));
    expect(spies.clearStore).toHaveBeenCalled();
  });

  it.each([AuthRoute.signIn, AuthRoute.resetPassword])(
    'stays on %s when another tab logs out',
    async (path) => {
      renderOn(path);

      fromAnotherTab('logout');

      await waitFor(() => expect(spies.clearStore).toHaveBeenCalled());
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );

  it('leaves Sign In for the app when another tab signs in', async () => {
    renderOn(AuthRoute.signIn);

    fromAnotherTab('login');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(AuthRoute.home));
    expect(spies.resetStore).not.toHaveBeenCalled();
  });

  it('refetches the open page as the new user when another tab signs in', async () => {
    renderOn('/cvs');

    fromAnotherTab('login');

    await waitFor(() => expect(spies.resetStore).toHaveBeenCalled());
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
