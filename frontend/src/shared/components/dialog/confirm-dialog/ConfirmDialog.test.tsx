import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ConfirmDialog } from './ConfirmDialog';

type Props = Partial<ComponentProps<typeof ConfirmDialog>>;

function renderConfirm(props: Props = {}) {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  const result = renderWithProviders(
    <ConfirmDialog
      open
      title="Delete department"
      message={
        <>
          Are you sure you want to delete department <strong>Engineering</strong>?
        </>
      }
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { ...result, onOpenChange, onConfirm };
}

describe('ConfirmDialog', () => {
  it('is a small dialog named by the title and described by the message', () => {
    renderConfirm();

    const dialog = screen.getByRole('dialog', { name: 'Delete department' });
    expect(dialog).toHaveAttribute('data-size', 'sm');
    expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to delete department Engineering?',
    );
    expect(screen.getByText('Engineering').tagName).toBe('STRONG');
  });

  it('uses Cancel / Confirm from common.actions by default', () => {
    renderConfirm();

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('takes custom button labels', () => {
    renderConfirm({ confirmLabel: 'Remove', cancelLabel: 'Keep' });

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm and leaves closing to the page', async () => {
    const { user, onConfirm, onOpenChange } = renderConfirm();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on Cancel without confirming', async () => {
    const { user, onConfirm, onOpenChange } = renderConfirm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  describe('while loading', () => {
    it('shows loading on Confirm and disables Cancel and ×', () => {
      renderConfirm({ loading: true });

      // the name is checked in the stories: jsdom ignores the CSS that hides the label
      const confirm = screen.getByRole('button', { name: 'Confirm' });
      expect(confirm).toHaveAttribute('aria-busy', 'true');
      expect(confirm).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });

    it('does not confirm again and does not close on Esc', async () => {
      const { user, onConfirm, onOpenChange } = renderConfirm({ loading: true });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      await user.keyboard('{Escape}');

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  it('shows the error as an alert and lets the user retry', async () => {
    const { user, onConfirm } = renderConfirm({
      error: "This item is in use and can't be deleted",
    });

    expect(screen.getByRole('alert')).toHaveTextContent("This item is in use and can't be deleted");

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('has no alert without an error', () => {
    renderConfirm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
