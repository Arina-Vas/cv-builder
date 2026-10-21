# AvatarUploader

Avatar uploader from the Figma design system ("Avatar Uploader" frame, Light and Dark).
Live examples of every state: Storybook → **Shared/AvatarUploader**.

The component shows the avatar (or the first letter of `fallback`), opens the native file dialog on
click and checks the chosen file. Keeping the file, the preview and the upload belong to the parent.

```tsx
import { AvatarUploader } from '@/shared/components/avatar-uploader/AvatarUploader';
```

## Usage

```tsx
<AvatarUploader fallback={user.firstName} />                                   // no avatar → letter
<AvatarUploader fallback={user.firstName} src={user.avatar} onRemove={remove} />
<AvatarUploader fallback={user.firstName} disabled />                           // e.g. viewing another user
```

| Prop       | Values                      | Default |
| ---------- | --------------------------- | ------- |
| `fallback` | `string`                    | —       |
| `src`      | `string`                    | —       |
| `onChange` | `(file: File) => void`      | —       |
| `onError`  | `(message: string) => void` | —       |
| `onRemove` | `() => void`                | —       |
| `disabled` | `boolean`                   | `false` |

- `fallback` is the user's name: the first letter, upper-cased, is shown in the grey circle when there
  is no `src`. It is also the `alt` of the image.
- `src` is any image URL: a link from the API or a `blob:` URL from `URL.createObjectURL()` for a preview.
- `onChange` gets the chosen file only after it passes the checks below.
- `onError` gets the message when the file fails a check. The component does not show it itself:
  the parent decides how (toast, text under the field).
- `onRemove` is called by the red cross on the avatar. The cross is shown only while there is an image
  and the uploader is not disabled.

## File checks

| Check | Rule                                     | `onError` message              |
| ----- | ---------------------------------------- | ------------------------------ |
| Type  | `image/png`, `image/jpeg`, `image/gif`   | `Only png, jpg or gif allowed` |
| Size  | no more than 0.5MB (`0.5 * 1024 * 1024`) | `File is larger than 0.5MB`    |

`accept` on the input only filters the file dialog (the user can switch it to "All files"), so the type
is checked again in code. The input value is reset after every choice, so choosing the same file again
after removing it still fires `onChange`.

## With a preview

```tsx
const [file, setFile] = useState<File | null>(null);
const [preview, setPreview] = useState<string | undefined>(user.avatar);

useEffect(() => {
  return () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); // free the old preview
  };
}, [preview]);

<AvatarUploader
  fallback={user.firstName}
  src={preview}
  onChange={(file) => {
    setFile(file);
    setPreview(URL.createObjectURL(file));
  }}
  onRemove={() => {
    setFile(null);
    setPreview(undefined);
  }}
  onError={showToast}
/>;
```

## States

| State        | Trigger                                                                       | Look                                                                                       |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Default      | no `src`                                                                      | grey 120px circle with the letter                                                          |
| Adding       | `:hover` / `:focus-within` on the text                                        | "Upload avatar image" is underlined                                                        |
| With image   | `src`                                                                         | round photo, `object-fit: cover`                                                           |
| Remove image | `src` + `:hover` on the avatar / `:focus-visible` on the cross / touch screen | red cross with a white X in the top-right corner, fades in                                 |
| Disabled     | `disabled` prop                                                               | grey text and icon, `not-allowed` cursor, no underline, no cross, the dialog does not open |

Adding and Remove image are CSS states, there are no props for them: hover the elements in Storybook
or move focus to them with Tab.

On touch screens (`@media (hover: none)`) there is no hover, so the cross is always shown while there is
an image.

## How it works

The right side is a `<label>` with a visually hidden `<input type="file">` inside, so a click anywhere
on the icon or the text opens the file dialog without any JS. The input is hidden with the
visually-hidden pattern (`clip-path`, 1×1px), not `display: none`, so it is still reachable with Tab.

The disabled look is driven by `data-disabled` on the label, because a `<label>` has no `:disabled` state.

The cross is the shared [`CloseIcon`](../icons/CloseIcon.tsx): a circle in `currentColor` with the X cut
out. The X is filled with `--close-icon-cross` (transparent by default, as in `Chip`); the uploader sets
it to `--on-primary`, so the X is white and no background is needed behind the icon.

## Accessibility

- The file input stays focusable; focus underlines the text the same way as hover.
- The remove button is `type="button"` (never submits a form) and has `aria-label="Remove avatar"`.
- Keyboard focus on the cross (`:focus-visible`) shows it even without hover and draws a 2px
  `--focus-ring` outline around it, the same ring as `IconButton`.
- Tab order: the remove button (when there is an image), then the file input.
- When `disabled`, the cross is not rendered and the file input is disabled, so neither is reachable
  with Tab.
- The fade-in of the cross is turned off with `prefers-reduced-motion: reduce`.
- The image `alt` is the `fallback` name.

## Tokens

Styles use tokens from [`theme/tokens.css`](../../theme/tokens.css): `--avatar-size-lg`,
`--avatar-font-size-lg`, `--avatar-bg`, `--avatar-fallback-text`, `--primary`, `--on-primary`, `--text`,
`--text-secondary`, `--text-disabled`, `--focus-ring`, `--type-h6-size`, `--type-body1-size`,
`--font-weight-medium`, `--duration-shorter`, `--ease-in-out`.

`--avatar-bg` / `--avatar-fallback-text` are the grey circle and the letter, with Light and Dark values.
They are not the same as `--avatar-placeholder-*` (the red sidebar avatar).
