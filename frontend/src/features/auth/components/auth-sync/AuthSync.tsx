'use client';

import { useApolloClient } from '@apollo/client/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { AuthRoute, GUEST_ONLY_ROUTES, PUBLIC_ROUTES } from '../../auth.constants';
import { subscribeToAuthEvents } from '../../lib/auth-channel';

/**
 * Follows sign-in and sign-out made in another tab or window of the same browser.
 * - logout: drop the cached data of the old user and go to Sign In (pages for everyone stay);
 * - login: leave Sign In / Sign Up for the app, or refetch the open page as the new user.
 * Renders nothing; mounted once inside the Apollo provider.
 */
export function AuthSync() {
  const client = useApolloClient();
  const router = useRouter();
  const pathname = usePathname();
  // the subscription is made once; the ref gives it the current page
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(
    () =>
      subscribeToAuthEvents((event) => {
        const path = pathnameRef.current;
        const onGuestPage = GUEST_ONLY_ROUTES.includes(path);

        if (event === 'logout') {
          void client.clearStore().catch(() => undefined);
          if (!onGuestPage && !PUBLIC_ROUTES.includes(path)) router.replace(AuthRoute.signIn);
          return;
        }

        if (onGuestPage) {
          router.replace(AuthRoute.home);
        } else {
          // maybe another user signed in: refetch what the page shows with the new session
          void client.resetStore().catch(() => undefined);
        }
      }),
    [client, router],
  );

  return null;
}
