# MultiSelect

Shared multi-value select with search from the Figma design system
("Design system (components)" → Select, "Multiselect & Autocomplete" column).
Selected values are shown as [`Chip`](../../chip/README.md)s inside the field, the list has a checkbox per option,
typing filters the list.
Live examples of every state, Light and Dark: Storybook → **Shared/MultiSelect**.

The default `emptyText` comes from `common.select` in `messages/en.json`, and the chips' ⊗ names from
`common.chip`, so it needs `NextIntlClientProvider` above it: the root layout mounts it in the app,
`.storybook/preview.tsx` in Storybook.

Radix `Select` has no multi mode, so this one is built on Radix
[`Popover`](https://www.radix-ui.com/primitives/docs/components/popover) (portal, positioning, outside click,
Escape) with an own listbox. Label, border and error come from [`Field`](../../field/README.md).

## Files

| File                      | What                                |
| ------------------------- | ----------------------------------- |
| `MultiSelect.tsx`         | component                           |
| `MultiSelect.module.css`  | field with chips, list, tokens only |
| `MultiSelect.stories.tsx` | states + `play` interaction tests   |

```tsx
import { MultiSelect } from '@/shared/components/select/multi-select/MultiSelect';
```

## Usage

```tsx
const POSITIONS = [
  { value: 'se', label: 'Software Engineer' },
  { value: 'qa', label: 'QA Engineer' },
];

<MultiSelect label="Position" options={POSITIONS} />                                     // uncontrolled
<MultiSelect label="Position" options={POSITIONS} defaultValue={['se']} />              // preselected
<MultiSelect label="Position" options={POSITIONS} value={value} onValueChange={setValue} />  // controlled
<MultiSelect label="Position" options={POSITIONS} error="Position is required" />
<MultiSelect label="Position" options={POSITIONS} defaultValue={['se']} disabled />
```

| Prop            | Values                                                 | Default                                  |
| --------------- | ------------------------------------------------------ | ---------------------------------------- |
| `options`       | `{ value, label, disabled? }[]` (`SelectOption`)       | required                                 |
| `label`         | `string`: also the placeholder of the empty field      | required                                 |
| `value`         | `string[]` · `[]` = nothing selected ⚠️                | —                                        |
| `defaultValue`  | `string[]`                                             | `[]`                                     |
| `onValueChange` | `(value: string[]) => void`                            | —                                        |
| `error`         | `string`: red border + chevron + text                  | —                                        |
| `disabled`      | `boolean`: grey field, chips with disabled ⊗           | `false`                                  |
| `required`      | `boolean`: `aria-required` only, no native validation  | `false`                                  |
| `name`          | `string`: one hidden `<input name>` per selected value | —                                        |
| `id`            | `string`: input id, auto via `useId`                   | auto                                     |
| `open`          | `boolean`                                              | —                                        |
| `defaultOpen`   | `boolean`                                              | `false`                                  |
| `onOpenChange`  | `(open: boolean) => void`                              | —                                        |
| `filter`        | `(option, query) => boolean`                           | label contains query, case-insensitive   |
| `emptyText`     | `string`: shown when nothing matches                   | `common.select.noOptions` (`No options`) |
| `ref`           | `Ref<HTMLInputElement>`: the search input              | —                                        |
| `className`     | on the `Field` root (label + field + error)            | —                                        |

- ⚠️ **Controlled vs uncontrolled:** `value === undefined` → uncontrolled. To clear a controlled select pass
  `value={[]}`, **not** `undefined`. Start the state as `useState<string[]>([])`. Same for `open` / `defaultOpen`.
  Both modes come from [`useControllableState`](../../../lib/useControllableState.ts).
- In controlled mode the component never changes on its own: `onValueChange` reports the new array, the chips
  change only when the parent passes it back.
- `value` holds **values**, not option objects: that's what forms and the API need, and labels stay in one place
  (`options`). A value missing from `options` (e.g. options still loading) gets no chip but stays in `value`.
- There is no `placeholder` prop: like in `Input`, the label sits inside the empty field and moves up on focus,
  on typing or when a chip is there.
- Chips keep the **order of selection**, not the order of `options`.
- `open` without `onOpenChange` freezes the list.

## Behaviour

| Action                     | Result                                                     |
| -------------------------- | ---------------------------------------------------------- |
| focus / click in the field | opens the list, the first option is highlighted            |
| click on the empty area    | toggles the list, focus goes to the input                  |
| typing                     | opens + filters the list, highlights the first match       |
| click / Enter on an option | toggles it, clears the search, **the list stays open**     |
| ⊗ on a chip                | removes the value, doesn't open the list                   |
| click outside / Tab out    | closes the list and clears the search, nothing is selected |

Focus stays in the input the whole time; the list is never focused. That's why:

- the list and the chip ⊗ cancel `mousedown`, so the input doesn't blur (and close the list) before the click;
- Popover's `onOpenAutoFocus` / `onCloseAutoFocus` are cancelled;
- a click on the field counts as "outside" for Radix, so `onInteractOutside` ignores it.

