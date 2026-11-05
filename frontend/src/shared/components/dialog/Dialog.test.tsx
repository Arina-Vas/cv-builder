import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Dialog } from './Dialog';

// Props and states. What needs a real browser (focus trap and return, the overlay click, layout,
// a Select inside) is checked by the play functions in Dialog.stories.tsx.

type Props = Partial<ComponentProps<typeof Dialog>>;

function renderDialog(props: Props = {}) {
  const onOpenChange = vi.fn();
  const result = renderWithProviders(
    <Dialog open title="Update department" onOpenChange={onOpenChange} {...props} />,
  );
  return { ...result, onOpenChange };
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

  it('is sm by default and takes size and className', () => {
    const { rerender, onOpenChange } = renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'sm');

    rerender(
      <Dialog
        open
        title="Update department"
        onOpenChange={onOpenChange}
        size="md"
        className="custom"
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-size', 'md');
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
  });
});
