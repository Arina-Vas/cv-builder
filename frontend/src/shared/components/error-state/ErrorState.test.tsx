import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('shows the title as a heading that names the section, and the message', () => {
    renderWithProviders(<ErrorState title="Oops" message="Something went wrong." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
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
