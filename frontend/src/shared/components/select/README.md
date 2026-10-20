# Select

Shared single-value select from the Figma design system ("Design system (components)" → Select, left column).
Built on Radix [`Select`](https://www.radix-ui.com/primitives/docs/components/select): keyboard, focus, ARIA, portal
and collision handling come from Radix, the look comes from `Select.module.css`.
Live examples of every state, Light and Dark: Storybook → **Shared/Select**.

## Files

| File                 | What                                         |
| -------------------- | -------------------------------------------- |
| `Select.tsx`         | component                                    |
| `Select.module.css`  | styles, tokens only                          |
| `Select.stories.tsx` | states + `play` interaction tests            |

```tsx
import { Select } from '@/shared/components/select/Select';
```

## Usage

```tsx
const POSITIONS = [
  { value: 'se', label: 'Software Engineer' },
  { value: 'qa', label: 'QA Engineer' },
];

<Select label="Position" placeholder="Position" options={POSITIONS} />          // uncontrolled
<Select label="Position" options={POSITIONS} defaultValue="se" />               // uncontrolled, preselected
<Select label="Position" options={POSITIONS} value={value} onValueChange={setValue} />  // controlled
<Select label="Position" options={POSITIONS} error="Position is required" />
<Select label="Position" options={POSITIONS} disabled />
```

| Prop            | Values                                   | Default           |
| --------------- | ---------------------------------------- | ----------------- |
| `options`       | `{ value, label, disabled? }[]`          | required          |
| `value`         | `string` · `''` = nothing selected ⚠️    | —                 |
| `defaultValue`  | `string`                                 | —                 |
| `onValueChange` | `(value: string) => void`                | —                 |
| `label`         | `string`                                 | —                 |
| `placeholder`   | `string`                                 | `'Select option'` |
| `error`         | `string`: red border + chevron + text    | —                 |
| `disabled`      | `boolean`                                | `false`           |
| `required`      | `boolean`                                | `false`           |
| `name`          | `string`: native form field name         | —                 |
| `id`            | `string`: trigger id, auto via `useId`   | auto              |
| `open`          | `boolean`                                | —                 |
| `defaultOpen`   | `boolean`                                | `false`           |
| `onOpenChange`  | `(open: boolean) => void`                | —                 |
| `ref`           | `Ref<HTMLButtonElement>`: the trigger    | —                 |
| `className`     | on the wrapper (label + trigger + error) | —                 |

- ⚠️ **Controlled vs uncontrolled** is decided by Radix: `value === undefined` → uncontrolled. To clear a
  controlled select pass `value=""`, **not** `undefined` (that silently switches it to uncontrolled).
  Start the state as `useState('')`, not `useState<string>()`.
- `option.value` must be a non-empty string: Radix throws on `value=""` for an item. Convert numeric ids outside.
- `open` without `onOpenChange` freezes the select. Use `defaultOpen` for "open on mount" (stories, demos).
- `name` + `required` render a hidden native `<select>`, so the value is sent with a plain `<form>` submit.
- `ref` points at the trigger button: react-hook-form uses it to focus the field on a validation error.
- Hover / Open / Focus / Disabled / Invalid are CSS states (`:hover`, `[data-state='open']`,
  `:focus-visible`, `:disabled`, `[aria-invalid='true']`), not props.

## Label

The label sits **above** the field and is shown only when the list is open or a value is chosen
(Figma: no label in Default / Hover / Invalid). This is pure CSS, so it works in both modes without state:

```css
.wrapper:has(.trigger[data-state='open']) .label,
.wrapper:has(.trigger:not([data-placeholder])) .label { opacity: 1; }
```

- It is hidden with `opacity`, **not** `visibility` / `display`: a hidden label drops out of the accessibility
  tree and the trigger loses its name. In tests use `toHaveStyle({ opacity })`: `toBeVisible` ignores opacity.
- The space is always reserved, so the field doesn't jump when the label appears.

## Usage with react-hook-form

```tsx
<Controller
  name="position"
  control={control}
  render={({ field, fieldState }) => (
    <Select
      ref={field.ref}
      label="Position"
      options={POSITIONS}
      value={field.value ?? ''}
      onValueChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

- Don't wire `field.onBlur` to the trigger: opening the list moves focus into the portal, so the field
  would be marked touched on the first open.

## Sizing rules

The select owns its **height and look** (`--input-height`); its **width comes from the parent**
(`width: 100%` of the wrapper). There is no fixed or max width in the component.

- Form column → the parent sets the width, e.g. `grid-template-columns: repeat(2, 1fr)`.
- One-off width → `className` on the wrapper.
- The list always matches the trigger width (`--radix-select-trigger-width`) and is capped at
  `240px` or the space left on screen, whichever is smaller.
- No room below → Radix flips the list above; the joint border follows via `[data-side]`.
- A long value is cut with an ellipsis, the chevron never shrinks.

## Tokens

Styles use component / semantic tokens from [`theme/tokens.css`](../../theme/tokens.css) only, so Light / Dark
switch automatically: `--input-*`, `--menu-bg`, `--select-option-*`, `--text-*`, `--icon-size`.
To change a size or colour, change the token, not the component CSS.

## Tests

`play` functions in `Select.stories.tsx` run in Storybook (Interactions panel) and in Vitest
(`@storybook/addon-vitest`, needs `npx playwright install chromium` once).

| Story                 | Checks                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `Default`             | placeholder, closed, accessible name, label hidden                  |
| `Open`                | list with every option, `aria-expanded`, `onOpenChange`, label shown |
| `WithValue`           | value + label shown, chosen option is `data-state="checked"`        |
| `Disabled`            | can't be opened                                                     |
| `Invalid`             | `aria-invalid`, error text                                          |
| `DisabledOption`      | a disabled option can't be chosen                                   |
| `SelectsWithMouse`    | click → `onValueChange`, list closes, focus back on the trigger     |
| `SelectsWithKeyboard` | Tab / Enter / arrows / Home / End                                   |
| `Closes`              | Escape and click outside close without changing the value           |
| `Controlled`          | external state + reset back to the placeholder                      |

Radix quirks the tests rely on:

- The list is portaled to `<body>`: query it with `within(canvasElement.ownerDocument.body)`.
- The chosen option is `data-state="checked"`; `aria-selected` follows **focus**, not the value.
- While open, Radix sets `pointer-events: none` on `<body>`: close by outside click with
  `fireEvent.pointerDown(body)`, `userEvent.click` refuses.
