import { renderHook } from '@testing-library/react';
import { format } from 'date-fns';
import { enUS, uk } from 'date-fns/locale';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/config';
import { DATE_FNS_LOCALES, getDateFnsLocale, useDateFnsLocale } from './date-fns-locale';

const NOVEMBER = new Date(2025, 10, 4);

describe('DATE_FNS_LOCALES', () => {
  it('has a date-fns locale for every app language', () => {
    expect(Object.keys(DATE_FNS_LOCALES).sort()).toEqual([...LOCALES].sort());
  });

  it.each([
    ['en', 0],
    ['pt', 0],
    ['uk', 1],
    ['de', 1],
    ['fr', 1],
    ['it', 1],
    ['pl', 1],
    ['ru', 1],
    ['es', 1],
  ] as const)('%s: the week starts on day %i', (locale, weekStartsOn) => {
    expect(DATE_FNS_LOCALES[locale].options?.weekStartsOn).toBe(weekStartsOn);
  });

  it('LLLL gives the standalone month name (header), MMMM the genitive', () => {
    expect(format(NOVEMBER, 'LLLL', { locale: uk })).toBe('листопад');
    expect(format(NOVEMBER, 'MMMM', { locale: uk })).toBe('листопада');
  });
});

describe('getDateFnsLocale', () => {
  it('maps an app language to its date-fns locale', () => {
    expect(getDateFnsLocale('uk')).toBe(uk);
    expect(getDateFnsLocale('en')).toBe(enUS);
  });

  it('falls back to English for an unknown language', () => {
    expect(getDateFnsLocale('xx')).toBe(enUS);
  });
});

describe('useDateFnsLocale', () => {
  it('returns the locale of the current next-intl language', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale="uk" messages={{}}>
        {children}
      </NextIntlClientProvider>
    );

    const { result } = renderHook(() => useDateFnsLocale(), { wrapper });

    expect(result.current).toBe(uk);
  });
});
