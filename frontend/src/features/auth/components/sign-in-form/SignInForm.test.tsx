import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  await ui.click(screen.getByRole('button', { name: 'SIGN IN' }));
}

describe('SignInForm', () => {
  it('renders the spec texts', () => {
    renderWithProviders(<SignInForm />);

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Hello again! Sign in to continue')).toBeInTheDocument();
  });

  it('validates the fields after leaving them and keeps SIGN IN disabled', async () => {
    const { user: ui } = renderWithProviders(<SignInForm />);

    await ui.click(screen.getByLabelText('Email'));
    await ui.tab();
    await ui.type(screen.getByLabelText('Password'), '123');
    await ui.tab();

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SIGN IN' })).toBeDisabled();
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

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL);
    expect(screen.getByLabelText('Password')).toHaveValue(PASSWORD);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('maps BAD_USER_INPUT field errors to the fields', async () => {
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

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
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

    await ui.click(screen.getByRole('button', { name: 'FORGOT PASSWORD' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/forgot-password');
  });
});
