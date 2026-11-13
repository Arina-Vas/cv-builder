import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { renderWithProviders } from '@/test/render';
import LanguagesPage from './page';

vi.mock('@/features/auth/hooks/useCurrentUser', () => ({ useCurrentUser: vi.fn() }));
// the catalog itself is covered by Languages.test.tsx; here only which page the role gets
vi.mock('@/features/languages/components/Languages', () => ({
  Languages: () => <p>Languages catalog</p>,
}));

const asUser = (role: 'ADMIN' | 'EMPLOYEE' | null) =>
  vi.mocked(useCurrentUser).mockReturnValue({
    user: role && { id: '1', role },
  } as unknown as ReturnType<typeof useCurrentUser>);

describe('/languages', () => {
  it('shows the language catalog to an Admin', () => {
    asUser('ADMIN');
    renderWithProviders(<LanguagesPage />);

    expect(screen.getByText('Languages catalog')).toBeInTheDocument();
  });

  it('does not show the catalog to an Employee', () => {
    asUser('EMPLOYEE');
    renderWithProviders(<LanguagesPage />);

    expect(screen.queryByText('Languages catalog')).not.toBeInTheDocument();
  });

  it('renders nothing until the role is known', () => {
    asUser(null);
    renderWithProviders(<LanguagesPage />);

    expect(screen.queryByText('Languages catalog')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
