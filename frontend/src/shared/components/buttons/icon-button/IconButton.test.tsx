import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CloseIcon } from '../../icons/CloseIcon';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is named by aria-label and defaults to type="button"', () => {
    renderWithProviders(
      <IconButton aria-label="Close">
        <CloseIcon />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });

  it('is reachable with Tab and works with the keyboard', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <IconButton aria-label="Close" onClick={onClick}>
        <CloseIcon />
      </IconButton>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <IconButton aria-label="Close" disabled onClick={onClick}>
        <CloseIcon />
      </IconButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
