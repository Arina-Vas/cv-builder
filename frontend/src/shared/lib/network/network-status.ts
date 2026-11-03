// "The app can't reach the backend" flag. Set by the Apollo network-error link when a query
// fails to fetch, cleared by RETRY on the No Internet page. Browser offline state is read
// separately (navigator.onLine) by useNetworkStatus.

type Listener = () => void;

let requestFailed = false;
const listeners = new Set<Listener>();

function setRequestFailed(value: boolean) {
  if (requestFailed === value) return;
  requestFailed = value;
  listeners.forEach((listener) => listener());
}

export const networkStatus = {
  reportFailure: () => setRequestFailed(true),
  clearFailure: () => setRequestFailed(false),
  hasFailure: () => requestFailed,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
