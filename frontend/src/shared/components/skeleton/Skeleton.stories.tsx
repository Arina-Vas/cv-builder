import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';

import { Skeleton } from './Skeleton';

const meta = {
  title: 'Shared/Skeleton',
  component: Skeleton,
  args: { style: { width: 200, height: 24 } },
  argTypes: { style: { control: 'object' } },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The size and shape come from the caller; these are the ones the app uses
const SHAPES: { title: string; style: CSSProperties }[] = [
  { title: 'Text line', style: { width: 160, height: 'var(--type-body2-lh)' } },
  { title: 'Name', style: { width: 200, height: 'var(--type-h5-lh)' } },
  {
    title: 'Avatar',
    style: { width: 'var(--avatar-size-lg)', height: 'var(--avatar-size-lg)', borderRadius: '50%' },
  },
  { title: 'Input', style: { width: 320, height: 'var(--input-height)' } },
  {
    title: 'Level bar',
    style: { width: 'var(--skill-bar-width)', height: 'var(--skill-bar-height)' },
  },
];

const Shapes = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div
    data-theme={theme}
    style={{ display: 'grid', gap: 16, padding: 24, background: 'var(--bg)', color: 'var(--text)' }}
  >
    {SHAPES.map(({ title, style }) => (
      <div key={title} style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12 }}>{title}</span>
        <Skeleton style={style} />
      </div>
    ))}
  </div>
);

export const Shapes_: Story = {
  name: 'Shapes, Light and Dark',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <Shapes theme="light" />
      <Shapes theme="dark" />
    </div>
  ),
};
