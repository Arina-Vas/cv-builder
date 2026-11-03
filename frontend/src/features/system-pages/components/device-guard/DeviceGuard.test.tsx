import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { MOBILE_QUERY } from '../../system-pages.constants';
import { DeviceGuard } from './DeviceGuard';

const DEVICE_MESSAGE =
  "This app isn't supported on mobile devices. Please open it on a desktop or tablet to continue.";

// matchMedia stub whose result can be flipped later, like a window resize.
function mockViewport(initiallyMobile: boolean) {
  let mobile = initiallyMobile;
  const listeners = new Set<() => void>();

  vi.mocked(window.matchMedia).mockImplementation(
    (query) =>
      ({
        get matches() {
          return query === MOBILE_QUERY && mobile;
        },
        media: query,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  );

  return {
    resize(nextMobile: boolean) {
      mobile = nextMobile;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

describe('DeviceGuard', () => {
  it('renders the app on desktop and tablet widths', () => {
    mockViewport(false);
    renderWithProviders(<DeviceGuard>App content</DeviceGuard>);

    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('replaces the app with the Device Error page below 768px', () => {
    mockViewport(true);
    renderWithProviders(<DeviceGuard>App content</DeviceGuard>);

    expect(screen.queryByText('App content')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Oops' })).toBeInTheDocument();
    expect(screen.getByText(DEVICE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reacts to resizing across the breakpoint', () => {
    const viewport = mockViewport(false);
    renderWithProviders(<DeviceGuard>App content</DeviceGuard>);

    viewport.resize(true);
    expect(screen.queryByText('App content')).not.toBeInTheDocument();

    viewport.resize(false);
    expect(screen.getByText('App content')).toBeInTheDocument();
  });
});
