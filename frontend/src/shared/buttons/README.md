# Buttons

Shared buttons from the Figma design system ("Design system (components)" → Buttons).
Live examples of every variant and state, Light and Dark: Storybook → **Shared/Button**, **Shared/IconButton**.

## Files

| Folder         | Component    | Use for                                            |
| -------------- | ------------ | -------------------------------------------------- |
| `button/`      | `Button`     | every button with a text label                     |
| `icon-button/` | `IconButton` | icon-only buttons, e.g. three-dot row action menu  |

```tsx
import { Button, IconButton } from '@/shared/buttons';
```

## Button

```tsx
<Button>UPDATE</Button>                          // primary, 48px
<Button variant="secondary">VERIFY EMAIL</Button>
<Button variant="ghost">CANCEL</Button>
<Button variant="text">UPDATE</Button>           // "Primary (V2)" in Figma
<Button size="sm">CREATE USER</Button>           // 40px, toolbar buttons
<Button type="submit" loading={isSubmitting}>SAVE</Button>
```

| Prop      | Values                                     | Default     |
| --------- | ------------------------------------------ | ----------- |
| `variant` | `primary` · `secondary` · `ghost` · `text` | `primary`   |
| `size`    | `md` (48px) · `sm` (40px)                  | `md`        |
| `loading` | `boolean`                                  | `false`     |
| `type`    | native                                     | `button` ⚠️ |

Plus every native `<button>` attribute (`onClick`, `disabled`, `form`, `aria-*`, `className`, `style`).

- ⚠️ `type` defaults to `button`, so a button inside a form does **not** submit it. Pass `type="submit"` explicitly.
- `loading` disables the button and sets `aria-busy`. Use it for mutations: it prevents duplicate
  submissions (AGENTS.md §2). The label stays in the layout, so the width doesn't jump.
- Hover / Active / Disabled / Focus are CSS states (`:hover`, `:active`, `:disabled`, `:focus-visible`), not props.

## IconButton

```tsx
<IconButton aria-label="Open actions" onClick={openMenu}>
  <MoreIcon />
</IconButton>
```

- `aria-label` is **required** by the type: the button has no visible text.
- The icon is passed as `children` (an `<svg>`); it takes `currentColor` and `--icon-size`.
- Fixed square `--icon-button-size` + `border-radius: 50%` → always a circle.

## Sizing rules

The button owns its **height and look**; its **width comes from the content**, never less than
`--button-min-width`. Where the button sits and whether it stretches is decided by the **parent**.

- Buttons in a row (modal CANCEL / CREATE) → parent `display: flex; gap: …`, no extra props.
- Full width (Sign In form) → let the parent stretch it, or `className` with `width: 100%`.
  If this repeats on several pages, add a `fullWidth` prop instead.
- One-off exception → `className` (preferred) or `style`. Don't add new `size` values unless the design has them.
- A grid parent stretches children by default (`justify-items: stretch`), which overrides `min-width`.

## Tokens

Styles use component / semantic tokens from [`theme/tokens.css`](../theme/tokens.css) only, so Light / Dark
switch automatically: `--button-*`, `--primary-*`, `--icon-button-size`, `--focus-ring`.
To change a size or colour, change the token, not the component CSS.

## Status

- [x] `Button`: 4 variants, 2 sizes, loading, disabled, Light / Dark
- [x] `IconButton`
- [x] Storybook stories
- [ ] Unit tests (blocked: Vitest + React Testing Library are not set up yet)
- [ ] `fullWidth` prop: add when the auth pages need it
- [ ] Icon set: no shared icon library yet; `MoreIcon` in stories is an inline SVG
