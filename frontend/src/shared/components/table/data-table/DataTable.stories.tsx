import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { positions, type PositionRow } from '../__fixtures__/positions';
import { DataTable } from './DataTable';

const meta = {
  title: 'Shared/DataTable',
  component: DataTable<PositionRow>,
  args: {
    columns: [{ key: 'name', header: 'Name', render: (row) => row.name }],
    rows: positions,
    getRowId: (row) => row.id,
    caption: 'Positions',
    emptyMessage: 'No positions found',
  },
} satisfies Meta<typeof DataTable<PositionRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
