import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { LOGOUT, RESET_PASSWORD } from '../../api/auth.operations';
import { subscribeToAuthEvents } from '../../lib/auth-channel';
import { ResetPasswordForm } from './ResetPasswordForm';

const TOKEN = 'reset-token';
const PASSWORD = 'newSecret1';

const request = {
  query: RESET_PASSWORD,
  variables: { input: { token: TOKEN, newPassword: PASSWORD, confirmPassword: PASSWORD } },
};

async function fillAndSubmit(ui: ReturnType<typeof renderWithProviders>['user']) {
  await ui.type(screen.getByLabelText('New password'), PASSWORD);
  await ui.type(screen.getByLabelText('Confirm password'), PASSWORD);
  await ui.click(screen.getByRole('button', { name: 'Submit' }));
}

describe('ResetPasswordForm', () => {
  it('validates the new password', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByLabelText('New password'));
    await user.tab();

    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('a click on the empty form shows every error and focuses the first field', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveFocus();
  });

  it('resets the password, ends the old session and goes to Sign In with a message', async () => {
    const logoutResult = vi.fn(() => ({ data: { logout: true } }));
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [
        { request, result: { data: { resetPassword: true } } },
        { request: { query: LOGOUT }, result: logoutResult },
      ],
    });

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Your password has been reset. Please sign in.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(logoutResult).toHaveBeenCalledTimes(1);
  });

  it('tells the other tabs that the session has ended', async () => {
    const onEvent = vi.fn();
    const unsubscribe = subscribeToAuthEvents(onEvent);
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [
        { request, result: { data: { resetPassword: true } } },
        { request: { query: LOGOUT }, result: { data: { logout: true } } },
      ],
    });

    await fillAndSubmit(user);

    await waitFor(() => expect(onEvent).toHaveBeenCalledWith('logout'));
    unsubscribe();
  });

  // the text comes from extensions.reason; the backend message is arbitrary and never shown
  it.each([
    ['INVALID', 'This password reset link is invalid'],
    ['EXPIRED', 'This password reset link has expired'],
    ['SOMETHING_NEW', 'This password reset link is invalid'],
    [undefined, 'This password reset link is invalid'],
  ])(
    'on reason %j from the backend shows "%s", keeps the passwords and stays on the page',
    async (reason, shown) => {
      const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
        mocks: [
          {
            request,
            result: {
              errors: [
                {
                  message: 'any backend text',
                  extensions: {
                    code: 'BAD_USER_INPUT',
                    fields: [{ field: 'token', message: 'any backend text' }],
                    reason,
                  },
                },
              ],
            },
          },
        ],
      });

      await fillAndSubmit(user);

      expect(await screen.findByText(shown)).toBeInTheDocument();
      expect(screen.queryByText('any backend text')).not.toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toHaveValue(PASSWORD);
      expect(screen.getByLabelText('Confirm password')).toHaveValue(PASSWORD);
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );

  it('without a token shows the invalid link state instead of the form', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token="" />);

    expect(screen.getByText('This password reset link is invalid')).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Request a new link' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/forgot-password');

    await user.click(screen.getByRole('button', { name: 'Go to sign in' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('shows a backend password error as a toast (the client validation runs first)', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [
        {
          request,
          result: {
            errors: [
              {
                message: 'Validation failed',
                extensions: {
                  code: 'BAD_USER_INPUT',
                  fields: [
                    {
                      field: 'newPassword',
                      message: 'Password does not meet the security requirements',
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });

    await fillAndSubmit(user);

    expect(await screen.findByText('Check the entered data')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveValue(PASSWORD);
  });

  it('goes to Sign In with Go to sign in', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByRole('button', { name: 'Go to sign in' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('sends one request even if the form is submitted again while saving', async () => {
    const result = vi.fn(() => ({ data: { resetPassword: true } }));
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [
        { request, result, delay: 50, maxUsageCount: 2 },
        { request: { query: LOGOUT }, result: { data: { logout: true } } },
      ],
    });

    await fillAndSubmit(user);
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(submit.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(result).toHaveBeenCalledTimes(1);
  });
});
