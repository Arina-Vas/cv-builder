import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { z } from 'zod';
import { Button } from '@/shared/components/buttons';
import { DatePicker } from '@/shared/components/date-picker/DatePicker';
import { Input, Textarea } from '@/shared/components/inputs';
import { Select } from '@/shared/components/select/Select';
import { MultiSelect } from '@/shared/components/select/multi-select/MultiSelect';
import {
  optionalString,
  requiredDate,
  requiredIds,
  requiredString,
  useAppForm,
  type ValidationT,
} from '@/shared/lib/form';
import layout from './FormLayout.module.css';
import { FormModal } from './FormModal';

/* ------------------------------------------------------------------ */
/* Simulated request                                                   */
/* ------------------------------------------------------------------ */

type Outcome = 'success' | 'error' | 'conflict';

const ERRORS: Record<Exclude<Outcome, 'success'>, CombinedGraphQLErrors> = {
  // an error without a field: shown above the buttons
  error: new CombinedGraphQLErrors({
    errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
  }),
  // the backend's conflict('name', ...) for a duplicate: shown under the field
  conflict: new CombinedGraphQLErrors({
    errors: [
      {
        message: 'Department already exists',
        extensions: { code: 'CONFLICT', field: 'name' },
      },
    ],
  }),
};

// what a mutation does: resolves on success, rejects with an Apollo error on failure
const request = (outcome: Outcome, delay = 300) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (outcome === 'success') resolve();
      else reject(ERRORS[outcome]);
    }, delay);
  });

/* ------------------------------------------------------------------ */
/* Example: Create / Edit department                                   */
/* ------------------------------------------------------------------ */

// same limit as the backend (MAX_NAME_LENGTH in backend/src/common/graphql/constants.ts)
const DEPARTMENT_NAME_MAX = 100;

// a schema is a factory of the `validation` translator, so the field errors are translated
const departmentSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('department.required')).max(DEPARTMENT_NAME_MAX, {
      error: t('department.maxLength', { max: DEPARTMENT_NAME_MAX }),
    }),
  });

type DepartmentDemoProps = {
  onSubmit: (values: { name: string }) => void;
  outcome?: Outcome;
  delay?: number;
  // Edit mode: the department being edited
  department?: string;
  requireDirty?: boolean;
  // open on mount: for Dark and manual checks without clicking the trigger
  initialOpen?: boolean;
};

const DepartmentDemo = ({
  onSubmit,
  outcome = 'success',
  delay,
  department,
  requireDirty,
  initialOpen = false,
}: DepartmentDemoProps) => {
  const t = useTranslations('validation');
  const schema = useMemo(() => departmentSchema(t), [t]);
  const form = useAppForm({ schema, defaultValues: { name: '' } });
  const [open, setOpen] = useState(initialOpen);
  const isEdit = department !== undefined;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {isEdit ? 'Edit department' : 'Create department'}
      </Button>
      <FormModal
        form={form}
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Edit department' : 'Create department'}
        mode={isEdit ? 'update' : 'create'}
        values={{ name: department ?? '' }}
        requireDirty={requireDirty}
        onSubmit={(values) => {
          onSubmit(values);
          return request(outcome, delay);
        }}
      >
        <Input
          label="Department"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
      </FormModal>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Example: every shared field                                         */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
];

const TECHNOLOGIES = [
  { value: 'react', label: 'React' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'postgres', label: 'PostgreSQL' },
];

const projectSchema = z.object({
  name: requiredString('Name is required'),
  description: optionalString(),
  categoryId: requiredString('Category is required'),
  technologyIds: requiredIds('Select at least one technology'),
  startDate: requiredDate('Start Date is required'),
});

const AllFieldsDemo = ({
  onSubmit,
}: {
  onSubmit: (values: z.output<typeof projectSchema>) => void;
}) => {
  const form = useAppForm({
    schema: projectSchema,
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      technologyIds: [],
      startDate: null,
    },
  });
  const [open, setOpen] = useState(false);
  const { errors } = form.formState;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create project</Button>
      <FormModal
        form={form}
        open={open}
        onOpenChange={setOpen}
        title="Create project"
        size="md"
        className={layout.grid}
        values={{ name: '', description: '', categoryId: '', technologyIds: [], startDate: null }}
        onSubmit={(values) => {
          onSubmit(values);
          return request('success');
        }}
      >
        {/* Input / Textarea: register */}
        <Input label="Name" {...form.register('name')} error={errors.name?.message} />

        {/* Select / MultiSelect / DatePicker: Controller */}
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Select
              ref={field.ref}
              name={field.name}
              label="Category"
              options={CATEGORIES}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="startDate"
          render={({ field, fieldState }) => (
            <DatePicker
              ref={field.ref}
              label="Start Date"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="technologyIds"
          render={({ field, fieldState }) => (
            <MultiSelect
              ref={field.ref}
              name={field.name}
              label="Technologies"
              options={TECHNOLOGIES}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              className={layout.full}
            />
          )}
        />
        <Textarea
          label="Description"
          {...form.register('description')}
          error={errors.description?.message}
          className={layout.full}
        />
      </FormModal>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

const getBody = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

const openDialog = async (canvasElement: HTMLElement, trigger: string) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: trigger }));
  return getBody(canvasElement).findByRole('dialog', { name: trigger });
};

