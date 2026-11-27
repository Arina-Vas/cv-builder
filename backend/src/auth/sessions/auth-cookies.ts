import type { CookieOptions, Request, Response } from 'express';
import { DAY_MS, SECOND_MS } from '@/common/time';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface AuthCookieSettings {
  secure: boolean;
  accessTtlSeconds: number;
  refreshTtlDays: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const baseOptions = (settings: AuthCookieSettings): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: settings.secure,
  path: '/',
});

export const setAuthCookies = (
  res: Response,
  tokens: AuthTokens,
  settings: AuthCookieSettings,
): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions(settings),
    maxAge: settings.accessTtlSeconds * SECOND_MS,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseOptions(settings),
    maxAge: settings.refreshTtlDays * DAY_MS,
  });
};

export const readCookie = (req: Request, name: string): string | undefined => {
  const value: unknown = req.cookies?.[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
};

export const clearAuthCookies = (res: Response, settings: AuthCookieSettings): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseOptions(settings));
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions(settings));
};
