import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { GraphQLError } from 'graphql';
import type { User } from '@/users/models/user.model';
import {
  CurrentSessionId,
  CurrentUser,
  currentSessionId,
  currentUser,
} from './current-user.decorator';
import { isMutation, type AuthenticatedRequest } from './request';

const graphqlContext = (
  req: Partial<AuthenticatedRequest>,
  parentType = 'Query',
): ExecutionContext => {
  const args = [{}, {}, { req }, { parentType: { name: parentType } }];
  return {
    getType: () => 'graphql',
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    getHandler: () => () => undefined,
    getClass: () => class Resolver {},
  } as unknown as ExecutionContext;
};

const httpContext = (req: Partial<AuthenticatedRequest>): ExecutionContext =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req }),
  }) as unknown as ExecutionContext;

describe('current user', () => {
  const user = { id: 'user-1' } as User;

  it('returns the user the auth guard put on a GraphQL request', () => {
    expect(currentUser(graphqlContext({ user }))).toBe(user);
  });

  it('returns the user from an HTTP request', () => {
    expect(currentUser(httpContext({ user }))).toBe(user);
  });

  it('throws UNAUTHENTICATED when there is no user', () => {
    expect(() => currentUser(graphqlContext({}))).toThrow(GraphQLError);
  });

  it('returns the current session id', () => {
    expect(currentSessionId(graphqlContext({ sessionId: 'session-1' }))).toBe('session-1');
  });

  it('throws UNAUTHENTICATED when there is no session', () => {
    expect(() => currentSessionId(graphqlContext({}))).toThrow(GraphQLError);
  });
});

// Nest stores the factory of a param decorator in the route args metadata of the method
const factoryOf = (decorator: () => ParameterDecorator) => {
  class Resolver {
    handle(@decorator() _value: unknown): void {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Resolver, 'handle') as Record<
    string,
    { factory: (data: unknown, context: ExecutionContext) => unknown }
  >;
  const [arg] = Object.values(args);
  if (!arg) {
    throw new Error('expected a param decorator');
  }
  return arg.factory;
};

describe('@CurrentUser and @CurrentSessionId', () => {
  it('resolve the user and the session id of the request', () => {
    const user = { id: 'user-1' } as User;
    const context = graphqlContext({ user, sessionId: 'session-1' });

    expect(factoryOf(CurrentUser)(undefined, context)).toBe(user);
    expect(factoryOf(CurrentSessionId)(undefined, context)).toBe('session-1');
  });
});

describe('isMutation', () => {
  it('is true only for root mutation fields', () => {
    expect(isMutation(graphqlContext({}, 'Mutation'))).toBe(true);
    expect(isMutation(graphqlContext({}, 'Query'))).toBe(false);
    expect(isMutation(httpContext({}))).toBe(false);
  });
});
