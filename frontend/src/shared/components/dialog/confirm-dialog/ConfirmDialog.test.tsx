import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { screen } from '@testing-library/react';
import { type ComponentProps, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ConfirmDialog } from './ConfirmDialog';

type Props = Partial<ComponentProps<typeof ConfirmDialog>>;

const IN_USE_TEXT = "This item is in use and can't be deleted";

const DEPARTMENT_IN_USE_TEXT = 'Department cannot be deleted because it is currently in use';

const apiError = (code: string, extensions: Record<string, unknown> = {}) =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'backend text', extensions: { code, ...extensions } }],
  });

const inUseError = () => apiError('ENTITY_IN_USE');

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

    it("shows the page's text for a code in errorMessages", async () => {
      const { user } = renderConfirm({
        onConfirm: () => Promise.reject(inUseError()),
        errorMessages: { ENTITY_IN_USE: DEPARTMENT_IN_USE_TEXT },
      });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(DEPARTMENT_IN_USE_TEXT);
    });

    it('shows the text errorMessages has after the error, not when Confirm was clicked', async () => {
      // As UserSkills does: onConfirm stores details of the error in state, then rejects
      const Page = () => {
        const [text, setText] = useState('Nothing yet');
        return (
          <ConfirmDialog
            open
            title="Remove skills"
            message="Are you sure?"
            onOpenChange={() => {}}
            onConfirm={() => {
              setText('React is used in CVs');
              return Promise.reject(inUseError());
            }}
            errorMessages={{ ENTITY_IN_USE: text }}
          />
        );
      };
      const { user } = renderWithProviders(<Page />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('React is used in CVs');
    });

    it('shows errors.<code> for a code that is not in errorMessages', async () => {
      const { user } = renderConfirm({
        onConfirm: () => Promise.reject(apiError('FORBIDDEN')),
        errorMessages: { ENTITY_IN_USE: DEPARTMENT_IN_USE_TEXT },
      });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "You don't have permission to do this",
      );
    });

    describe('reasonMessages', () => {
      const SELF = 'You cannot delete your own account';
      const LAST_ADMIN = 'The last admin cannot be deleted';
      const NOT_ALLOWED = 'Not allowed for this user';

      const notAllowed = (reason?: string) =>
        apiError('OPERATION_NOT_ALLOWED', reason ? { reason } : {});

      it('shows the text for the reason over the text for the code', async () => {
        const { user } = renderConfirm({
          onConfirm: () => Promise.reject(notAllowed('LAST_ADMIN')),
          errorMessages: { OPERATION_NOT_ALLOWED: NOT_ALLOWED },
          reasonMessages: { OPERATION_NOT_ALLOWED: { SELF, LAST_ADMIN } },
        });

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(LAST_ADMIN);
        expect(screen.queryByText('backend text')).not.toBeInTheDocument();
      });

      it.each([
        ['a reason without a text', 'LAST_ADMIN'],
        ['an unknown reason', 'SOMETHING_NEW'],
        ['no reason', undefined],
      ])('falls back to the text for the code for %s', async (_, reason) => {
        const { user } = renderConfirm({
          onConfirm: () => Promise.reject(notAllowed(reason)),
          errorMessages: { OPERATION_NOT_ALLOWED: NOT_ALLOWED },
          reasonMessages: { OPERATION_NOT_ALLOWED: { SELF } },
        });

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(NOT_ALLOWED);
      });

      it('ignores a text given for the same reason under another code', async () => {
        const { user } = renderConfirm({
          onConfirm: () => Promise.reject(notAllowed('LAST_ADMIN')),
          errorMessages: { OPERATION_NOT_ALLOWED: NOT_ALLOWED },
          reasonMessages: { ENTITY_IN_USE: { LAST_ADMIN } },
        });

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(NOT_ALLOWED);
      });

      it('falls back to errors.<code> when neither the reason nor the code has a text', async () => {
        const { user } = renderConfirm({
          onConfirm: () => Promise.reject(notAllowed('LAST_ADMIN')),
          reasonMessages: { OPERATION_NOT_ALLOWED: { SELF } },
        });

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('This action is not allowed');
      });
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
