import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { NotFoundPage } from './NotFoundPage';

function mockHistoryLength(length: number) {
  vi.spyOn(window.history, 'length', 'get').mockReturnValue(length);
}

describe('NotFoundPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the spec texts and the GO BACK button', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Hmm...' })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This doesn't seem to be the page you were looking for. Let's get you back on track.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('goes back to the previous page', async () => {
    mockHistoryLength(3);
    const { user } = renderWithProviders(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockRouter.back).toHaveBeenCalledOnce();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('opens the app when there is no previous page', async () => {
    mockHistoryLength(1);
    const { user } = renderWithProviders(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
