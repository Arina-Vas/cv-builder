import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ME } from '../api/auth.operations';
import { useEmailVerified } from './useEmailVerified';

const me = {
  __typename: 'User' as const,
  id: '1',
  email: 'employee@example.test',
  role: 'EMPLOYEE' as const,
  emailVerifiedAt: null as string | null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
};

function Probe() {
  const { isVerified, loading } = useEmailVerified();
  return <p>{loading ? 'loading' : isVerified ? 'verified' : 'unverified'}</p>;
}

const renderProbe = (mock: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(<Probe />, mock);

describe('useEmailVerified', () => {
  it('reports loading until ME resolves', async () => {
    renderProbe({ mocks: [{ request: { query: ME }, result: { data: { me } } }] });

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('unverified')).toBeInTheDocument();
  });

  it('is verified when ME has emailVerifiedAt', async () => {
    renderProbe({
      mocks: [
        {
          request: { query: ME },
          result: { data: { me: { ...me, emailVerifiedAt: '2026-11-01T10:00:00.000Z' } } },
        },
      ],
    });

    expect(await screen.findByText('verified')).toBeInTheDocument();
  });

  it('is not verified when emailVerifiedAt is null', async () => {
    renderProbe({ mocks: [{ request: { query: ME }, result: { data: { me } } }] });

    expect(await screen.findByText('unverified')).toBeInTheDocument();
  });

  it('is not verified when ME fails', async () => {
    renderProbe({ mocks: [{ request: { query: ME }, error: new Error('Network down') }] });

    expect(await screen.findByText('unverified')).toBeInTheDocument();
  });
});
