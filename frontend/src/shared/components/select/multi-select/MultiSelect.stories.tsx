import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { MultiSelect } from './MultiSelect';

const OPTIONS = [
  { value: 'se-1', label: 'Software Engineer 1' },
  { value: 'se-2', label: 'Software Engineer 2' },
  { value: 'se-3', label: 'Software Engineer 3' },
  { value: 'se-4', label: 'Software Engineer 4' },
];

type Props = ComponentProps<typeof MultiSelect>;

const ControlledMultiSelect = ({ value: initial = [], onValueChange, ...rest }: Props) => {
  const [value, setValue] = useState<string[]>(initial);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MultiSelect
        {...rest}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
      <button type="button" onClick={() => setValue([])}>
        Reset
      </button>
    </div>
  );
};

// the list is portaled to <body>, outside the story canvas
const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);
const getInput = (canvasElement: HTMLElement) => within(canvasElement).getByRole('combobox');
const getChips = (canvasElement: HTMLElement) =>
  within(canvasElement).queryAllByRole('button', { name: /^Remove / });
// Field root: label → .control → root (data-filled / data-active live there)
const getFieldRoot = (canvasElement: HTMLElement) =>
  within(canvasElement).getByText('Position', { selector: 'label' }).parentElement!.parentElement!;
// the highlighted option is both marked and announced through aria-activedescendant
const expectActive = async (canvasElement: HTMLElement, name: string) => {
  const option = getBody(canvasElement).getByRole('option', { name });
  await expect(option).toHaveAttribute('data-highlighted');
  await expect(getInput(canvasElement)).toHaveAttribute('aria-activedescendant', option.id);
};

const meta = {
  title: 'Shared/MultiSelect',
  component: MultiSelect,
  args: {
    options: OPTIONS,
    label: 'Position',
    disabled: false,
    onValueChange: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    options: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    onOpenChange: { control: false },
    filter: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Position' });
    const root = getFieldRoot(canvasElement);

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(getChips(canvasElement)).toHaveLength(0);
    await expect(root).not.toHaveAttribute('data-filled');
    await expect(root).not.toHaveAttribute('data-active');
  },
};

export const WithValue: Story = {
  args: { defaultValue: ['se-3', 'se-1'] },
  play: async ({ canvasElement }) => {
    const chips = getChips(canvasElement);

    // chips keep the order of selection, not the order of options
    await expect(chips.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Remove Software Engineer 3',
      'Remove Software Engineer 1',
    ]);
    await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-filled');
  },
};

export const ManyChips: Story = {
  args: { defaultValue: OPTIONS.map((o) => o.value) },
  play: async ({ canvasElement }) => {
    const tops = getChips(canvasElement).map((b) =>
      Math.round(b.parentElement!.getBoundingClientRect().top),
    );

    await expect(tops).toHaveLength(4);
    const [first, second, third, fourth] = tops as [number, number, number, number];

    // two chips per row, the rest wraps: 4 chips → 2 rows
    await expect(first).toBe(second);
    await expect(third).toBeGreaterThan(first);
    await expect(third).toBe(fourth);
  },
};

export const Open: Story = {
  play: async ({ args, canvasElement }) => {
    const input = getInput(canvasElement);

    await userEvent.click(input);

    const listbox = await getBody(canvasElement).findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(OPTIONS.length);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-active');
  },
};

