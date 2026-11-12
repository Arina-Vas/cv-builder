import type { MockLink } from '@apollo/client/testing';
import { ME } from '@/features/auth/api/auth.operations';

interface MeMockOptions {
  id?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  /** Unverified users get locked actions (useVerifiedGuard) */
  verified?: boolean;
}

/** The signed-in user for pages that check the role or email verification */
export const meMock = ({
  id = 'me',
  role = 'ADMIN',
  verified = true,
}: MeMockOptions = {}): MockLink.MockedResponse => ({
  request: { query: ME },
  result: {
    data: {
      me: {
        __typename: 'User',
        id,
        email: 'me@example.test',
        role,
        emailVerifiedAt: verified ? '2026-11-01T10:00:00.000Z' : null,
        firstName: 'Ada',
        lastName: 'Lovelace',
        avatarUrl: null,
      },
    },
  },
});
