import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/shared/components/buttons';
import { meMock } from '@/test/me-mock';
import { renderWithProviders } from '@/test/render';
import { VerifiedActionGate } from './VerifiedActionGate';

function renderGate(verified: boolean) {
  const onSave = vi.fn();
  const result = renderWithProviders(
    <VerifiedActionGate>
      <Button gated onClick={onSave}>
        Save
      </Button>
    </VerifiedActionGate>,
    { mocks: [meMock({ verified })] },
  );
  return { ...result, onSave, button: screen.getByRole('button', { name: 'Save' }) };
}

describe('VerifiedActionGate', () => {
  it('opens gated actions for a verified user once ME has loaded', async () => {
    const { user, onSave, button } = renderGate(true);

    // locked while ME loads
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));

    await user.click(button);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('keeps gated actions locked for an unverified user and explains with a toast', async () => {
    const { user, onSave, button } = renderGate(false);

    // the click is ignored until ME answers, so wait for the toast after it
    await waitFor(async () => {
      await user.click(button);
      expect(screen.getByText('Verify your email to do this')).toBeInTheDocument();
    });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(onSave).not.toHaveBeenCalled();
  });
});
