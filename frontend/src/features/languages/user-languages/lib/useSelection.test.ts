import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSelection } from './useSelection';

describe('useSelection', () => {
  it('starts outside selection mode with nothing selected', () => {
    const { result } = renderHook(() => useSelection());

    expect(result.current.selectingMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('toggles ids on and off', () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.start());
    act(() => result.current.toggle('a'));
    act(() => result.current.toggle('b'));
    act(() => result.current.toggle('a'));

    expect(result.current.selectingMode).toBe(true);
    expect([...result.current.selectedIds]).toEqual(['b']);
  });

  it('exit leaves the mode and clears the selection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.start());
    act(() => result.current.toggle('a'));
    act(() => result.current.exit());

    expect(result.current.selectingMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });
});
