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

const LABEL = 'Start Date';
const ERROR = 'Start Date is required';

const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);
// the trigger is named by the Field label, not by the date inside it
const getTrigger = (canvasElement: HTMLElement, name = LABEL) =>
  within(canvasElement).getByRole('button', { name });

const meta = {
  title: 'Shared/DatePicker',
  component: DatePicker,
  render: (args) => <ControlledDatePicker {...args} />,
  args: {
    label: LABEL,
    value: null,
    onChange: fn(),
    onOpenChange: fn(),
    onBlur: fn(),
    placeholder: 'Select date',
    disabled: false,
  },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    onOpenChange: { control: false },
    onBlur: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    excludeDates: { control: false },
    ref: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------- visual ---------------- */

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: new Date(2025, 8, 4),
  },
};

export const EndDate: Story = {
  name: 'End date (minDate)',
  args: {
    label: 'End Date',
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
  play: async ({ canvasElement }) => {
    await expect(getTrigger(canvasElement)).toBeDisabled();
  },
};

export const WithError: Story = {
  args: {
    error: ERROR,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent(ERROR);
    // aria-invalid is not allowed on role=button, so the error is linked by aria-describedby
    await expect(getTrigger(canvasElement)).toHaveAccessibleDescription(ERROR);
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

export const DarkWithError: Story = {
  args: {
    error: ERROR,
  },
  globals: {
    theme: 'dark',
  },
};

/* ---------------- behaviour ---------------- */

// The Field label has pointer-events: none (clicks go through to the control), so instead of a
// click the check is that the label names the trigger: <label for> → <button id>
export const LabelNamesTrigger: Story = {
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText(LABEL, { selector: 'label' });
    const trigger = getTrigger(canvasElement);

    await expect(label).toHaveAttribute('for', trigger.id);
  },
};

export const PlaceholderOnlyWhenOpen: Story = {
  play: async ({ canvasElement, step }) => {
    const trigger = getTrigger(canvasElement);

    await step('empty and closed: only the label, no placeholder', async () => {
      await expect(trigger).not.toHaveTextContent('Select date');
    });

    await step('open: the label moves up, the placeholder shows', async () => {
      await userEvent.click(trigger);
      await getBody(canvasElement).findByRole('dialog');

      await expect(trigger).toHaveTextContent('Select date');
    });
  },
};

export const SelectsDate: Story = {
  args: {
    value: new Date(2025, 8, 4),
  },
  play: async ({ args, canvasElement }) => {
    const trigger = getTrigger(canvasElement);
    const body = getBody(canvasElement);

    await expect(trigger).toHaveTextContent('04.09.2025');

    await userEvent.click(trigger);
    await userEvent.click(await body.findByText('12'));

    await expect(args.onChange).toHaveBeenCalledWith(new Date(2025, 8, 12));
    await expect(trigger).toHaveTextContent('12.09.2025');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // a form marks the field as touched on close, so picking a day must report it too
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

// react-hook-form marks a field as touched on blur; the picker reports it when the calendar closes,
// not when focus moves into the popover on open
export const BlursOnClose: Story = {
  play: async ({ args, canvasElement, step }) => {
    const body = getBody(canvasElement);
    const trigger = getTrigger(canvasElement);

    await step('opening does not blur', async () => {
      await userEvent.click(trigger);
      await body.findByRole('dialog');

      await expect(args.onBlur).not.toHaveBeenCalled();
    });

    await step('Escape without a date blurs once', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

      await expect(args.onBlur).toHaveBeenCalledTimes(1);
    });

    await step('picking a day blurs as well', async () => {
      await userEvent.click(trigger);
      await userEvent.click(await body.findByText('12'));
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

      await expect(args.onBlur).toHaveBeenCalledTimes(2);
    });
  },
};

export const OpenClose: Story = {
  args: { value: new Date(2025, 8, 4) },
  play: async ({ args, canvasElement, step }) => {
    const body = getBody(canvasElement);
    const trigger = getTrigger(canvasElement);

    await step('click on trigger opens popover', async () => {
      await userEvent.click(trigger);

      await expect(await body.findByRole('dialog')).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    });

    await step('Escape closes popover and returns focus to trigger', async () => {
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
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
