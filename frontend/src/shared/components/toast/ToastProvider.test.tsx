import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import type { ToastApi } from './Toast.types';
import { useToast } from './ToastProvider';

// Renders inside the providers' ToastProvider and hands its API to the test
function renderToastApi() {
  let api: ToastApi | undefined;

  function Capture() {
    api = useToast();
    return null;
  }

  const result = renderWithProviders(<Capture />);
  if (!api) throw new Error('useToast did not run');
  const toast = api;

  return { ...result, show: (call: (toast: ToastApi) => void) => act(() => call(toast)) };
}

describe('ToastProvider', () => {
  it('does not add a toast that is already on screen', () => {
    const { show } = renderToastApi();

    show((toast) => toast.error('Could not delete the skill'));
    show((toast) => toast.error('Could not delete the skill'));

    expect(screen.getAllByText('Could not delete the skill')).toHaveLength(1);
  });

  it('treats an empty title as no title', () => {
    const { show } = renderToastApi();

    show((toast) => toast.error('Could not delete the skill'));
    show((toast) => toast.error('Could not delete the skill', { title: '' }));

    expect(screen.getAllByText('Could not delete the skill')).toHaveLength(1);
  });

  it.each([
    ['another type', (toast: ToastApi) => toast.warning('Could not delete the skill')],
    [
      'another title',
      (toast: ToastApi) => toast.error('Could not delete the skill', { title: 'Oops' }),
    ],
  ])('shows the same text with %s', (_, second) => {
    const { show } = renderToastApi();

    show((toast) => toast.error('Could not delete the skill'));
    show(second);

    expect(screen.getAllByText('Could not delete the skill')).toHaveLength(2);
  });

  it('shows the same text again once the first toast is closed', async () => {
    const { show } = renderToastApi();

    show((toast) => toast.error('Could not delete the skill'));
    // fireEvent, not userEvent: Radix starts a swipe on pointerdown, and jsdom has no pointer capture
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByText('Could not delete the skill')).not.toBeInTheDocument(),
    );

    show((toast) => toast.error('Could not delete the skill'));

    expect(screen.getByText('Could not delete the skill')).toBeInTheDocument();
  });

  it('keeps only the last three toasts', () => {
    const { show } = renderToastApi();

    ['First', 'Second', 'Third', 'Fourth'].forEach((text) => show((toast) => toast.info(text)));

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    ['Second', 'Third', 'Fourth'].forEach((text) =>
      expect(screen.getByText(text)).toBeInTheDocument(),
    );
  });
});
