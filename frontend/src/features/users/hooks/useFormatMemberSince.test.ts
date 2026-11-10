import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IntlProvider } from '@/test/render';
import { useFormatMemberSince } from './useFormatMemberSince';

describe('useFormatMemberSince', () => {
  it('builds the "A member since" text in the app language', () => {
    const { result } = renderHook(() => useFormatMemberSince(), { wrapper: IntlProvider });

    expect(result.current('2024-01-14T12:00:00.000Z')).toBe('A member since Sun Jan 14 2024');
  });
});