export const Disabled: Story = {
  args: { defaultValue: ['se-1', 'se-2'], disabled: true },
  play: async ({ args, canvasElement }) => {
    const input = getInput(canvasElement);

    await expect(input).toBeDisabled();
    for (const chip of getChips(canvasElement)) await expect(chip).toBeDisabled();

    await userEvent.click(input);

    await expect(getBody(canvasElement).queryByRole('listbox')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

export const Invalid: Story = {
  args: { error: 'Position is required' },
  play: async ({ canvasElement }) => {
    const input = getInput(canvasElement);

    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Position is required');
  },
};

export const DisabledOption: Story = {
  args: {
    options: [...OPTIONS, { value: 'se-5', label: 'Software Engineer 5', disabled: true }],
  },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(getInput(canvasElement));
    const option = await getBody(canvasElement).findByRole('option', {
      name: 'Software Engineer 5',
    });

    await expect(option).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(option);
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const Dark: Story = {
  args: { defaultValue: ['se-1', 'se-2'] },
  globals: { theme: 'dark' },
};

/* ------------------------------------------------------------------ */
/* Behaviour                                                           */
/* ------------------------------------------------------------------ */

export const SelectsSeveral: Story = {
  play: async ({ args, canvasElement }) => {
    const body = getBody(canvasElement);

    await userEvent.click(getInput(canvasElement));
    await userEvent.click(await body.findByRole('option', { name: 'Software Engineer 1' }));
    await userEvent.click(body.getByRole('option', { name: 'Software Engineer 2' }));

    await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-1', 'se-2']);
    await expect(getChips(canvasElement)).toHaveLength(2);
    // the list stays open for the next pick
    await expect(body.getByRole('listbox')).toBeInTheDocument();
    await expect(body.getByRole('option', { name: 'Software Engineer 2' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

export const Deselects: Story = {
  args: { defaultValue: ['se-2'] },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(getInput(canvasElement));
    await userEvent.click(
      await getBody(canvasElement).findByRole('option', { name: 'Software Engineer 2' }),
    );

    await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
    await expect(getChips(canvasElement)).toHaveLength(0);
  },
};

export const RemoveChip: Story = {
  args: { defaultValue: ['se-1', 'se-2'] },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Remove Software Engineer 1' }),
    );

    await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-2']);
    // ⊗ doesn't open the list
    await expect(getBody(canvasElement).queryByRole('listbox')).not.toBeInTheDocument();
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

export const Filters: Story = {
  play: async ({ canvasElement, step }) => {
    const input = getInput(canvasElement);
    const body = getBody(canvasElement);

    await step('typing opens the list and filters it', async () => {
      await userEvent.type(input, '3');

      const listbox = await body.findByRole('listbox');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
      await expect(getFieldRoot(canvasElement)).toHaveAttribute('data-filled');
    });

    await step('nothing found shows the empty text', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'xyz');

      await expect(body.getByText('No options')).toBeInTheDocument();
    });

    await step('picking an option clears the search', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, '4');
      await userEvent.click(body.getByRole('option', { name: 'Software Engineer 4' }));

      await expect(input).toHaveValue('');
      await expect(within(body.getByRole('listbox')).getAllByRole('option')).toHaveLength(
        OPTIONS.length,
      );
    });
  },
};

export const Keyboard: Story = {
  play: async ({ args, canvasElement, step }) => {
    const input = getInput(canvasElement);
    const body = getBody(canvasElement);

    await step('↓ on the closed list opens it on the first option', async () => {
      await userEvent.click(input);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());

      await userEvent.keyboard('{ArrowDown}');
      await body.findByRole('listbox');
      await expectActive(canvasElement, 'Software Engineer 1');
    });

    await step('arrows move the highlight and stop at the ends', async () => {
      await userEvent.keyboard('{ArrowUp}');
      await expectActive(canvasElement, 'Software Engineer 1');

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
      await expectActive(canvasElement, 'Software Engineer 4');

      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      await expectActive(canvasElement, 'Software Engineer 2');
    });

    await step('Enter toggles the option and keeps the list open', async () => {
      await userEvent.keyboard('{Enter}');

      await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-2']);
      await expect(body.getByRole('listbox')).toBeInTheDocument();
      await expectActive(canvasElement, 'Software Engineer 2');

      await userEvent.keyboard('{Enter}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
    });

    await step(
      'typing highlights the first match, the highlight stays on it after Enter',
      async () => {
        await userEvent.type(input, '3');
        await expectActive(canvasElement, 'Software Engineer 3');

        await userEvent.keyboard('{Enter}');

        await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-3']);
        await expect(input).toHaveValue('');
        // the full list is back, the same option is still highlighted
        await expectActive(canvasElement, 'Software Engineer 3');
      },
    );
  },
};

const onSubmit = fn();

export const EnterDoesNotSubmit: Story = {
  render: (args) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <MultiSelect {...args} />
    </form>
  ),
  play: async ({ args, canvasElement }) => {
    onSubmit.mockClear();

    await userEvent.click(getInput(canvasElement));
    await userEvent.keyboard('{Enter}');

    // the open list takes Enter: it picks the option and doesn't submit the form
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-1']);
    await expect(onSubmit).not.toHaveBeenCalled();
  },
};

export const Backspace: Story = {
  args: { defaultValue: ['se-1', 'se-2'] },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(getInput(canvasElement));
    await userEvent.keyboard('{Backspace}');

    await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-1']);
  },
};

export const Closes: Story = {
  play: async ({ canvasElement, step }) => {
    const input = getInput(canvasElement);
    const body = getBody(canvasElement);

    await step('first Escape clears the search, the second one closes', async () => {
      await userEvent.type(input, '3');
      await body.findByRole('listbox');

      await userEvent.keyboard('{Escape}');
      await expect(input).toHaveValue('');
      await expect(body.getByRole('listbox')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
    });

    await step('click outside closes and clears the search', async () => {
      await userEvent.type(input, '2');
      await body.findByRole('listbox');

      await userEvent.click(canvasElement.ownerDocument.body);

      await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
      await expect(input).toHaveValue('');
    });
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledMultiSelect {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(getInput(canvasElement));
    await userEvent.click(
      await getBody(canvasElement).findByRole('option', { name: 'Software Engineer 1' }),
    );
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['se-1']);
    await expect(getChips(canvasElement)).toHaveLength(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(getChips(canvasElement)).toHaveLength(0);
  },
};

// the parent ignores onValueChange: the component must not change on its own
export const ControlledRejecting: Story = {
  args: { value: [] },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(getInput(canvasElement));
    await userEvent.click(
      await getBody(canvasElement).findByRole('option', { name: 'Software Engineer 1' }),
    );

    await expect(args.onValueChange).toHaveBeenCalledWith(['se-1']);
    await expect(getChips(canvasElement)).toHaveLength(0);
  },
};
