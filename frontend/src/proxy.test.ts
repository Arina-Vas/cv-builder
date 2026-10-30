import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

const ORIGIN = 'http://localhost:3000';

function request(pathname: string, { signedIn = false } = {}) {
  const req = new NextRequest(new URL(pathname, ORIGIN));
  if (signedIn) req.cookies.set('refresh_token', 'token');
  return req;
}

// NextResponse.next() has no Location header; a redirect has one
const redirectTarget = (pathname: string, options?: { signedIn?: boolean }) =>
  proxy(request(pathname, options)).headers.get('location');

describe('proxy', () => {
  describe('signed out', () => {
    it.each(['/', '/users', '/cvs/1/details', '/settings', '/verify-email'])(
      'sends %s to Sign In',
      (pathname) => {
        expect(redirectTarget(pathname)).toBe(`${ORIGIN}/login`);
      },
    );

    it.each(['/login', '/register', '/forgot-password', '/reset-password'])(
      'lets %s through',
      (pathname) => {
        expect(redirectTarget(pathname)).toBeNull();
      },
    );
  });

  describe('signed in', () => {
    it.each(['/login', '/register'])('sends %s into the app', (pathname) => {
      expect(redirectTarget(pathname, { signedIn: true })).toBe(`${ORIGIN}/`);
    });

    it.each(['/', '/users', '/verify-email', '/forgot-password', '/reset-password'])(
      'lets %s through',
      (pathname) => {
        expect(redirectTarget(pathname, { signedIn: true })).toBeNull();
      },
    );
  });
});
