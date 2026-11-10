import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { renderWithProviders } from '@/test/render';
import SkillsPage from './page';

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({ useCurrentUser: vi.fn() }));
// the catalog itself is covered by Skills.test.tsx; here only which page the role gets
vi.mock('@/features/skills/components/Skills', () => ({
  Skills: () => <p>Skills catalog</p>,
}));

const asUser = (role: 'ADMIN' | 'EMPLOYEE' | null) =>
  vi.mocked(useCurrentUser).mockReturnValue({
    user: role && { id: '1', role },
  } as unknown as ReturnType<typeof useCurrentUser>);

describe('/skills', () => {
  it('shows the skill catalog to an Admin', () => {
    asUser('ADMIN');
    renderWithProviders(<SkillsPage />);

    expect(screen.getByText('Skills catalog')).toBeInTheDocument();
  });

  it('does not show the catalog to an Employee', () => {
    asUser('EMPLOYEE');
    renderWithProviders(<SkillsPage />);

    expect(screen.queryByText('Skills catalog')).not.toBeInTheDocument();
  });

  it('renders nothing until the role is known', () => {
    asUser(null);
    renderWithProviders(<SkillsPage />);

    expect(screen.queryByText('Skills catalog')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
