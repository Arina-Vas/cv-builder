import { NextResponse, type NextRequest } from 'next/server';

import {
  AuthRoute,
  GUEST_ONLY_ROUTES,
  PUBLIC_ROUTES,
  REFRESH_TOKEN_COOKIE,
} from '@/features/auth/auth.constants';

// Optimistic check: only looks at whether a session cookie exists, not whether it is valid.
// The backend is the real check: an invalid session gets UNAUTHENTICATED, and the refresh link
// sends the user to Sign In (the failed refresh also clears both cookies).
//
// The refresh cookie is checked, not the access one: the access cookie expires after 30 minutes,
// while the session lives on (1 day, sliding) and the next request refreshes it.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  if (GUEST_ONLY_ROUTES.includes(pathname)) {
    return hasSession
      ? NextResponse.redirect(new URL(AuthRoute.home, request.url))
      : NextResponse.next();
  }

  return hasSession
    ? NextResponse.next()
    : NextResponse.redirect(new URL(AuthRoute.signIn, request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
