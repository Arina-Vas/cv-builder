import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { OtpInput, type OtpInputProps } from './OtpInput';

function ControlledOtp({ initial = '', ...props }: Partial<OtpInputProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <OtpInput {...props} value={value} onChange={setValue} />;
}

const cells = () => screen.getAllByRole('textbox');
const cell = (digit: number) => screen.getByLabelText(`Digit ${digit} of 6`);
const code = () =>
  cells()
    .map((cell) => (cell as HTMLInputElement).value)
    .join('');

describe('OtpInput', () => {
  it('renders 6 labelled cells in a group', () => {
    renderWithProviders(<ControlledOtp />);

    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(cells()).toHaveLength(6);
    expect(screen.getByLabelText('Digit 1 of 6')).toBeInTheDocument();
  });

  it('moves focus forward while typing and ignores non-digits', async () => {
    const { user } = renderWithProviders(<ControlledOtp />);

    await user.click(cell(1));
    await user.keyboard('1a2');

    expect(code()).toBe('12');
    expect(cell(3)).toHaveFocus();
  });

  it('fills every cell from a pasted code', async () => {
    const { user } = renderWithProviders(<ControlledOtp />);

    await user.click(cell(1));
    await user.paste('12-34-56');

    expect(code()).toBe('123456');
    expect(cell(6)).toHaveFocus();
  });

  it('Backspace on an empty cell deletes the previous digit', async () => {
    const { user } = renderWithProviders(<ControlledOtp initial="123" />);

    await user.click(cell(4));
    await user.keyboard('{Backspace}');

    expect(code()).toBe('12');
    expect(cell(3)).toHaveFocus();
  });

  it('moves between cells with the arrow keys', async () => {
    const { user } = renderWithProviders(<ControlledOtp initial="123" />);

    await user.click(cell(2));
    await user.keyboard('{ArrowLeft}');
    expect(cell(1)).toHaveFocus();

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(cell(3)).toHaveFocus();
  });

  it('shows the error and marks the cells invalid', () => {
    renderWithProviders(<ControlledOtp error="Invalid verification code" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid verification code');
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Invalid verification code');
    expect(cell(1)).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables every cell', () => {
    renderWithProviders(<ControlledOtp disabled />);

    cells().forEach((cell) => expect(cell).toBeDisabled());
  });
});
