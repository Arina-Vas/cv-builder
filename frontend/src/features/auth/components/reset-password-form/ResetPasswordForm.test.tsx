import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { LOGOUT, RESET_PASSWORD } from '../../api/auth.operations';
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
  await ui.click(screen.getByRole('button', { name: 'SUBMIT' }));
}

describe('ResetPasswordForm', () => {
  it('validates the new password', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByLabelText('New password'));
    await user.tab();

    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SUBMIT' })).toBeDisabled();
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
    expect(logoutResult).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it.each(['This password reset link is invalid', 'This password reset link has expired'])(
    'shows "%s", keeps the passwords and stays on the page',
    async (message) => {
      const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
        mocks: [
          {
            request,
            result: {
              errors: [
                {
                  message: 'Validation failed',
                  extensions: { code: 'BAD_USER_INPUT', fields: [{ field: 'token', message }] },
                },
              ],
            },
          },
        ],
      });

      await fillAndSubmit(user);

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByLabelText('New password')).toHaveValue(PASSWORD);
      expect(screen.getByLabelText('Confirm password')).toHaveValue(PASSWORD);
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );

  it('maps password errors from the backend to the fields', async () => {
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

    expect(
      await screen.findByText('Password does not meet the security requirements'),
    ).toBeInTheDocument();
  });

  it('goes to Sign In with GO TO SIGN IN', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByRole('button', { name: 'GO TO SIGN IN' }));

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
    const submit = screen.getByRole('button', { name: 'SUBMIT' });
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(submit.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(result).toHaveBeenCalledTimes(1);
  });
});
