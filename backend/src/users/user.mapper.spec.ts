import { UserRole } from '@/common/graphql/enums';
import { toUser, type UserWithRelations } from './user.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: UserWithRelations = {
  id: 'user-1',
  email: 'employee@cv-builder.local',
  emailVerifiedAt: null,
  passwordHash: 'secret-hash',
  firstName: null,
  lastName: null,
  role: UserRole.EMPLOYEE,
  avatarUrl: null,
  departmentId: null,
  department: null,
  positionId: null,
  position: null,
  createdAt,
  updatedAt: createdAt,
};

describe('toUser', () => {
  it('maps a user without department and position to nulls', () => {
    expect(toUser(row)).toEqual({
      id: 'user-1',
      email: 'employee@cv-builder.local',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: UserRole.EMPLOYEE,
      position: null,
      department: null,
      emailVerifiedAt: null,
      createdAt,
    });
  });

  it('maps department and position through their mappers', () => {
    const user = toUser({
      ...row,
      departmentId: 'department-1',
      department: { id: 'department-1', name: 'JavaScript', createdAt, updatedAt: createdAt },
      positionId: 'position-1',
      position: { id: 'position-1', name: 'Software Engineer', createdAt, updatedAt: createdAt },
    });

    expect(user.department).toEqual({ id: 'department-1', name: 'JavaScript' });
    expect(user.position).toEqual({ id: 'position-1', name: 'Software Engineer' });
  });

  it('never exposes the password hash', () => {
    expect(toUser(row)).not.toHaveProperty('passwordHash');
  });
});
