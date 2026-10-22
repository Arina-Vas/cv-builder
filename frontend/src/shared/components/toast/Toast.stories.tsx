import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toast as RadixToast } from 'radix-ui';
import { type CSSProperties, type ReactNode, useState } from 'react';

import { Toast } from './Toast';
import { type ToastType, TITLES } from './Toast.types';

// from TITLES, so a new type shows up here without editing the stories
const TYPES = Object.keys(TITLES) as ToastType[];

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
/* Live: toasts appear and close by timer, like in the app             */
/* ------------------------------------------------------------------ */

function LiveStage({ duration }: { duration: number }) {
  const [items, setItems] = useState<{ id: number; type: ToastType }[]>([]);

  const add = (type: ToastType) => setItems((prev) => [...prev, { id: Date.now(), type }]);

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TYPES.map((type) => (
          <button key={type} type="button" onClick={() => add(type)}>
            Show {type}
          </button>
        ))}
      </div>
      <ToastStage duration={duration}>
        {items.map(({ id, type }) => (
          <Toast key={id} type={type} description={`Toast #${id % 10000}`} />
        ))}
      </ToastStage>
    </div>
  );
}

// For animations, hover-to-pause, swipe and stacking. Closed toasts stay in `items`
// here (Radix just hides them); the real provider will remove them from its list.
export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LiveStage duration={5000} />,
};
