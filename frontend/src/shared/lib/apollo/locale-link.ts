import { ApolloLink } from '@apollo/client';

/**
 * Sends the language the app is shown in as `Accept-Language`, so emails the backend sends
 * (verification code, password reset) come in the same language. It replaces the browser's own
 * header, which would win otherwise even when the user picked another language in Settings.
 * Takes a getter: the client lives for the whole session, the language can change meanwhile.
 */
export function createLocaleLink(getLocale: () => string): ApolloLink {
  return new ApolloLink((operation, forward) => {
    operation.setContext(({ headers }: { headers?: Record<string, string> }) => ({
      headers: { ...headers, 'accept-language': getLocale() },
    }));
    return forward(operation);
  });
}
