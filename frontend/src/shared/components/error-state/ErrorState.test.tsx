import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ErrorState } from './ErrorState';
import s from './ErrorState.module.css';

describe('ErrorState', () => {
  it('shows the title as a heading that names the section, and the message', () => {
    renderWithProviders(<ErrorState title="Oops" message="Something went wrong." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('takes the whole screen by default and only the content area when inline', () => {
    const inlineClass = s.inline as string;
    expect(inlineClass).toEqual(expect.any(String));

    const { rerender } = renderWithProviders(<ErrorState title="Oops" message="Failed." />);
    expect(screen.getByRole('region', { name: 'Oops' })).not.toHaveClass(inlineClass);

    rerender(<ErrorState title="Oops" message="Failed." inline />);
    expect(screen.getByRole('region', { name: 'Oops' })).toHaveClass(inlineClass);
  });

  it('renders no button without an action', () => {
    renderWithProviders(<ErrorState title="Oops" message="Not supported." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls the action on click', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <ErrorState title="Oops" message="Failed." action={{ label: 'Retry', onClick }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the action while it is loading', () => {
    renderWithProviders(
      <ErrorState
        title="Oops"
        message="Failed."
        action={{ label: 'Retry', onClick: vi.fn(), loading: true }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });
});
