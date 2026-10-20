# Inputs

Shared text fields from the Figma design system ("Design system (components)" → Input & Textarea).
Live examples of every state, Light and Dark: Storybook → **Shared/Input**, **Shared/Textarea**.

## Files

| Folder      | Component  | Use for                                                     |
| ----------- | ---------- | ----------------------------------------------------------- |
| `input/`    | `Input`    | single-line fields: email, password, names, ISO code, …     |
| `textarea/` | `Textarea` | multi-line fields: CV description, project responsibilities |
| `field/`    | `Field`    | internal wrapper (label, border, error). Not exported       |

```tsx
import { Input, Textarea } from '@/shared/components/inputs';
```

## Input

```tsx
<Input label="Email" type="email" />
<Input label="Password" type="password" />                 // eye toggle is added automatically
<Input label="First Name" error="First name is required" />
<Input label="Email" value={user.email} disabled />         // read-only field, e.g. Update user modal
```

| Prop       | Values    | Default |
| ---------- | --------- | ------- |
| `label`    | `string`  | —       |
| `error`    | `string`  | —       |
| `disabled` | `boolean` | `false` |

Plus every native `<input>` attribute (`type`, `name`, `value`, `defaultValue`, `onChange`, `onBlur`,
`maxLength`, `autoComplete`, `ref`, `aria-*`).

- `type="password"` renders a show / hide button inside the field (`Show password` / `Hide password`).
  It is `type="button"`, so it never submits the form. The state is local to the field.
- Do **not** pass `placeholder`: the field sets `placeholder=" "` itself, the floating label depends on it.
  The label plays the placeholder role in the empty state.
- `className` goes to the outer wrapper (label + field + error), not to the `<input>`, so margins and
  width move the whole field.

## Textarea

```tsx
<Textarea label="Description" error={errors.description?.message} />
<Textarea label="Responsibilities" rows={6} />
```

Same props as `Input` (no `type`) plus every native `<textarea>` attribute. Fixed height
`--textarea-height` (120px), `resize: none`; longer text scrolls inside.

## With react-hook-form

`ref` is a normal prop (React 19), so `register()` can be spread directly:

```tsx
const { register, formState: { errors } } = useForm<SignInForm>({ resolver: zodResolver(schema) });

<Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
<Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
```

Error texts come from the zod schema and must match `docs/REQUIREMENTS.md` exactly.

## States

All states are CSS, not props, except `error` and `disabled`.

| State          | Trigger                                | Look                                                             |
| -------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Default        | empty, not focused                     | grey border, label inside the field                              |
| Hover          | `:hover`                               | darker border                                                    |
| Focus / Filled | `:focus` or `:not(:placeholder-shown)` | label moves above the border and shrinks to 12px                 |
| Error          | `error` prop                           | red border, red raised label, red eye icon, text under the field |
| Disabled       | `disabled` prop                        | grey fill, `#AEAEAE` text, no hover, eye disabled                |

## Accessibility

- `<label htmlFor>` is linked to the control; the id comes from `useId()` unless `id` is passed.
- With `error`: `aria-invalid="true"` and `aria-describedby` → the error text, which has `role="alert"`
  so screen readers announce it when it appears.
- The password toggle has an `aria-label` that says what the click will do and `aria-controls` → the input.
- Animations are disabled with `prefers-reduced-motion: reduce`.

## Layout

The raised label sits **above** the border, so `Field` reserves `padding-top: var(--space-4)` (16px).
A field takes 64px (Input) / 136px (Textarea) plus the error line. Width is 100% of the parent:
set the width on the parent or via `className`.

## Tokens

Styles use tokens from [`theme/tokens.css`](../../theme/tokens.css) only, so Light / Dark switch automatically:
`--input-*`, `--textarea-height`, `--type-input-*`, `--type-label-*`, `--type-helper-*`, `--error`.
To change a size or colour, change the token, not the component CSS.

## Status

- [x] `Input`: label, error, disabled, password toggle, Light / Dark
- [x] `Textarea`
- [x] Storybook stories
- [ ] Unit tests (`Input.test.tsx`, `Textarea.test.tsx`)
- [ ] `Show password` / `Hide password` texts: move to i18n when it is set up
