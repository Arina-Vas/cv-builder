# Theme (Light / Dark / Device settings)

How theming works in the frontend and how to use it.
Where the token values come from and what is still unconfirmed: [TOKENS.md](TOKENS.md).

## Files

| File                 | Role                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| `tokens.css`         | All design tokens as CSS variables. Light in `:root`, dark in `[data-theme='dark']`. |
| `theme.ts`           | Types (`ThemeMode`, `ResolvedTheme`), constants, `isThemeMode()`, `resolveTheme()`.  |
| `theme-script.ts`    | Inline script that sets `data-theme` before the first paint.                         |
| `theme-provider.tsx` | `ThemeProvider` + `useTheme()` hook.                                                 |
| `TOKENS.md`          | Token sources (Figma / app / MUI defaults) and open questions for the designer.      |

Wiring lives in `src/app/layout.tsx`: it imports `tokens.css` and `globals.css`, loads Roboto with
`next/font` (`--font-roboto`), puts `themeScript` into `<head>` and wraps the app in `<ThemeProvider>`.

## How it works

The only thing that switches the theme is the `data-theme="light" | "dark"` attribute on `<html>`.
`tokens.css` redefines the semantic variables under `[data-theme='dark']`, so components never know
which theme is active.

```
user choice (ThemeMode)          OS preference
LIGHT | DARK | SYSTEM            prefers-color-scheme
        \                          /
         resolveTheme(mode, systemIsDark)
                    |
          data-theme on <html>  →  tokens.css
```

- **First paint.** The server does not know what is in `localStorage`, so `theme-script.ts` runs in
  `<head>` before the body is drawn and sets `data-theme`. This prevents a white flash for dark-theme
  users. `<html>` has `suppressHydrationWarning` because the script changes it before React hydrates.
- **After hydration.** `ThemeProvider` reads the stored mode and the OS preference with
  `useSyncExternalStore` and keeps `data-theme` in sync. While hydrating it does not touch the attribute,
  so it never overwrites the value the script already set.
- **SYSTEM** follows the OS live (`matchMedia` `change` event), no reload needed.
- **Tabs.** A change in one tab is picked up by the others via the `storage` event.
- **Blocked storage.** If `localStorage` throws, the choice is kept in memory for the session.

## Persistence

Client-side: `localStorage['cv-builder-theme']` = `LIGHT` | `DARK` | `SYSTEM`. Missing or invalid
value → `SYSTEM`. This is the decision for AGENTS.md §8.4; if the team moves it to the backend
(`theme` on User), only `setTheme` has to call the mutation in addition.

## Usage

Styling: use semantic or component tokens only, never the raw `--color-*` palette.

```css
.card {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
```

Reading / changing the theme (client components only):

```tsx
'use client';

import { useTheme } from '@/shared/theme/theme-provider';

const { theme, resolvedTheme, setTheme } = useTheme();
setTheme('DARK');
```

- `theme`: what the user picked (`LIGHT` | `DARK` | `SYSTEM`). Use it for the Settings select.
- `resolvedTheme`: what is applied (`light` | `dark`). Use it only if JS really needs the colour scheme.
- During hydration `theme` is `SYSTEM` for one render, then the stored value.

## Status

- [x] Tokens, global styles, Roboto font
- [x] No flash on first paint (`theme-script.ts`)
- [x] `ThemeProvider` / `useTheme()`, SYSTEM follows the OS, sync between tabs
- [ ] Theme select (Light / Dark / Device settings) on the Settings page (§14)
- [ ] Tests for `theme.ts` and `ThemeProvider` (blocked: Vitest is not set up yet)
- [ ] Open designer questions in [TOKENS.md](TOKENS.md#missing--ambiguous-questions-for-the-designer)
