import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';

import { Avatar, type AvatarProps } from './Avatar';
import { SAMPLE_AVATAR } from './sampleAvatar';

const meta = {
  title: 'Shared/Avatar',
  component: Avatar,
  args: {
    fallback: 'Arina',
    size: 'lg',
    color: 'default',
  },
  argTypes: {
    src: { control: 'text' },
    fallback: { control: 'text' },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    color: { control: 'inline-radio', options: ['default', 'primary'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const getRoot = (canvasElement: HTMLElement) => canvasElement.querySelector('[data-size]')!;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Fallback: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('first letter, upper-cased, no image', async () => {
      await expect(canvas.getByText('A')).toBeInTheDocument();
      await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
    });

    await step('lg is 120px', async () => {
      const { width, height } = getRoot(canvasElement).getBoundingClientRect();
      await expect(width).toBe(120);
      await expect(height).toBe(120);
    });
  },
};

export const LowercaseName: Story = {
  args: { fallback: 'arina' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('A')).toBeInTheDocument();
  },
};

export const WithImage: Story = {
  args: { src: SAMPLE_AVATAR },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', { name: 'Arina' });

    await expect(getComputedStyle(img).objectFit).toBe('cover');
    // `sizes` is not rendered for data: URLs (Next does not optimize them), so check the box
    await expect(img.getBoundingClientRect().width).toBe(120);
  },
};

export const Medium: Story = {
  args: { size: 'md' },
  play: async ({ canvasElement, step }) => {
    const letter = within(canvasElement).getByText('A');

    await step('md is 40px', async () => {
      const { width, height } = getRoot(canvasElement).getBoundingClientRect();
      await expect(width).toBe(40);
      await expect(height).toBe(40);
    });

    await step('Figma users table: the same grey circle as lg, smaller letter', async () => {
      await expect(getComputedStyle(letter).backgroundColor).toBe('rgb(174, 174, 174)');
      await expect(getComputedStyle(letter).fontSize).toBe('20px');
    });
  },
};

export const Primary: Story = {
  args: { size: 'md', color: 'primary' },
  play: async ({ canvasElement }) => {
    const letter = within(canvasElement).getByText('A');

    // Figma sidebar: red circle with a white letter, the same in Light and Dark
    await expect(getComputedStyle(letter).backgroundColor).toBe('rgb(198, 48, 49)');
    await expect(getComputedStyle(letter).color).toBe('rgb(255, 255, 255)');
  },
};

export const MediumWithImage: Story = {
  args: { size: 'md', src: SAMPLE_AVATAR },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', { name: 'Arina' });

    await expect(img.getBoundingClientRect().width).toBe(40);
  },
};

/* ------------------------------------------------------------------ */
/* Overview: Light and Dark                                            */
/* ------------------------------------------------------------------ */

const STATES: { title: string; props: Partial<AvatarProps> }[] = [
  { title: 'lg, letter', props: {} },
  { title: 'lg, image', props: { src: SAMPLE_AVATAR } },
  { title: 'md, letter', props: { size: 'md' } },
  { title: 'md, primary', props: { size: 'md', color: 'primary' } },
  { title: 'md, image', props: { size: 'md', src: SAMPLE_AVATAR } },
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
          <Avatar fallback="Arina" {...props} />
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
