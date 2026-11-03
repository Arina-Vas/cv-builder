'use client';

import { useSyncExternalStore } from 'react';
import { networkStatus } from './network-status';

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useNetworkStatus(): { isOffline: boolean } {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const requestFailed = useSyncExternalStore(
    networkStatus.subscribe,
    networkStatus.hasFailure,
    () => false,
  );

  return { isOffline: !online || requestFailed };
}
