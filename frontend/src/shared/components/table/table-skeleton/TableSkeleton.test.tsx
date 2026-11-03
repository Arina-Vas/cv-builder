import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TableSkeleton } from './TableSkeleton';

function renderSkeleton(props: { columnCount: number; rowCount?: number }) {
  return renderWithProviders(
    <table>
      <TableSkeleton {...props} />
    </table>,
  );
}

// The skeleton is aria-hidden, so it has no roles to query by: the tests read the DOM directly
describe('TableSkeleton', () => {
  it('renders 5 placeholder rows by default', () => {
    const { container } = renderSkeleton({ columnCount: 3 });

    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('renders the requested number of rows, each spanning every column', () => {
    const { container } = renderSkeleton({ columnCount: 4, rowCount: 2 });

    const cells = container.querySelectorAll('tbody td');
    expect(cells).toHaveLength(2);
    cells.forEach((cell) => expect(cell).toHaveAttribute('colspan', '4'));
  });

  it('is hidden from assistive technology', () => {
    const { container } = renderSkeleton({ columnCount: 3 });

    expect(container.querySelector('tbody')).toHaveAttribute('aria-hidden', 'true');
  });
});
