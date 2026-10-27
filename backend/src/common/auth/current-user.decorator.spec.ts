import type { ExecutionContext } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { User } from '@/users/models/user.model';
import { currentSessionId, currentUser } from './current-user.decorator';
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

describe('isMutation', () => {
  it('is true only for root mutation fields', () => {
    expect(isMutation(graphqlContext({}, 'Mutation'))).toBe(true);
    expect(isMutation(graphqlContext({}, 'Query'))).toBe(false);
    expect(isMutation(httpContext({}))).toBe(false);
  });
});
