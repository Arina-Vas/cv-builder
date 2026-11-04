import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/shared/components/buttons';
import dialogStyles from '../Dialog.module.css';
import { ConfirmDialog } from './ConfirmDialog';

type DemoProps = Omit<ComponentProps<typeof ConfirmDialog>, 'open'> & {
  // open on mount: for Dark and manual checks without clicking the trigger
  initialOpen?: boolean;
};

// Only owns `open`; loading / error come straight from args, so each state can be set in Controls
const ConfirmDialogDemo = ({ initialOpen = false, onOpenChange, ...rest }: DemoProps) => {
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete department</Button>
      <ConfirmDialog
        {...rest}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange(next);
        }}
      />
    </>
  );
};

type Outcome = 'success' | 'error' | 'errorThenSuccess';

// What a page does with useMutation: loading while the request runs, close on success,
// keep the dialog open with the error on failure, clear the error when the dialog closes
const PageDemo = ({
  outcome,
  onConfirm,
  onOpenChange,
  ...rest
}: DemoProps & { outcome: Outcome }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const attempts = useRef(0);

  const handleOpenChange = (next: boolean) => {
    if (!next) setError(undefined); // mutation reset()
    setOpen(next);
    onOpenChange(next);
  };

  const handleConfirm = () => {
    onConfirm();
    attempts.current += 1;
    setLoading(true);
    setError(undefined);

    setTimeout(() => {
      setLoading(false);
      const fails =
        outcome === 'error' || (outcome === 'errorThenSuccess' && attempts.current === 1);
      if (fails) setError(IN_USE_TEXT);
      else handleOpenChange(false); // onCompleted
    }, REQUEST_MS);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete department</Button>
      <ConfirmDialog
        {...rest}
        open={open}
        loading={loading}
        error={error}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
      />
    </>
  );
};

const TITLE = 'Delete department';
// errors.ENTITY_IN_USE in messages/en.json; a page gets it from useErrorMessage(parseError(error))
const IN_USE_TEXT = "This item is in use and can't be deleted";
const REQUEST_MS = 800;

// The dialog is portaled to <body>, so queries go through the whole document
const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

const openDialog = async (canvasElement: HTMLElement, name = TITLE) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Delete department' }));
  return getBody(canvasElement).findByRole('dialog', { name });
};

const getOverlay = (canvasElement: HTMLElement) =>
  canvasElement.ownerDocument.body.querySelector<HTMLElement>(`.${dialogStyles.overlay}`)!;

const waitForClose = (canvasElement: HTMLElement) =>
  waitFor(() => expect(getBody(canvasElement).queryByRole('dialog')).toBeNull());

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialogDemo,
  args: {
    title: TITLE,
    message: (
      <>
        Are you sure you want to delete department <strong>Engineering</strong>?
      </>
    ),
    loading: false,
    error: '',
    onConfirm: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    message: { control: false },
    error: { control: 'text' },
    onConfirm: { control: false },
    onOpenChange: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ConfirmDialogDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

// Props and states (labels, Cancel / Confirm, loading, error) are in ConfirmDialog.test.tsx
export const Default: Story = {};

export const CustomLabels: Story = {
  args: {
    title: 'Remove skills',
    message: (
      <>
        Are you sure you want to remove <strong>3</strong> skills?
      </>
    ),
    confirmLabel: 'Remove',
    cancelLabel: 'Keep',
  },
};

export const LongName: Story = {
  args: {
    message: (
      <>
        Are you sure you want to delete CV{' '}
        <strong>Software Engineer with 5+ years of experience in React, Node.js and AWS</strong>?
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    // the name wraps, the dialog keeps the sm width (620px or less on a narrow screen)
    await expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(620);
  },
};

/* ------------------------------------------------------------------ */
/* States from props                                                   */
/* ------------------------------------------------------------------ */

// Only what jsdom can't see: the loading button keeps its accessible name (CSS), the overlay is blocked
export const Loading: Story = {
  args: {
    loading: true,
  },
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    await expect(within(dialog).getByRole('button', { name: 'Confirm' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await userEvent.click(getOverlay(canvasElement));
    await expect(dialog).toBeVisible();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

export const WithError: Story = {
  args: {
    error: IN_USE_TEXT,
  },
};

/* ------------------------------------------------------------------ */
/* Page flow: the way a page wires useMutation into the dialog         */
/* ------------------------------------------------------------------ */

export const FlowSuccess: Story = {
  render: (args) => <PageDemo {...args} outcome="success" />,
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    const confirm = within(dialog).getByRole('button', { name: 'Confirm' });

    await userEvent.click(confirm);

    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await waitForClose(canvasElement);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const FlowDoubleClick: Story = {
  render: (args) => <PageDemo {...args} outcome="success" />,
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    // loading disables CONFIRM after the first click, so the second one is ignored
    await userEvent.dblClick(within(dialog).getByRole('button', { name: 'Confirm' }));

    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await waitForClose(canvasElement);
  },
};

export const FlowError: Story = {
  render: (args) => <PageDemo {...args} outcome="error" />,
  play: async ({ canvasElement, step }) => {
    let dialog = await openDialog(canvasElement);

    await step('the error appears, the dialog stays open', async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
      await expect(await within(dialog).findByRole('alert')).toHaveTextContent(IN_USE_TEXT);
      await expect(dialog).toBeVisible();
    });

    await step('reopening starts without the old error', async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitForClose(canvasElement);
      dialog = await openDialog(canvasElement);
      await expect(within(dialog).queryByRole('alert')).toBeNull();
    });
  },
};

export const FlowRetryAfterError: Story = {
  render: (args) => <PageDemo {...args} outcome="errorThenSuccess" />,
  play: async ({ canvasElement, step }) => {
    const dialog = await openDialog(canvasElement);
    const confirm = within(dialog).getByRole('button', { name: 'Confirm' });

    await step('the first attempt fails', async () => {
      await userEvent.click(confirm);
      await within(dialog).findByRole('alert');
    });

    await step('the second attempt hides the error and closes the dialog', async () => {
      await userEvent.click(confirm);
      await waitFor(() => expect(within(dialog).queryByRole('alert')).toBeNull());
      await waitForClose(canvasElement);
    });
  },
};

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

// Opened on load. Dark is a separate story: the dialog is portaled to <body> and takes the theme
// from <html>, so Light and Dark can't be shown side by side.
export const Light: Story = {
  args: { initialOpen: true },
  globals: { theme: 'light' },
};

export const Dark: Story = {
  args: { initialOpen: true },
  globals: { theme: 'dark' },
};

export const DarkWithError: Story = {
  args: { initialOpen: true, error: IN_USE_TEXT },
  globals: { theme: 'dark' },
};

export const DarkLoading: Story = {
  args: { initialOpen: true, loading: true },
  globals: { theme: 'dark' },
};
