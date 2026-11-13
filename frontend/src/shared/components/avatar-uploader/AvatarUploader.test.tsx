import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { closedGate } from '@/test/action-gate';
import { IntlProvider } from '@/test/render';
import { AvatarUploader, type AvatarUploaderProps, MAX_AVATAR_SIZE } from './AvatarUploader';

const SRC = 'https://img.magnific.com/free-vector/avatar.png';

const fileOf = (type: string, size: number, name = 'avatar') =>
  new File([new Uint8Array(size)], name, { type });

const renderUploader = (
  props: Partial<AvatarUploaderProps> = {},
  Gate: (props: { children: ReactNode }) => ReactNode = ({ children }) => children,
) => {
  const handlers = { onChange: vi.fn(), onError: vi.fn(), onRemove: vi.fn() };
  const user = userEvent.setup({ applyAccept: false });
  const view = render(
    <IntlProvider>
      <Gate>
        <AvatarUploader fallback="Arina" {...handlers} {...props} />
      </Gate>
    </IntlProvider>,
  );
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  return { ...handlers, user, input };
};

describe('AvatarUploader', () => {
  it('shows the 5 MB limit in the hint', () => {
    renderUploader();

    expect(screen.getByText('png, jpg or gif no more than 5 MB')).toBeInTheDocument();
  });

  it('passes a file of exactly 5 MB and rejects a larger one with the spec message', async () => {
    const { user, input, onChange, onError } = renderUploader();
    const fits = fileOf('image/png', MAX_AVATAR_SIZE);

    await user.upload(input, fits);
    await user.upload(input, fileOf('image/png', MAX_AVATAR_SIZE + 1));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(fits);
    expect(onError).toHaveBeenCalledWith('File size must not exceed 5 MB');
  });

  it.each(['image/png', 'image/jpeg', 'image/gif'])('accepts %s', async (type) => {
    const { user, input, onChange } = renderUploader();

    await user.upload(input, fileOf(type, 10));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('rejects other types', async () => {
    const { user, input, onChange, onError } = renderUploader();

    await user.upload(input, fileOf('image/svg+xml', 10, 'logo.svg'));

    expect(onError).toHaveBeenCalledWith('Only png, jpg or gif allowed');
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('while loading', () => {
    it('announces the upload and accepts no new file', async () => {
      const { user, input, onChange } = renderUploader({ loading: true, src: SRC });

      expect(screen.getByRole('status')).toHaveTextContent('Uploading avatar');
      expect(input).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument();

      await user.upload(input, fileOf('image/png', 10));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the current avatar under the spinner', () => {
      renderUploader({ loading: true, src: SRC });

      expect(screen.getByRole('img', { name: 'Arina' })).toBeInTheDocument();
    });
  });

  it('has no spinner when idle', () => {
    renderUploader();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  describe('with a closed action gate (unverified email)', () => {
    it('does not open the file dialog and lets the gate explain', async () => {
      const { blocked, Wrapper } = closedGate();
      const { user, input } = renderUploader({}, Wrapper);
      // React handles the click on its root, so look at the event after it, on the document
      const click = vi.fn((event: MouseEvent) => event.defaultPrevented);
      document.addEventListener('click', click);

      await user.click(input);
      document.removeEventListener('click', click);

      expect(blocked).toHaveBeenCalledTimes(1);
      expect(click.mock.results[0]?.value).toBe(true);
      expect(input).toHaveAttribute('aria-disabled', 'true');
      expect(input).toBeEnabled();
    });

    it('does not remove the avatar', async () => {
      const { blocked, Wrapper } = closedGate();
      const { user, onRemove } = renderUploader({ src: SRC }, Wrapper);

      await user.click(screen.getByRole('button', { name: 'Remove avatar' }));

      expect(blocked).toHaveBeenCalledTimes(1);
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  it('removes the avatar through the cross when the gate is open', async () => {
    const { user, onRemove } = renderUploader({ src: SRC });

    await user.click(screen.getByRole('button', { name: 'Remove avatar' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
