import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { MultiSelect } from './MultiSelect';

const OPTIONS = [
  { value: 'react', label: 'React' },
  { value: 'nest', label: 'NestJS' },
];

const renderSelect = (defaultValue: string[] = []) => {
  const onValueChange = vi.fn();
  const onBlur = vi.fn();
  const rendered = renderWithProviders(
    <MultiSelect
      label="Environment"
      options={OPTIONS}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onBlur={onBlur}
    />,
  );
  return { ...rendered, onValueChange, onBlur };
};

describe('MultiSelect', () => {
  // ⊗ cancels mousedown, so the input never gets or loses focus: without onBlur here a form would never
  // mark the field touched and "nothing selected" would not show after the last chip is removed
  it('touches the field when a chip is removed with ⊗, after reporting the new value', async () => {
    const { user, onValueChange, onBlur } = renderSelect(['react', 'nest']);

    await user.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(onValueChange).toHaveBeenCalledWith(['nest']);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledBefore(onBlur);
    expect(screen.getByRole('combobox', { name: 'Environment' })).not.toHaveFocus();
  });

  it('touches the field when the last chip is removed', async () => {
    const { user, onValueChange, onBlur } = renderSelect(['react']);

    await user.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(onValueChange).toHaveBeenCalledWith([]);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('does not touch the field while options are picked in the open list', async () => {
    const { user, onValueChange, onBlur } = renderSelect();

    await user.click(screen.getByRole('combobox', { name: 'Environment' }));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Environment' })).getByRole('option', {
        name: 'React',
      }),
    );

    expect(onValueChange).toHaveBeenCalledWith(['react']);
    expect(onBlur).not.toHaveBeenCalled();
  });

  it('does not touch the field when Backspace removes a chip: leaving the field does', async () => {
    const { user, onValueChange, onBlur } = renderSelect(['react']);

    await user.click(screen.getByRole('combobox', { name: 'Environment' }));
    await user.keyboard('{Backspace}');

    expect(onValueChange).toHaveBeenCalledWith([]);
    expect(onBlur).not.toHaveBeenCalled();

    await user.tab();

    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
