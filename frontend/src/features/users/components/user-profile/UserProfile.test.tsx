import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { Component, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ME, RESEND_VERIFICATION_CODE } from '@/features/auth/api/auth.operations';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { UPDATE_PROFILE, USER, USER_FORM_OPTIONS } from '../../api/users.operations';
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
  emailVerifiedAt: null as string | null,
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

type Viewer = { id: string; role: 'ADMIN' | 'EMPLOYEE' };

const OWNER: Viewer = { id: USER_ID, role: 'EMPLOYEE' };
const OTHER_EMPLOYEE: Viewer = { id: 'u2', role: 'EMPLOYEE' };
const ADMIN: Viewer = { id: 'a1', role: 'ADMIN' };

// ME and USER are the same User:<id> record in the cache, so for the owner they must agree
const meMock = (
  { id, role }: Viewer,
  emailVerifiedAt: string | null = null,
): MockLink.MockedResponse => ({
  request: { query: ME },
  result: {
    data: {
      me: {
        __typename: 'User',
        id,
        email: `${id}@example.com`,
        role,
        emailVerifiedAt,
        firstName: id === USER_ID ? rostislav.firstName : 'Someone',
        lastName: id === USER_ID ? rostislav.lastName : 'Else',
        avatarUrl: null,
      },
    },
  },
});

const optionsMock: MockLink.MockedResponse = {
  request: { query: USER_FORM_OPTIONS },
  result: {
    data: {
      departments: {
        __typename: 'DepartmentPage',
        items: [rostislav.department, { ...rostislav.department, id: 'd2', name: 'Angular' }],
      },
      positions: {
        __typename: 'PositionPage',
        items: [rostislav.position, { ...rostislav.position, id: 'p2', name: 'QA Engineer' }],
      },
    },
  },
};

type ProfileInput = {
  firstName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
};

const savedInput: ProfileInput = {
  firstName: 'Rostislav',
  lastName: 'Harlanov',
  departmentId: 'd1',
  positionId: 'p1',
};

const updateRequest = (input: Partial<ProfileInput>) => ({
  query: UPDATE_PROFILE,
  variables: { input: { id: USER_ID, ...savedInput, ...input } },
});

const updateMock = (
  input: Partial<ProfileInput>,
  user: typeof rostislav,
): MockLink.MockedResponse => ({
  request: updateRequest(input),
  result: { data: { updateProfile: user } },
});

const renderProfile = (
  mocks: MockLink.MockedResponse[],
  viewer = OTHER_EMPLOYEE,
  viewerEmailVerifiedAt: string | null = null,
) =>
  renderWithProviders(
    <CatchErrors>
      <UserProfile userId={USER_ID} />
    </CatchErrors>,
    { mocks: [meMock(viewer, viewerEmailVerifiedAt), ...mocks] },
  );

const choose = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  label: string,
  option: string,
) => {
  const trigger = screen.getByRole('combobox', { name: label });
  await expect.poll(() => trigger).toBeEnabled();
  await user.click(trigger);
  await user.click(within(document.body).getByRole('option', { name: option }));
};

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

