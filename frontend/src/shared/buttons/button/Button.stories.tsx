import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties, ReactNode } from 'react';
import { fn } from 'storybook/test';

import { Button, type ButtonVariant } from './Button';

const VARIANTS: { variant: ButtonVariant; label: string; title: string }[] = [
  { variant: 'primary', label: 'UPDATE', title: 'Primary' },
  { variant: 'secondary', label: 'VERIFY EMAIL', title: 'Secondary' },
  { variant: 'ghost', label: 'CANCEL', title: 'Ghost' },
  { variant: 'text', label: 'UPDATE', title: 'Primary (V2)' },
];

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: {
    children: 'UPDATE',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'text'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'VERIFY EMAIL' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'CANCEL' },
};

export const Text: Story = {
  name: 'Primary (V2)',
  args: { variant: 'text' },
};

/* ------------------------------------------------------------------ */
/* Sizes & states                                                      */
/* ------------------------------------------------------------------ */

export const Small: Story = {
  args: { size: 'sm', children: 'CREATE USER' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const LongLabel: Story = {
  args: { children: 'SEND VERIFICATION EMAIL AGAIN' },
};

/* ------------------------------------------------------------------ */
/* Overview: the Figma design-system table, Light and Dark            */
/* ------------------------------------------------------------------ */

const STATES: { title: string; props: { disabled?: boolean; loading?: boolean } }[] = [
  { title: 'Default', props: {} },
  { title: 'Disabled', props: { disabled: true } },
  { title: 'Loading', props: { loading: true } },
];

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `80px repeat(${VARIANTS.length}, auto)`,
  alignItems: 'center',
  gap: 16,
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
};

function StatesGrid({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} style={gridStyle}>
      <span />
      {VARIANTS.map(({ title }) => (
        <span key={title} style={{ textAlign: 'center' }}>
          {title}
        </span>
      ))}

      {STATES.map(({ title, props }) => (
        <Row key={title} title={title}>
          {VARIANTS.map(({ variant, label }) => (
            <Button key={variant} variant={variant} {...props}>
              {label}
            </Button>
          ))}
        </Row>
      ))}
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <span>{title}</span>
      {children}
    </>
  );
}

// Hover / Active are CSS pseudo-classes: check them by hovering / pressing the buttons here.
export const AllStates: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div>
      <StatesGrid theme="light" />
      <StatesGrid theme="dark" />
    </div>
  ),
};
