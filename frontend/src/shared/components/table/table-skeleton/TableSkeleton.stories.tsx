import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import tableStyles from '../data-table/DataTable.module.css';
import { TableSkeleton } from './TableSkeleton';

const HEADERS = ['', 'First Name', 'Last Name', 'Email', 'Department', 'Position'];

const meta = {
  title: 'Shared/DataTable/TableSkeleton',
  component: TableSkeleton,
  args: {
    columnCount: HEADERS.length,
    rowCount: 5,
  },
  argTypes: {
    columnCount: { control: { type: 'number', min: 1 } },
    rowCount: { control: { type: 'number', min: 1 } },
  },
  decorators: [
    (Story) => (
      <table className={tableStyles.table}>
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <Story />
      </table>
    ),
  ],
} satisfies Meta<typeof TableSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FewRows: Story = {
  args: { rowCount: 2 },
};
