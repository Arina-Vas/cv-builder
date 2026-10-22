# LevelBar

A thin bar that shows a level from 0 to 5: skill mastery or language proficiency
(Figma "Design system (components)" → Notifications frame, layer `Progressbar`, Level 0 – Level 5 (Max)).
Live examples, Light and Dark: Storybook → **Shared/LevelBar**.

```tsx
import { LevelBar } from '@/shared/components/level-bar/LevelBar';
import type { LevelType } from '@/shared/components/level-bar/LevelBar.types';
```

## Usage

```tsx
<LevelBar level={3} label="Intermediate" />                         // skill
<LevelBar level={3} label="B2" />                                   // language
<LevelBar level={3} label="Intermediate" aria-labelledby={nameId} /> // named by a text next to it
<LevelBar level={0} />                                              // empty track
```

| Prop        | Values                                    | Default  |
| ----------- | ----------------------------------------- | -------- |
| `level`     | `LevelType`: `0 \| 1 \| 2 \| 3 \| 4 \| 5` | required |
| `label`     | `string`: text value for screen readers   | —        |
| `className` | on the root, e.g. a different width       | —        |

Plus every native `<div>` attribute (`aria-label`, `aria-labelledby`, `title`, `data-*`, `style`).

- The bar only knows the level. Converting mastery / proficiency to a level belongs to the page that
  has the data, not to this component (see the table below).
- `label` is the **value** ("Intermediate", "B2"). It goes to `aria-valuetext`, so a screen reader says
  "Intermediate" instead of "3". Without `label` the attribute is not rendered.
- The **name** of what is measured ("React", "English") is not part of the bar. Put it next to the bar
  and link it with `aria-labelledby`, or pass `aria-label`.
- The bar has no text, no click and no focus. A clickable skill / language item wraps it.
- `LevelType`, `LEVEL_MIN` and `LEVEL_MAX` are exported from `LevelBar.types.ts`.

## Levels

| Level | Fill | Skill mastery (Notion) | Language proficiency |
| ----- | ---- | ---------------------- | -------------------- |
| 0     | 0%   | —                      | —                    |
| 1     | 20%  | Beginner               | A1, A2               |
| 2     | 40%  | Elementary             | B1                   |
| 3     | 60%  | Intermediate           | B2                   |
| 4     | 80%  | Advanced               | C1, C2               |
| 5     | 100% | Expert                 | Native               |

The fill width is `level / LEVEL_MAX`. Each level has its own fill and track colour; the track is drawn
by `::before` at 90% opacity, so the fill on top stays fully opaque. Level 0 is an empty track:
neither the skill nor the language values in the spec map to it.

## Next to a name

```tsx
const nameId = useId();

<div className={s.item}>
  <LevelBar level={level} label={skill.mastery} aria-labelledby={nameId} />
  <span id={nameId}>{skill.name}</span>
</div>;
```

The screen reader reads "React, meter, Intermediate". Storybook → **In List** shows this layout
(bar on the left of the name, as on the User Skills / User Languages screens).

## Accessibility

- `role="meter"` with `aria-valuemin` 0, `aria-valuemax` 5, `aria-valuenow` = `level`:
  it is a measured value, not the progress of a task.
- `aria-valuetext` = `label`.
- The bar is not focusable. If the item around it is interactive (opens the Update modal),
  the item is the button, not the bar.

## Tokens

Styles use tokens from [`theme/tokens.css`](../../theme/tokens.css):

| Token                                       | Value                                  |
| ------------------------------------------- | -------------------------------------- |
| `--skill-bar-width`                         | 80px (not measured in Figma)           |
| `--skill-bar-height`                        | 4px                                    |
| `--skill-bar-track-opacity`                 | 0.9                                    |
| `--level-{0…5}-track`, `--level-{1…5}-fill` | colour of each level (see `TOKENS.md`) |

To change a size or a colour, change the token, not the component CSS.
The levels exist only in a light Figma frame; the dark-theme values are an open question in
[TOKENS.md](../../theme/TOKENS.md) (tracks of levels 0–1 are hard to see on the dark background).
