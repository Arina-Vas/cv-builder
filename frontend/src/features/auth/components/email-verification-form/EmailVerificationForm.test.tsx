import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { RESEND_VERIFICATION_CODE, VERIFY_EMAIL } from '../../api/auth.operations';
import { EmailVerificationForm } from './EmailVerificationForm';

const CODE = '123456';
const verifyRequest = { query: VERIFY_EMAIL, variables: { input: { code: CODE } } };
const resendRequest = { query: RESEND_VERIFICATION_CODE };

// The cooldown ticks with a real 1 s timer, so on a slow runner the label can already be a second or two lower
const cooldownButton = (seconds: number) =>
  screen.getByRole('button', {
    name: new RegExp(`^RESEND CODE \\((${seconds}|${seconds - 1}|${seconds - 2})s\\)$`),
  });

async function enterCodeAndConfirm(ui: ReturnType<typeof renderWithProviders>['user']) {
  await ui.click(screen.getByLabelText('Digit 1 of 6'));
  await ui.paste(CODE);
  await ui.click(screen.getByRole('button', { name: 'CONFIRM' }));
}

describe('EmailVerificationForm', () => {
  it('keeps CONFIRM disabled until 6 digits are entered', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />);
    const confirm = screen.getByRole('button', { name: 'CONFIRM' });

    expect(confirm).toBeDisabled();

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.paste(CODE);

    expect(confirm).toBeEnabled();
  });

  it('verifies the email and goes to the app', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [
        {
          request: verifyRequest,
          result: {
            data: {
              verifyEmail: {
                __typename: 'User',
                id: '1',
                email: 'user@example.com',
                role: 'EMPLOYEE',
                emailVerifiedAt: '2026-10-30T10:00:00.000Z',
              },
            },
          },
        },
      ],
    });

    await enterCodeAndConfirm(user);

    expect(await screen.findByText('Email verified')).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('shows an invalid code under the input', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [
        {
          request: verifyRequest,
          result: {
            errors: [
              {
                message: 'Invalid verification code',
                extensions: { code: 'BAD_USER_INPUT', field: 'code' },
              },
            ],
          },
        },
      ],
    });

    await enterCodeAndConfirm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid verification code');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('sends an already verified user into the app', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [
        {
          request: verifyRequest,
          result: {
            errors: [{ message: 'Email is already verified', extensions: { code: 'CONFLICT' } }],
          },
        },
      ],
    });

    await enterCodeAndConfirm(user);

    expect(await screen.findByText('Email is already verified')).toBeInTheDocument();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('starts with a resend cooldown right after sign up', () => {
    renderWithProviders(<EmailVerificationForm codeJustSent />);

    expect(cooldownButton(60)).toBeDisabled();
  });

  it('resends the code and starts the cooldown', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [{ request: resendRequest, result: { data: { resendVerificationCode: true } } }],
    });

    await user.click(screen.getByRole('button', { name: 'RESEND CODE' }));

    expect(await screen.findByText('Verification code sent')).toBeInTheDocument();
    expect(cooldownButton(60)).toBeDisabled();
  });

  it('uses retryAfter from a rate-limit error for the cooldown', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [
        {
          request: resendRequest,
          result: {
            errors: [
              {
                message: 'Please wait before requesting another code',
                extensions: { code: 'RATE_LIMITED', retryAfter: 30 },
              },
            ],
          },
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'RESEND CODE' }));

    expect(
      await screen.findByText('Please wait before requesting another code'),
    ).toBeInTheDocument();
    expect(cooldownButton(30)).toBeDisabled();
  });

  it('lets the user skip verification with LATER', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />);

    await user.click(screen.getByRole('button', { name: 'LATER' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('sends one request even if the code is confirmed again while verifying', async () => {
    const result = vi.fn(() => ({
      data: {
        verifyEmail: {
          __typename: 'User',
          id: '1',
          email: 'user@example.com',
          role: 'EMPLOYEE',
          emailVerifiedAt: '2026-10-30T10:00:00.000Z',
        },
      },
    }));
    const { user } = renderWithProviders(<EmailVerificationForm />, {
      mocks: [{ request: verifyRequest, result, delay: 50, maxUsageCount: 2 }],
    });

    await enterCodeAndConfirm(user);
    const confirm = screen.getByRole('button', { name: 'CONFIRM' });
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(confirm.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(result).toHaveBeenCalledTimes(1);
  });
});
