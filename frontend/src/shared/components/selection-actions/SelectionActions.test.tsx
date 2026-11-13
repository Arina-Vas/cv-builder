import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SelectionActions } from './SelectionActions';

const labels = {
  addLabel: 'Add thing',
  removeLabel: 'Remove things',
  removeCountLabel: 'Remove (0)',
  cancelLabel: 'Cancel',
};

describe('SelectionActions', () => {
  it('renders nothing when canEdit is false', () => {
    renderWithProviders(
      <SelectionActions
        canEdit={false}
        selecting={false}
        selectedCount={0}
        canRemove={true}
        {...labels}
        onAdd={vi.fn()}
        onStartRemove={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows Add and Remove, calling their handlers; Remove is disabled when canRemove is false', async () => {
    const onAdd = vi.fn();
    const onStartRemove = vi.fn();
    const { user } = renderWithProviders(
      <SelectionActions
        canEdit
        selecting={false}
        selectedCount={0}
        canRemove={false}
        {...labels}
        onAdd={onAdd}
        onStartRemove={onStartRemove}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const remove = screen.getByRole('button', { name: 'Remove things' });
    expect(remove).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add thing' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('while selecting, shows Cancel and Remove(n), gating Remove(n) on selectedCount', async () => {
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    const { user } = renderWithProviders(
      <SelectionActions
        canEdit
        selecting
        selectedCount={2}
        canRemove
        {...labels}
        removeCountLabel="Remove (2)"
        onAdd={vi.fn()}
        onStartRemove={vi.fn()}
        onCancel={onCancel}
        onRemove={onRemove}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Add thing' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove (2)' }));
    expect(onRemove).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables Remove(n) when nothing is selected', () => {
    renderWithProviders(
      <SelectionActions
        canEdit
        selecting
        selectedCount={0}
        canRemove
        {...labels}
        onAdd={vi.fn()}
        onStartRemove={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Remove (0)' })).toBeDisabled();
  });
});
