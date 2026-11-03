# Tabs

Route-based tabs built on Radix Tabs. Each tab is a `next/link` to its own nested route, and the
active tab comes from the current URL, so opening a tab URL directly or refreshing the page shows the
right tab. Live examples: Storybook → **Shared/Tabs**.

Used by:

- `app/(main)/users/[userId]/layout.tsx`: Profile / Skills / Languages / CVs
- `app/(main)/cvs/[cvId]/layout.tsx`: Details / Skills / Projects / Preview
- `features/auth/components/auth-tabs/AuthTabs.tsx`: Sign in / Sign up (`align="center"`)

```tsx
import { getTranslations } from 'next-intl/server';
import { Tabs } from '@/shared/components/tabs';

const t = await getTranslations('cvs.tabs');
const items = [
  { href: `/cvs/${cvId}/details`, label: t('details') },
  { href: `/cvs/${cvId}/skills`, label: t('skills') },
];

<Tabs items={items} label={t('label')}>
  {children}
</Tabs>;
```

| Prop       | Type                  | Notes                                                       |
| ---------- | --------------------- | ----------------------------------------------------------- |
| `items`    | `{ href, label }[]`   | `label` is already translated; `href` is also the tab value |
| `label`    | `string`              | Accessible name of the tab list                             |
| `children` | `ReactNode`           | Content of the current route, rendered in the tab panel     |
| `align`    | `'start' \| 'center'` | Default `'start'`                                           |

## Behaviour

- **Active tab.** `getActiveHref` picks the longest `href` that equals the pathname or is a parent
  segment of it. `/cvs/1/projects/42` keeps **Projects** active, and `/cvs/1/skillsets` matches
  nothing.
- **Keyboard.** `activationMode="manual"`: arrow keys, Home and End move focus between tabs
  without navigating; Enter or a click follows the link. Only the active tab is in the Tab order.
- **Semantics.** Tabs get `role="tab"` and `aria-selected` from Radix, and the active link also gets
  `aria-current="page"`. The layout stays mounted while switching, so anything rendered next to
  `<Tabs>` (header, breadcrumbs) is kept.
- **Styles.** `--tab-*` and `--tabs-*` tokens from `shared/theme/tokens.css` (Light and Dark).
