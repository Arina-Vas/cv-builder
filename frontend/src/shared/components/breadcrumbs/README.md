# Breadcrumbs

Presentational breadcrumbs for the page header: `Employees > Rostislav Harlanov > Skills`. The
component only draws the items it gets. It does not read the URL or load data. Building the items
from the current route is the job of the caller. Live examples: Storybook → **Shared/Breadcrumbs**.

```tsx
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ProfileIcon } from '@/shared/components/icons/ProfileIcon';

<Breadcrumbs
  label={t('layout.breadcrumbs')}
  items={[
    { label: 'Employees', href: '/users' },
    { label: fullName, href: `/users/${id}/profile`, icon: ProfileIcon, variant: 'entity' },
    { label: 'Skills' },
  ]}
/>;
```

| Prop    | Type               | Notes                                       |
| ------- | ------------------ | ------------------------------------------- |
| `items` | `BreadcrumbItem[]` | From the section to the current page        |
| `label` | `string`           | Accessible name of the `<nav>` (translated) |

`BreadcrumbItem`:

| Field     | Type                    | Notes                                                             |
| --------- | ----------------------- | ----------------------------------------------------------------- |
| `label`   | `string`                | Already translated text                                           |
| `href`    | `string?`               | Makes the item a `next/link`; without it the last item is current |
| `icon`    | `ComponentType?`        | 24px icon before the text (the employee has one, a CV not)        |
| `variant` | `'default' \| 'entity'` | `entity` = employee / CV name in the primary colour               |
| `loading` | `boolean?`              | Shows a skeleton instead of the text (name not loaded yet)        |

## Behaviour

- **Current page.** The last item without `href` is plain text with `aria-current="page"`: the
  tab on a detail page, the only item on a list page (`Employees`, `Settings`).
- **Last item with `href`.** It is a link and not current: the user is not on that page. Used when
  a CV or employee does not exist (or is not the user's): only `CVs` / `Employees` is left, as the
  way back to the list (wiki: "Clicking CVs returns to the CVs page").
- **Links.** Earlier items with `href` are links in the muted colour, underlined on hover, with a
  focus ring for the keyboard.
- **Long names.** Only the `entity` item shrinks, so the section and the tab always stay whole.
  The name is cut with an ellipsis and the full text is in the `title` tooltip.
- **Semantics.** `<nav aria-label>` → `<ol>` → `<li>`. The chevron separators are `aria-hidden`, so
  screen readers don't read them. The loading skeleton is `aria-hidden` as well.
- **Styles.** `--breadcrumbs-*` tokens from `shared/theme/tokens.css` (Light and Dark), measured on
  the `Header › Ordered List` layer of the 1440px Desktop frames: body1 text, 20px separator, 8px
  gaps.
