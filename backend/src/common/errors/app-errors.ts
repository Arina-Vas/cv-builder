import { GraphQLError } from 'graphql';
import { ErrorCode } from './error-code.enum';
import { ErrorReason } from './error-reason.enum';

export interface FieldError {
  field: string;
  message: string;
}

export interface BadUserInputOptions {
  fields: FieldError[];
  message?: string;
  reason?: ErrorReason;
}

export const unauthenticated = (message = 'Authentication required'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.UNAUTHENTICATED } });

export const forbidden = (
  message = 'You are not authorized to perform this action',
): GraphQLError => new GraphQLError(message, { extensions: { code: ErrorCode.FORBIDDEN } });

export const emailNotVerified = (
  message = 'Please verify your email to perform this action',
): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.EMAIL_NOT_VERIFIED } });

export const notFound = (message = 'Not found'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.NOT_FOUND } });

export const badUserInput = ({
  fields,
  message = 'Validation failed',
  reason,
}: BadUserInputOptions): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: ErrorCode.BAD_USER_INPUT, fields, ...(reason && { reason }) },
  });

export const conflict = (field: string, message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.CONFLICT, field } });

export const entityInUse = (message: string, ids?: string[]): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.ENTITY_IN_USE, ...(ids && { ids }) } });

export const operationNotAllowed = (message: string, reason?: ErrorReason): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: ErrorCode.OPERATION_NOT_ALLOWED, ...(reason && { reason }) },
  });

export const rateLimited = (retryAfter: number, message = 'Too many requests'): GraphQLError =>
  new GraphQLError(message, { extensions: { code: ErrorCode.RATE_LIMITED, retryAfter } });

export const internalError = (): GraphQLError =>
  new GraphQLError('Something went wrong. Please try again later', {
    extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
  });
