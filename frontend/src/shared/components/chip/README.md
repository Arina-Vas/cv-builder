# Chip

Shared chip: a short value in an outlined pill, optionally with a ⊗ remove button
(Figma "Design system (components)" → Select, Multiselect column).
Used for the selected values in `MultiSelect`; also fits project environments and skills.
Live examples, Light and Dark: Storybook → **Shared/Chip**.

```tsx
import { Chip } from '@/shared/components/chip/Chip';
```

## Usage

```tsx
<Chip label="React" onRemove={() => removeSkill('react')} />    // with ⊗, as in Figma
<Chip label="React" onRemove={…} disabled />                    // grey, ⊗ shown but disabled
<Chip label="React" />                                          // no ⊗, see the note below
```

| Prop        | Values                                         | Default  |
| ----------- | ---------------------------------------------- | -------- |
| `label`     | `string`                                       | required |
| `onRemove`  | `() => void`: shows the ⊗ button               | —        |
| `disabled`  | `boolean`: grey text, border and ⊗; ⊗ disabled | `false`  |
| `className` | on the root `<span>`                           | —        |

Plus every native `<span>` attribute (`aria-*`, `data-*`, `style`), except `children`: the text is `label`.

- `onRemove` gets **no arguments**: the parent already knows which value it removes
  (`onRemove={() => toggle(option.value)}`). Don't key chips by their label: labels can repeat.
- The ⊗ button is `type="button"` (never submits a form) with `aria-label="Remove {label}"`.
- Clicking ⊗ calls `stopPropagation()`, so the click doesn't reach the parent (e.g. doesn't open a select list).
- ⊗ has `onMouseDown` → `preventDefault()`: focus stays where it was, e.g. in the `MultiSelect` input.
- ⊗ is a normal focusable button: Tab reaches it, Enter / Space remove the chip.
- `disabled` keeps the ⊗ on screen (Figma: disabled MultiSelect) but sets the native `disabled` on the button:
  no click, skipped by Tab, still announced by screen readers as "Remove … , dimmed".
- A chip **without** ⊗ is not in the design system. The closest thing is Project → Environment in the app
  screens, which are MUI filled chips (grey fill, no border). Check that page in Figma before reusing `Chip` there.

## Layout

The chip is `inline-flex` and never wider than its parent. A long label is cut with an ellipsis,
the full text is in the native tooltip (`title`). Put chips in a `flex-wrap` parent with
`gap: var(--chip-gap)`; the chip has no margins of its own.

## Tokens

Styles use tokens from [`theme/tokens.css`](../../theme/tokens.css) only, so Light / Dark switch automatically:
`--chip-border`, `--chip-remove`, `--chip-remove-hover`, `--chip-remove-size`, `--radius-chip`, `--input-disabled-text`.
To change a size or colour, change the token, not the component CSS.
