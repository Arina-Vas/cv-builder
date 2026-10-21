import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Chip } from './Chip';

const meta = {
  title: 'Shared/Chip',
  component: Chip,
  args: { children: 'TypeScript' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
