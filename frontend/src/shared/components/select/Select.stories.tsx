import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn, userEvent, within } from 'storybook/test';
import { Select } from './Select';

const OPTIONS = [
  { value: 'se-1', label: 'Software Engineer 1' },
  { value: 'se-2', label: 'Software Engineer 2' },
  { value: 'se-3', label: 'Software Engineer 3' },
  { value: 'se-4', label: 'Software Engineer 4' },
];

const meta = {
  title: 'Shared/Select',
  component: Select,
  args: {
    options: OPTIONS,
    label: 'Position',
    placeholder: 'Position',
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    options: { control: false },
    onValueChange: { control: false },
    onOpenChange: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
  },
};

export const WithValue: Story = {
  args: { defaultValue: 'se-2' },
};

export const Disabled: Story = {
  args: { defaultValue: 'se-2', disabled: true },
};

export const Invalid: Story = {
  args: { error: 'Position is required' },
};

export const Dark: Story = {
  globals: {
    theme: 'dark',
  },
};
