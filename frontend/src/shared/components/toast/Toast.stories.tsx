import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toast as RadixToast } from 'radix-ui';
import { type CSSProperties, type ReactNode, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Toast } from './Toast';
import { ToastProvider, useToast } from './ToastProvider';
import { TOAST_TYPES } from './Toast.types';

// from TOAST_TYPES, so a new type shows up here without editing the stories
const TYPES = TOAST_TYPES;

// RadixToast.Root renders into RadixToast.Viewport, so every story needs a Provider + Viewport.
// The viewport here is static (not fixed in a corner) so toasts sit right in the canvas.
const viewportStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  outline: 'none',
};

// duration = Infinity: toasts don't disappear while you are tweaking styles
// label: each Viewport is a landmark, two on one page need different names (axe "landmark-unique")
function ToastStage({
  children,
  duration = Infinity,
  label = 'Notifications',
}: {
  children: ReactNode;
  duration?: number;
  label?: string;
}) {
  return (
    <RadixToast.Provider duration={duration} label={label}>
      {children}
      <RadixToast.Viewport style={viewportStyle} label={`${label} ({hotkey})`} />
    </RadixToast.Provider>
  );
}

const meta = {
  title: 'Shared/Toast',
  component: Toast,
  args: {
    type: 'success',
    description: 'Description text',
  },
  argTypes: {
    type: { control: 'inline-radio', options: TYPES },
    title: {
      control: 'text',
      description: 'Overrides the default title of the type (Success, Error, …). Empty = default.',
    },
    description: { control: 'text' },
  },
  render: (args) => (
    <ToastStage>
      {/* key: a new toast when the type changes, so a closed one comes back */}
      <Toast key={args.type} {...args} />
    </ToastStage>
  ),
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Single toast, driven by Controls                                    */
/* ------------------------------------------------------------------ */

// title is empty: the toast shows the default title of its type
export const Playground: Story = {
  args: {
    type: 'info',
  },
};

export const CustomTitle: Story = {
  args: {
    type: 'success',
    title: 'Saved',
    description: 'CV "Frontend Developer" was updated',
  },
};

export const LongMessage: Story = {
  args: {
    type: 'error',
    description:
      'Something went wrong while saving the CV. Please check your connection and try again later.',
  },
};

/* ------------------------------------------------------------------ */
/* Overview: all types, Light and Dark (Figma: Notifications › Frame)  */
/* ------------------------------------------------------------------ */

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
};

function TypesColumn({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} style={columnStyle}>
      <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
      <ToastStage label={`Notifications ${theme}`}>
        {TYPES.map((type) => (
          <Toast key={type} type={type} description="Description text" />
        ))}
      </ToastStage>
    </div>
  );
}

// A toast closed with ✕ is gone: press "Reset" to bring all of them back.
function AllTypesStage() {
  const [round, setRound] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setRound((r) => r + 1)} style={{ margin: 24 }}>
        Reset
      </button>
      <div key={round} style={{ display: 'flex', flexWrap: 'wrap' }}>
        <TypesColumn theme="light" />
        <TypesColumn theme="dark" />
      </div>
    </div>
  );
}

export const AllTypes: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => <AllTypesStage />,
};

/* ------------------------------------------------------------------ */
/* With provider: useToast() as in the app (top-right, timer, max 3)  */
/* ------------------------------------------------------------------ */

function ToastButtons() {
  const toast = useToast();
  const counter = useRef(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      {TYPES.map((type) => (
        <button key={type} type="button" onClick={() => toast[type](`Toast #${++counter.current}`)}>
          Show {type}
        </button>
      ))}
      <button
        type="button"
        onClick={() => toast.success('Closes after 1 s', { title: 'Saved', duration: 1000 })}
      >
        Custom title, 1 s
      </button>
    </div>
  );
}

const getToasts = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll<HTMLElement>('li[data-type]');

// For animations, hover-to-pause, swipe and stacking: click the buttons by hand.
export const WithProvider: Story = {
  // padded: buttons on the left, so the top-right toasts don't cover them
  parameters: { layout: 'padded', controls: { disable: true } },
  render: () => (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('a call shows a toast with the default title', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Show success' }));
      await expect(await canvas.findByText('Toast #1')).toBeInTheDocument();
      await expect(canvas.getByText('Success')).toBeInTheDocument();
    });

    await step('no more than 3 toasts at a time, the oldest goes first', async () => {
      for (const type of ['error', 'warning', 'info']) {
        await userEvent.click(canvas.getByRole('button', { name: `Show ${type}` }));
      }
      await waitFor(() => expect(getToasts(canvasElement)).toHaveLength(3));
      await expect(canvas.queryByText('Toast #1')).not.toBeInTheDocument();
    });

    await step('options: custom title and duration', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Custom title, 1 s' }));
      await expect(await canvas.findByText('Saved')).toBeInTheDocument();
      await waitFor(() => expect(canvas.queryByText('Saved')).not.toBeInTheDocument(), {
        timeout: 2000,
      });
      await expect(getToasts(canvasElement)).toHaveLength(2);
    });

    // Last on purpose: after ✕ Radix moves focus to the viewport, and while it is
    // focused all timers are paused (keyboard users get time to read).
    await step('✕ closes a toast', async () => {
      const [close] = canvas.getAllByRole('button', { name: 'Close' });
      await userEvent.click(close!);
      await waitFor(() => expect(getToasts(canvasElement)).toHaveLength(1));
    });
  },
};
