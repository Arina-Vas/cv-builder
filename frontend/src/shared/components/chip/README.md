# Chip

Shared chip: a short value in a pill, in two looks:

- **outlined** (default): border, no fill, optionally with a ⊗ remove button
  (Figma "Design system (components)" → Select, Multiselect column). Used for the selected values in `MultiSelect`
  and for project environments.
- **filled**: grey fill, no border, 24px high, smaller text (13px / 143%, letter-spacing 0.01em) (Figma "1440px Desktop" →
  [CV PROJECTS](https://www.figma.com/design/m3zxmLv79A6MsHCuAIQAoo/CV-Builder?node-id=21482-33925),
  the responsibilities under a project's description). For read-only lists of short values.

Live examples, Light and Dark: Storybook → **Shared/Chip** (`AllStates`, `Filled`, `Filled: list of responsibilities`).

```tsx
import { Chip } from '@/shared/components/chip/Chip';
```

## Usage

```tsx
<Chip label="React" onRemove={() => removeSkill('react')} />    // outlined with ⊗, as in Figma
<Chip label="React" onRemove={…} disabled />                    // grey, ⊗ shown but disabled
<Chip label="React" />                                          // outlined, no ⊗
<Chip label="Did something great" variant="filled" />           // filled, read-only
```

A list of filled chips, e.g. the responsibilities of a CV project:

```tsx
<ul className={s.chips}>
  {items.map((item, index) => (
    <li key={index}>
      <Chip label={item} variant="filled" />
    </li>
  ))}
</ul>
```

| Prop        | Values                                                         | Default      |
| ----------- | -------------------------------------------------------------- | ------------ |
| `label`     | `string`                                                       | required     |
| `variant`   | `'outlined'` \| `'filled'` (type `ChipVariant`)                | `'outlined'` |
| `onRemove`  | `() => void`: shows the ⊗ button                               | —            |
| `disabled`  | `boolean`: grey text, border and ⊗; ⊗ disabled (outlined only) | `false`      |
| `className` | on the root `<span>`                                           | —            |

Plus every native `<span>` attribute (`aria-*`, `data-*`, `style`), except `children`: the text is `label`.
The root carries `data-variant`, and `data-removable` / `data-disabled` when they apply.

- `onRemove` gets **no arguments**: the parent already knows which value it removes
  (`onRemove={() => toggle(option.value)}`). Don't key chips by their label: labels can repeat.
- The ⊗ is the shared [`IconButton`](../buttons/README.md), `type="button"` (never submits a form)
  with `aria-label="Remove {label}"` (`common.chip.remove` in `messages/en.json`, so the chip needs
  `NextIntlClientProvider` above it: root layout in the app, `.storybook/preview.tsx` in Storybook).
  The chip CSS overrides its look: 12px, grey, no fill on press,
  same grey when disabled.
- Clicking ⊗ calls `stopPropagation()`, so the click doesn't reach the parent (e.g. doesn't open a select list).
- ⊗ has `onMouseDown` → `preventDefault()`: focus stays where it was, e.g. in the `MultiSelect` input.
- ⊗ is a normal focusable button: Tab reaches it, Enter / Space remove the chip.
  Keyboard focus has no ring: the ⊗ turns the hover colour (`--chip-remove-hover`).
- `disabled` keeps the ⊗ on screen (Figma: disabled MultiSelect) but sets the native `disabled` on the button:
  no click, skipped by Tab, still announced by screen readers as "Remove … , dimmed".
- The filled chip in Figma has no ⊗ and no disabled state. `onRemove` works on it too, but this look is not designed;
  `disabled` on a filled chip adds the grey outlined-disabled border.
- The chip only shows the text it gets. Splitting a stored text into several chips (e.g. CV project
  responsibilities) belongs to the feature that renders them.

## Layout

The chip is `inline-flex` and never wider than its parent. Side padding is 12px, or 12px left /
6px right when it has a ⊗ (`data-removable` on the root). The filled chip is 24px high with a 16px radius; the
outlined one takes the height of its text. A long label is cut with an ellipsis,
the full text is in the native tooltip (`title`). Put chips in a `flex-wrap` parent with
`gap: var(--chip-gap)`; the chip has no margins of its own.

## Tokens

Styles use tokens from [`theme/tokens.css`](../../theme/tokens.css) only, so Light / Dark switch automatically:

- outlined: `--chip-border`, `--radius-chip`;
- filled: `--chip-bg` (`#E2E2E4` / dark `#626262`), `--chip-text` (`#2E2E2E` / dark `#F5F5F7`),
  `--chip-filled-height` (24px), `--chip-filled-radius` (16px);
- ⊗ and states: `--chip-remove`, `--chip-remove-hover`, `--chip-remove-size`, `--input-disabled-text`;
- both: `--space-1` (gap), `--space-3` (padding).

To change a size or colour, change the token, not the component CSS.
