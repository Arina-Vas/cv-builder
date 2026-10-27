import { GraphQLError } from 'graphql';
import { emailNotVerified } from './app-errors';
import { ErrorCode } from './error-code.enum';

describe('app errors', () => {
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
});
