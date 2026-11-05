# Dialog

Modal windows from the Figma pages (Create user, Add project, Delete CV, …): `Dialog` is the frame, `ConfirmDialog`
is the delete / remove confirmation built on it. Live examples, Light and Dark: Storybook → **Shared/Dialog**,
**Shared/ConfirmDialog**.

Built on [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog): it gives the portal, the focus
trap, Esc, the click outside, scroll lock and `aria-modal`. The dialog's own texts (× name, default button labels)
come from `common.actions` in `messages/en.json`, so it needs `NextIntlClientProvider` above it (root layout in the
app, `.storybook/preview.tsx` in Storybook). Title, message and error are passed by the caller, already translated.

## Files

| File                               | Role                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| `Dialog.tsx`                       | Overlay + window: title, ×, description, body, error, footer |
| `Dialog.module.css`                | Overlay, window, sizes, sections                             |
| `confirm-dialog/ConfirmDialog.tsx` | `Dialog` size `sm` with a message and CANCEL / CONFIRM       |
| `index.ts`                         | `export { Dialog, ConfirmDialog }`                           |
| `*.stories.tsx`, `*.test.tsx`      | Stories with `play` checks, unit tests                       |

```tsx
import { ConfirmDialog, Dialog } from '@/shared/components/dialog';
```

## Usage

The dialog is always controlled: the page keeps `open` and opens it from a toolbar button or a row action.
There is no trigger inside the dialog.

### `Dialog`

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>{t('create')}</Button>
<Dialog
  open={open}
  onOpenChange={setOpen}
  title={t('createDialog.title')}
  size="md" // forms; the default is sm
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>{tActions('cancel')}</Button>
      <Button onClick={save}>{tActions('save')}</Button>
    </>
  }
>
  <Input label={t('fields.name')} />
</Dialog>
```

A form puts its `<form>` with its own buttons into `children` and leaves `footer` empty, so the submit button is
inside the form and Enter in a field submits it (story `WithForm`):

```tsx
<Dialog open={open} onOpenChange={setOpen} title={t('createDialog.title')} size="md">
  <form onSubmit={handleSubmit}>
    {/* fields */}
    <Button type="submit">{tActions('save')}</Button>
  </form>
</Dialog>
```

| Prop           | Values                    | Default  |
| -------------- | ------------------------- | -------- |
| `open`         | `boolean`                 | required |
| `onOpenChange` | `(open: boolean) => void` | required |
| `title`        | `string`                  | required |
| `description`  | `ReactNode`               | —        |
| `children`     | `ReactNode`: the body     | —        |
| `footer`       | `ReactNode`: the buttons  | —        |
| `error`        | `string`                  | —        |
| `size`         | `'sm'` · `'md'`           | `'sm'`   |
| `preventClose` | `boolean`                 | `false`  |
| `className`    | on the window             | —        |

- `description`, `children`, `error` and `footer` are rendered only when passed. Without `description` the window
  has no `aria-describedby` (and Radix does not warn about it).
- `footer` lays the buttons out in a row on the right with `--modal-actions-gap`; pass them as a fragment, not
  wrapped in a `<div>`.
- `preventClose`: while a request is running Esc, the click on the overlay and × do not close the dialog, × is
  disabled. The dialog does not know about requests: the caller sets it, usually to its `loading`.

### `ConfirmDialog`

The dialog only shows the state; the page owns it. With Apollo it comes straight from `useMutation`:

```tsx
const errorMessage = useErrorMessage();
const [deleteDepartment, { loading, error, reset }] = useMutation(DELETE_DEPARTMENT, {
  onCompleted: () => setTarget(null), // success → close
});

<ConfirmDialog
  open={target !== null}
  onOpenChange={(open) => {
    if (!open) {
      reset(); // the next opening starts without the old error
      setTarget(null);
    }
  }}
  title={t('deleteDialog.title')}
  message={t.rich('deleteDialog.message', {
    name: target?.name ?? '',
    b: (c) => <strong>{c}</strong>,
  })}
  loading={loading}
  error={error ? errorMessage(parseError(error)) : undefined}
  onConfirm={() => deleteDepartment({ variables: { id: target!.id } })}
