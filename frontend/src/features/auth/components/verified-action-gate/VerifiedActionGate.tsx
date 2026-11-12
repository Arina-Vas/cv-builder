'use client';

import { useMemo, type ReactNode } from 'react';
import { ActionGateProvider } from '@/shared/lib/action-gate/ActionGate';
import { useVerifiedGuard } from '../../hooks/useVerifiedGuard';

/**
 * Locks the actions of an unverified user for every page inside (mounted once in AppShell).
 * Mirrors the backend: mutations need a verified email unless the resolver has @AllowUnverified().
 */
export const VerifiedActionGate = ({ children }: { children: ReactNode }) => {
  const { locked, guard } = useVerifiedGuard();
  const gate = useMemo(() => ({ locked, guard }), [locked, guard]);

  return <ActionGateProvider value={gate}>{children}</ActionGateProvider>;
};
