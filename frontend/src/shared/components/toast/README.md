# Toast

Pop-up messages from the Figma design system ("Notifications" frame): Success, Error, Warning, Info.
Live examples, Light and Dark: Storybook → **Shared/Toast** (`With Provider` shows the real provider).

Built on [Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast): it gives the timer,
pause on hover / focus, swipe to dismiss, the F8 hotkey and screen reader announcements.

## Files

| File                | Role                                                        |
| ------------------- | ----------------------------------------------------------- |
| `Toast.tsx`         | One toast: colours, title, description, ✕                   |
| `ToastProvider.tsx` | `ToastProvider` (the list of toasts) + `useToast()` hook    |
| `Toast.types.ts`    | `ToastType`, `ToastOptions`, `ToastApi`, default `TITLES`   |
| `Toast.module.css`  | Toast and viewport styles, enter / leave / swipe animations |

## Usage

`ToastProvider` is already mounted in `app/layout.tsx`, so every page can call the hook
(client components only):

```tsx
'use client';

import { useToast } from '@/shared/components/toast/ToastProvider';

const toast = useToast();

toast.success('CV was saved');
toast.error('Could not delete the skill');
toast.warning('The session expires in 5 minutes');
toast.info('A new version is available');

toast.success('CV "Frontend Developer" was updated', { title: 'Saved' }); // own title
toast.error('Network error', { duration: Infinity }); // stays until ✕
toast.show({ type: 'info', description: 'Same as toast.info' });
```

| Method                                   | Arguments                                                |
| ---------------------------------------- | -------------------------------------------------------- |
| `success` / `error` / `warning` / `info` | `(description: string, options?: { title?, duration? })` |
| `show`                                   | `({ type, description, title?, duration? })`             |

- `title` replaces the default title of the type (`Success`, `Error`, `Warning`, `Info`).
  An empty string falls back to the default.
- `duration` is in ms, default **5000** for every type. `Infinity` keeps the toast until it is closed.
- `useToast()` outside `ToastProvider` throws `useToast must be used within ToastProvider`.

## Behaviour

- **Position:** top-right corner, 16 px from the edges. The newest toast is on top.
- **At most 3 toasts** (`MAX_TOASTS`). A fourth one pushes out the oldest.
- **Closing:** ✕, the timer, swipe right or Esc. The toast plays the leave animation, then the provider
  removes it from its list (`EXIT_ANIMATION_MS` = 200, not shorter than `--duration-leave`).
- **Pause:** the timer stops while the pointer is over the toasts or focus is inside them.
  After closing with ✕ focus stays on the toast list, so the other toasts wait until focus leaves it.
- **Screen readers:** Error toasts are announced at once (`type="foreground"`), the others politely
  (`type="background"`). The toast list is a landmark named "Notifications", F8 moves focus to it.
- **Animations:** slide in from the right (`--duration-enter`, `--ease-out`), short fade out
  (`--duration-leave`, `--ease-in`). With `prefers-reduced-motion: reduce` toasts appear and disappear
  without motion.

## The `Toast` component

Use it directly only in Storybook or tests; pages call `useToast()`.
It renders a `Radix Toast.Root`, so it needs a `Toast.Provider` and a `Toast.Viewport` around it.

| Prop           | Values                                           | Default             |
| -------------- | ------------------------------------------------ | ------------------- |
| `type`         | `'success'` · `'error'` · `'warning'` · `'info'` | required            |
| `description`  | `string`                                         | required            |
| `title`        | `string`                                         | `TITLES[type]`      |
| `open`         | `boolean`                                        | uncontrolled (open) |
| `onOpenChange` | `(open: boolean) => void`                        | —                   |
| `duration`     | `number`, ms                                     | from the provider   |

## Tokens

Colours, sizes, type and motion come from [`theme/tokens.css`](../../theme/tokens.css),
so a change goes to the token, not to the component CSS:

| Group    | Tokens                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Size     | `--toast-width`, `--toast-height` (min height), `--toast-radius`, `--toast-padding`                    |
| Colour   | `--toast-{success\|error\|warning\|info}-bg` / `-fg` (border + text), `--toast-error-text`             |
| Type     | `--type-toast-title-*`, `--type-toast-text-*`, `--font-weight-medium`                                  |
| Motion   | `--duration-enter`, `--duration-leave`, `--duration-shorter` (swipe cancel), `--ease-out`, `--ease-in` |
| Layering | `--z-toast`: above menus (`z-index: 50`) and modals                                                    |

Not tokens: the ✕ button position and size (8 / 12 px, 24 px) and its pressed fill `rgb(0 0 0 / 0.12)`.
`--radix-toast-swipe-move-x` / `--radix-toast-swipe-end-x` are set by Radix on the toast while it is
swiped; `tokens.css` only gives them a `0px` default.

Sources and open questions (dark theme, text contrast): [TOKENS.md](../../theme/TOKENS.md).
