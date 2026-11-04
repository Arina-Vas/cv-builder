import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { Select } from '@/shared/components/select/Select';
import { Dialog } from './Dialog';
import s from './Dialog.module.css';

type DialogProps = ComponentProps<typeof Dialog>;

type DemoProps = Omit<DialogProps, 'open' | 'footer'> & {
  // open on mount: for Dark and manual checks without clicking the trigger
  initialOpen?: boolean;
  // footer gets `close`, so CANCEL / SAVE in the stories really close the dialog
  renderFooter?: (close: () => void) => ReactNode;
};

// The page owns the open state (like useDialogState will), the trigger is outside the dialog
const DialogDemo = ({ initialOpen = false, renderFooter, onOpenChange, ...rest }: DemoProps) => {
  const [open, setOpen] = useState(initialOpen);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        {...rest}
        open={open}
        onOpenChange={handleOpenChange}
        footer={renderFooter?.(() => handleOpenChange(false))}
      />
    </>
  );
};

const cancelSaveFooter = (close: () => void) => (
  <>
    <Button variant="ghost" onClick={close}>
      Cancel
    </Button>
    <Button onClick={close}>Save</Button>
  </>
);

const TITLE = 'Update department';

// The dialog is portaled to <body>, so queries go through the whole document
const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

const openDialog = async (canvasElement: HTMLElement) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open dialog' }));
  return getBody(canvasElement).findByRole('dialog', { name: TITLE });
};

const getOverlay = (canvasElement: HTMLElement) =>
  canvasElement.ownerDocument.body.querySelector<HTMLElement>(`.${s.overlay}`)!;

const meta = {
  title: 'Shared/Dialog',
  component: DialogDemo,
  args: {
    title: TITLE,
    children: <p>Department name and other fields go here.</p>,
    renderFooter: cancelSaveFooter,
    preventClose: false,
    onOpenChange: fn(),
  },
  argTypes: {
    children: { control: false },
    description: { control: 'text' },
    renderFooter: { control: false },
    onOpenChange: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DialogDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Opening and closing                                                 */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByRole('heading', { name: TITLE })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: /close/i })).toBeEnabled();
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible();
    // Radix moves focus into the dialog on the next tick
    await waitFor(() =>
      expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement),
    );
  },
};

export const ClosesOnEscape: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Open dialog' });
    await openDialog(canvasElement);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(getBody(canvasElement).queryByRole('dialog')).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    // focus goes back to the element that opened the dialog, after Radix unmounts it
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ClosesOnOverlayClick: Story = {
  play: async ({ args, canvasElement, step }) => {
    const dialog = await openDialog(canvasElement);

    await step('a click inside the dialog does not close it', async () => {
      await userEvent.click(within(dialog).getByRole('heading', { name: TITLE }));
      await expect(dialog).toBeVisible();
      await expect(args.onOpenChange).not.toHaveBeenCalled();
    });

    await step('a click on the overlay closes it', async () => {
      await userEvent.click(getOverlay(canvasElement));
      await waitFor(() => expect(getBody(canvasElement).queryByRole('dialog')).toBeNull());
      await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    });
  },
};

export const ClosesOnCross: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await userEvent.click(within(dialog).getByRole('button', { name: /close/i }));

    await waitFor(() => expect(getBody(canvasElement).queryByRole('dialog')).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

export const ClosesFromFooter: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(getBody(canvasElement).queryByRole('dialog')).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

/* ------------------------------------------------------------------ */
/* Focus                                                               */
/* ------------------------------------------------------------------ */

export const FocusTrap: Story = {
  args: {
    children: <Input label="Department" />,
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    const doc = canvasElement.ownerDocument;
    const cross = within(dialog).getByRole('button', { name: /close/i });
    const save = within(dialog).getByRole('button', { name: 'Save' });

    // × → Department → Cancel → Save → back to ×: Tab never leaves the dialog
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      await expect(dialog).toContainElement(doc.activeElement as HTMLElement);
    }

    cross.focus();
    await userEvent.tab({ shift: true });
    await expect(save).toHaveFocus();
  },
};

