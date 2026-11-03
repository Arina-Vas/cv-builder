import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { usePathname } from '@storybook/nextjs-vite/navigation.mock';
import { useTranslations } from 'next-intl';
import { expect, userEvent, within } from 'storybook/test';

import { Tabs, type TabsProps } from './Tabs';

function mockPathname(pathname: string) {
  return () => {
    usePathname.mockReturnValue(pathname);
  };
}

function UserTabs(props: Partial<TabsProps>) {
  const t = useTranslations('users.tabs');
  const items = (['profile', 'skills', 'languages', 'cvs'] as const).map((key) => ({
    href: `/users/1/${key}`,
    label: t(key),
  }));

  return (
    <Tabs items={items} label={t('label')} {...props}>
      <p style={{ padding: 24, color: 'var(--text)' }}>Tab content</p>
    </Tabs>
  );
}

const meta = {
  title: 'Shared/Tabs',
  component: UserTabs,
  parameters: { layout: 'fullscreen' },
  beforeEach: mockPathname('/users/1/profile'),
} satisfies Meta<typeof UserTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Figma: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {(['light', 'dark'] as const).map((theme) => (
        <div key={theme} data-theme={theme} style={{ background: 'var(--bg)' }}>
          <UserTabs {...args} />
        </div>
      ))}
    </div>
  ),
};

export const NestedRoute: Story = {
  beforeEach: mockPathname('/users/1/skills/42'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Skills' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

export const Centered: Story = {
  args: { align: 'center' },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: 'Profile' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Skills' })).toHaveFocus();
    await expect(canvas.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};
