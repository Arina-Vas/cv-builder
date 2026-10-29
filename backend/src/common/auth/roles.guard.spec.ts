import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GraphQLError } from 'graphql';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import type { AuthenticatedRequest } from './request';
import { Roles, ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

const graphqlContext = (req: Partial<AuthenticatedRequest>): ExecutionContext => {
  const args = [{}, {}, { req }, { parentType: { name: 'Query' } }];
  return {
    getType: () => 'graphql',
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    getHandler: () => () => undefined,
    getClass: () => class Resolver {},
  } as unknown as ExecutionContext;
};

const withRole = (role: UserRole) =>
  ({ user: { role } }) as unknown as Partial<AuthenticatedRequest>;

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  it('allows operations without @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(graphqlContext(withRole(UserRole.EMPLOYEE)))).toBe(true);
  });

  it('allows a user with a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(graphqlContext(withRole(UserRole.ADMIN)))).toBe(true);
  });

  it('rejects a user without a required role with FORBIDDEN', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    try {
      guard.canActivate(graphqlContext(withRole(UserRole.EMPLOYEE)));
      fail('expected FORBIDDEN');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions['code']).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it('rejects a request without a user', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(graphqlContext({}))).toThrow(GraphQLError);
  });
});

describe('@Roles', () => {
  it('stores the required roles for RolesGuard', () => {
    class Resolver {
      @Roles(UserRole.ADMIN)
      createDepartment(): void {}
    }

    expect(new Reflector().get(ROLES_KEY, Resolver.prototype.createDepartment)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});