/* ------------------------------------------------------------------ */
/* preventClose: a request is in progress                              */
/* ------------------------------------------------------------------ */

export const PreventClose: Story = {
  args: {
    preventClose: true,
    renderFooter: () => (
      <>
        <Button variant="ghost" disabled>
          Cancel
        </Button>
        <Button loading>Save</Button>
      </>
    ),
  },
  play: async ({ args, canvasElement, step }) => {
    const dialog = await openDialog(canvasElement);

    await step('× is disabled', async () => {
      await expect(within(dialog).getByRole('button', { name: /close/i })).toBeDisabled();
    });

    await step('Esc does not close', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(dialog).toBeVisible();
    });

    await step('a click on the overlay does not close', async () => {
      await userEvent.click(getOverlay(canvasElement));
      await expect(dialog).toBeVisible();
    });

    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const WithDescription: Story = {
  args: {
    title: TITLE,
    description: 'Are you sure you want to delete department Engineering?',
    children: null,
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to delete department Engineering?',
    );
  },
};

export const WithoutDescription: Story = {
  play: async ({ canvasElement }) => {
    // Radix warns in the console when Description is missing and aria-describedby is not cleared
    const warn = spyOn(console, 'warn');
    const dialog = await openDialog(canvasElement);

    await expect(dialog).not.toHaveAttribute('aria-describedby');
    await expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Description'));
    warn.mockRestore();
  },
};

export const WithoutFooter: Story = {
  args: {
    renderFooter: undefined,
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await expect(dialog.querySelector(`.${s.footer}`)).toBeNull();
  },
};

// The FormModal pattern: <form> with its own footer goes into children, so submit is inside the form
const onSubmit = fn();

export const WithForm: Story = {
  args: {
    renderFooter: undefined,
    children: (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <Input label="Department" defaultValue="Engineering" />
        <div className={s.footer}>
          <Button variant="ghost">Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    ),
  },
  play: async ({ canvasElement, step }) => {
    onSubmit.mockClear();
    const dialog = await openDialog(canvasElement);

    await step('Enter in a field submits the form', async () => {
      await userEvent.click(within(dialog).getByRole('textbox', { name: 'Department' }));
      await userEvent.keyboard('{Enter}');
      await expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    await step('SAVE submits the form', async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
      await expect(onSubmit).toHaveBeenCalledTimes(2);
    });
  },
};

export const LongContent: Story = {
  args: {
    children: Array.from({ length: 30 }, (_, i) => (
      <p key={i}>
        Paragraph {i + 1}. Long content scrolls inside the body, the title and the buttons stay in
        place.
      </p>
    )),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    const body = dialog.querySelector<HTMLElement>(`.${s.body}`)!;
    const viewportHeight = canvasElement.ownerDocument.documentElement.clientHeight;

    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(viewportHeight);
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible();
  },
};

// z-index check: the list of a Select inside the dialog must be above the dialog (50 > --z-dialog)
export const WithSelect: Story = {
  args: {
    children: (
      <Select
        label="Position"
        options={[
          { value: 'se', label: 'Software Engineer' },
          { value: 'qa', label: 'QA Engineer' },
        ]}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Position' }));
    const option = await getBody(canvasElement).findByRole('option', { name: 'QA Engineer' });
    const { left, top, width, height } = option.getBoundingClientRect();
    const topElement = canvasElement.ownerDocument.elementFromPoint(
      left + width / 2,
      top + height / 2,
    );

    await expect(option).toContainElement(topElement as HTMLElement);
  },
};

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

// Opened on load. Side-by-side Light / Dark is not possible: the dialog is portaled to <body>
// and takes the theme from <html>, so Dark is a separate story.
export const Light: Story = {
  args: { initialOpen: true },
  globals: { theme: 'light' },
};

export const Dark: Story = {
  args: { initialOpen: true },
  globals: { theme: 'dark' },
};
