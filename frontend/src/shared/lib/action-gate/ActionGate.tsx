'use client';

import { createContext, useContext } from 'react';

/**
 * Locks the actions that change data (CREATE, Edit, Delete, gated buttons) for the whole subtree.
 * Shared components read it themselves, so pages don't know why an action is locked.
 * The app fills it in features/auth (VerifiedActionGate: unverified email); UX only, the backend decides.
 */
export interface ActionGate {
  /** The action looks disabled (aria-disabled) but stays focusable, so `guard` can explain why */
  locked: boolean;
  /** Wraps a handler: runs it when the gate is open, otherwise explains (e.g. a toast) */
  guard: <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => void;
}

// No provider (Storybook, component tests, auth pages): nothing is locked
const OPEN_GATE: ActionGate = { locked: false, guard: (fn) => fn };

const ActionGateContext = createContext<ActionGate>(OPEN_GATE);

export const ActionGateProvider = ActionGateContext.Provider;

export const useActionGate = (): ActionGate => useContext(ActionGateContext);
