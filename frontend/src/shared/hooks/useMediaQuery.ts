'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Live `matchMedia` result. The server (and the hydration pass) always gets `false`,
 * so layouts must render their wide-screen variant by default.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
