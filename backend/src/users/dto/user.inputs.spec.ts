import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '@/auth/dto/credentials.input';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { UserRole } from '@/common/graphql/enums';
import { VALIDATOR_OPTIONS } from '@/common/validation/validator-options';
import { UserSortField } from '@/users/models/user-sort-field.enum';
import { CreateUserInput } from './create-user.input';
import { UpdateProfileInput } from './update-profile.input';
import { UpdateUserInput } from './update-user.input';
import { UsersArgs } from './users.args';

const DEPARTMENT_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const POSITION_ID = '7a1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
const USER_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const VALID_CREATE = {
  email: 'jane.doe@cv-builder.local',
  password: 'secret123',
  firstName: 'Jane',
  lastName: 'Doe',
  departmentId: DEPARTMENT_ID,
  positionId: POSITION_ID,
  role: UserRole.EMPLOYEE,
};

// Same steps as the global ValidationPipe: transform, then validate with one error per field
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const messages = Object.fromEntries(
    validateSync(dto, VALIDATOR_OPTIONS).map((error) => [
      error.property,
      Object.values(error.constraints ?? {}),
    ]),
  );
  return { dto, messages };
};

describe('CreateUserInput', () => {
  it('accepts a valid input, trims the email and normalizes the names', () => {
    const { dto, messages } = check(CreateUserInput, {
      ...VALID_CREATE,
      email: '  jane.doe@cv-builder.local ',
      firstName: '  Mary   Jane ',
      lastName: ' Doe ',
    });

    expect(messages).toEqual({});
    expect(dto.email).toBe('jane.doe@cv-builder.local');
    expect(dto.firstName).toBe('Mary Jane');
    expect(dto.lastName).toBe('Doe');
  });

  it('gives the "required" messages of the Create user modal for empty fields', () => {
    const { messages } = check(CreateUserInput, {
      email: '',
      password: '',
      firstName: '   ',
      lastName: '',
      departmentId: '',
      positionId: '',
      role: '',
    });

    expect(messages).toEqual({
      email: ['Email is required'],
      password: ['Password is required'],
      firstName: ['First name is required'],
      lastName: ['Last name is required'],
      departmentId: ['Department is required'],
      positionId: ['Position is required'],
      role: ['Role is required'],
    });
  });

  it('rejects an invalid email', () => {
    expect(check(CreateUserInput, { ...VALID_CREATE, email: 'jane.doe' }).messages).toEqual({
      email: ['Invalid email address'],
    });
  });

  it('rejects a password shorter than 6 characters', () => {
    expect(check(CreateUserInput, { ...VALID_CREATE, password: '12345' }).messages).toEqual({
      password: ['Password must contain at least 6 characters'],
    });
  });

  it('rejects a password longer than the maximum length', () => {
    const { messages } = check(CreateUserInput, {
      ...VALID_CREATE,
      password: 'a'.repeat(PASSWORD_MAX_LENGTH + 1),
    });

    expect(messages).toEqual({
      password: [`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`],
    });
  });

  it('accepts names of the maximum length and rejects longer ones', () => {
    const max = 'a'.repeat(MAX_NAME_LENGTH);
    const tooLong = 'a'.repeat(MAX_NAME_LENGTH + 1);

    expect(
      check(CreateUserInput, { ...VALID_CREATE, firstName: max, lastName: max }).messages,
    ).toEqual({});
    expect(
      check(CreateUserInput, { ...VALID_CREATE, firstName: tooLong, lastName: tooLong }).messages,
    ).toEqual({
      firstName: [`First name must not exceed ${MAX_NAME_LENGTH} characters`],
      lastName: [`Last name must not exceed ${MAX_NAME_LENGTH} characters`],
    });
  });

  it('rejects department and position ids that are not UUIDs', () => {
    const { messages } = check(CreateUserInput, {
      ...VALID_CREATE,
      departmentId: '42',
      positionId: 'abc',
    });

    expect(Object.keys(messages)).toEqual(['departmentId', 'positionId']);
  });

  it('rejects an unknown role', () => {
    const { messages } = check(CreateUserInput, { ...VALID_CREATE, role: 'SUPERADMIN' });

    expect(Object.keys(messages)).toEqual(['role']);
  });
});

describe('UpdateUserInput', () => {
  const VALID_UPDATE = {
    id: USER_ID,
    firstName: 'Jane',
    lastName: 'Doe',
    departmentId: DEPARTMENT_ID,
    positionId: POSITION_ID,
    role: UserRole.ADMIN,
  };

  it('accepts the id, names, department, position and role', () => {
    expect(check(UpdateUserInput, VALID_UPDATE).messages).toEqual({});
  });

  it('inherits the names, department, position and role rules', () => {
    const { messages } = check(UpdateUserInput, {
      id: USER_ID,
      firstName: '  ',
      lastName: 'a'.repeat(101),
      departmentId: '',
      positionId: '',
      role: '',
    });

    expect(messages).toEqual({
      firstName: ['First name is required'],
      lastName: ['Last name must not exceed 100 characters'],
      departmentId: ['Department is required'],
      positionId: ['Position is required'],
      role: ['Role is required'],
    });
  });

  it('rejects an id that is not a UUID', () => {
    expect(Object.keys(check(UpdateUserInput, { ...VALID_UPDATE, id: '42' }).messages)).toEqual([
      'id',
    ]);
  });
});

describe('UpdateProfileInput', () => {
  const VALID_PROFILE = {
    id: USER_ID,
    firstName: 'Jane',
    lastName: 'Doe',
    departmentId: DEPARTMENT_ID,
    positionId: POSITION_ID,
  };

  it('accepts the id, names, department and position without a role', () => {
    const { dto, messages } = check(UpdateProfileInput, {
      ...VALID_PROFILE,
      firstName: '  Mary   Jane ',
    });

    expect(messages).toEqual({});
    expect(dto.firstName).toBe('Mary Jane');
  });

  it('gives the Profile tab messages for empty and too long fields', () => {
    const { messages } = check(UpdateProfileInput, {
      id: USER_ID,
      firstName: '',
      lastName: 'a'.repeat(MAX_NAME_LENGTH + 1),
      departmentId: '',
      positionId: '',
    });

    expect(messages).toEqual({
      firstName: ['First name is required'],
      lastName: ['Last name must not exceed 100 characters'],
      departmentId: ['Department is required'],
      positionId: ['Position is required'],
    });
  });

  it('rejects an id that is not a UUID', () => {
    expect(Object.keys(check(UpdateProfileInput, { ...VALID_PROFILE, id: '42' }).messages)).toEqual(
      ['id'],
    );
  });
});

describe('UsersArgs', () => {
  it('has no sort field by default', () => {
    const { dto, messages } = check(UsersArgs, {});

    expect(dto.sortBy).toBeUndefined();
    expect(messages).toEqual({});
  });

  it('accepts every sort field', () => {
    for (const sortBy of Object.values(UserSortField)) {
      expect(check(UsersArgs, { sortBy }).messages).toEqual({});
    }
  });

  it('rejects an unknown sort field', () => {
    expect(Object.keys(check(UsersArgs, { sortBy: 'email' }).messages)).toEqual(['sortBy']);
  });

  it('keeps the inherited pagination rules', () => {
    expect(Object.keys(check(UsersArgs, { pageSize: 15 }).messages)).toEqual(['pageSize']);
  });

  it('treats a blank search as no filter', () => {
    expect(check(UsersArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
