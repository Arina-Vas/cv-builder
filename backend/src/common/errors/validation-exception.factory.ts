import { badUserInput, FieldError } from './app-errors';
import { ValidationError } from 'class-validator';
import { GraphQLError } from 'graphql';

const toFieldErrors = (errors: ValidationError[], parent = ''): FieldError[] => {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownError = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));

    return [...ownError, ...toFieldErrors(error.children ?? [], field)];
  });
};

export const validationExceptionFactory = (errors: ValidationError[]): GraphQLError =>
  badUserInput(toFieldErrors(errors));
