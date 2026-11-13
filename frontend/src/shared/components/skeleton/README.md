# Skeleton

One grey placeholder block with a wave, shown while data loads. It has no size of its own: the page
gives it a size and shape with `className` and builds its loading layout from these blocks, in the same
grid as the real content, so nothing jumps when the data arrives. Live examples, Light and Dark:
Storybook → **Shared/Skeleton**.

```tsx
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
```

## Usage

```tsx
// UserLanguagesSkeleton: the list grid, a bar and a name per item
<ul className={s.list} aria-busy="true" aria-label={t('loading')}>
  {Array.from({ length: 3 }, (_, index) => (
    <li key={index} className={s.skeletonItem}>
      <Skeleton className={s.skeletonBar} /> {/* width: var(--skill-bar-width); height: … */}
      <Skeleton className={s.skeletonName} />
    </li>
  ))}
</ul>
```

| Prop        | Values                                                        | Default |
| ----------- | ------------------------------------------------------------- | ------- |
| `className` | size and shape (`width`, `height`, `border-radius`, `margin`) | —       |

Plus every native `<span>` attribute.

- **The container says what is loading**, not the block: put `aria-busy="true"` and an `aria-label`
  ("Loading profile", "Loading languages") on the wrapper. The block itself is `aria-hidden`.
- The block is `display: block` with `--radius-sm` corners; a round avatar sets `border-radius: 50%`.
- Colours: `--skeleton` for the block, `--action-hover` for the wave, both themed. The wave stops with
  `prefers-reduced-motion: reduce`.
- Used by: `UserProfileSkeleton` (Profile tab), `UserLanguagesSkeleton`. `TableSkeleton` and the
  breadcrumbs placeholder still have their own copy of the wave.

## Files

| File                   | What                                       |
| ---------------------- | ------------------------------------------ |
| `Skeleton.tsx`         | the block: `span` + `className`            |
| `Skeleton.module.css`  | grey block, wave animation, reduced motion |
| `Skeleton.test.tsx`    | hidden from screen readers, class merged   |
| `Skeleton.stories.tsx` | sizes and shapes, Light / Dark             |
