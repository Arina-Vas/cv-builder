import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { type ActionGate, ActionGateProvider } from '@/shared/lib/action-gate/ActionGate';

/** A closed gate for shared-component tests: `blocked` records the clicks it stopped */
export function closedGate() {
  const blocked = vi.fn();
  const gate: ActionGate = { locked: true, guard: () => () => blocked() };
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ActionGateProvider value={gate}>{children}</ActionGateProvider>
  );
  return { blocked, Wrapper };
}
