import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CHANGE_PASSWORD } from '@/features/settings/api/settings.operations';
import type { Locale } from '@/i18n/config';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { closedGate } from '@/test/action-gate';
import { renderWithProviders } from '@/test/render';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ChangePasswordForm } from './ChangePasswordForm';

const INPUT = {
  currentPassword: 'old-secret',
  newPassword: 'new-secret',
  confirmPassword: 'new-secret',
};

const request = { query: CHANGE_PASSWORD, variables: { input: INPUT } };

const successMock = (extra: Partial<MockLink.MockedResponse> = {}): MockLink.MockedResponse => ({
  request,
  result: { data: { changePassword: true } },
  ...extra,
});

const fieldErrorMock = (field: string, message: string): MockLink.MockedResponse => ({
  request,
  result: {
    errors: [
      new GraphQLError(message, {
        extensions: { code: 'BAD_USER_INPUT', fields: [{ field, message }] },
      }),
    ],
  },
});

const fields = () => ({
  current: screen.getByLabelText('Password'),
  next: screen.getByLabelText('New Password'),
  confirm: screen.getByLabelText('Confirm Password'),
  submit: screen.getByRole('button', { name: 'Change' }),
});

type User = ReturnType<typeof userEvent.setup>;

const fillValid = async (user: User) => {
  const { current, next, confirm } = fields();
  await user.type(current, INPUT.currentPassword);
  await user.type(next, INPUT.newPassword);
  await user.type(confirm, INPUT.confirmPassword);
};

