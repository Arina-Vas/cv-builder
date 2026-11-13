import { screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { renderWithProviders } from '@/test/render';
import UserSkillsPage from './page';

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({ useCurrentUser: vi.fn() }));
// the list itself is covered by UserSkills.test.tsx; here only what the tab passes to it
vi.mock('@/features/skills/user-skills/components/UserSkills', () => ({
  UserSkills: ({
    userId,
    canEdit,
    emptyMessage,
  }: {
    userId: string;
    canEdit: boolean;
    emptyMessage: string;
  }) => <p>{`skills of ${userId}, canEdit ${canEdit}, empty "${emptyMessage}"`}</p>,
}));

const PROFILE_ID = 'u-profile';

const viewProfileAs = (me: { id: string; role: 'ADMIN' | 'EMPLOYEE' } | null) => {
  vi.mocked(useParams).mockReturnValue({ userId: PROFILE_ID });
  vi.mocked(useCurrentUser).mockReturnValue({ user: me } as unknown as ReturnType<
    typeof useCurrentUser
  >);
  renderWithProviders(<UserSkillsPage />);
};

describe('/users/[userId]/skills', () => {
  it('shows the skills of the opened profile, with the profile empty text', () => {
    viewProfileAs({ id: 'u-me', role: 'EMPLOYEE' });

    expect(
      screen.getByText(/skills of u-profile,.*empty "No skills added yet"/),
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

    expect(screen.queryByText(/skills of/)).not.toBeInTheDocument();
  });
});
