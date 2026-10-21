# Select

Shared single-value select from the Figma design system ("Design system (components)" → Select, left column).
Built on Radix [`Select`](https://www.radix-ui.com/primitives/docs/components/select): keyboard, focus, ARIA, portal
and collision handling come from Radix. Label, border and error come from [`Field`](../field/README.md),
the trigger and the list from `Select.module.css`.
Live examples of every state, Light and Dark: Storybook → **Shared/Select**.
Several values with search and chips: [`MultiSelect`](./multi-select/README.md).

## Files

| File                 | What                              |
| -------------------- | --------------------------------- |
| `Select.tsx`         | component                         |
| `Select.module.css`  | styles, tokens only               |
| `Select.stories.tsx` | states + `play` interaction tests |

```tsx
import { Select } from '@/shared/components/select/Select';
```

## Usage

```tsx
const POSITIONS = [
  { value: 'se', label: 'Software Engineer' },
  { value: 'qa', label: 'QA Engineer' },
];

<Select label="Position" options={POSITIONS} />                                 // uncontrolled
<Select label="Position" options={POSITIONS} defaultValue="se" />               // uncontrolled, preselected
<Select label="Position" options={POSITIONS} value={value} onValueChange={setValue} />  // controlled
<Select label="Position" options={POSITIONS} error="Position is required" />
<Select label="Position" options={POSITIONS} disabled />
```

| Prop            | Values                                           | Default  |
| --------------- | ------------------------------------------------ | -------- |
| `options`       | `{ value, label, disabled? }[]` (`SelectOption`) | required |
| `label`         | `string`: sits inside the empty closed field     | required |
| `placeholder`   | `string`: shown in the open list until a choice  | `label`  |
| `value`         | `string` · `''` = nothing selected ⚠️            | —        |
| `defaultValue`  | `string`                                         | `''`     |
| `onValueChange` | `(value: string) => void`                        | —        |
| `error`         | `string`: red border + chevron + text            | —        |
| `disabled`      | `boolean`                                        | `false`  |
| `required`      | `boolean`                                        | `false`  |
| `name`          | `string`: native form field name                 | —        |
| `id`            | `string`: trigger id, auto via `useId`           | auto     |
| `open`          | `boolean`                                        | —        |
| `defaultOpen`   | `boolean`                                        | `false`  |
| `onOpenChange`  | `(open: boolean) => void`                        | —        |
| `ref`           | `Ref<HTMLButtonElement>`: the trigger            | —        |
| `className`     | on the `Field` root (label + trigger + error)    | —        |

- ⚠️ **Controlled vs uncontrolled:** `value === undefined` → uncontrolled. To clear a controlled select pass
  `value=""`, **not** `undefined` (that silently switches it to uncontrolled). Start the state as `useState('')`,
  not `useState<string>()`. Same for `open` / `defaultOpen`.
- `Field` has to know whether there is a value and whether the list is open, so both live in
  [`useControllableState`](../../lib/useControllableState.ts) and Radix itself is always controlled.
- `option.value` must be a non-empty string: Radix throws on `value=""` for an item. Convert numeric ids outside.
- `open` without `onOpenChange` freezes the select. Use `defaultOpen` for "open on mount" (stories, demos).
- `name` + `required` render a hidden native `<select>`, so the value is sent with a plain `<form>` submit.
- `ref` points at the trigger button: react-hook-form uses it to focus the field on a validation error.
- With `error`: `aria-invalid` and `aria-describedby` → the `Field` error text.

## Label

Like in `Input` and `MultiSelect`, the `Field` label sits inside the empty field and moves up when the list is
open (`active`) or a value is chosen (`filled`). Keyboard focus without opening only darkens the border
(`[role='combobox']:focus-visible` in `Field`).

| State            | Label  | In the field  |
| ---------------- | ------ | ------------- |
| closed, empty    | inside | —             |
| open, empty      | raised | `placeholder` |
| a value selected | raised | the value     |

- While closed and empty the placeholder is in the DOM but `visibility: hidden`
  (`.trigger[data-placeholder]:not([data-state='open']) .value`), so it doesn't overlap the label.
  The trigger's accessible name still comes from the label.

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
(`Field` is `width: 100%`). There is no fixed or max width in the component.

- Form column → the parent sets the width, e.g. `grid-template-columns: repeat(2, 1fr)`.
- One-off width → `className` on the `Field` root.
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

| Story                 | Checks                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `Default`             | empty, closed, accessible name, label inside                            |
| `Open`                | list with every option, `aria-expanded`, `onOpenChange`, `Field` active |
| `WithValue`           | value shown, label raised, chosen option is `data-state="checked"`      |
| `Disabled`            | can't be opened                                                         |
| `Invalid`             | `aria-invalid`, error as the accessible description                     |
| `DisabledOption`      | a disabled option can't be chosen                                       |
| `SelectsWithMouse`    | click → `onValueChange`, list closes, focus back on the trigger         |
| `SelectsWithKeyboard` | Tab / Enter / arrows / Home / End                                       |
| `Closes`              | Escape and click outside close without changing the value               |
| `Controlled`          | external state + reset back to an empty field                           |

Radix quirks the tests rely on:

- `Field` state is on its root: `data-filled` / `data-active` / `data-error` (label → `.control` → root).
- The list is portaled to `<body>`: query it with `within(canvasElement.ownerDocument.body)`.
- The chosen option is `data-state="checked"`; `aria-selected` follows **focus**, not the value.
- While open, Radix sets `pointer-events: none` on `<body>`: close by outside click with
  `fireEvent.pointerDown(body)`, `userEvent.click` refuses.
