import { screen, waitFor } from '@testing-library/react';
import { useState, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Dialog } from './Dialog';

type Props = Partial<ComponentProps<typeof Dialog>>;

function renderDialog(props: Props = {}) {
  const onOpenChange = vi.fn();
  const result = renderWithProviders(
    <Dialog open title="Update department" onOpenChange={onOpenChange} {...props} />,
  );
  return { ...result, onOpenChange };
}

// Overlay and content are siblings in the portal; the overlay is the one without role="dialog"
const getOverlay = () =>
  document.body.querySelector<HTMLElement>('[data-state="open"]:not([role="dialog"])')!;

// The page owns `open`, the trigger is outside the dialog (no Radix Dialog.Trigger)
function DialogWithTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Update department" />
    </>
  );
}

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a dialog named by its title with a close button', () => {
    renderDialog({ children: <p>Body text</p> });

    const dialog = screen.getByRole('dialog', { name: 'Update department' });
    expect(dialog).toHaveTextContent('Body text');
    expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  });

  it('is described by the description', () => {
    renderDialog({ description: 'Are you sure?' });

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Are you sure?');
  });

  it('has no aria-describedby without a description', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('renders the footer only when it is passed', () => {
    const { rerender, onOpenChange } = renderDialog();
    expect(screen.getAllByRole('button')).toHaveLength(1); // only ×

    rerender(
      <Dialog
        open
        title="Update department"
        onOpenChange={onOpenChange}
        footer={<button type="button">Save</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows the error as an alert', () => {
    const { rerender, onOpenChange } = renderDialog();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(
      <Dialog open title="Update department" onOpenChange={onOpenChange} error="Request failed" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
  });

  it('is md by default and takes size and className', () => {
    const { rerender, onOpenChange } = renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'md');

    rerender(
      <Dialog
        open
        title="Update department"
        onOpenChange={onOpenChange}
        size="sm"
        className="custom"
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-size', 'sm');
    expect(dialog).toHaveClass('custom');
  });

  describe('closing', () => {
    it('closes on Esc', async () => {
      const { user, onOpenChange } = renderDialog();

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes on ×', async () => {
      const { user, onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes on a click on the overlay', async () => {
      const { user, onOpenChange } = renderDialog();

      await user.click(getOverlay());

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('returns focus to the element that opened it', async () => {
      const { user } = renderWithProviders(<DialogWithTrigger />);
      const trigger = screen.getByRole('button', { name: 'Open dialog' });

      await user.click(trigger);
      await screen.findByRole('dialog');
      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  });

  describe('preventClose', () => {
    it('disables ×', () => {
      renderDialog({ preventClose: true });

      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });

    it('ignores Esc', async () => {
      const { user, onOpenChange } = renderDialog({ preventClose: true });

      await user.keyboard('{Escape}');

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('ignores a click on the overlay', async () => {
      const { user, onOpenChange } = renderDialog({ preventClose: true });

      await user.click(getOverlay());

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
