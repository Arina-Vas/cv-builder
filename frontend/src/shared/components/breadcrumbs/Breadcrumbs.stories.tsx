import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import { ProfileIcon } from '../icons/ProfileIcon';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Shared/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
  args: {
    label: 'Breadcrumb',
    items: [
      { label: 'Employees', href: '/users' },
      {
        label: 'Rostislav Harlanov',
        href: '/users/1/profile',
        icon: ProfileIcon,
        variant: 'entity',
      },
      { label: 'Skills' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Figma: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {(['light', 'dark'] as const).map((theme) => (
        <div key={theme} data-theme={theme} style={{ padding: 16, background: 'var(--bg)' }}>
          <Breadcrumbs {...args} />
        </div>
      ))}
    </div>
  ),
};

export const Cv: Story = {
  args: {
    items: [
      { label: 'CVs', href: '/cvs' },
      {
        label: 'Software Engineer With 5+ Years Of Experience',
        href: '/cvs/1/details',
        variant: 'entity',
      },
      { label: 'Details' },
    ],
  },
};

export const SectionOnly: Story = {
  args: { items: [{ label: 'Employees', href: '/users' }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    await expect(canvas.getByText('Employees').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const LoadingName: Story = {
  args: {
    items: [
      { label: 'Employees', href: '/users' },
      { label: '', variant: 'entity', loading: true },
      { label: 'Skills' },
    ],
  },
};

export const LongName: Story = {
  render: (args) => (
    <div style={{ width: 360 }}>
      <Breadcrumbs {...args} />
    </div>
  ),
  args: {
    items: [
      { label: 'CVs', href: '/cvs' },
      {
        label: 'Senior Frontend Developer With 10+ Years Of Experience In Fintech',
        href: '/cvs/1/details',
        variant: 'entity',
      },
      { label: 'Projects' },
    ],
  },
};
