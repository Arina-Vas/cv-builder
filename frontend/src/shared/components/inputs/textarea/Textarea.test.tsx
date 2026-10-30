import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('is reachable by its label and accepts multiline text', async () => {
    const { user } = renderWithProviders(<Textarea label="Description" />);

    const textarea = screen.getByLabelText('Description');
    await user.type(textarea, 'line 1{Enter}line 2');

    expect(textarea).toHaveValue('line 1\nline 2');
  });

  it('shows the error and links it to the field', () => {
    renderWithProviders(<Textarea label="Description" error="Description is required" />);

    const textarea = screen.getByLabelText('Description');
    expect(screen.getByRole('alert')).toHaveTextContent('Description is required');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Description is required');
  });

  it('can be disabled', () => {
    renderWithProviders(<Textarea label="Description" disabled />);

    expect(screen.getByLabelText('Description')).toBeDisabled();
  });
});
