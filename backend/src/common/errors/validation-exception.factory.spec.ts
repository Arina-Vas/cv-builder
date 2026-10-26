import { ValidationError } from 'class-validator';
import { ErrorCode } from './error-code.enum';
import { validationExceptionFactory } from './validation-exception.factory';

const validationError = (
  property: string,
  constraints: Record<string, string> = {},
  children: ValidationError[] = [],
): ValidationError => Object.assign(new ValidationError(), { property, constraints, children });

describe('validationExceptionFactory', () => {
  it('returns BAD_USER_INPUT', () => {
    const error = validationExceptionFactory([
      validationError('name', { isNotEmpty: 'Department name is required' }),
    ]);

    expect(error.extensions['code']).toBe(ErrorCode.BAD_USER_INPUT);
    expect(error.message).toBe('Validation failed');
  });

  it('returns one entry per violated rule', () => {
    const error = validationExceptionFactory([
      validationError('name', {
        isNotEmpty: 'Department name is required',
        maxLength: 'Department name must not exceed 100 characters',
      }),
      validationError('pageSize', { isIn: 'pageSize must be one of 10, 20, 50' }),
    ]);

    expect(error.extensions['fields']).toEqual([
      { field: 'name', message: 'Department name is required' },
      { field: 'name', message: 'Department name must not exceed 100 characters' },
      { field: 'pageSize', message: 'pageSize must be one of 10, 20, 50' },
    ]);
  });

  it('joins nested fields with a dot', () => {
    const error = validationExceptionFactory([
      validationError('address', {}, [validationError('city', { isNotEmpty: 'City is required' })]),
    ]);

    expect(error.extensions['fields']).toEqual([
      { field: 'address.city', message: 'City is required' },
    ]);
  });
});
