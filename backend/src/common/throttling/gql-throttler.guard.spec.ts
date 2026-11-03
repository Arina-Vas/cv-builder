import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, ThrottlerStorageService } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { GqlThrottlerGuard, RATE_LIMIT_MESSAGE } from './gql-throttler.guard';
import { AuthThrottle, AUTH_THROTTLE_LIMIT, DEFAULT_THROTTLE } from './throttle.decorators';

class TestResolver {
  query(): void {}

  @AuthThrottle()
  signIn(): void {}
}

const request = (ip: string) => ({ ip, headers: {} });
const response = () => ({ header: jest.fn() });

const graphqlContext = (
  handler: keyof TestResolver,
  req = request('203.0.113.7'),
  res = response(),
): ExecutionContext =>
  ({
    getType: () => 'graphql',
    getClass: () => TestResolver,
    getHandler: () => TestResolver.prototype[handler],
    getArgs: () => [{}, {}, { req, res }, {}],
    getArgByIndex: (index: number) => [{}, {}, { req, res }, {}][index],
  }) as unknown as ExecutionContext;

const httpContext = (req = request('203.0.113.7'), res = response()): ExecutionContext =>
  ({
    getType: () => 'http',
    getClass: () => TestResolver,
    getHandler: () => TestResolver.prototype.query,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  }) as unknown as ExecutionContext;

const errorOf = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );

describe('GqlThrottlerGuard', () => {
  let storage: ThrottlerStorageService;
  let guard: GqlThrottlerGuard;

  beforeEach(async () => {
    storage = new ThrottlerStorageService();
    guard = new GqlThrottlerGuard([DEFAULT_THROTTLE], storage, new Reflector());
    await guard.onModuleInit();
  });

  afterEach(() => {
    storage.onApplicationShutdown();
  });

  const hit = async (context: () => ExecutionContext, times: number): Promise<void> => {
    for (let i = 0; i < times; i += 1) {
      await guard.canActivate(context());
    }
  };

  it('reads the client from the GraphQL context and sets the rate limit headers', async () => {
    const res = response();

    await expect(
      guard.canActivate(graphqlContext('query', request('203.0.113.7'), res)),
    ).resolves.toBe(true);
    expect(res.header).toHaveBeenCalledWith('X-RateLimit-Limit', DEFAULT_THROTTLE.limit);
  });

  it('rejects an operation over its @AuthThrottle limit with RATE_LIMITED and retryAfter', async () => {
    await hit(() => graphqlContext('signIn'), AUTH_THROTTLE_LIMIT);

    const error = await errorOf(guard.canActivate(graphqlContext('signIn')));

    expect(error).toBeInstanceOf(GraphQLError);
    expect((error as GraphQLError).message).toBe(RATE_LIMIT_MESSAGE);
    expect((error as GraphQLError).extensions).toEqual({
      code: ErrorCode.RATE_LIMITED,
      retryAfter: expect.any(Number) as unknown,
    });
    expect((error as GraphQLError).extensions['retryAfter']).toBeGreaterThan(0);
  });

  it('counts each client IP separately', async () => {
    await hit(() => graphqlContext('signIn'), AUTH_THROTTLE_LIMIT);

    await expect(
      guard.canActivate(graphqlContext('signIn', request('198.51.100.1'))),
    ).resolves.toBe(true);
  });

  it('counts each operation separately', async () => {
    await hit(() => graphqlContext('signIn'), AUTH_THROTTLE_LIMIT);

    await expect(guard.canActivate(graphqlContext('query'))).resolves.toBe(true);
  });

  it('keeps the default behaviour for plain HTTP routes', async () => {
    await hit(() => httpContext(), DEFAULT_THROTTLE.limit as number);

    await expect(errorOf(guard.canActivate(httpContext()))).resolves.toBeInstanceOf(
      ThrottlerException,
    );
  });
});
