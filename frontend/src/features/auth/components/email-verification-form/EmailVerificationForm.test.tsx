import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { ME, RESEND_VERIFICATION_CODE, VERIFY_EMAIL } from '../../api/auth.operations';
import { EmailVerificationForm } from './EmailVerificationForm';

const CODE = '123456';
const verifyRequest = { query: VERIFY_EMAIL, variables: { input: { code: CODE } } };
const resendRequest = { query: RESEND_VERIFICATION_CODE };

// The cooldown ticks with a real 1 s timer, so on a slow runner the label can already be a second or two lower
const cooldownButton = (seconds: number) =>
  screen.getByRole('button', {
    name: new RegExp(`^Resend code \\((${seconds}|${seconds - 1}|${seconds - 2})s\\)$`),
  });

const enteredCode = () =>
  screen
    .getAllByRole('textbox')
    .map((cell) => (cell as HTMLInputElement).value)
    .join('');

async function enterCodeAndConfirm(ui: ReturnType<typeof renderWithProviders>['user']) {
  await ui.click(screen.getByLabelText('Digit 1 of 6'));
  await ui.paste(CODE);
  await ui.click(screen.getByRole('button', { name: 'Confirm' }));
}

describe('EmailVerificationForm', () => {
  it('keeps Confirm disabled until all 6 digits are entered', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    expect(confirm).toBeDisabled();

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.paste('123');
    expect(confirm).toBeDisabled();

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.paste(CODE);
    expect(confirm).toBeEnabled();
  });

  it('shows the code error when the form is submitted without 6 digits', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />);
    const form = screen.getByRole('button', { name: 'Confirm' }).closest('form')!;

    expect(screen.queryByText('Verification code is required')).not.toBeInTheDocument();

    fireEvent.submit(form);
    expect(await screen.findByText('Verification code is required')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.paste('123');
    expect(screen.getByText('Please enter a valid 6-digit code')).toBeInTheDocument();
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

  // the text comes from extensions.reason; the backend message is arbitrary and never shown
  it.each([
    ['INVALID', 'Invalid verification code'],
    ['EXPIRED', 'Verification code has expired'],
    ['USED', 'Verification code has already been used'],
    ['SOMETHING_NEW', 'Invalid verification code'],
    [undefined, 'Invalid verification code'],
  ])(
    'on reason %j from the backend shows "%s" under the input and keeps the code',
    async (reason, shown) => {
      const { user } = renderWithProviders(<EmailVerificationForm />, {
        mocks: [
          {
            request: verifyRequest,
            result: {
              errors: [
                {
                  message: 'any backend text',
                  extensions: {
                    code: 'BAD_USER_INPUT',
                    fields: [{ field: 'code', message: 'any backend text' }],
                    reason,
                  },
                },
              ],
            },
          },
        ],
      });

      await enterCodeAndConfirm(user);

      expect(await screen.findByRole('alert')).toHaveTextContent(shown);
      expect(screen.queryByText('any backend text')).not.toBeInTheDocument();
      expect(enteredCode()).toBe(CODE);
      expect(mockRouter.replace).not.toHaveBeenCalled();
    },
  );

  it('shows the validation error only after the code field is left', async () => {
    const { user } = renderWithProviders(
      <>
        <EmailVerificationForm />
        <button type="button">outside</button>
      </>,
    );

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.keyboard('123');
    // moving between the cells is not leaving the field
    await user.click(screen.getByLabelText('Digit 4 of 6'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid 6-digit code');
  });

  it('says the code is required when the field is left empty', async () => {
    const { user } = renderWithProviders(
      <>
        <EmailVerificationForm />
        <button type="button">outside</button>
      </>,
    );

    await user.click(screen.getByLabelText('Digit 1 of 6'));
    await user.click(screen.getByRole('button', { name: 'outside' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Verification code is required');
  });

  it('sends a user with an already verified email away from the page', async () => {
    renderWithProviders(<EmailVerificationForm />, {
      mocks: [
        {
          request: { query: ME },
          result: {
            data: {
              me: {
                __typename: 'User' as const,
                id: '1',
                email: 'user@example.com',
                role: 'EMPLOYEE' as const,
                emailVerifiedAt: '2026-10-30T10:00:00.000Z',
                firstName: null,
                lastName: null,
                avatarUrl: null,
              },
            },
          },
        },
      ],
    });

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Resend code' }));

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
                message: 'Please wait',
                extensions: { code: 'RATE_LIMITED', retryAfter: 30 },
              },
            ],
          },
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Resend code' }));

    expect(
      await screen.findByText('Too many attempts. Try again in 30 seconds'),
    ).toBeInTheDocument();
    expect(cooldownButton(30)).toBeDisabled();
  });

  it('lets the user skip verification with Later', async () => {
    const { user } = renderWithProviders(<EmailVerificationForm />);

    await user.click(screen.getByRole('button', { name: 'Later' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('locks the code and sends one request even if confirmed again while verifying', async () => {
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
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    screen.getAllByRole('textbox').forEach((cell) => expect(cell).toBeDisabled());
    fireEvent.submit(confirm.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(result).toHaveBeenCalledTimes(1);
  });
});
