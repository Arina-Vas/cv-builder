import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { SIGN_IN } from '../../api/auth.operations';
import { SignInForm } from './SignInForm';

const EMAIL = 'user@example.com';
const PASSWORD = 'secret123';

const request = { query: SIGN_IN, variables: { input: { email: EMAIL, password: PASSWORD } } };

const user = {
  __typename: 'User',
  id: '1',
  email: EMAIL,
  role: 'EMPLOYEE',
  emailVerifiedAt: null,
};

async function fillAndSubmit(ui: ReturnType<typeof renderWithProviders>['user']) {
  await ui.type(screen.getByLabelText('Email'), EMAIL);
  await ui.type(screen.getByLabelText('Password'), PASSWORD);
  await ui.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('SignInForm', () => {
  it('renders the spec texts', () => {
    renderWithProviders(<SignInForm />);

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Hello again! Sign in to continue')).toBeInTheDocument();
  });

  it('validates the fields after leaving them and keeps Sign in disabled', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />);

    await ui.click(screen.getByLabelText('Email'));
    await ui.tab();
    await ui.type(screen.getByLabelText('Password'), '123');
    await ui.tab();

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('signs in and goes to the app', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />, {
      mocks: [{ request, result: { data: { signIn: user } } }],
    });

    await fillAndSubmit(ui);

    await expect.poll(() => mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('shows "Invalid email or password" under the password and keeps the values', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />, {
      mocks: [
        {
          request,
          result: {
            errors: [
              { message: 'Invalid email or password', extensions: { code: 'UNAUTHENTICATED' } },
            ],
          },
        },
      ],
    });

    await fillAndSubmit(ui);

    await waitFor(() =>
      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
        'Invalid email or password',
      ),
    );
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
    expect(screen.getByLabelText('Password')).toHaveValue(PASSWORD);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('shows a backend validation error as a toast (the client validation runs first)', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />, {
      mocks: [
        {
          request,
          result: {
            errors: [
              {
                message: 'Validation failed',
                extensions: {
                  code: 'BAD_USER_INPUT',
                  fields: [{ field: 'email', message: 'Please enter a valid email address' }],
                },
              },
            ],
          },
        },
      ],
    });

    await fillAndSubmit(ui);

    expect(await screen.findByText('Check the entered data')).toBeInTheDocument();
  });

  it('shows the generic message on a network error', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />, {
      mocks: [{ request, error: new Error('Network down') }],
    });

    await fillAndSubmit(ui);

    expect(
      await screen.findByText('Something went wrong. Please try again later'),
    ).toBeInTheDocument();
  });

  it('opens Forgot Password', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />);

    await ui.click(screen.getByRole('button', { name: 'Forgot password' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/forgot-password');
  });

  it('sends one request even if the form is submitted again while signing in', async () => {
    const result = vi.fn(() => ({ data: { signIn: user } }));
    const { user: ui } = renderWithProviders(<SignInForm />, {
      mocks: [{ request, result, delay: 50, maxUsageCount: 2 }],
    });

    await fillAndSubmit(ui);
    const submit = screen.getByRole('button', { name: 'Sign in' });
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.submit(submit.closest('form')!);

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(result).toHaveBeenCalledTimes(1);
  });
});
