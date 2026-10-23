import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AvatarUploader, type AvatarUploaderProps } from './AvatarUploader';
import { SAMPLE_AVATAR } from '../avatar/sampleAvatar';

// the hidden <input type="file"> inside the label
const getFileInput = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;

const fileOf = (type: string, size: number, name = 'avatar') =>
  new File([new Uint8Array(size)], name, { type });

const meta = {
  title: 'Shared/AvatarUploader',
  component: AvatarUploader,
  args: {
    fallback: 'Arina',
    disabled: false,
    onChange: fn(),
    onRemove: fn(),
    onError: fn(),
  },
  argTypes: {
    src: { control: 'text' },
    fallback: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof AvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = getFileInput(canvasElement);

    await step('no src: the first letter, no ×', async () => {
      await expect(canvas.getByText('A')).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument();
    });

    await step('a png up to 0.5MB goes to onChange', async () => {
      const file = fileOf('image/png', 1024);
      await userEvent.upload(input, file);
      await expect(args.onChange).toHaveBeenCalledWith(file);
      await expect(args.onError).not.toHaveBeenCalled();
    });

    await step('a file over 0.5MB goes to onError', async () => {
      await userEvent.upload(input, fileOf('image/jpeg', 0.5 * 1024 * 1024 + 1));
      await expect(args.onError).toHaveBeenCalledWith('File is larger than 0.5MB');
      await expect(args.onChange).toHaveBeenCalledTimes(1);
    });

    await step('another type goes to onError, even past `accept`', async () => {
      const user = userEvent.setup({ applyAccept: false });
      await user.upload(input, fileOf('application/pdf', 1024, 'cv.pdf'));
      await expect(args.onError).toHaveBeenCalledWith('Only png, jpg or gif allowed');
      await expect(args.onChange).toHaveBeenCalledTimes(1);
    });

    await step('the input is reset, so the same file can be chosen again', async () => {
      await expect(input.value).toBe('');
    });
  },
};

export const WithImage: Story = {
  args: { src: SAMPLE_AVATAR },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole('button', { name: 'Remove avatar' });

    await step('the image has the name as alt', async () => {
      await expect(canvas.getByRole('img', { name: 'Arina' })).toBeInTheDocument();
    });

    await step('× sits in the top-right corner of the avatar, hidden until hover', async () => {
      const avatar = canvas.getByRole('img', { name: 'Arina' }).getBoundingClientRect();
      const cross = remove.getBoundingClientRect();
      await expect(cross.top).toBe(avatar.top);
      await expect(cross.right).toBe(avatar.right);
      await expect(getComputedStyle(remove).opacity).toBe('0');
    });

    await step('Tab: the × first, then the file input', async () => {
      await userEvent.tab();
      await expect(remove).toHaveFocus();
      // focus only shows the ×, without IconButton's ring
      await expect(getComputedStyle(remove).outlineStyle).toBe('none');
      await userEvent.tab();
      await expect(getFileInput(canvasElement)).toHaveFocus();
    });

    await step('click on × calls onRemove', async () => {
      await userEvent.click(remove);
      await expect(args.onRemove).toHaveBeenCalledTimes(1);
    });
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(getFileInput(canvasElement)).toBeDisabled();
  },
};

export const DisabledWithImage: Story = {
  args: { disabled: true, src: SAMPLE_AVATAR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('img', { name: 'Arina' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Remove avatar' })).not.toBeInTheDocument();
    await expect(getFileInput(canvasElement)).toBeDisabled();
  },
};

/* ------------------------------------------------------------------ */
/* Overview: Light and Dark                                            */
/* ------------------------------------------------------------------ */

const STATES: { title: string; props: Partial<AvatarUploaderProps> }[] = [
  { title: 'Default', props: {} },
  { title: 'With image', props: { src: SAMPLE_AVATAR } },
  { title: 'Disabled', props: { disabled: true } },
  { title: 'Disabled with image', props: { disabled: true, src: SAMPLE_AVATAR } },
];

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px auto',
  alignItems: 'center',
  gap: 24,
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
};

function StatesGrid({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} style={gridStyle}>
      {STATES.map(({ title, props }) => (
        <div key={title} style={{ display: 'contents' }}>
          <span>{title}</span>
          <AvatarUploader fallback="Arina" {...props} />
        </div>
      ))}
    </div>
  );
}

// Adding and Remove image are CSS states: hover the text / the avatar here, or move focus with Tab.
export const AllStates: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <StatesGrid theme="light" />
      <StatesGrid theme="dark" />
    </div>
  ),
};
