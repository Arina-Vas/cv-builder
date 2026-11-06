import type { AppError } from './graphql-errors';

// Unhandled API errors: reported by the error-toast link, shown as toasts by ApiErrorToaster.
// A module, not React state, because Apollo links live outside React (same idea as network-status).

type Listener = (error: AppError) => void;

// Errors reported before ApiErrorToaster subscribes (a query failing during the first render) wait here.
// No more than the toasts on screen (MAX_TOASTS): older ones would be pushed out anyway.
const MAX_PENDING = 3;

const listeners = new Set<Listener>();
let pending: AppError[] = [];

export const apiErrors = {
  report(error: AppError) {
    // On the server this module is shared between requests of different users: keep nothing there
    if (typeof window === 'undefined') return;

    if (listeners.size === 0) {
      pending = [...pending, error].slice(-MAX_PENDING);
      return;
    }
    listeners.forEach((listener) => listener(error));
  },

  subscribe(listener: Listener) {
    listeners.add(listener);

    const queued = pending;
    pending = [];
    queued.forEach((error) => listener(error));

    return () => {
      listeners.delete(listener);
    };
  },
};
