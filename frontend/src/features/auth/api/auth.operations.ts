import { graphql } from '@/gql';


graphql(`
  fragment AuthUserFields on User {
    id
    email
    role
    emailVerifiedAt
  }
`);

export const ME = graphql(`
  query Me {
    me {
      ...AuthUserFields
    }
  }
`);

export const SIGN_IN = graphql(`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      ...AuthUserFields
    }
  }
`);

export const SIGN_UP = graphql(`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      ...AuthUserFields
    }
  }
`);

export const VERIFY_EMAIL = graphql(`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      ...AuthUserFields
    }
  }
`);

export const RESEND_VERIFICATION_CODE = graphql(`
  mutation ResendVerificationCode {
    resendVerificationCode
  }
`);

export const REQUEST_PASSWORD_RESET = graphql(`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`);

export const RESET_PASSWORD = graphql(`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`);

export const LOGOUT = graphql(`
  mutation Logout {
    logout
  }
`);
