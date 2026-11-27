import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  acceptLanguage: null as string | null,
}));

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({ get: () => (request.cookie ? { value: request.cookie } : undefined) }),
  headers: () => Promise.resolve({ get: () => request.acceptLanguage }),
}));
// Returns the config callback itself, so the test can call it
vi.mock('next-intl/server', () => ({ getRequestConfig: (callback: unknown) => callback }));

const { default: resolveConfig } = (await import('./request')) as unknown as {
  default: () => Promise<{ locale: string }>;
};

describe('i18n request config', () => {
  beforeEach(() => {
    request.cookie = undefined;
    request.acceptLanguage = null;
  });

  it('uses the language chosen in Settings over the browser one', async () => {
    request.cookie = 'uk';
    request.acceptLanguage = 'ru-RU,ru;q=0.9';

    await expect(resolveConfig()).resolves.toMatchObject({ locale: 'uk' });
  });

  it('uses the browser language when nothing was chosen', async () => {
    request.acceptLanguage = 'ru-RU,ru;q=0.9,en;q=0.8';

    await expect(resolveConfig()).resolves.toMatchObject({ locale: 'ru' });
  });

  it('ignores an unknown cookie value and falls back to English', async () => {
    request.cookie = 'xx';
    request.acceptLanguage = 'ja';

    await expect(resolveConfig()).resolves.toMatchObject({ locale: 'en' });
  });
});
