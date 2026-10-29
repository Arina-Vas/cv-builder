import { gql, type TypedDocumentNode } from '@apollo/client';

// Types are written by hand until the auth schema reaches `dev` and codegen is set up.
// Source of truth: backend/schema.gql on backend/feature/auth.

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
}

interface InputVariables<TInput> {
  input: TInput;
}

export interface CredentialsInput {
  email: string;
  password: string;
}

export interface SignUpInput extends CredentialsInput {
  confirmPassword: string;
}

const AUTH_USER_FIELDS = gql`
  fragment AuthUserFields on User {
    id
    email
    role
    emailVerifiedAt
  }
`;

export const ME: TypedDocumentNode<{ me: AuthUser }> = gql`
  query Me {
    me {
      ...AuthUserFields
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const SIGN_IN: TypedDocumentNode<
  { signIn: AuthUser },
  InputVariables<CredentialsInput>
> = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      ...AuthUserFields
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const SIGN_UP: TypedDocumentNode<{ signUp: AuthUser }, InputVariables<SignUpInput>> = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      ...AuthUserFields
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const VERIFY_EMAIL: TypedDocumentNode<
  { verifyEmail: AuthUser },
  InputVariables<{ code: string }>
> = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      ...AuthUserFields
    }
  }
  ${AUTH_USER_FIELDS}
`;

export const RESEND_VERIFICATION_CODE: TypedDocumentNode<{ resendVerificationCode: boolean }> = gql`
  mutation ResendVerificationCode {
    resendVerificationCode
  }
`;

export const REQUEST_PASSWORD_RESET: TypedDocumentNode<
  { requestPasswordReset: boolean },
  InputVariables<{ email: string }>
> = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`;

export const RESET_PASSWORD: TypedDocumentNode<
  { resetPassword: boolean },
  InputVariables<{ token: string; newPassword: string; confirmPassword: string }>
> = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export const LOGOUT: TypedDocumentNode<{ logout: boolean }> = gql`
  mutation Logout {
    logout
  }
`;
