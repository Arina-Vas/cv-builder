import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TableToolbar, type TableToolbarProps } from './TableToolbar';

// Owns `search` like a page with useTableParams, so typing works in the story
const TableToolbarDemo = ({ search: initial, onSearch, ...rest }: TableToolbarProps) => {
  const [search, setSearch] = useState(initial);

  return (
    <TableToolbar
      {...rest}
      search={search}
      onSearch={(next) => {
        setSearch(next);
        onSearch(next);
      }}
    />
  );
};

const meta = {
  title: 'Shared/TableToolbar',
  component: TableToolbarDemo,
  args: {
    search: '',
    onSearch: fn(),
    action: { label: 'Create department', onClick: fn() },
  },
  argTypes: {
    onSearch: { control: false },
  },
  parameters: { layout: 'fullscreen' },
  // the width of a list page next to the expanded sidebar
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1032, padding: '24px 0', background: 'var(--bg)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TableToolbarDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Props and callbacks are in TableToolbar.test.tsx
export const Default: Story = {};

export const WithoutAction: Story = {
  args: { action: undefined },
};

export const WithSearch: Story = {
  args: { search: 'engineering' },
};

// Figma: the + icon and the text are one red text button, 40px high like the search
export const ActionLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search' });
    const button = canvas.getByRole('button', { name: 'Create department' });

    await expect(button.getBoundingClientRect().height).toBe(search.getBoundingClientRect().height);
    await expect(button.getBoundingClientRect().left).toBeGreaterThan(
      search.getBoundingClientRect().right,
    );
  },
};

export const Typing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search' }), 'qa');

    await expect(await canvas.findByDisplayValue('qa')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 400)); // SearchField debounce
    await expect(args.onSearch).toHaveBeenLastCalledWith('qa');
  },
};

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

export const Light: Story = {
  globals: { theme: 'light' },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
};
