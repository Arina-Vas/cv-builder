# Field

Internal wrapper for form controls: floating label, border, error text. Not exported from a public index;
components import it directly and render the control as `children`.
Used by `Input`, `Textarea` ([`../inputs`](../inputs/README.md)), `Select`, `MultiSelect` ([`../select`](../select/README.md)).

```tsx
import { Field, getErrorId } from '@/shared/components/field/Field';
```

## Usage

The component owns the id and wires the control to the label and the error:

```tsx
const autoId = useId();
const controlId = id ?? autoId;

<Field id={controlId} label={label} error={error} disabled={disabled} className={className}>
  <input
    id={controlId}
    placeholder=" "
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? getErrorId(controlId) : undefined}
  />
</Field>;
```

| Prop        | Values                                          | Default  |
| ----------- | ----------------------------------------------- | -------- |
| `id`        | `string`: id of the control, `htmlFor` of label | required |
| `label`     | `string`                                        | required |
| `error`     | `string`: red border + text under the field     | —        |
| `disabled`  | `boolean`: grey fill, grey label                | `false`  |
| `filled`    | `boolean`: the control has a value              | `false`  |
| `active`    | `boolean`: the control is open / in use         | `false`  |
| `hideLabel` | `boolean`: no visible label, no space above     | `false`  |
| `className` | on the root (label + control + error)           | —        |

## When the label is raised

| Control                 | How Field knows                                         | Pass                       |
| ----------------------- | ------------------------------------------------------- | -------------------------- |
| `<input>`, `<textarea>` | CSS: `:focus` and `:not(:placeholder-shown)`            | nothing, `placeholder=" "` |
| `Select`, `MultiSelect` | no native placeholder, focus moves into the list portal | `filled`, `active`         |

- `filled` → raised label. `active` → raised label + focus border (e.g. while the list is open).
- The control must be a **direct child** for the CSS states (`.control > input`, `.control > [role='combobox']`).
  If it's nested (chips + input), drive the state with `filled` / `active`.
- Don't replace the rules with `:focus-within`: the password eye button is inside the field too, and focusing
  it would raise the label of an empty input.

## Layout

The raised label sits **above** the border, so the root reserves `padding-top: var(--space-4)` (16px).
Width is 100% of the parent. The border is the `.outline` overlay, so the control itself has `border: 0`.

## Accessibility

- The error has `id={getErrorId(id)}` and `role="alert"`: link it with `aria-describedby` on the control.
- The label has `pointer-events: none`, clicks go through to the control.
- Transitions are off with `prefers-reduced-motion: reduce`.
