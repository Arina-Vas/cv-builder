import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { Component, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { USER } from '../../api/users.operations';
import { UserProfile } from './UserProfile';

const USER_ID = 'u1';

const rostislav = {
  __typename: 'User' as const,
  id: USER_ID,
  email: 'thorn_pear@icloud.com',
  firstName: 'Rostislav',
  lastName: 'Harlanov',
  avatarUrl: null,
  role: 'EMPLOYEE' as const,
  // Midday UTC, so the day is the same in every time zone the tests may run in
  createdAt: '2024-01-14T12:00:00.000Z',
  emailVerifiedAt: null,
  department: { __typename: 'Department' as const, id: 'd1', name: 'React' },
  position: { __typename: 'Position' as const, id: 'p1', name: 'Software Engineer' },
};

const request = { query: USER, variables: { id: USER_ID } };

const userMock = (user = rostislav): MockLink.MockedResponse => ({
  request,
  result: { data: { user } },
});

const errorMock = (code: string): MockLink.MockedResponse => ({
  request,
  result: { errors: [new GraphQLError('raw backend text', { extensions: { code } })] },
});

// notFound() throws (like the real Next.js one), so something has to catch it
class CatchErrors extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? null : this.props.children;
  }
}

const renderProfile = (mocks: MockLink.MockedResponse[]) =>
  renderWithProviders(
    <CatchErrors>
      <UserProfile userId={USER_ID} />
    </CatchErrors>,
    { mocks },
  );

describe('UserProfile', () => {
  it('shows a skeleton with the same layout while the profile loads', () => {
    renderProfile([userMock()]);

    const skeleton = screen.getByRole('region', { name: 'Loading profile' });
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows the header: initial instead of the avatar, full name, email and member since', async () => {
    renderProfile([userMock()]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rostislav Harlanov' }),
    ).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('thorn_pear@icloud.com')).toBeInTheDocument();
    expect(screen.getByText('A member since Sun Jan 14 2024')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Loading profile' })).not.toBeInTheDocument();
  });

  it('shows the fields filled in and read-only', async () => {
    renderProfile([userMock()]);

    const firstName = await screen.findByRole('textbox', { name: 'First Name' });
    const lastName = screen.getByRole('textbox', { name: 'Last Name' });
    const department = screen.getByRole('combobox', { name: 'Department' });
    const position = screen.getByRole('combobox', { name: 'Position' });

    expect(firstName).toHaveValue('Rostislav');
    expect(lastName).toHaveValue('Harlanov');
    expect(department).toHaveTextContent('React');
    expect(position).toHaveTextContent('Software Engineer');
    for (const field of [firstName, lastName, department, position]) {
      expect(field).toBeDisabled();
    }
  });

  it('has no actions in read-only mode', async () => {
    renderProfile([userMock()]);

    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByRole('button', { name: /update|verify email/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/upload avatar image/i)).not.toBeInTheDocument();
  });

  it('shows the email as the name and empty fields when the user has no name, department or position', async () => {
    renderProfile([
      userMock({
        ...rostislav,
        firstName: null,
        lastName: null,
        department: null,
        position: null,
      } as unknown as typeof rostislav),
    ]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'thorn_pear@icloud.com' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'First Name' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Last Name' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Department' })).not.toHaveTextContent('React');
    expect(screen.getByRole('combobox', { name: 'Position' })).not.toHaveTextContent(
      'Software Engineer',
    );
  });

  it('shows the error text from the spec instead of the raw backend message', async () => {
    renderProfile([errorMock('INTERNAL_SERVER_ERROR')]);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load profile information',
    );
    expect(screen.queryByText('raw backend text')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('repeats the request on Retry and shows the profile when it succeeds', async () => {
    const { user } = renderProfile([errorMock('INTERNAL_SERVER_ERROR'), userMock()]);

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rostislav Harlanov' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens the 404 page when the user does not exist', async () => {
    // React logs the error caught by the boundary; keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderProfile([errorMock('NOT_FOUND')]);

    await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
