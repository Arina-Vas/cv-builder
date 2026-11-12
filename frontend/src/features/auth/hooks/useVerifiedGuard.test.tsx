import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { meMock } from '@/test/me-mock';
import { renderWithProviders } from '@/test/render';
import { ME } from '../api/auth.operations';
import { useEmailVerified } from './useEmailVerified';
import { useVerifiedGuard } from './useVerifiedGuard';

function Probe({ onAction }: { onAction: (value: string) => void }) {
  const { locked, guard } = useVerifiedGuard();
  const { loading } = useEmailVerified();
  return (
    <>
      {!loading && <p>ME loaded</p>}
      <button
        type="button"
        aria-disabled={locked || undefined}
        onClick={() => guard(onAction)('x')}
      >
        Act
      </button>
    </>
  );
}

const renderProbe = (mocks: Parameters<typeof renderWithProviders>[1]) => {
  const onAction = vi.fn();
  return { ...renderWithProviders(<Probe onAction={onAction} />, mocks), onAction };
};

const unlocked = (button: HTMLElement) =>
  waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));

describe('useVerifiedGuard', () => {
  it('runs the action with its arguments for a verified user', async () => {
    const { user, onAction } = renderProbe({ mocks: [meMock()] });
    const button = screen.getByRole('button', { name: 'Act' });

    await unlocked(button);
    await user.click(button);

    expect(onAction).toHaveBeenCalledWith('x');
    expect(screen.queryByText('Verify your email to do this')).not.toBeInTheDocument();
  });

  it('locks the action and explains with a toast for an unverified user', async () => {
    const { user, onAction } = renderProbe({ mocks: [meMock({ verified: false })] });
    const button = screen.getByRole('button', { name: 'Act' });

    await screen.findByText('ME loaded');
    await user.click(button);
    expect(await screen.findByText('Verify your email to do this')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('does nothing while ME is loading: no action, no toast', async () => {
    const { user, onAction } = renderProbe({
      mocks: [{ ...meMock(), delay: Infinity }],
    });
    const button = screen.getByRole('button', { name: 'Act' });

    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.click(button);

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.queryByText('Verify your email to do this')).not.toBeInTheDocument();
  });

  it('stays locked when ME fails', async () => {
    const { user, onAction } = renderProbe({
      mocks: [{ request: { query: ME }, error: new Error('Network down') }],
    });

    await screen.findByText('ME loaded');
    await user.click(screen.getByRole('button', { name: 'Act' }));
    expect(await screen.findByText('Verify your email to do this')).toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
  });
});
