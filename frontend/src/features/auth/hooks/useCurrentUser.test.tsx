import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ME } from '../api/auth.operations';
import { useCurrentUser } from './useCurrentUser';

const me = {
  __typename: 'User' as const,
  id: '1',
  email: 'admin@example.test',
  role: 'ADMIN' as const,
  emailVerifiedAt: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
};

function Probe() {
  const { user, loading, error } = useCurrentUser();
  if (loading) return <p>loading</p>;
  if (error) return <p>error</p>;
  return (
    <p>
      {user?.firstName} {user?.role}
    </p>
  );
}

describe('useCurrentUser', () => {
  it('returns the signed-in user from the ME query', async () => {
    renderWithProviders(<Probe />, {
      mocks: [{ request: { query: ME }, result: { data: { me } } }],
    });

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('Ada ADMIN')).toBeInTheDocument();
  });

  it('exposes the error when the request fails', async () => {
    renderWithProviders(<Probe />, {
      mocks: [{ request: { query: ME }, error: new Error('Network down') }],
    });

    expect(await screen.findByText('error')).toBeInTheDocument();
  });
});
