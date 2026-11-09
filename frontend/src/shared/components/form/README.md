# Forms

The form kit every form in the app is built on: [react-hook-form](https://react-hook-form.com) for state,
[zod](https://zod.dev) for validation, the shared fields (`Input`, `Textarea`, `Select`, `MultiSelect`, `DatePicker`,
all on [`Field`](../field/Field.tsx)) for the UI, and `FormModal` for the Create / Edit modals from Figma
(Create department, Create project, Create user, …). Live examples, Light and Dark: Storybook → **Shared/FormModal**.

## Files

| File                                           | What                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `shared/lib/form/useAppForm.ts`                | `useForm` + `zodResolver` + the validation mode shared by all forms       |
| `shared/lib/form/schemas.ts`                   | zod building blocks: `requiredString`, `optionalString`, `requiredIds`, … |
| `shared/lib/form/limits.ts`                    | field length limits shared with the backend: `NAME_MAX_LENGTH`, …         |
| `shared/lib/form/types.ts`                     | `ValidationT`: the `validation` translator a schema factory takes         |
| `shared/components/form/FormModal.tsx`         | `Dialog` + `<form>` + CANCEL / submit, loading, close, request error      |
| `shared/components/form/FormLayout.module.css` | field layout classes: `stack`, `grid`, `full`                             |
| `*.test.ts(x)`, `FormModal.stories.tsx`        | unit tests, stories with `play` checks                                    |

```tsx
import { useAppForm, requiredString, NAME_MAX_LENGTH, type ValidationT } from '@/shared/lib/form';
import { FormModal } from '@/shared/components/form';
import layout from '@/shared/components/form/FormLayout.module.css';
```

## Quick start: Create / Edit department

```tsx
// features/departments/…/department.schema.ts
export const departmentSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('department.required')).max(NAME_MAX_LENGTH, {
      error: t('department.maxLength', { max: NAME_MAX_LENGTH }),
    }),
  });

// features/departments/…/DepartmentFormModal.tsx
const t = useTranslations('departments');
const tValidation = useTranslations('validation');
const schema = useMemo(() => departmentSchema(tValidation), [tValidation]);
const form = useAppForm({ schema, defaultValues: { name: '' } });
// One hook per mutation: a document picked by a ternary loses the variables' types
const options = {
  context: NO_ERROR_TOAST, // FormModal shows the error in the dialog: no global toast
  refetchQueries: [DEPARTMENTS], // the list is up to date before the modal closes
  awaitRefetchQueries: true,
};
const [createDepartment] = useMutation(CREATE_DEPARTMENT, options);
const [updateDepartment] = useMutation(UPDATE_DEPARTMENT, options);

<FormModal
  form={form}
  open={open}
  onOpenChange={onOpenChange}
  title={department ? t('edit.title') : t('create.title')}
  mode={department ? 'update' : 'create'}
  values={{ name: department?.name ?? '' }}
  requireDirty={!!department} // Save stays disabled until the name changes
  onSubmit={(values) =>
    department
      ? updateDepartment({ variables: { input: { id: department.id, ...values } } })
      : createDepartment({ variables: { input: values } })
  }
>
  <Input
    label={t('fields.name')}
    {...form.register('name')}
    error={form.formState.errors.name?.message}
  />
</FormModal>;
```

## Schemas

- **A schema is a factory of the `validation` translator** (`useTranslations('validation')`), so the field errors
  are translated: keys `validation.<field>.<rule>` (`validation.department.required`). Build it in `useMemo`,
  otherwise the resolver is recreated on every render.
- **Building blocks take the translated message**, not a key. Limits are chained as usual zod calls
  (`.max(NAME_MAX_LENGTH, { error })`). The numbers live once in `shared/lib/form/limits.ts`, copied from the
  backend DTOs so both sides agree; add a new limit there, not as a local constant in a schema.
- **Field names are the names of the GraphQL input** (`name`, `categoryId`, `startDate`, `technologyIds`), so the
  values go to the mutation as they are and a server error `field` points at the right field.

| Block                           | In the form → in `onSubmit` | For                                         |
| ------------------------------- | --------------------------- | ------------------------------------------- |
| `requiredString(message)`       | `string` → trimmed `string` | `Input`, `Textarea`, `Select` (`''` = none) |
| `optionalString()`              | `string` → trimmed `string` | optional text                               |
| `requiredIds(message, min = 1)` | `string[]` → `string[]`     | `MultiSelect`                               |
| `requiredDate(message)`         | `Date \| null` → `Date`     | `DatePicker`                                |

Send a date to the API as `format(date, 'yyyy-MM-dd')` (see the `DatePicker` README).

## `useAppForm`

`useForm` with a zod resolver and the mode all forms share. It returns the usual react-hook-form object.

| Option           | Default       | Why                                                                     |
| ---------------- | ------------- | ----------------------------------------------------------------------- |
| `schema`         | required      | the input / output types of the form come from it                       |
| `defaultValues`  | —             | the empty form                                                          |
| `mode`           | `'onTouched'` | an error shows after the user leaves the field, not on the first letter |
| `reValidateMode` | `'onChange'`  | a shown error is re-checked on every change and disappears at once      |

`isValid` is still recomputed on every change, so the submit button can be disabled while the form is invalid.

## Connecting the fields

`Input` and `Textarea` take `register` as is; `Select`, `MultiSelect` and `DatePicker` go through `Controller`:

```tsx
<Input label="Name" {...form.register('name')} error={form.formState.errors.name?.message} />

<Controller
  control={form.control}
  name="categoryId"
  render={({ field, fieldState }) => (
    <Select
      ref={field.ref}
      name={field.name}
      label="Category"
      options={categories}
      value={field.value}
      onValueChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

- `ref` lets react-hook-form focus the first invalid field.
- `onBlur` of `Select` / `DatePicker` fires when the list / calendar closes, of `MultiSelect` when the input loses
  focus, so `mode: 'onTouched'` works for them too (see their READMEs).

## `FormModal`

The page owns the form (`useAppForm`) and passes it in; `FormModal` runs the modal around it.

| Prop           | Values                                                                                                      | Default                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `form`         | the result of `useAppForm`                                                                                  | required                                              |
| `open`         | `boolean`                                                                                                   | required                                              |
| `onOpenChange` | `(open: boolean) => void`                                                                                   | required                                              |
| `title`        | `string`                                                                                                    | required                                              |
| `values`       | the form values for this opening                                                                            | required                                              |
| `onSubmit`     | `(values) => Promise<unknown>`: the mutation, rejects on error; the mutation uses `context: NO_ERROR_TOAST` | required                                              |
| `mode`         | `'create'` · `'update'`                                                                                     | `'create'`                                            |
| `submitLabel`  | `string`                                                                                                    | `create` → Create, `update` → Save (`common.actions`) |
| `requireDirty` | `boolean`: submit disabled until something changes                                                          | `false`                                               |
| `size`         | `'sm'` · `'md'`                                                                                             | `'sm'`                                                |
| `className`    | layout of the fields, set on `<form>`                                                                       | `layout.stack`                                        |

- **Opening** resets the form to `values`: empty for Create, the entity for Edit. Without it the previous row's
  values, errors and touched state would stay, because the form object lives on the page.
- **Submit** is disabled while the form is invalid (and, with `requireDirty`, unchanged). The button sits in the
  dialog footer and is linked with `form="<id>"`, so it stays in place when a long form scrolls and Enter in a field
  still submits.
- **While the request runs** (`isSubmitting`, i.e. until the `onSubmit` promise settles) the submit button shows a
  spinner and is disabled, CANCEL and × are disabled, Esc and a click outside do nothing. A second submit is
  impossible: React disables the button before the next click or keypress, and the browser does not submit on Enter
  while the form's default button is disabled.
- **Success** closes the modal. **Failure** keeps it open with the values, and shows `errors.<CODE>` above the
  buttons (`Dialog` `error`, `role="alert"`), never the backend message; closing clears it. `FormModal` does not
  call the mutation, so it cannot opt it out of the global error toast: the page passes
  `context: NO_ERROR_TOAST` to its `useMutation`, otherwise the error shows in the dialog and as a toast
  ([frontend README](../../../../README.md) → Global error toasts).
- Other labels for the submit button: `submitLabel={t('add')}` / `t('update')` (`common.actions.add`, `update`).
- **Server error on a field.** The values passed the schema, but the backend rejected a field: `CONFLICT` for a
  duplicate name (`extensions.field: 'name'`), `BAD_USER_INPUT` with `extensions.fields`. If that field is in the
  form, `FormModal` puts `errors.<CODE>` under it with `form.setError` (the field gets focus), and nothing is shown
  above the buttons. The field names match the GraphQL input, so no mapping is needed: the page already passes
  `formState.errors.<field>?.message` to the field. The submit button stays disabled until the field changes; the
  change re-checks the field and clears the server error. A field the form does not have falls back to the text
  above the buttons.

## Layout

`FormModal` does not place the fields: the form does, with the classes from `FormLayout.module.css` (one place for
the Figma spacing, tokens `--form-row-gap` / `--form-column-gap`).

| Class   | Where                                     | What                                      |
| ------- | ----------------------------------------- | ----------------------------------------- |
| `stack` | `<form>` (the default of `FormModal`)     | one column with the row gap               |
| `grid`  | `className` of `FormModal` / own `<form>` | two equal columns; every field takes half |
| `full`  | `className` of a field                    | the field takes the whole row of `grid`   |

```tsx
<FormModal size="md" className={layout.grid} …>
  <Input label="Name" … />
  <Input label="Domain" … />
  <DatePicker label="Start Date" … />
  <DatePicker label="End Date" … />
  <Textarea label="Description" className={layout.full} … />
  <MultiSelect label="Environment" className={layout.full} … />
</FormModal>
```

From Figma:

| Form                                       | `size`      | Layout                                                           |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------- |
| Department, Position (one field)           | `sm`        | default                                                          |
| Project                                    | `md`        | `grid`; Description, Environment `full`                          |
| User                                       | `md`        | `grid`; the last field (Role) stays half                         |
| CV Project                                 | `md`        | `grid`; Description, Environment, Roles, Responsibilities `full` |
| Language, Skill, User skill / language, CV | check Figma | `stack` or `grid`                                                |

Page forms (Profile, CV Details, Settings) use the same classes on their own `<form>`.

## Tests

Unit tests (jsdom) cover the logic and states:

| Test                                  | Checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/lib/form/schemas.test.ts`     | each block: required / trim / min / `Date`, the error path, a message from the `validation` translator                                                                                                                                                                                                                                                                                                                                                                        |
| `shared/lib/form/useAppForm.test.tsx` | `onTouched` / `onChange` modes and override, `isValid`, `handleSubmit` gets the schema output                                                                                                                                                                                                                                                                                                                                                                                 |
| `FormModal.test.tsx`                  | `sm` / `md`, button labels, Cancel, layout class and `form` link; values on opening and reset on reopening; disabled while invalid / unchanged; submit and close, Enter; loading state; error text by code and for a network error, kept input, cleared on retry and on reopening; `CONFLICT` with a field: text under the field and focus, submit disabled until the field changes, cleared on change and on reopening, a field not in the form falls back above the buttons |

The stories cover what needs a real browser (layout widths, errors after leaving a field, the full flows with every
field):

| Story              | Checks                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CreateDepartment` | `sm` window; Create disabled while empty; translated "required" after leaving the field and "must not exceed 100 characters"; submit gets the trimmed name; closes |
| `EditDepartment`   | `update` mode: filled from `values`, Save disabled until changed (`requireDirty`), Enter submits                                                                   |
| `Submitting`       | spinner, CANCEL and × disabled, Esc ignored, submit button disabled; closes after one submit                                                                       |
| `SubmitError`      | `errors.FORBIDDEN` text in the dialog, the input is kept, retry possible; reopening resets values and error                                                        |
| `ConflictOnField`  | `CONFLICT` (`field: 'name'`): `errors.CONFLICT` under the field, focus, no text above the buttons; submit disabled until the name changes, then the error is gone  |
| `AllFields`        | `md` + `grid`: short fields half, `full` fields the whole row; all five fields; submit gets trimmed text, ids, a `Date`                                            |
| `Dark`             | visual                                                                                                                                                             |

The request is simulated with a promise; the error is a real `CombinedGraphQLErrors` with `extensions.code`.

## Status

- [x] `useAppForm`, schema blocks, `onBlur` of the selects and the date picker
- [x] `FormModal`: reset on open, disabled / loading submit, close on success, request error, `sm` / `md`, layout
- [x] Example forms in Storybook (Create / Edit department, all fields), Light / Dark
- [x] Server field errors (`CONFLICT` / `BAD_USER_INPUT` with `field`) under the fields
- [ ] Confirm closing with unsaved changes (optional in the task)
- [ ] Auth forms still use their own `useFormFields`; moving them to this kit is a separate task
