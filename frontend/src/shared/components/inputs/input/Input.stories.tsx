import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';

import { Input, type InputProps } from './Input';

const meta = {
  title: 'Shared/Input',
  component: Input,
  decorators: [
    (Story, { parameters }) =>
      parameters.layout === 'fullscreen' ? (
        <Story />
      ) : (
        <div style={{ width: 400 }}>
          <Story />
        </div>
      ),
  ],
  args: {
    label: 'Email',
    error: '',
    disabled: false,
    onChange: fn(),
    onBlur: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['text', 'email', 'password'] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: 'john.doe@mail.com' },
};

export const WithError: Story = {
  args: { error: 'Email is required' },
};

export const FilledWithError: Story = {
  args: { defaultValue: 'john.doe@', error: 'Please enter a valid email address' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledFilled: Story = {
  args: { disabled: true, defaultValue: 'john.doe@mail.com' },
};

export const Password: Story = {
  args: { label: 'Password', type: 'password', defaultValue: 'secret123' },
};

export const LongLabel: Story = {
  args: { label: 'First name of the employee as written in the passport' },
};

const STATES: { title: string; props: Partial<InputProps> }[] = [
  { title: 'Default', props: {} },
  { title: 'Filled', props: { defaultValue: 'john.doe@mail.com' } },
  { title: 'Error', props: { error: 'Email is required' } },
  {
    title: 'Filled + error',
    props: { defaultValue: 'john.doe@', error: 'Please enter a valid email address' },
  },
  { title: 'Disabled', props: { disabled: true } },
  { title: 'Disabled + filled', props: { disabled: true, defaultValue: 'john.doe@mail.com' } },
];

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px 400px',
  alignItems: 'start',
  gap: 24,
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
};

function StatesGrid({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} style={gridStyle}>
      {STATES.map(({ title, props }) => (
        <div key={title} style={{ display: 'contents' }}>
          <span style={{ paddingTop: 30 }}>{title}</span>
          <Input label="Email" {...props} />
        </div>
      ))}
    </div>
  );
}

export const AllStates: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <StatesGrid theme="light" />
      <StatesGrid theme="dark" />
    </div>
  ),
};
