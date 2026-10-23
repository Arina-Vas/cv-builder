import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Pagination, type PaginationProps } from './Pagination';

const meta = {
  title: 'Shared/Pagination',
  component: Pagination,
  args: {
    page: 1,
    pageSize: 10,
    total: 200,
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Figma: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {(['light', 'dark'] as const).map((theme) => (
        <div key={theme} data-theme={theme} style={{ padding: 24, background: 'var(--bg)' }}>
          <Pagination {...args} label={`Pagination (${theme})`} />
        </div>
      ))}
    </div>
  ),
};

export const MiddlePage: Story = {
  args: { page: 10 },
};

export const LastPage: Story = {
  args: { page: 20 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Page 20' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const FewPages: Story = {
  name: 'Few pages (no ellipsis)',
  args: { page: 2, total: 45 },
};

// 8 rows fit on one page of 10: nothing is rendered
export const OnePage: Story = {
  name: 'One page: hidden',
  args: { total: 8 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

// 30 rows with 50 per page is one page, but the select stays so the user can go back to 10
export const OnePageBigPageSize: Story = {
  name: 'One page with 50 per page: select stays',
  args: { total: 30, pageSize: 50 },
};

function InteractivePagination(args: PaginationProps) {
  const [page, setPage] = useState(args.page);
  const [pageSize, setPageSize] = useState(args.pageSize);

  return (
    <Pagination
      {...args}
      page={page}
      pageSize={pageSize}
      onPageChange={(next) => {
        setPage(next);
        args.onPageChange(next);
      }}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
        args.onPageSizeChange(size);
      }}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <InteractivePagination {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Page 20' }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(20);
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
  },
};
