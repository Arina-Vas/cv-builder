import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DatePicker } from './DatePicker';

type Props = ComponentProps<typeof DatePicker>;

const ControlledDatePicker = ({ value: initial, onChange, ...rest }: Props) => {
  const [value, setValue] = useState<Date | null>(initial);

  return (
    <div style={{ width: 320 }}>
      <DatePicker
        {...rest}
        value={value}
        onChange={(date) => {
          setValue(date);
          onChange(date);
        }}
      />
    </div>
  );
};

const meta = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  render: (args) => <ControlledDatePicker {...args} />,
  args: {
    value: null,
    onChange: fn(),
    placeholder: 'Select date',
    disabled: false,
  },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    excludeDates: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: new Date(2025, 8, 4),
  },
};

export const EndDate: Story = {
  name: 'End date (minDate)',
  args: {
    placeholder: 'End Date',
    // relative to today, otherwise the calendar opens on a month with nothing disabled
    minDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
  },
};

export const ExcludeDates: Story = {
  args: {
    value: new Date(2025, 8, 4),
    excludeDates: [new Date(2025, 8, 15), new Date(2025, 8, 19)],
  },
};

export const Disabled: Story = {
  args: {
    value: new Date(2025, 8, 4),
    disabled: true,
  },
};

export const Dark: Story = {
  args: {
    value: new Date(2025, 8, 4),
  },
  globals: {
    theme: 'dark',
  },
};

export const SelectsDate: Story = {
  args: {
    value: new Date(2025, 8, 4),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: /04\.09\.2025/ }));
    await userEvent.click(await body.findByText('12'));

    await expect(args.onChange).toHaveBeenCalledWith(new Date(2025, 8, 12));
    await expect(canvas.getByRole('button', { name: /12\.09\.2025/ })).toBeInTheDocument();
  },
};

export const OpenClose: Story = {
  args: { value: new Date(2025, 8, 4) },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: /04\.09\.2025/ });

    await step('click on trigger opens popover', async () => {
      await userEvent.click(trigger);

      await expect(await body.findByRole('dialog')).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape closes popover and returns focus to trigger', async () => {
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
    });

    await step('click outside closes popover', async () => {
      await userEvent.click(trigger);
      await body.findByRole('dialog');

      await userEvent.click(canvasElement.ownerDocument.body);

      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('reopening shows day view again', async () => {
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');

      await userEvent.click(within(dialog).getByRole('button', { name: 'September' }));
      await expect(within(dialog).getByText('January')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
      await userEvent.click(trigger);
      const reopened = await body.findByRole('dialog');

      await expect(within(reopened).queryByText('January')).not.toBeInTheDocument();
      await expect(
        within(reopened).getByRole('rowgroup', { name: 'Month September, 2025' }),
      ).toBeInTheDocument();
    });
  },
};
