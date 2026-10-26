import { GraphQLError } from 'graphql';
import { ErrorCode } from './error-code.enum';

export interface FieldError {
  field: string;
  message: string;
}

export const unauthenticated = (message = 'Authentication required'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.UNAUTHENTICATED } });

export const forbidden = (
  message = 'You are not authorized to perform this action',
): GraphQLError => new GraphQLError(message, { extensions: { code: ErrorCode.FORBIDDEN } });

export const notFound = (message = 'Not found'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.NOT_FOUND } });

export const badUserInput = (fields: FieldError[], message = 'Validation failed'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.BAD_USER_INPUT, fields } });

export const conflict = (field: string, message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.CONFLICT, field } });

export const entityInUse = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.ENTITY_IN_USE } });

export const rateLimited = (retryAfter: number, message = 'Too many requests'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.RATE_LIMITED, retryAfter } });

export const internalError = (): GraphQLError =>
  new GraphQLError('Something went wrong. Please try again later', {
    extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
  });
