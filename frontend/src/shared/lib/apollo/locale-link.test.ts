import { ApolloClient, ApolloLink, InMemoryCache, gql } from '@apollo/client';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { createLocaleLink } from './locale-link';

// A real operation from backend/schema.gql; the response is mocked
const RESEND_CODE = gql`
  mutation ResendVerificationCode {
    resendVerificationCode
  }
`;

function createClient(getLocale: () => string, headers?: Record<string, string>) {
  const sent: Record<string, string>[] = [];
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      new ApolloLink((operation, forward) => {
        if (headers) {
          operation.setContext({ headers });
        }
        return forward(operation);
      }),
      createLocaleLink(getLocale),
      new ApolloLink((operation) => {
        sent.push((operation.getContext() as { headers: Record<string, string> }).headers);
        return of({ data: { resendVerificationCode: true } });
      }),
    ]),
  });

  return { client, sent };
}

describe('createLocaleLink', () => {
  it('sends the app language as Accept-Language', async () => {
    const { client, sent } = createClient(() => 'ru');

    await client.mutate({ mutation: RESEND_CODE });

    expect(sent[0]).toEqual({ 'accept-language': 'ru' });
  });

  it('reads the language on every request, so a later change in Settings is used', async () => {
    let locale = 'en';
    const { client, sent } = createClient(() => locale);

    await client.mutate({ mutation: RESEND_CODE });
    locale = 'uk';
    await client.mutate({ mutation: RESEND_CODE });

    expect(sent.map((headers) => headers['accept-language'])).toEqual(['en', 'uk']);
  });

  it('keeps the headers other links have set', async () => {
    const { client, sent } = createClient(() => 'de', { 'x-test': '1' });

    await client.mutate({ mutation: RESEND_CODE });

    expect(sent[0]).toEqual({ 'x-test': '1', 'accept-language': 'de' });
  });
});
