import { afterEach, describe, expect, it, vi } from 'vitest';
import { networkStatus } from './network-status';

describe('networkStatus', () => {
  afterEach(() => {
    networkStatus.clearFailure();
  });

  it('stores a reported failure until it is cleared', () => {
    networkStatus.reportFailure();
    expect(networkStatus.hasFailure()).toBe(true);

    networkStatus.clearFailure();
    expect(networkStatus.hasFailure()).toBe(false);
  });

  it('notifies subscribers only when the value changes', () => {
    const listener = vi.fn();
    const unsubscribe = networkStatus.subscribe(listener);

    networkStatus.reportFailure();
    networkStatus.reportFailure();
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    networkStatus.clearFailure();
    expect(listener).toHaveBeenCalledOnce();
  });
});