describe('UserProfile — editing', () => {
  it('lets the owner edit the fields; UPDATE is disabled until something changes', async () => {
    const { user } = renderProfile([userMock(), optionsMock], OWNER);

    const firstName = await screen.findByRole('textbox', { name: 'First Name' });
    const update = screen.getByRole('button', { name: 'Update' });

    expect(firstName).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Last Name' })).toBeEnabled();
    expect(update).toBeDisabled();

    await user.type(firstName, 'x');
    expect(update).toBeEnabled();

    // back to the saved value → nothing changed again
    await user.type(firstName, '{Backspace}');
    expect(update).toBeDisabled();
  });

  it('saves the changes, shows a toast and disables UPDATE again with the saved values', async () => {
    const saved = {
      ...rostislav,
      firstName: 'Ross',
      department: { ...rostislav.department, id: 'd2', name: 'Angular' },
    };
    const { user } = renderProfile(
      [userMock(), optionsMock, updateMock({ firstName: 'Ross', departmentId: 'd2' }, saved)],
      OWNER,
    );

    const firstName = await screen.findByRole('textbox', { name: 'First Name' });
    await user.clear(firstName);
    await user.type(firstName, 'Ross');
    await choose(user, 'Department', 'Angular');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Profile has been updated')).toBeInTheDocument();
    // the header shows the backend response through the Apollo cache
    expect(screen.getByRole('heading', { level: 1, name: 'Ross Harlanov' })).toBeInTheDocument();
    expect(firstName).toHaveValue('Ross');
    expect(screen.getByRole('combobox', { name: 'Department' })).toHaveTextContent('Angular');
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });

  it('lets an admin edit another user and change the position', async () => {
    const saved = {
      ...rostislav,
      position: { ...rostislav.position, id: 'p2', name: 'QA Engineer' },
    };
    const { user } = renderProfile(
      [userMock(), optionsMock, updateMock({ positionId: 'p2' }, saved)],
      ADMIN,
    );

    await screen.findByRole('textbox', { name: 'First Name' });
    await choose(user, 'Position', 'QA Engineer');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Profile has been updated')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Position' })).toHaveTextContent('QA Engineer');
  });

  it('shows the spec messages and keeps UPDATE disabled while a field is invalid', async () => {
    const { user } = renderProfile([userMock(), optionsMock], OWNER);

    const firstName = await screen.findByRole('textbox', { name: 'First Name' });
    await user.clear(firstName);
    await user.tab();

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();

    await user.type(firstName, 'a'.repeat(101));
    expect(
      await screen.findByText('First name must not exceed 100 characters'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });

  it('keeps the entered values and shows a friendly message when the save fails', async () => {
    const { user } = renderProfile(
      [
        userMock(),
        optionsMock,
        {
          request: updateRequest({ lastName: 'Smith' }),
          result: {
            errors: [new GraphQLError('raw backend text', { extensions: { code: 'FORBIDDEN' } })],
          },
        },
      ],
      OWNER,
    );

    const lastName = await screen.findByRole('textbox', { name: 'Last Name' });
    await user.clear(lastName);
    await user.type(lastName, 'Smith');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "You don't have permission to do this",
    );
    expect(screen.queryByText('raw backend text')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile has been updated')).not.toBeInTheDocument();
    expect(lastName).toHaveValue('Smith');
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();
  });

  it('keeps another employee read-only and does not load the department/position catalog', async () => {
    renderProfile([userMock()], OTHER_EMPLOYEE);

    expect(await screen.findByRole('textbox', { name: 'First Name' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
    // there is no USER_FORM_OPTIONS mock: the select shows the value from the profile query
    expect(screen.getByRole('combobox', { name: 'Department' })).toHaveTextContent('React');
  });
});

describe('UserProfile — verify email', () => {
  const verified = { ...rostislav, emailVerifiedAt: '2024-02-01T12:00:00.000Z' };

  const resendMock = (result: MockLink.MockedResponse['result']): MockLink.MockedResponse => ({
    request: { query: RESEND_VERIFICATION_CODE },
    result,
  });

  const resendError = (code: string, extensions: Record<string, unknown> = {}) =>
    resendMock({
      errors: [new GraphQLError('raw backend text', { extensions: { code, ...extensions } })],
    });

  it('is shown only to the owner whose email is not verified', async () => {
    renderProfile([userMock(), optionsMock], OWNER);

    expect(await screen.findByRole('button', { name: 'Verify email' })).toBeEnabled();
  });

  it('is hidden when the email is already verified', async () => {
    renderProfile([userMock(verified), optionsMock], OWNER, verified.emailVerifiedAt);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Verify email' })).not.toBeInTheDocument();
  });

  it("is hidden for an admin on someone else's unverified profile", async () => {
    renderProfile([userMock(), optionsMock], ADMIN);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify email' })).not.toBeInTheDocument();
  });

  it('sends a new code, shows the toast and opens the Verification page', async () => {
    const { user } = renderProfile(
      [userMock(), optionsMock, resendMock({ data: { resendVerificationCode: true } })],
      OWNER,
    );

    await user.click(await screen.findByRole('button', { name: 'Verify email' }));

    expect(await screen.findByText('Verification email has been sent')).toBeInTheDocument();
    expect(mockRouter.push).toHaveBeenCalledWith('/verify-email?sent=1');
  });

  it('shows the spec error and stays on the page when sending fails', async () => {
    const { user } = renderProfile(
      [userMock(), optionsMock, resendError('INTERNAL_SERVER_ERROR')],
      OWNER,
    );

    await user.click(await screen.findByRole('button', { name: 'Verify email' }));

    expect(await screen.findByText('Failed to send verification email')).toBeInTheDocument();
    expect(screen.queryByText('raw backend text')).not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('asks to wait when a code was requested too recently', async () => {
    const { user } = renderProfile(
      [userMock(), optionsMock, resendError('RATE_LIMITED', { retryAfter: 42 })],
      OWNER,
    );

    await user.click(await screen.findByRole('button', { name: 'Verify email' }));

    expect(
      await screen.findByText('Too many attempts. Try again in 42 seconds'),
    ).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('reloads the profile and hides the button when the email was verified meanwhile', async () => {
    const { user } = renderProfile(
      [
        userMock(),
        optionsMock,
        resendError('CONFLICT', { field: 'email' }),
        userMock(verified),
        meMock(OWNER, verified.emailVerifiedAt),
      ],
      OWNER,
    );

    await user.click(await screen.findByRole('button', { name: 'Verify email' }));

    expect(await screen.findByText('Email is already verified')).toBeInTheDocument();
    await expect
      .poll(() => screen.queryByRole('button', { name: 'Verify email' }))
      .not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
