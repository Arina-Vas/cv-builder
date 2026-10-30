import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { REQUEST_PASSWORD_RESET } from '../../api/auth.operations';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const EMAIL = 'user@example.com';
const CONFIRMATION =
  'If an account with this email exists, you will receive password reset instructions.';

const request = { query: REQUEST_PASSWORD_RESET, variables: { input: { email: EMAIL } } };

describe('ForgotPasswordForm', () => {
  it('keeps Reset password disabled until the email is valid', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />);
    const submit = screen.getByRole('button', { name: 'Reset password' });

    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.tab();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('sends the request and shows the neutral confirmation (no account enumeration)', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [{ request, result: { data: { requestPasswordReset: true } } }],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
  });

  it('keeps the email and shows how long to wait when rate limited', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [
        {
          request,
          result: {
            errors: [
              {
                message: 'Too many requests',
                extensions: { code: 'RATE_LIMITED', retryAfter: 30 },
              },
            ],
          },
        },
      ],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(
      await screen.findByText('Too many attempts. Try again in 30 seconds'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
  });

  it('shows the generic message on a network error and keeps the email', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [{ request, error: new Error('Network down') }],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(
      await screen.findByText('Something went wrong. Please try again later'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
  });

  it('goes back to Sign In on Cancel', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('sends one request even if the form is submitted again while sending', async () => {
    const result = vi.fn(() => ({ data: { requestPasswordReset: true } }));
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [{ request, result, delay: 50, maxUsageCount: 2 }],
    });

    await user.type(screen.getByLabelText('Email'), EMAIL);
    const submit = screen.getByRole('button', { name: 'Reset password' });
    await user.click(submit);
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(submit.closest('form')!);

    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
    expect(result).toHaveBeenCalledTimes(1);
  });
});
