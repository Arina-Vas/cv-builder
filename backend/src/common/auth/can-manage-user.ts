import { UserRole } from '@/common/graphql/enums';
import type { User } from '@/users/models/user.model';

// "Own or Admin" (docs/api/permissions.md): an Employee may change only their own data, an Admin anyone's.
// `userId` is the target profile from the request; the current user comes from the auth context.
export const canManageUser = (currentUser: Pick<User, 'id' | 'role'>, userId: string): boolean =>
  currentUser.role === UserRole.ADMIN || currentUser.id === userId;