describe('ChangePasswordForm', () => {
  describe('fields', () => {
    it('has three masked password fields, each with a visibility toggle', () => {
      renderWithProviders(<ChangePasswordForm />);
      const { current, next, confirm } = fields();

      for (const input of [current, next, confirm])
        expect(input).toHaveAttribute('type', 'password');
      expect(screen.getAllByRole('button', { name: 'Show password' })).toHaveLength(3);
    });
  });

  describe('validation', () => {
    it('keeps CHANGE disabled while the form is empty', () => {
      renderWithProviders(<ChangePasswordForm />);

      expect(fields().submit).toBeDisabled();
    });

    it('shows "Password is required" under an empty current password after leaving it', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />);

      await user.click(fields().current);
      await user.tab();

      expect(await screen.findByText('Password is required')).toBeInTheDocument();
      expect(fields().current).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows the security requirements text for a new password shorter than 6 characters', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />);

      await user.type(fields().next, '12345');
      await user.tab();

      expect(
        await screen.findByText('Password does not meet the security requirements'),
      ).toBeInTheDocument();
    });

    it('re-checks the confirmation when the new password changes', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />);
      const { next, confirm } = fields();

      await user.type(next, 'new-secret');
      await user.type(confirm, 'new-secreT');
      await user.tab();
      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();

      await user.clear(next);
      await user.type(next, 'new-secreT');
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('leaves an untouched empty confirmation alone while the new password is typed', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />);
      const { next, confirm } = fields();

      await user.type(next, 'new-secret');
      await user.tab();
      expect(screen.queryByText('Confirm password is required')).not.toBeInTheDocument();
      expect(confirm).not.toHaveAttribute('aria-invalid');

      await user.type(confirm, 'new-secret');
      expect(screen.queryByText('Confirm password is required')).not.toBeInTheDocument();
    });

    it('enables CHANGE as soon as the form is valid', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />);

      await fillValid(user);

      await waitFor(() => expect(fields().submit).toBeEnabled());
    });
  });

  describe('submit', () => {
    it('sends the three passwords and no user id, then confirms and clears the form', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, { mocks: [successMock()] });

      await fillValid(user);
      await user.click(fields().submit);

      expect(await screen.findByText('Password has been changed')).toBeInTheDocument();
      const { current, next, confirm, submit } = fields();
      for (const input of [current, next, confirm]) expect(input).toHaveValue('');
      // isValid is recomputed asynchronously after form.reset() (the zod resolver is async)
      await waitFor(() => expect(submit).toBeDisabled());
    });

    it('shows loading, keeps the values and sends a single request while waiting', async () => {
      const result = vi.fn(() => ({ data: { changePassword: true } }));
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [successMock({ result, delay: 100, maxUsageCount: 2 })],
      });

      await fillValid(user);
      await user.click(fields().submit);

      const { current, submit } = fields();
      expect(submit).toHaveAttribute('aria-busy', 'true');
      expect(submit).toBeDisabled();
      expect(current).toHaveValue(INPUT.currentPassword);
      await user.click(submit);

      expect(await screen.findByText('Password has been changed')).toBeInTheDocument();
      expect(result).toHaveBeenCalledTimes(1);
    });

    it('does not send anything for a user with an unverified email', async () => {
      const result = vi.fn(() => ({ data: { changePassword: true } }));
      const { blocked, Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <ChangePasswordForm />
        </Wrapper>,
        { mocks: [successMock({ result })] },
      );

      await fillValid(user);
      expect(fields().submit).toHaveAttribute('aria-disabled', 'true');
      await user.click(fields().submit);

      expect(blocked).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveBeenCalled();
    });
  });

  describe('server errors', () => {
    it('shows an incorrect current password under its field, focuses it and keeps the values', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [fieldErrorMock('currentPassword', 'Current password is incorrect')],
      });

      await fillValid(user);
      await user.click(fields().submit);

      expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
      const { current, next, confirm } = fields();
      expect(current).toHaveFocus();
      expect(current).toHaveAttribute('aria-invalid', 'true');
      expect(current).toHaveValue(INPUT.currentPassword);
      expect(next).toHaveValue(INPUT.newPassword);
      expect(confirm).toHaveValue(INPUT.confirmPassword);
    });

    it('shows a new password equal to the current one under New Password', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [
          fieldErrorMock('newPassword', 'New password must be different from the current password'),
        ],
      });

      await fillValid(user);
      await user.click(fields().submit);

      expect(
        await screen.findByText('New password must be different from the current password'),
      ).toBeInTheDocument();
      expect(fields().next).toHaveFocus();
    });

    it('does not depend on the backend wording of the new password error', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [fieldErrorMock('newPassword', 'Some other backend text')],
      });

      await fillValid(user);
      await user.click(fields().submit);

      expect(
        await screen.findByText('New password must be different from the current password'),
      ).toBeInTheDocument();
    });

    it('shows an error without a field as a toast', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [
          {
            request,
            result: {
              errors: [new GraphQLError('boom', { extensions: { code: 'INTERNAL_SERVER_ERROR' } })],
            },
          },
        ],
      });

      await fillValid(user);
      await user.click(fields().submit);

      expect(
        await screen.findByText('Something went wrong. Please try again later'),
      ).toBeInTheDocument();
      expect(fields().current).not.toHaveAttribute('aria-invalid');
    });

    it('shows a network error as a toast', async () => {
      const { user } = renderWithProviders(<ChangePasswordForm />, {
        mocks: [{ request, error: new Error('Failed to fetch') }],
      });

      await fillValid(user);
      await user.click(fields().submit);

      expect(
        await screen.findByText('Something went wrong. Please try again later'),
      ).toBeInTheDocument();
      expect(fields().current).toHaveValue(INPUT.currentPassword);
    });
  });

  it('translates the errors already shown when the language changes', async () => {
    const mocks = [fieldErrorMock('currentPassword', 'Current password is incorrect')];
    const Providers = ({ locale, children }: { locale: Locale; children: ReactNode }) => (
      <NextIntlClientProvider locale={locale} messages={locale === 'uk' ? uk : en}>
        <MockedProvider mocks={mocks}>
          <ToastProvider>{children}</ToastProvider>
        </MockedProvider>
      </NextIntlClientProvider>
    );
    const user = userEvent.setup();
    const { rerender } = render(
      <Providers locale="en">
        <ChangePasswordForm />
      </Providers>,
    );

    await fillValid(user);
    await user.click(fields().submit);
    await screen.findByText('Current password is incorrect');
    await user.clear(fields().next);
    await user.type(fields().next, '123');
    await user.tab();
    await screen.findByText('Password does not meet the security requirements');

    rerender(
      <Providers locale="uk">
        <ChangePasswordForm />
      </Providers>,
    );

    expect(await screen.findByText('Поточний пароль неправильний')).toBeInTheDocument();
    expect(await screen.findByText('Пароль не відповідає вимогам безпеки')).toBeInTheDocument();
  });
});
