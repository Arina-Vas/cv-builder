import type { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  readCookie,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from './auth-cookies';

describe('readCookie', () => {
  const request = (cookies: unknown) => ({ cookies }) as unknown as Request;

  it('returns a string cookie', () => {
    expect(readCookie(request({ refresh_token: 'value' }), REFRESH_TOKEN_COOKIE)).toBe('value');
  });

  it.each([
    ['missing', {}],
    ['empty', { refresh_token: '' }],
    ['not a string', { refresh_token: { nested: true } }],
    ['without cookie-parser', undefined],
  ])('returns undefined for a %s cookie', (_, cookies) => {
    expect(readCookie(request(cookies), REFRESH_TOKEN_COOKIE)).toBeUndefined();
  });
});

const settings = { secure: true, accessTtlSeconds: 1800, refreshTtlDays: 1 };

const createResponse = () => {
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  return { res, response: res as unknown as Response };
};

describe('auth cookies', () => {
  it('sets both tokens as httpOnly, SameSite=Lax cookies with their lifetimes', () => {
    const { res, response } = createResponse();

    setAuthCookies(response, { accessToken: 'access', refreshToken: 'refresh' }, settings);

    const options = { httpOnly: true, sameSite: 'lax', secure: true, path: '/' };
    expect(res.cookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, 'access', {
      ...options,
      maxAge: 1_800_000,
    });
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'refresh', {
      ...options,
      maxAge: 86_400_000,
    });
  });

  it('marks cookies as not secure outside production', () => {
    const { res, response } = createResponse();

    setAuthCookies(
      response,
      { accessToken: 'a', refreshToken: 'r' },
      { ...settings, secure: false },
    );

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'a',
      expect.objectContaining({ secure: false }),
    );
  });

  it('clears both cookies with the same options they were set with', () => {
    const { res, response } = createResponse();

    clearAuthCookies(response, settings);

    const options = { httpOnly: true, sameSite: 'lax', secure: true, path: '/' };
    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, options);
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, options);
  });
});
