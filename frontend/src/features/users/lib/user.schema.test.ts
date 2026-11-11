import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { profileSchema, userSchema } from './user.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });

const valid = {
  email: 'jane@example.com',
  password: 'secret1',
  firstName: 'Jane',
  lastName: 'Doe',
  departmentId: 'd1',
  positionId: 'p1',
  role: 'EMPLOYEE',
};

/** the first message per field, as zodResolver shows it */
const errorsOf = (values: Record<string, unknown>, mode: 'create' | 'update' = 'create') => {
  const errors: Record<string, string> = {};
  for (const issue of userSchema(t, mode).safeParse(values).error?.issues ?? []) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
};

describe('userSchema (create)', () => {
  it('passes valid values and trims the text', () => {
    expect(
      userSchema(t).parse({ ...valid, email: ' jane@example.com ', firstName: ' Jane ' }),
    ).toEqual(valid);
  });

  it('shows the spec messages for an empty form', () => {
    expect(
      errorsOf({
        email: '',
        password: '',
        firstName: ' ',
        lastName: '',
        departmentId: '',
        positionId: '',
      }),
    ).toEqual({
      email: 'Email is required',
      password: 'Password is required',
      firstName: 'First name is required',
      lastName: 'Last name is required',
      departmentId: 'Department is required',
      positionId: 'Position is required',
      role: 'Role is required',
    });
  });

  it('rejects an invalid email', () => {
    expect(errorsOf({ ...valid, email: 'jane@' })).toEqual({ email: 'Invalid email address' });
  });

  it('needs at least 6 password characters, at most 128', () => {
    expect(errorsOf({ ...valid, password: '12345' })).toEqual({
      password: 'Password must contain at least 6 characters',
    });
    expect(errorsOf({ ...valid, password: 'a'.repeat(129) })).toEqual({
      password: 'Password must not exceed 128 characters',
    });
  });

  it('limits names to 100 characters', () => {
    expect(errorsOf({ ...valid, firstName: 'a'.repeat(100) })).toEqual({});
    expect(errorsOf({ ...valid, firstName: 'a'.repeat(101), lastName: 'b'.repeat(101) })).toEqual({
      firstName: 'First name must not exceed 100 characters',
      lastName: 'Last name must not exceed 100 characters',
    });
  });

  it('accepts only known roles', () => {
    expect(errorsOf({ ...valid, role: 'ROOT' })).toEqual({ role: 'Role is required' });
  });
});

describe('userSchema (update)', () => {
  it('does not validate the disabled email and password', () => {
    expect(errorsOf({ ...valid, email: '', password: '' }, 'update')).toEqual({});
  });

  it('still validates the names, department, position and role', () => {
    expect(
      errorsOf(
        {
          ...valid,
          firstName: ' ',
          lastName: 'a'.repeat(101),
          departmentId: '',
          positionId: '',
          role: '',
        },
        'update',
      ),
    ).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name must not exceed 100 characters',
      departmentId: 'Department is required',
      positionId: 'Position is required',
      role: 'Role is required',
    });
  });
});

describe('profileSchema', () => {
  const profile = { firstName: 'Jane', lastName: 'Doe', departmentId: 'd1', positionId: 'p1' };

  const profileErrorsOf = (values: Record<string, unknown>) => {
    const errors: Record<string, string> = {};
    for (const issue of profileSchema(t).safeParse(values).error?.issues ?? []) {
      errors[String(issue.path[0])] ??= issue.message;
    }
    return errors;
  };

  it('passes valid values, trims them and drops the fields the profile does not edit', () => {
    expect(
      profileSchema(t).parse({ ...profile, firstName: ' Jane ', email: 'x@y.z', role: 'ADMIN' }),
    ).toEqual(profile);
  });

  it('shows the spec messages for empty fields', () => {
    expect(
      profileErrorsOf({ firstName: ' ', lastName: '', departmentId: '', positionId: '' }),
    ).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      departmentId: 'Department is required',
      positionId: 'Position is required',
    });
  });

  it('limits names to 100 characters', () => {
    expect(profileErrorsOf({ ...profile, firstName: 'a'.repeat(100) })).toEqual({});
    expect(
      profileErrorsOf({ ...profile, firstName: 'a'.repeat(101), lastName: 'b'.repeat(101) }),
    ).toEqual({
      firstName: 'First name must not exceed 100 characters',
      lastName: 'Last name must not exceed 100 characters',
    });
  });
});
