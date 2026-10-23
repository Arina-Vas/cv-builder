import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { Select } from './Select';

const OPTIONS = [
  { value: 'se-1', label: 'Software Engineer 1' },
  { value: 'se-2', label: 'Software Engineer 2' },
  { value: 'se-3', label: 'Software Engineer 3' },
  { value: 'se-4', label: 'Software Engineer 4' },
];

type Props = ComponentProps<typeof Select>;

const ControlledSelect = ({ value: initial = '', onValueChange, ...rest }: Props) => {
  const [value, setValue] = useState(initial);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Select
        {...rest}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
      <button type="button" onClick={() => setValue('')}>
        Reset
      </button>
    </div>
  );
};

const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

// Field root: label → .control → root (data-filled / data-active live there)
const getFieldRoot = (canvasElement: HTMLElement) =>
  within(canvasElement).getByText('Position', { selector: 'label' }).parentElement!.parentElement!;

const meta = {
  title: 'Shared/Select',
  component: Select,
  args: {
    options: OPTIONS,
    label: 'Position',
    placeholder: 'Position',
    disabled: false,
    onValueChange: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    options: { control: false },
    onValueChange: { control: false },
    onOpenChange: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Position' });
    const root = getFieldRoot(canvasElement);

    await expect(trigger).toHaveAttribute('data-placeholder');
    // closed: the Field label takes the place of the placeholder
    await expect(within(trigger).getByText('Position')).not.toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-invalid');
    await expect(root).not.toHaveAttribute('data-filled');
    await expect(root).not.toHaveAttribute('data-active');
  },
};

export const Open: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await userEvent.click(trigger);

    const listbox = await body.findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(OPTIONS.length);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-active');
    // open and empty: label raised, placeholder shown until something is chosen
    await expect(within(trigger).getByText('Position')).toBeVisible();
  },
};

export const WithValue: Story = {
  args: { defaultValue: 'se-2' },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await step('shows the value, the label is raised', async () => {
      await expect(trigger).toHaveTextContent('Software Engineer 2');
      await expect(trigger).not.toHaveAttribute('data-placeholder');
      await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-filled');
    });

    await step('marks the selected option in the list', async () => {
      await userEvent.click(trigger);

      // Radix ties aria-selected to the focused option, data-state marks the chosen one
      const selected = await body.findByRole('option', { name: 'Software Engineer 2' });
      await expect(selected).toHaveAttribute('data-state', 'checked');

      await userEvent.keyboard('{Escape}');
    });
  },
};

export const Disabled: Story = {
  args: { defaultValue: 'se-2', disabled: true },
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await expect(trigger).toBeDisabled();

    await userEvent.click(trigger);

    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

export const Invalid: Story = {
  args: { error: 'Position is required' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');

    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription('Position is required');
    await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-error');
  },
};

export const WithoutLabel: Story = {
  args: { hideLabel: true, defaultValue: 'se-2' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('combobox', { name: 'Position' })).toHaveTextContent(
      'Software Engineer 2',
    );
    await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-label-hidden');
  },
};

export const DisabledOption: Story = {
  args: {
    options: [...OPTIONS, { value: 'se-5', label: 'Software Engineer 5', disabled: true }],
  },
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await userEvent.click(trigger);
    const option = await body.findByRole('option', { name: 'Software Engineer 5' });

    await expect(option).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(option);

    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(trigger).toHaveAttribute('data-placeholder');
  },
};

export const Dark: Story = {
  globals: {
    theme: 'dark',
  },
};

/* ------------------------------------------------------------------ */
/* Behaviour                                                           */
/* ------------------------------------------------------------------ */

export const SelectsWithMouse: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Software Engineer 3' }));

    await expect(args.onValueChange).toHaveBeenCalledWith('se-3');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(trigger).toHaveTextContent('Software Engineer 3');
    await expect(trigger).toHaveFocus();
  },
};

export const SelectsWithKeyboard: Story = {
  play: async ({ args, canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await step('Tab focuses, Enter opens', async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await body.findByRole('listbox');
    });

    await step('arrows move the highlight, Enter selects', async () => {
      // with no value the first option is highlighted on open
      await userEvent.keyboard('{ArrowDown}');
      await expect(body.getByRole('option', { name: 'Software Engineer 2' })).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      await expect(args.onValueChange).toHaveBeenCalledWith('se-2');
      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(trigger).toHaveTextContent('Software Engineer 2');
    });

    await step('Home / End jump to the first / last option', async () => {
      await userEvent.keyboard('{Enter}');
      await body.findByRole('listbox');

      await userEvent.keyboard('{Home}');
      await expect(body.getByRole('option', { name: 'Software Engineer 1' })).toHaveFocus();

      await userEvent.keyboard('{End}');
      await expect(body.getByRole('option', { name: 'Software Engineer 4' })).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      await expect(args.onValueChange).toHaveBeenLastCalledWith('se-4');
      await expect(trigger).toHaveTextContent('Software Engineer 4');
    });
  },
};

export const Closes: Story = {
  args: { defaultValue: 'se-1' },
  play: async ({ args, canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox');
    const body = getBody(canvasElement);

    await step('Escape closes and returns focus to the trigger', async () => {
      await userEvent.click(trigger);
      await body.findByRole('listbox');

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
    });

    await step('click outside closes without changing the value', async () => {
      await userEvent.click(trigger);
      await body.findByRole('listbox');

      // Radix sets pointer-events: none on <body> while open, so userEvent.click would refuse
      await fireEvent.pointerDown(canvasElement.ownerDocument.body);

      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(trigger).toHaveTextContent('Software Engineer 1');
      await expect(args.onValueChange).not.toHaveBeenCalled();
    });
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledSelect {...args} />,
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = getBody(canvasElement);
    const trigger = canvas.getByRole('combobox');

    await step('selecting an option updates the value', async () => {
      await userEvent.click(trigger);
      await userEvent.click(await body.findByRole('option', { name: 'Software Engineer 2' }));

      await expect(args.onValueChange).toHaveBeenCalledWith('se-2');
      await expect(trigger).toHaveTextContent('Software Engineer 2');
    });

    await step('reset empties the field and lowers the label', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));

      await expect(trigger).toHaveAttribute('data-placeholder');
      await expect(within(trigger).getByText('Position')).not.toBeVisible();
      await expect(getFieldRoot(canvasElement)).not.toHaveAttribute('data-filled');
    });
  },
};
