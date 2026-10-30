import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Input } from './Input';

describe('Input', () => {
  it('is reachable by its label and accepts typing', async () => {
    const { user } = renderWithProviders(<Input label="Email" />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'user@example.com');

    expect(input).toHaveValue('user@example.com');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('shows the error, marks the field invalid and links the message to it', () => {
    renderWithProviders(<Input label="Email" error="Email is required" />);

    const input = screen.getByLabelText('Email');
    const message = screen.getByRole('alert');

    expect(message).toHaveTextContent('Email is required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email is required');
  });

  describe('password', () => {
    it('is masked by default and the toggle reveals and hides it', async () => {
      const { user } = renderWithProviders(<Input label="Password" type="password" />);

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: 'Show password' }));
      expect(input).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(input).toHaveAttribute('type', 'password');
    });

    it('disables the toggle together with the field', () => {
      renderWithProviders(<Input label="Password" type="password" disabled />);

      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
    });
  });

  it('renders no toggle for other input types', () => {
    renderWithProviders(<Input label="Email" type="email" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
