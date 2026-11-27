// Tells the other tabs and windows of the same browser profile that the session changed.
// The session lives in cookies they already share, but each tab keeps its own Apollo cache
// and page, so without this a signed-out tab keeps showing the old user's data.
// BroadcastChannel never delivers a message back to the tab that sent it.

const CHANNEL_NAME = 'cv-builder-auth';

export type AuthEvent = 'login' | 'logout';

const isAuthEvent = (value: unknown): value is AuthEvent => value === 'login' || value === 'logout';

const isSupported = () => typeof BroadcastChannel !== 'undefined';

export function broadcastAuthEvent(event: AuthEvent) {
  if (!isSupported()) return;

  const channel = new BroadcastChannel(CHANNEL_NAME);
  // a message posted before close() is still delivered
  channel.postMessage(event);
  channel.close();
}

/** Calls `onEvent` for each event another tab sends; returns the unsubscribe function. */
export function subscribeToAuthEvents(onEvent: (event: AuthEvent) => void): () => void {
  if (!isSupported()) return () => {};

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = ({ data }: MessageEvent<unknown>) => {
    if (isAuthEvent(data)) onEvent(data);
  };

  return () => channel.close();
}
