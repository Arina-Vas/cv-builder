import { hashPassword } from '@/common/crypto/password';
import { UserRole } from '@/common/graphql/enums';
import type { PrismaService } from '@/prisma/prisma.service';
import type { GqlClient } from './graphql-client';

export const PASSWORD = 'secret123';

export const USER_FIELDS = 'id email role emailVerifiedAt';

export const SIGN_UP = `mutation ($input: SignUpInput!) { signUp(input: $input) { ${USER_FIELDS} } }`;
export const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { ${USER_FIELDS} } }`;
export const ME = `query { me { ${USER_FIELDS} } }`;
export const REFRESH = 'mutation { refresh }';
export const LOGOUT = 'mutation { logout }';
export const VERIFY_EMAIL = `mutation ($input: VerifyEmailInput!) { verifyEmail(input: $input) { ${USER_FIELDS} } }`;
export const RESEND_CODE = 'mutation { resendVerificationCode }';
export const REQUEST_RESET =
  'mutation ($input: RequestPasswordResetInput!) { requestPasswordReset(input: $input) }';
export const RESET_PASSWORD =
  'mutation ($input: ResetPasswordInput!) { resetPassword(input: $input) }';
export const ADMIN_PROBE = 'query { adminProbe }';
export const VERIFIED_PROBE = 'mutation { verifiedProbe }';

export interface GqlUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
}

let users = 0;

/** A unique email, so tests never collide even before the tables are emptied. */
export const uniqueEmail = (label = 'user'): string => {
  users += 1;
  return `${label}-${users}@cv-builder.test`;
};

/** Inserts a user straight into the database, skipping sign-up and email verification. */
export const createUser = async (
  prisma: PrismaService,
  {
    role = UserRole.EMPLOYEE,
    verified = true,
    email = uniqueEmail(),
  }: { role?: UserRole; verified?: boolean; email?: string } = {},
): Promise<{ id: string; email: string }> =>
  prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(PASSWORD),
      role,
      emailVerifiedAt: verified ? new Date() : null,
    },
    select: { id: true, email: true },
  });

export const signIn = (client: GqlClient, email: string, password = PASSWORD): Promise<unknown> =>
  client.data(SIGN_IN, { input: { email, password } });
