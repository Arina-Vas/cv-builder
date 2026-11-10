import { describe, expect, it } from 'vitest';
import { UserProfile } from '@/features/users/components/user-profile/UserProfile';
import UserProfilePage from './page';

describe('UserProfilePage', () => {
  it('passes the userId from the URL to the profile', async () => {
    const page = await UserProfilePage({ params: Promise.resolve({ userId: 'u1' }) });

    expect(page.type).toBe(UserProfile);
    expect(page.props).toEqual({ userId: 'u1' });
  });
});
