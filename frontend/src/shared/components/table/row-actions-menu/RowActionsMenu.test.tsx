import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { RowActionsMenu } from './RowActionsMenu';

const row = { id: '1', name: 'React' };

function renderMenu() {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const result = renderWithProviders(
    <RowActionsMenu
      row={row}
      label="Actions for React"
      actions={[
        { label: 'Update', onSelect: onUpdate },
        { label: 'Delete', onSelect: onDelete },
      ]}
    />,
  );
  return { ...result, onUpdate, onDelete };
}

describe('RowActionsMenu', () => {
  it('is closed until the trigger is clicked', async () => {
    const { user } = renderMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for React' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Update',
      'Delete',
    ]);
  });

  it('calls the action with the row and closes', async () => {
    const { user, onUpdate, onDelete } = renderMenu();

    await user.click(screen.getByRole('button', { name: 'Actions for React' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(row);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { user } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions for React' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
