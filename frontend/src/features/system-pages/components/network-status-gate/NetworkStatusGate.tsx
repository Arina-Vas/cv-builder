'use client';

import { useApolloClient } from '@apollo/client/react';
import { useState, type ReactNode } from 'react';
import { networkStatus } from '@/shared/lib/network/network-status';
import { useNetworkStatus } from '@/shared/lib/network/useNetworkStatus';
import { NoInternetPage } from '../no-internet-page/NoInternetPage';
import s from './NetworkStatusGate.module.css';

export function NetworkStatusGate({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const { isOffline } = useNetworkStatus();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    networkStatus.clearFailure();
    try {
      await client.refetchObservableQueries();
    } catch {
    } finally {
      setRetrying(false);
    }
  };

  return (
    <>
      <div className={isOffline ? s.hidden : s.app} aria-hidden={isOffline || undefined}>
        {children}
      </div>
      {isOffline && <NoInternetPage onRetry={retry} retrying={retrying} />}
    </>
  );
}
