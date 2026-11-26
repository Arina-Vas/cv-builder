import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Chip } from './Chip';

// The root <span> that carries the variant and state attributes
const chipOf = (label: string) => screen.getByText(label).parentElement!;

describe('Chip', () => {
  it('is outlined by default, so existing chips keep their look', () => {
    renderWithProviders(<Chip label="React" />);

    expect(chipOf('React')).toHaveAttribute('data-variant', 'outlined');
  });

  it('renders the filled variant', () => {
    renderWithProviders(<Chip label="Did something great" variant="filled" />);

    expect(chipOf('Did something great')).toHaveAttribute('data-variant', 'filled');
  });

  it('shows the full label in the native tooltip', () => {
    renderWithProviders(<Chip label="Managed to write code in time" variant="filled" />);

    expect(chipOf('Managed to write code in time')).toHaveAttribute(
      'title',
      'Managed to write code in time',
    );
  });

  it('has no remove button without onRemove', () => {
    renderWithProviders(<Chip label="React" variant="filled" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(chipOf('React')).not.toHaveAttribute('data-removable');
  });

  it.each(['outlined', 'filled'] as const)(
    'removes a %s chip with the ⊗ button, without bubbling the click',
    async (variant) => {
      const onRemove = vi.fn();
      const onParentClick = vi.fn();
      const { user } = renderWithProviders(
        <div onClick={onParentClick}>
          <Chip label="React" variant={variant} onRemove={onRemove} />
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'Remove React' }));

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onParentClick).not.toHaveBeenCalled();
      expect(chipOf('React')).toHaveAttribute('data-removable', 'true');
    },
  );

  it('keeps ⊗ visible but disabled when the chip is disabled', async () => {
    const onRemove = vi.fn();
    const { user } = renderWithProviders(<Chip label="React" onRemove={onRemove} disabled />);
    const remove = screen.getByRole('button', { name: 'Remove React' });

    await user.click(remove);

    expect(remove).toBeDisabled();
    expect(onRemove).not.toHaveBeenCalled();
    expect(chipOf('React')).toHaveAttribute('data-disabled', 'true');
  });

  it('passes native span attributes and a class name through', () => {
    renderWithProviders(<Chip label="React" className="extra" aria-describedby="hint" />);

    expect(chipOf('React')).toHaveClass('extra');
    expect(chipOf('React')).toHaveAttribute('aria-describedby', 'hint');
  });
});