## Keyboard

| Key       | Closed list                             | Open list                                          |
| --------- | --------------------------------------- | -------------------------------------------------- |
| ↓ / ↑     | opens, first option highlighted         | moves the highlight, stops at the ends (no wrap)   |
| Enter     | nothing: the form submits as usual      | toggles the highlighted option, **doesn't submit** |
| Escape    | —                                       | clears the search; with no search closes the list  |
| Backspace | in an empty input removes the last chip | same                                               |
| Space     | types a space                           | types a space (needed for "Software Engineer")     |
| Tab       | leaves the field                        | closes the list                                    |

- The highlighted option is announced through `aria-activedescendant` on the input; mouse and keyboard share it
  (`onMouseMove`, not `:hover`), so only one row is ever highlighted.
- After Enter the search is cleared and the highlight stays on **the same option** in the full list.
- Not supported yet: Home / End, skipping disabled options (arrows stop on them, Enter does nothing there),
  scrolling the list to the highlighted option.

## Layout

The field owns its **look**; its **width comes from the parent** (`Field` is `width: 100%`), there is no fixed or
max width. Set the width with the form layout (e.g. one column on tablet) or `className`.

- The field grows in height when chips wrap. One row: 2 × 12px padding + chip ≈ 50px.
- **Two chips always fit in one row**, at any width: a chip is capped at half the row
  (`.field .chip { max-width: calc((100% - 2 * gap - caret) / 2) }`), a longer label gets an ellipsis
  and the full text is in the chip's tooltip. At 400px "Software Engineer" fits whole.
- The empty input takes only room for the caret, so it stays in the chips' row. While typing it needs 60px and may
  move to the next row. `placeholder=" "` makes `:placeholder-shown` mean "empty" for this rule.
- The right padding reserves room for the chevron, which is pinned to the first row.
- The list matches the field width (`--radix-popover-trigger-width`), is capped at `240px` or the space left on
  screen and scrolls with a visible scrollbar. No room below → it opens above, the joint border follows `[data-side]`.

## Accessibility

- The input is a `combobox` (`aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`),
  the list is a `listbox` with `aria-multiselectable`, options carry `aria-selected` / `aria-disabled`.
- The checkbox in an option is decorative (`aria-hidden`): the option itself is the control.
- With `error`: `aria-invalid` and `aria-describedby` → the `Field` error text.
- Hidden inputs for `name` are nested in the field, not direct children of `Field`'s `.control`: otherwise
  `Field`'s `:not(:placeholder-shown)` rule would keep the label raised in an empty field.

## Usage with react-hook-form

```tsx
<Controller
  name="skillIds"
  control={control}
  render={({ field, fieldState }) => (
    <MultiSelect
      ref={field.ref}
      label="Skills"
      options={skillOptions}
      value={field.value ?? []}
      onValueChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

## Tokens

Styles use tokens from [`theme/tokens.css`](../../../theme/tokens.css) only, so Light / Dark switch automatically:
`--input-*`, `--menu-bg`, `--select-option-*`, `--icon-size`, `--text-*`; chips use `--chip-*`.
To change a size or colour, change the token, not the component CSS.

## Tests

`play` functions in `MultiSelect.stories.tsx` run in Storybook (Interactions panel) and in Vitest
(`@storybook/addon-vitest`, needs `npx playwright install chromium` once).

| Story                 | Checks                                                        |
| --------------------- | ------------------------------------------------------------- |
| `Default`             | closed, no chips, accessible name, label inside               |
| `WithValue`           | chips in the order of selection, label raised                 |
| `ManyChips`           | chips wrap, the field grows                                   |
| `Open`                | every option, `aria-expanded`, `onOpenChange`, `Field` active |
| `Disabled`            | input and chip ⊗ disabled, can't be opened                    |
| `Invalid`             | `aria-invalid`, error as the accessible description           |
| `DisabledOption`      | a disabled option can't be chosen                             |
| `SelectsSeveral`      | two clicks → two chips, the list stays open                   |
| `Deselects`           | a second click removes the value                              |
| `RemoveChip`          | ⊗ removes the value and doesn't open the list                 |
| `Filters`             | typing filters, `emptyText`, picking clears the search        |
| `Keyboard`            | arrows, ends, Enter toggles, highlight kept after a search    |
| `EnterDoesNotSubmit`  | Enter in an open list doesn't submit the form                 |
| `Backspace`           | removes the last chip                                         |
| `Closes`              | Escape twice, click outside                                   |
| `Controlled`          | external state + reset to `[]`                                |
| `ControlledRejecting` | the parent ignores `onValueChange` → no chip appears          |

- The list is portaled to `<body>`: query it with `within(canvasElement.ownerDocument.body)`.
- Popover is not modal, so `userEvent.click(body)` works for an outside click (unlike Radix Select).
- `Field` state is on its root: `data-filled` / `data-active` (label → `.control` → root).
- The highlighted option: `data-highlighted` + `aria-activedescendant` on the input equals the option `id`.
