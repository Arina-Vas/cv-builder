import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { IconButton } from './IconButton';

// Material "MoreVert" (three dots). Replace with the shared icon once an icon set is chosen.
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const meta = {
  title: 'Shared/IconButton',
  component: IconButton,
  args: {
    'aria-label': 'Open actions',
    children: <MoreIcon />,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

// Hover / Active: hover and press the buttons here.
export const LightAndDark: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (args) => (
    <div style={{ display: 'flex' }}>
      {(['light', 'dark'] as const).map((theme) => (
        <div
          key={theme}
          data-theme={theme}
          style={{ display: 'flex', gap: 24, padding: 24, background: 'var(--bg)' }}
        >
          <IconButton {...args} />
          <IconButton {...args} disabled />
        </div>
      ))}
    </div>
  ),
};