/>;
```

| Prop           | Values                    | Default                  |
| -------------- | ------------------------- | ------------------------ |
| `open`         | `boolean`                 | required                 |
| `onOpenChange` | `(open: boolean) => void` | required                 |
| `title`        | `string`                  | required                 |
| `message`      | `ReactNode`               | required                 |
| `onConfirm`    | `() => void`              | required                 |
| `loading`      | `boolean`                 | `false`                  |
| `error`        | `string`                  | —                        |
| `confirmLabel` | `string`                  | `common.actions.confirm` |
| `cancelLabel`  | `string`                  | `common.actions.cancel`  |

- CONFIRM only calls `onConfirm`; closing after success is the page's job (`onCompleted`).
- `loading` → spinner on CONFIRM (`aria-busy`, disabled, so a second click is ignored), CANCEL and × disabled,
  the dialog can't be closed (`preventClose`).
- `message` becomes the dialog's accessible description; the entity name is bold, as in Figma (`t.rich`).
- Size is always `sm`.

## Behaviour

- **Closing:** Esc, a click on the overlay, ×, or the caller's own CANCEL. Each calls `onOpenChange(false)`;
  the dialog closes when the caller sets `open` to `false`.
- **Focus:** when the dialog opens, Radix moves focus to its first focusable element (× in the header). Tab and
  Shift+Tab stay inside the dialog. After closing, focus returns to the element that was focused before it opened
  (the trigger). The component does this itself: Radix only returns focus to its own `Dialog.Trigger`, which is
  not used here.
- **Page scroll** is locked while the dialog is open (Radix).
- **Long content** scrolls inside the body; the title, the error and the buttons stay in place.
- **No animation** yet: the dialog appears and disappears at once.

## Errors

A dialog shows request errors **inside itself**, above the buttons (`error`, `role="alert"`), not as a toast:

- the dialog makes the rest of the page inert, so a toast can't be reached with Tab or F8, and a click on it counts
  as a click outside and closes the dialog;
- the requirements say the dialog stays open after a failed request and the user can retry;
- the error explains why this action failed (`errors.ENTITY_IN_USE`: "This item is in use and can't be deleted"),
  so it belongs next to the button.

The text comes from `useErrorMessage()(parseError(error))`, never the backend `message`. An error that belongs to a
form field (`CONFLICT` / `BAD_USER_INPUT` with `field`) goes under that field, not into `error`.

## Sizing rules

| Size | Width                  | Use for                                       |
| ---- | ---------------------- | --------------------------------------------- |
| `sm` | `--modal-width-sm` 620 | confirmations                                 |
| `md` | `--modal-width-md` 860 | forms (Create user, Add project, Update CV …) |

- The height follows the content, up to `--modal-max-height` (680).
- On a smaller window the width and height shrink to the window minus 16 px on each side (`--space-4`), so the
  header and the buttons are always visible: on the 768 px tablet `md` is 736 px wide.
- The window is centred and has square corners and the `--modal-shadow` shadow.

## Layering

`--z-dialog` (40) is above the sidebar (`--z-sidebar`, 30) and below popovers (`z-index: 50`: Select, MultiSelect,
DatePicker, row menu), so a Select opened inside a dialog shows its list above it. Toasts (`--z-toast`) are above
everything.

## Accessibility

- `role="dialog"` with `aria-modal`, named by the title (`aria-labelledby`), described by `description`.
- × is an `IconButton` named "Close" (`common.actions.close`).
- The error is `role="alert"`, so screen readers announce it when it appears.
- Buttons get their names from the texts in `en.json`; CSS only upper-cases them.

## Tokens

Sizes, spacing and colours come from [`theme/tokens.css`](../../theme/tokens.css), so a change goes to the token,
not to the component CSS:

| Group   | Tokens                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------- |
| Size    | `--modal-width-sm`, `--modal-width-md`, `--modal-max-height`, `--space-4` (gap to the window edge) |
| Spacing | `--modal-content-padding`, `--modal-section-gap` (title ↔ body ↔ buttons), `--modal-actions-gap`   |
| Colour  | `--modal-bg`, `--modal-shadow`, `--overlay`, `--text`, `--error`                                   |
| Type    | `--type-h6-size` (title), `--type-body1-size` (message), `--type-body2-size` (error)               |
| Layer   | `--z-dialog`                                                                                       |

Sources and open questions: [TOKENS.md](../../theme/TOKENS.md).

## Tests

Each behaviour is checked once, as `frontend/README.md` → Tests asks: unit tests (`Dialog.test.tsx`,
`ConfirmDialog.test.tsx`, jsdom) cover props and states; `play` functions in the stories cover what needs a real
browser: focus, the overlay click, layout, Radix portals, CSS and the page flow. Stories run in Storybook
(Interactions panel) and in Vitest (`storybook` project, needs `pnpm exec playwright install chromium` once).

| Unit test                | Checks                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog.test.tsx`        | closed → nothing; named by the title, × "Close"; description / no `aria-describedby`; footer and error only when passed; `size`, `className`; Esc and × call `onOpenChange(false)`; `preventClose` disables × and ignores Esc |
| `ConfirmDialog.test.tsx` | `sm`, title and message; default and own labels; CONFIRM calls `onConfirm` and does not close; CANCEL closes; `loading` disables the buttons and Esc; error shown, retry possible                                             |

| Story (Shared/Dialog)                               | Checks                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `Default`                                           | focus moves into the dialog                                |
| `ReturnsFocus`                                      | after Esc focus is back on the trigger                     |
| `FocusTrap`                                         | Tab and Shift+Tab never leave the dialog                   |
| `ClosesOnOverlayClick`                              | a click inside does not close, a click on the overlay does |
| `PreventClose`                                      | a click on the overlay does not close                      |
| `WithForm`                                          | a form in `children` submits on Enter and on SAVE          |
| `LongContent`                                       | the body scrolls, the buttons stay visible                 |
| `WithSelect`                                        | a Select list opens above the dialog                       |
| `Light`, `Dark`, `WithDescriptionAndError`, `Small` | opened on load, for a visual check                         |

| Story (Shared/ConfirmDialog)                                                            | Checks                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `LongName`                                                                              | a long name wraps, the dialog keeps the `sm` width                                 |
| `Loading`                                                                               | the loading CONFIRM keeps its accessible name; the overlay does not close          |
| `FlowSuccess`, `FlowDoubleClick`, `FlowError`, `FlowRetryAfterError`                    | a page with a simulated mutation: loading, close on success, error, reset on close |
| `Default`, `CustomLabels`, `WithError`, `Light`, `Dark`, `DarkWithError`, `DarkLoading` | visual only; `loading` and `error` can be changed in Controls                      |

## Status

- [x] `Dialog`: title, ×, description, body, error, footer, `sm` / `md`, `preventClose`, focus return
- [x] `ConfirmDialog`: controlled `loading` / `error`
- [x] Stories and unit tests, Light / Dark
- [ ] `Loading` story fails: `Button` hides its label with `visibility: hidden`, so a loading button has no
      accessible name (fix in `Button.module.css`)
- [ ] Error text contrast in the dark theme (`--error` on `--modal-bg`, about 2.2:1)
- [ ] Enter / leave animation
- [ ] `useDialogState` hook (open state + target row), with the first page that uses the dialogs
