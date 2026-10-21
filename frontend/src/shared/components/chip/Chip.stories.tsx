import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Chip, type ChipProps } from './Chip';

const meta = {
  title: 'Shared/Chip',
  component: Chip,
  args: {
    label: 'Software Engineer',
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    onRemove: { control: false },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Software Engineer')).toBeInTheDocument();
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

export const Removable: Story = {
  args: { onRemove: fn() },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole('button', { name: 'Remove Software Engineer' });

    await step('⊗ is rendered with a size', async () => {
      // an <svg> without width / height collapses to 0×0 inside the button
      const { width, height } = remove.getBoundingClientRect();
      await expect(width).toBeGreaterThan(0);
      await expect(height).toBeGreaterThan(0);
    });

    await step('click on ⊗ calls onRemove once', async () => {
      await userEvent.click(remove);
      await expect(args.onRemove).toHaveBeenCalledTimes(1);
    });

    await step('click on the label does not remove', async () => {
      await userEvent.click(canvas.getByText('Software Engineer'));
      await expect(args.onRemove).toHaveBeenCalledTimes(1);
    });

    await step('⊗ is reachable with Tab and works with Enter', async () => {
      await userEvent.tab();
      await expect(remove).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await expect(args.onRemove).toHaveBeenCalledTimes(2);
    });
  },
};

export const Disabled: Story = {
  args: { disabled: true, onRemove: fn() },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Figma: a disabled chip keeps a grey ⊗, it just doesn't work
    const remove = canvas.getByRole('button', { name: 'Remove Software Engineer' });

    await step('⊗ is shown but disabled', async () => {
      await expect(remove).toBeDisabled();
    });

    await step('click on ⊗ does not remove', async () => {
      await userEvent.click(remove);
      await expect(args.onRemove).not.toHaveBeenCalled();
    });

    await step('⊗ is skipped by Tab', async () => {
      await userEvent.tab();
      await expect(remove).not.toHaveFocus();
    });
  },
};

export const LongLabel: Story = {
  args: {
    label: 'Senior Software Engineer in Test Automation',
    onRemove: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText('Senior Software Engineer in Test Automation');

    // cut with an ellipsis, the full text is in the native tooltip
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(label.parentElement).toHaveAttribute(
      'title',
      'Senior Software Engineer in Test Automation',
    );
  },
};

/* ------------------------------------------------------------------ */
/* Overview: Light and Dark                                            */
/* ------------------------------------------------------------------ */

const STATES: { title: string; props: Partial<ChipProps> }[] = [
  { title: 'Default', props: {} },
  { title: 'Removable', props: { onRemove: () => {} } },
  { title: 'Disabled', props: { disabled: true, onRemove: () => {} } },
  {
    title: 'Long label',
    props: { label: 'Senior Software Engineer in Test Automation', onRemove: () => {} },
  },
];

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px 200px',
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
          <div>
            <Chip label="Software Engineer" {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Hover / Focus of ⊗ are CSS states: check them by hovering / tabbing here.
export const AllStates: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <StatesGrid theme="light" />
      <StatesGrid theme="dark" />
    </div>
  ),
};
