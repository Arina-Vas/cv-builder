import { screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { renderWithProviders } from '@/test/render';
import UserLanguagesPage from './page';

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({ useCurrentUser: vi.fn() }));
// the list itself is covered by UserLanguages.test.tsx; here only what the tab passes to it
vi.mock('@/features/languages/user-languages/components/UserLanguages', () => ({
  UserLanguages: ({
    userId,
    canEdit,
    emptyMessage,
  }: {
    userId: string;
    canEdit: boolean;
    emptyMessage: string;
  }) => <p>{`languages of ${userId}, canEdit ${canEdit}, empty "${emptyMessage}"`}</p>,
}));

const PROFILE_ID = 'u-profile';

const viewProfileAs = (me: { id: string; role: 'ADMIN' | 'EMPLOYEE' } | null) => {
  vi.mocked(useParams).mockReturnValue({ userId: PROFILE_ID });
  vi.mocked(useCurrentUser).mockReturnValue({ user: me } as unknown as ReturnType<
    typeof useCurrentUser
  >);
  renderWithProviders(<UserLanguagesPage />);
};

describe('/users/[userId]/languages', () => {
  it('shows the languages of the opened profile, with the profile empty text', () => {
    viewProfileAs({ id: 'u-me', role: 'EMPLOYEE' });

    expect(
      screen.getByText(/languages of u-profile,.*empty "No languages added yet"/),
    ).toBeInTheDocument();
  });

  it.each([
    ['the owner', { id: PROFILE_ID, role: 'EMPLOYEE' }, true],
    ['an Admin', { id: 'u-admin', role: 'ADMIN' }, true],
    ['an Employee on another profile', { id: 'u-me', role: 'EMPLOYEE' }, false],
  ] as const)('canEdit for %s is %s', (_, me, canEdit) => {
    viewProfileAs(me);

    expect(screen.getByText(new RegExp(`canEdit ${canEdit}`))).toBeInTheDocument();
  });

  it('renders nothing until the current user is known', () => {
    viewProfileAs(null);

    expect(screen.queryByText(/languages of/)).not.toBeInTheDocument();
  });
});
