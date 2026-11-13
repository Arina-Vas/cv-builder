import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from screen readers: the container says what is loading', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps its own class and adds the caller size class', () => {
    const { container } = render(<Skeleton className="avatar" data-testid="block" />);
    const block = container.firstElementChild!;

    expect(block).toHaveClass('avatar');
    expect(block.classList.length).toBe(2);
    expect(block).toHaveAttribute('data-testid', 'block');
  });
});
