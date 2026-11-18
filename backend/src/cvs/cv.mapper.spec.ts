import { UserRole } from '@/common/graphql/enums';
import { cvInclude, toCv, type CvWithUser } from './cv.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: CvWithUser = {
  id: 'cv-1',
  name: 'Frontend Developer',
  education: 'BSUIR, Software Engineering',
  description: 'Five years of web development',
  userId: 'user-1',
  user: {
    id: 'user-1',
    email: 'employee@cv-builder.local',
    emailVerifiedAt: null,
    passwordHash: 'secret-hash',
    firstName: 'Anna',
    lastName: 'Smith',
    role: UserRole.EMPLOYEE,
    avatarKey: null,
    departmentId: 'department-1',
    department: { id: 'department-1', name: 'JavaScript', createdAt, updatedAt: createdAt },
    positionId: null,
    position: null,
    createdAt,
    updatedAt: createdAt,
  },
  createdAt,
  updatedAt: createdAt,
};

describe('cvInclude', () => {
  it('loads the owner with the relations the User type needs', () => {
    expect(cvInclude).toEqual({ user: { include: { department: true, position: true } } });
  });
});

describe('toCv', () => {
  it('maps the CV with its owner and drops service fields', () => {
    expect(toCv(row)).toEqual({
      id: 'cv-1',
      name: 'Frontend Developer',
      education: 'BSUIR, Software Engineering',
      description: 'Five years of web development',
      user: {
        id: 'user-1',
        email: 'employee@cv-builder.local',
        firstName: 'Anna',
        lastName: 'Smith',
        avatarKey: null,
        role: UserRole.EMPLOYEE,
        position: null,
        department: { id: 'department-1', name: 'JavaScript' },
        emailVerifiedAt: null,
        createdAt,
      },
    });
  });

  it('never exposes the owner password hash', () => {
    expect(toCv(row).user).not.toHaveProperty('passwordHash');
  });
});
