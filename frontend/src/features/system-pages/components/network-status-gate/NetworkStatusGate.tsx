'use client';

import { useApolloClient } from '@apollo/client/react';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { networkStatus } from '@/shared/lib/network/network-status';
import { useNetworkStatus } from '@/shared/lib/network/useNetworkStatus';
import { NoInternetPage } from '../no-internet-page/NoInternetPage';
import s from './NetworkStatusGate.module.css';

export function NetworkStatusGate({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const { isOffline } = useNetworkStatus();
  const [retrying, setRetrying] = useState(false);
  const retryingRef = useRef(false);

  const retry = async () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);
    networkStatus.clearFailure();
    try {
      await client.refetchObservableQueries();
    } catch {
      // A query that fails again re-reports itself through the network-error link.
    } finally {
      retryingRef.current = false;
      setRetrying(false);
    }
  };

  const onOnline = useEffectEvent(() => {
    void retry();
  });

  useEffect(() => {
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <>
      <div className={isOffline ? s.hidden : s.app} aria-hidden={isOffline || undefined}>
        {children}
      </div>
      {isOffline && <NoInternetPage onRetry={retry} retrying={retrying} />}
    </>
  );
}
