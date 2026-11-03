import request from 'supertest';
import type { App } from 'supertest/types';

export interface GqlError {
  message: string;
  extensions: { code: string; [key: string]: unknown };
}

export interface GqlResponse<T> {
  data: T | null;
  errors?: GqlError[];
}

let clients = 0;

/**
 * One browser: keeps the httpOnly auth cookies between requests like a real client and sends a
 * client IP of its own (X-Forwarded-For), so rate limits of one test never affect another.
 */
export class GqlClient {
  private readonly cookies = new Map<string, string>();
  readonly ip: string;

  constructor(private readonly server: App) {
    clients += 1;
    this.ip = `10.0.${Math.floor(clients / 250)}.${(clients % 250) + 1}`;
  }

  async send<T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<GqlResponse<T>> {
    const response = await request(this.server)
      .post('/graphql')
      .set('X-Forwarded-For', this.ip)
      .set(
        'Cookie',
        [...this.cookies].map(([name, value]) => `${name}=${value}`),
      )
      .send({ query, variables });

    this.store(response.headers['set-cookie']);
    return response.body as GqlResponse<T>;
  }

  /** Sends the operation and returns its data, failing the test on any GraphQL error. */
  async data<T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const body = await this.send<T>(query, variables);
    if (body.errors?.length || !body.data) {
      throw new Error(`unexpected GraphQL errors: ${JSON.stringify(body.errors)}`);
    }
    return body.data;
  }

  /** Sends the operation and returns its first error, failing the test if it succeeded. */
  async error(query: string, variables?: Record<string, unknown>): Promise<GqlError> {
    const body = await this.send(query, variables);
    const [error] = body.errors ?? [];
    if (!error) {
      throw new Error(`expected a GraphQL error, got ${JSON.stringify(body.data)}`);
    }
    return error;
  }

  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  private store(header: string[] | string | undefined): void {
    const lines = typeof header === 'string' ? [header] : (header ?? []);
    for (const line of lines) {
      const [pair = '', ...attributes] = line.split(';').map((part) => part.trim());
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      // res.clearCookie() sends an empty value that expired in 1970
      const cleared = value === '' || attributes.some((attr) => /^expires=.*1970/i.test(attr));
      if (cleared) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }
}
