import { UserRole } from '@/common/graphql/enums';
import { canManageUser } from './can-manage-user';

describe('canManageUser', () => {
  it.each([
    ['an Admin, another user', { id: 'admin-1', role: UserRole.ADMIN }, 'user-1', true],
    ['an Admin, own profile', { id: 'admin-1', role: UserRole.ADMIN }, 'admin-1', true],
    ['an Employee, own profile', { id: 'user-1', role: UserRole.EMPLOYEE }, 'user-1', true],
    ['an Employee, another user', { id: 'user-1', role: UserRole.EMPLOYEE }, 'user-2', false],
  ])('%s → %p', (_, currentUser, userId, expected) => {
    expect(canManageUser(currentUser, userId)).toBe(expected);
  });
});
