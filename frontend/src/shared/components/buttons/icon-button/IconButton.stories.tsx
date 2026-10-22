import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { MoreIcon } from '../../icons/MoreIcon';
import { RowActionsMenu } from '../../table/row-actions-menu/RowActionsMenu';
import { IconButton } from './IconButton';

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

export const WithMenu: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RowActionsMenu
      row={{ id: '1' }}
      label="Open actions"
      actions={[
        { label: 'View', onSelect: fn() },
        { label: 'Update', onSelect: fn() },
        { label: 'Delete', onSelect: fn() },
      ]}
    />
  ),
};

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
