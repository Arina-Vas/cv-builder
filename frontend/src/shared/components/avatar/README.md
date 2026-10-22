# Avatar

Shared round avatar: the user's photo, or the first letter of the name when there is no photo.
Two sizes from Figma: the profile / Avatar Uploader (120px) and the users table / sidebar (40px),
and two colours of the letter circle: grey (everywhere) and red (the sidebar user).
Live examples, Light and Dark: Storybook → **Shared/Avatar**.

```tsx
import { Avatar } from '@/shared/components/avatar/Avatar';
```

## Usage

```tsx
<Avatar fallback={user.firstName} />                             // 120px grey circle with the letter
<Avatar fallback={user.firstName} src={user.avatar} />           // 120px photo
<Avatar fallback={user.firstName} src={user.avatar} size="md" /> // 40px, e.g. the users table
<Avatar fallback={me.firstName} size="md" color="primary" />      // 40px red, the sidebar user
```

| Prop       | Values                     | Default     |
| ---------- | -------------------------- | ----------- |
| `fallback` | `string`                   | required    |
| `src`      | `string`                   | —           |
| `size`     | `'md'` \| `'lg'`           | `'lg'`      |
| `color`    | `'default'` \| `'primary'` | `'default'` |

- `fallback` is the user's name: the first letter, upper-cased, is shown when there is no `src`.
  It is also the `alt` of the image.
- `src` is rendered with `next/image` (`fill`, `object-fit: cover`). `sizes` follows `size`
  (`40px` / `120px`), so Next picks a small enough file. `blob:` and `data:` URLs work as is;
  a link from another host has to be allowed in `images.remotePatterns` in `next.config.ts`.
- The avatar only shows a picture: no click, no remove button. Editing is
  [`AvatarUploader`](../avatar-uploader/README.md), which puts the red × over a `lg` avatar.
- It never shrinks in a flex row (`flex-shrink: 0`) and has no margins of its own.

## Sizes

| `size` | Where in Figma            | Circle                   | Letter                       |
| ------ | ------------------------- | ------------------------ | ---------------------------- |
| `lg`   | profile, Avatar Uploader  | `--avatar-size-lg` 120px | `--avatar-font-size-lg` 40px |
| `md`   | users table, sidebar user | `--avatar-size` 40px     | `--avatar-font-size` 20px    |

| `color`   | Where in Figma            | Letter circle without a photo                                       |
| --------- | ------------------------- | ------------------------------------------------------------------- |
| `default` | profile, users table      | grey `--avatar-bg`, `--avatar-fallback-text`, Light and Dark values |
| `primary` | sidebar, next to the name | red `--avatar-placeholder-bg`, white `--avatar-placeholder-text`    |

Size and colour are independent: `data-size` and `data-color` on the root, the CSS picks the tokens by them.
`color` only changes the letter circle; with a photo both look the same.

The `md` letter size (`--avatar-font-size`, 20px) is MUI's Avatar default: the Figma file could only be
viewed, not inspected, so check it in Inspect when you can.
`--avatar-size-sm` (24px, skill / language bullet) is not an `Avatar` size.

## Files

| File                | What it is                                              |
| ------------------- | ------------------------------------------------------- |
| `Avatar.tsx`        | the component                                           |
| `Avatar.module.css` | sizes and the letter circle                             |
| `sampleAvatar.ts`   | inline sample image for the Avatar and Uploader stories |
