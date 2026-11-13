import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AsyncList } from './AsyncList';

const labels = {
  loadErrorMessage: 'Failed to load things',
  retryLabel: 'Retry',
  loadingLabel: 'Loading things',
  emptyMessage: 'No things yet',
};

describe('AsyncList', () => {
  it('shows a busy placeholder list while items are not loaded yet', () => {
    renderWithProviders(
      <AsyncList items={undefined} error={undefined} loading onRetry={vi.fn()} {...labels}>
        {null}
      </AsyncList>,
    );

    expect(screen.getByRole('list', { name: 'Loading things' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('shows the error with Retry when loading failed and there is no data yet', async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(
      <AsyncList
        items={undefined}
        error={new Error('down')}
        loading={false}
        onRetry={onRetry}
        {...labels}
      >
        {null}
      </AsyncList>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load things');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows the empty message when items load as an empty list', () => {
    renderWithProviders(
      <AsyncList items={[]} error={undefined} loading={false} onRetry={vi.fn()} {...labels}>
        {null}
      </AsyncList>,
    );

    expect(screen.getByText('No things yet')).toBeInTheDocument();
  });

  it('renders children once items have loaded', () => {
    renderWithProviders(
      <AsyncList items={['a', 'b']} error={undefined} loading={false} onRetry={vi.fn()} {...labels}>
        <p>a,b</p>
      </AsyncList>,
    );

    expect(screen.getByText('a,b')).toBeInTheDocument();
  });
});
