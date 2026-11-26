import { GraphQLError } from 'graphql';
import { badUserInput, emailNotVerified, operationNotAllowed } from './app-errors';
import { ErrorCode } from './error-code.enum';
import { ErrorReason } from './error-reason.enum';

describe('app errors', () => {
  describe('badUserInput', () => {
    const fields = [{ field: 'code', message: 'Verification code has expired' }];

    it('returns a GraphQL error with the BAD_USER_INPUT code and fields', () => {
      const error = badUserInput({ fields });

      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions['code']).toBe(ErrorCode.BAD_USER_INPUT);
      expect(error.extensions['fields']).toEqual(fields);
    });

    it('has a default message', () => {
      expect(badUserInput({ fields }).message).toBe('Validation failed');
    });

    it('uses a custom message when given', () => {
      expect(badUserInput({ fields, message: 'Verification code has expired' }).message).toBe(
        'Verification code has expired',
      );
    });

    it('adds the reason to extensions when given', () => {
      const error = badUserInput({ fields, reason: ErrorReason.EXPIRED });

      expect(error.extensions['reason']).toBe(ErrorReason.EXPIRED);
    });

    it('omits the reason key when not given', () => {
      expect(badUserInput({ fields }).extensions).not.toHaveProperty('reason');
    });
  });

  describe('emailNotVerified', () => {
    it('returns a GraphQL error with the EMAIL_NOT_VERIFIED code', () => {
      const error = emailNotVerified();

      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions['code']).toBe(ErrorCode.EMAIL_NOT_VERIFIED);
    });

    it('has a default message', () => {
      expect(emailNotVerified().message).not.toBe('');
    });

    it('uses a custom message when given', () => {
      expect(emailNotVerified('Verify your email first').message).toBe('Verify your email first');
    });
  });

  describe('operationNotAllowed', () => {
    it('returns a GraphQL error with the OPERATION_NOT_ALLOWED code', () => {
      const error = operationNotAllowed('You cannot delete your own account');

      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.extensions['code']).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
    });

    it('uses the given message', () => {
      expect(operationNotAllowed('The last admin cannot be deleted').message).toBe(
        'The last admin cannot be deleted',
      );
    });

    it('adds the reason to extensions when given', () => {
      const error = operationNotAllowed('The last admin cannot be deleted', ErrorReason.LAST_ADMIN);

      expect(error.extensions['reason']).toBe(ErrorReason.LAST_ADMIN);
    });

    it('omits the reason key when not given', () => {
      expect(operationNotAllowed('The last admin cannot be deleted').extensions).not.toHaveProperty(
        'reason',
      );
    });
  });
});
