import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/shared/components/buttons';
import dialogStyles from '../Dialog.module.css';
import { ConfirmDialog } from './ConfirmDialog';

/* ------------------------------------------------------------------ */
/* Simulated request                                                   */
/* ------------------------------------------------------------------ */

// what onConfirm's promise does; `pending` never settles, to look at the loading state
type Outcome = 'success' | 'error' | 'errorThenSuccess' | 'pending';

// errors.ENTITY_IN_USE in messages/en.json: the dialog gets it from useErrorMessage(parseError(error))
const IN_USE_TEXT = "This item is in use and can't be deleted";
const REQUEST_MS = 800;

const inUseError = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'Department is in use', extensions: { code: 'ENTITY_IN_USE' } }],
  });

// what a mutation does: resolves on success, rejects with an Apollo error on failure
const request = (fails: boolean) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => (fails ? reject(inUseError()) : resolve()), REQUEST_MS);
  });

/* ------------------------------------------------------------------ */
/* Demo                                                                */
/* ------------------------------------------------------------------ */

type DemoProps = Omit<ComponentProps<typeof ConfirmDialog>, 'open' | 'onConfirm'> & {
  outcome?: Outcome;
  // spy: called on each Confirm, before the simulated request
  onConfirm: () => void;
  // open on mount: for Dark and manual checks without clicking the trigger
  initialOpen?: boolean;
};

// Owns `open` like a page; onConfirm returns the simulated request, the dialog does the rest
const ConfirmDialogDemo = ({
  outcome = 'success',
  onConfirm,
  onOpenChange,
  initialOpen = false,
  ...rest
}: DemoProps) => {
  const [open, setOpen] = useState(initialOpen);
  const attempts = useRef(0);

  const handleConfirm = () => {
    onConfirm();
    attempts.current += 1;
    if (outcome === 'pending') return new Promise<never>(() => {});
    return request(
      outcome === 'error' || (outcome === 'errorThenSuccess' && attempts.current === 1),
    );
  };

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
        onConfirm={handleConfirm}
      />
    </>
  );
};

const TITLE = 'Delete department';

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

const clickConfirm = async (canvasElement: HTMLElement) => {
  const dialog = await getBody(canvasElement).findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
  return dialog;
};

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
    outcome: 'success',
    onConfirm: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    message: { control: false },
    outcome: {
      control: 'inline-radio',
      options: ['success', 'error', 'errorThenSuccess', 'pending'],
    },
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

// Props and states (labels, Cancel / Confirm, loading, error, retry) are in ConfirmDialog.test.tsx
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
/* States                                                              */
/* ------------------------------------------------------------------ */

// Only what jsdom can't see: the loading button keeps its accessible name (CSS), the overlay is blocked
export const Loading: Story = {
  args: { outcome: 'pending' },
  play: async ({ args, canvasElement }) => {
    await openDialog(canvasElement);
    const dialog = await clickConfirm(canvasElement);

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
  args: { outcome: 'error' },
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);
    const dialog = await clickConfirm(canvasElement);

    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(IN_USE_TEXT);
  },
};

/* ------------------------------------------------------------------ */
/* Flows: onConfirm returns the mutation's promise                     */
/* ------------------------------------------------------------------ */

export const FlowSuccess: Story = {
  play: async ({ args, canvasElement }) => {
    await openDialog(canvasElement);
    const dialog = await clickConfirm(canvasElement);

    await expect(within(dialog).getByRole('button', { name: 'Confirm' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await waitForClose(canvasElement);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const FlowDoubleClick: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await openDialog(canvasElement);

    // loading disables CONFIRM after the first click, so the second one is ignored
    await userEvent.dblClick(within(dialog).getByRole('button', { name: 'Confirm' }));

    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await waitForClose(canvasElement);
  },
};

export const FlowError: Story = {
  args: { outcome: 'error' },
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
  args: { outcome: 'errorThenSuccess' },
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
  args: { initialOpen: true, outcome: 'error' },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const dialog = await clickConfirm(canvasElement);
    await within(dialog).findByRole('alert');
  },
};

export const DarkLoading: Story = {
  args: { initialOpen: true, outcome: 'pending' },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await clickConfirm(canvasElement);
  },
};
