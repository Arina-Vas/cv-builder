import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { SIGN_UP } from '../../api/auth.operations';
import { SignUpForm } from './SignUpForm';

const EMAIL = 'new@example.com';
const PASSWORD = 'secret123';

const request = {
  query: SIGN_UP,
  variables: { input: { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD } },
};

async function fill(ui: ReturnType<typeof renderWithProviders>['user'], confirm = PASSWORD) {
  await ui.type(screen.getByLabelText('Email'), EMAIL);
  await ui.type(screen.getByLabelText('Password'), PASSWORD);
  await ui.type(screen.getByLabelText('Confirm Password'), confirm);
}

describe('SignUpForm', () => {
  it('renders the spec texts', () => {
    renderWithProviders(<SignUpForm />);

    expect(screen.getByRole('heading', { name: 'Sign up now' })).toBeInTheDocument();
    expect(screen.getByText('Welcome! Sign up to continue')).toBeInTheDocument();
  });

  it('requires matching passwords', async () => {
    const { user } = renderWithProviders(<SignUpForm />);

    await fill(user, 'different1');
    await user.tab();

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CREATE ACCOUNT' })).toBeDisabled();
  });

  it('creates the account and goes to email verification', async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [
        {
          request,
          result: {
            data: {
              signUp: {
                __typename: 'User',
                id: '2',
                email: EMAIL,
                role: 'EMPLOYEE',
                emailVerifiedAt: null,
              },
            },
          },
        },
      ],
    });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'CREATE ACCOUNT' }));

    await expect.poll(() => mockRouter.replace).toHaveBeenCalledWith('/verify-email?sent=1');
  });

  it('shows the duplicate email message under the field', async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [
        {
          request,
          result: {
            errors: [
              {
                message: 'An account with this email already exists',
                extensions: { code: 'CONFLICT', field: 'email' },
              },
            ],
          },
        },
      ],
    });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'CREATE ACCOUNT' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists',
    );
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
    expect(screen.getByLabelText('Password')).toHaveValue(PASSWORD);
    expect(screen.getByLabelText('Confirm Password')).toHaveValue(PASSWORD);
  });

  it('shows the generic message on other errors', async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [{ request, error: new Error('Network down') }],
    });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'CREATE ACCOUNT' }));

    expect(
      await screen.findByText('Something went wrong. Please try again later'),
    ).toBeInTheDocument();
  });

  it('goes to Sign In with I HAVE AN ACCOUNT', async () => {
    const { user } = renderWithProviders(<SignUpForm />);

    await user.click(screen.getByRole('button', { name: 'I HAVE AN ACCOUNT' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('sends one request even if the form is submitted again while creating the account', async () => {
    const result = vi.fn(() => ({
      data: {
        signUp: {
          __typename: 'User',
          id: '2',
          email: EMAIL,
          role: 'EMPLOYEE',
          emailVerifiedAt: null,
        },
      },
    }));
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [{ request, result, delay: 50, maxUsageCount: 2 }],
    });

    await fill(user);
    const submit = screen.getByRole('button', { name: 'CREATE ACCOUNT' });
    await user.click(submit);
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(submit.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    expect(result).toHaveBeenCalledTimes(1);
  });
});
