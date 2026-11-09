import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TableToolbar } from './TableToolbar';

type Props = Partial<ComponentProps<typeof TableToolbar>>;

function renderToolbar(props: Props = {}) {
  const onSearch = vi.fn();
  const result = renderWithProviders(<TableToolbar search="" onSearch={onSearch} {...props} />);
  return { ...result, onSearch };
}

describe('TableToolbar', () => {
  it('shows the search with the current value', () => {
    renderToolbar({ search: 'eng' });

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('eng');
  });

  it('passes the typed search to onSearch', async () => {
    const { user, onSearch } = renderToolbar();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'eng');

    // SearchField debounces: one call with the whole value
    await expect.poll(() => onSearch).toHaveBeenCalledWith('eng');
  });

  it('has no action button without `action`', () => {
    renderToolbar();

    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
  });

  it('shows the action button with its label and calls onClick', async () => {
    const onClick = vi.fn();
    const { user } = renderToolbar({ action: { label: 'Create department', onClick } });

    const button = screen.getByRole('button', { name: 'Create department' });
    expect(button).toHaveAttribute('type', 'button');

    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
