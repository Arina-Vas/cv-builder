import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { REQUEST_PASSWORD_RESET } from '../../api/auth.operations';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const EMAIL = 'user@example.com';
const CONFIRMATION =
  'If an account with this email exists, you will receive password reset instructions.';

const request = { query: REQUEST_PASSWORD_RESET, variables: { input: { email: EMAIL } } };

describe('ForgotPasswordForm', () => {
  it('keeps RESET PASSWORD disabled until the email is valid', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />);
    const submit = screen.getByRole('button', { name: 'RESET PASSWORD' });

    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.tab();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('sends the request and shows the same confirmation for any email', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [{ request, result: { data: { requestPasswordReset: true } } }],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
  });

  it('keeps the email and shows the rate-limit message from the backend', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [
        {
          request,
          result: {
            errors: [{ message: 'Too many requests', extensions: { code: 'RATE_LIMITED' } }],
          },
        },
      ],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

    expect(await screen.findByText('Too many requests')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
  });

  it('shows the generic message on a network error', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [{ request, error: new Error('Network down') }],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'RESET PASSWORD' }));

    expect(
      await screen.findByText('Something went wrong. Please try again later'),
    ).toBeInTheDocument();
  });

  it('goes back to Sign In on CANCEL', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />);

    await user.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