const meta = {
  title: 'Shared/FormModal',
  component: DepartmentDemo,
  args: {
    onSubmit: fn(),
    outcome: 'success',
  },
  argTypes: {
    onSubmit: { control: false },
    outcome: { control: 'inline-radio', options: ['success', 'error', 'conflict'] },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DepartmentDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// The example from the task: a schema with translated messages, validation on blur, submit, close
export const CreateDepartment: Story = {
  play: async ({ args, canvasElement, step }) => {
    const dialog = await openDialog(canvasElement, 'Create department');
    const input = within(dialog).getByRole('textbox', { name: 'Department' });
    const create = within(dialog).getByRole('button', { name: 'Create' });

    await step('empty form: Create is disabled, no error before the field is touched', async () => {
      // one field: the narrow window, as in Figma (CREATE DEPARTMENT)
      await expect(dialog).toHaveAttribute('data-size', 'sm');
      await expect(create).toBeDisabled();
      await expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    });

    await step('leaving the empty field shows the translated required error', async () => {
      await userEvent.click(input);
      await userEvent.tab();

      await expect(await within(dialog).findByText('Department name is required')).toBeVisible();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('too long a name shows the translated max length error', async () => {
      await userEvent.click(input);
      await userEvent.paste('a'.repeat(DEPARTMENT_NAME_MAX + 1));

      await expect(
        await within(dialog).findByText('Department name must not exceed 100 characters'),
      ).toBeVisible();
      await expect(create).toBeDisabled();
    });

    await step('a valid name enables Create; the value is trimmed on submit', async () => {
      await userEvent.clear(input);
      await userEvent.type(input, '  Quality Assurance  ');
      await waitFor(() => expect(create).toBeEnabled());

      await userEvent.click(create);

      await expect(args.onSubmit).toHaveBeenCalledWith({ name: 'Quality Assurance' });
    });

    await step('closes after success', async () => {
      await waitFor(() =>
        expect(getBody(canvasElement).queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });
  },
};

export const EditDepartment: Story = {
  args: { department: 'Engineering', requireDirty: true },
  play: async ({ args, canvasElement, step }) => {
    const dialog = await openDialog(canvasElement, 'Edit department');
    const input = within(dialog).getByRole('textbox', { name: 'Department' });
    const save = within(dialog).getByRole('button', { name: 'Save' });

    await step('the field is filled, Save is disabled until something changes', async () => {
      await expect(input).toHaveValue('Engineering');
      await expect(save).toBeDisabled();
    });

    await step('Enter in the field submits the changed value', async () => {
      await userEvent.type(input, ' Team');
      await waitFor(() => expect(save).toBeEnabled());
      await userEvent.keyboard('{Enter}');

      await expect(args.onSubmit).toHaveBeenCalledWith({ name: 'Engineering Team' });
    });
  },
};

export const Submitting: Story = {
  args: { department: 'Engineering', delay: 1500 },
  play: async ({ args, canvasElement, step }) => {
    const body = getBody(canvasElement);
    const dialog = await openDialog(canvasElement, 'Edit department');
    const save = within(dialog).getByRole('button', { name: 'Save' });

    await step(
      'while the request runs: loading, CANCEL and × disabled, Esc does not close',
      async () => {
        await userEvent.click(save);

        await expect(save).toHaveAttribute('aria-busy', 'true');
        await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
        await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeDisabled();

        await userEvent.keyboard('{Escape}');
        await expect(body.getByRole('dialog')).toBeInTheDocument();
      },
    );

    // React applies the isSubmitting update before the next click or keypress, so the disabled
    // button is the guard: a click can't reach it, and the browser does not submit on Enter while
    // the form's default button is disabled. (user-event's own Enter emulation ignores buttons
    // linked with form="…" and would submit anyway, so it is not used here.)
    await step('a second submit is impossible: the submit button is disabled', async () => {
      await expect(save).toBeDisabled();
    });

    await step('closes when the request succeeds, after a single submit', async () => {
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument(), {
        timeout: 3000,
      });
      await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    });
  },
};

export const SubmitError: Story = {
  args: { department: 'Engineering', outcome: 'error' },
  play: async ({ canvasElement, step }) => {
    const body = getBody(canvasElement);
    let dialog = await openDialog(canvasElement, 'Edit department');
    const input = within(dialog).getByRole('textbox', { name: 'Department' });

    await step('the error is shown in the dialog, the input is kept', async () => {
      await userEvent.type(input, ' Team');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      await expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "You don't have permission to do this",
      );
      await expect(body.getByRole('dialog')).toBeInTheDocument();
      await expect(input).toHaveValue('Engineering Team');
      await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    await step('reopening starts from the entity again, without the error', async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

      dialog = await openDialog(canvasElement, 'Edit department');

      await expect(within(dialog).getByRole('textbox', { name: 'Department' })).toHaveValue(
        'Engineering',
      );
      await expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    });
  },
};

// The name passed the schema, the backend rejected it as a duplicate (CONFLICT, field: 'name')
export const ConflictOnField: Story = {
  args: { outcome: 'conflict' },
  play: async ({ canvasElement, step }) => {
    const dialog = await openDialog(canvasElement, 'Create department');
    const input = within(dialog).getByRole('textbox', { name: 'Department' });
    const create = within(dialog).getByRole('button', { name: 'Create' });

    await step('the error is shown under the field, not above the buttons', async () => {
      await userEvent.type(input, 'Engineering');
      await waitFor(() => expect(create).toBeEnabled());
      await userEvent.click(create);

      await expect(await within(dialog).findByText('This value is already taken')).toBeVisible();
      await expect(within(dialog).getAllByRole('alert')).toHaveLength(1);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveFocus();
      await expect(input).toHaveValue('Engineering');
    });

    await step('submit is disabled until the name changes', async () => {
      await waitFor(() => expect(create).toBeDisabled());
    });

    await step('changing the name clears the error and enables submit', async () => {
      await userEvent.type(input, ' Team');

      await waitFor(() =>
        expect(within(dialog).queryByText('This value is already taken')).not.toBeInTheDocument(),
      );
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      await waitFor(() => expect(create).toBeEnabled());
    });
  },
};

export const AllFields: Story = {
  render: (args) => <AllFieldsDemo onSubmit={args.onSubmit} />,
  play: async ({ args, canvasElement, step }) => {
    const body = getBody(canvasElement);
    const dialog = await openDialog(canvasElement, 'Create project');
    const create = within(dialog).getByRole('button', { name: 'Create' });

    // relative widths, so the check does not depend on the viewport size
    await step(
      'md window, two columns: short fields take half, long ones the whole row',
      async () => {
        const width = (element: HTMLElement) => element.getBoundingClientRect().width;
        const form = dialog.querySelector('form')!;
        const name = within(dialog).getByRole('textbox', { name: 'Name' });
        // the Field root is the direct child of the form
        const fieldRoot = (control: HTMLElement) =>
          [...form.children].find((child) => child.contains(control)) as HTMLElement;

        await expect(dialog).toHaveAttribute('data-size', 'md');
        await expect(width(fieldRoot(name))).toBeLessThan(width(form) / 2);
        await expect(
          width(fieldRoot(within(dialog).getByRole('textbox', { name: 'Description' }))),
        ).toBe(width(form));
        await expect(
          width(fieldRoot(within(dialog).getByRole('combobox', { name: 'Technologies' }))),
        ).toBe(width(form));
      },
    );

    await step('fill every field', async () => {
      await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), ' CV Builder ');

      await userEvent.click(within(dialog).getByRole('combobox', { name: 'Category' }));
      await userEvent.click(await body.findByRole('option', { name: 'Frontend' }));

      await userEvent.click(within(dialog).getByRole('combobox', { name: 'Technologies' }));
      await userEvent.click(await body.findByRole('option', { name: 'React' }));
      await userEvent.click(within(dialog).getByRole('heading', { name: 'Create project' }));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Start Date' }));
      await userEvent.click(await body.findByText('15'));

      await userEvent.type(within(dialog).getByRole('textbox', { name: 'Description' }), 'Demo');
    });

    await step('submit gets the schema output: trimmed text, ids, a Date', async () => {
      await waitFor(() => expect(create).toBeEnabled());
      await userEvent.click(create);

      await expect(args.onSubmit).toHaveBeenCalledWith({
        name: 'CV Builder',
        description: 'Demo',
        categoryId: 'frontend',
        technologyIds: ['react'],
        startDate: expect.any(Date),
      });
    });
  },
};

export const Dark: Story = {
  args: { initialOpen: true },
  globals: { theme: 'dark' },
};
