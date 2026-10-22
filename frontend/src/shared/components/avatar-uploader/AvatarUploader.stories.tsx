import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps, CSSProperties } from 'react';
import { fn } from 'storybook/test';

import { AvatarUploader } from './AvatarUploader';

type AvatarUploaderProps = ComponentProps<typeof AvatarUploader>;

// Inline image, so the stories do not depend on the network or on a static folder
const SAMPLE_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
      '<rect width="120" height="120" fill="#c63031"/>' +
      '<circle cx="60" cy="48" r="22" fill="#e9b0b0"/>' +
      '<ellipse cx="60" cy="110" rx="40" ry="32" fill="#e9b0b0"/>' +
      '</svg>',
  );

const meta = {
  title: 'Shared/AvatarUploader',
  component: AvatarUploader,
  args: {
    fallback: 'Arina',
    disabled: false,
    onChange: fn(),
    onRemove: fn(),
    onError: fn(),
  },
  argTypes: {
    src: { control: 'text' },
    fallback: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof AvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: { src: SAMPLE_AVATAR },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledWithImage: Story = {
  args: { disabled: true, src: SAMPLE_AVATAR },
};

const STATES: { title: string; props: Partial<AvatarUploaderProps> }[] = [
  { title: 'Default', props: {} },
  { title: 'With image', props: { src: SAMPLE_AVATAR } },
  { title: 'Disabled', props: { disabled: true } },
];

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px auto',
  alignItems: 'center',
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
          <span>{title}</span>
          <AvatarUploader fallback="Arina" {...props} />
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
