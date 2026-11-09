import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ConfirmDialog } from './ConfirmDialog';

type Props = Partial<ComponentProps<typeof ConfirmDialog>>;

const IN_USE_TEXT = "This item is in use and can't be deleted";

const inUseError = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'backend text', extensions: { code: 'ENTITY_IN_USE' } }],
  });

// a request that is still running when the test checks the dialog
const pending = () => new Promise<never>(() => {});

function renderConfirm(props: Props = {}) {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn(() => Promise.resolve());
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

  it('closes after onConfirm resolves', async () => {
    const { user, onConfirm, onOpenChange } = renderConfirm();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Cancel without confirming', async () => {
    const { user, onConfirm, onOpenChange } = renderConfirm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  describe('while onConfirm is running', () => {
    it('shows loading on Confirm and disables Cancel and ×', async () => {
      const { user } = renderConfirm({ onConfirm: pending });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      // the name is checked in the stories: jsdom ignores the CSS that hides the label
      const confirm = screen.getByRole('button', { name: 'Confirm' });
      expect(confirm).toHaveAttribute('aria-busy', 'true');
      expect(confirm).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });

    it('does not confirm again and does not close on Esc', async () => {
      const onConfirm = vi.fn(pending);
      const { user, onOpenChange } = renderConfirm({ onConfirm });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      await user.keyboard('{Escape}');

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('when onConfirm fails', () => {
    it('shows the error as an alert and stays open', async () => {
      const { user, onOpenChange } = renderConfirm({
        onConfirm: () => Promise.reject(inUseError()),
      });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(IN_USE_TEXT);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('lets the user retry: the error goes away and the dialog closes', async () => {
      const onConfirm = vi
        .fn<() => Promise<unknown>>()
        .mockRejectedValueOnce(inUseError())
        .mockResolvedValueOnce(undefined);
      const { user, onOpenChange } = renderConfirm({ onConfirm });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      await screen.findByRole('alert');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });

    it('clears the error when the dialog closes', async () => {
      const { user } = renderConfirm({ onConfirm: () => Promise.reject(inUseError()) });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      await screen.findByRole('alert');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // `open` stays true in this test, so the same dialog shows what the next opening would
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('has no alert without an error', () => {
    renderConfirm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
