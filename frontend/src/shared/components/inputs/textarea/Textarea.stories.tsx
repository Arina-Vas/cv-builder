import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { fn } from 'storybook/test';

import { Textarea, type TextareaProps } from './Textarea';

const DESCRIPTION =
  'Frontend developer with 5 years of experience in React and TypeScript.\nBuilt design systems, dashboards and e-commerce platforms.';

const LONG_DESCRIPTION = Array.from({ length: 4 }, () => DESCRIPTION).join('\n\n');

const meta = {
  title: 'Shared/Textarea',
  component: Textarea,
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
    label: 'Description',
    error: '',
    disabled: false,
    onChange: fn(),
    onBlur: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: DESCRIPTION },
};

export const WithError: Story = {
  args: { error: 'Description is required' },
};

export const FilledWithError: Story = {
  args: { defaultValue: DESCRIPTION, error: 'Description must not exceed 2000 characters' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledFilled: Story = {
  args: { disabled: true, defaultValue: DESCRIPTION },
};

export const LongText: Story = {
  args: { defaultValue: LONG_DESCRIPTION },
};

export const LongLabel: Story = {
  args: { label: 'Responsibilities of the employee on this project in detail' },
};

const STATES: { title: string; props: Partial<TextareaProps> }[] = [
  { title: 'Default', props: {} },
  { title: 'Filled', props: { defaultValue: DESCRIPTION } },
  { title: 'Error', props: { error: 'Description is required' } },
  {
    title: 'Filled + error',
    props: { defaultValue: DESCRIPTION, error: 'Description must not exceed 2000 characters' },
  },
  { title: 'Disabled', props: { disabled: true } },
  { title: 'Disabled + filled', props: { disabled: true, defaultValue: DESCRIPTION } },
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
          <Textarea label="Description" {...props} />
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
