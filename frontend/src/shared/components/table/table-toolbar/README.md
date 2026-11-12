# TableToolbar

The row above a list table: search on the left, the red **+ CREATE …** text button on the right (Figma:
Departments, Positions, Users, CVs, …). It only shows what it gets: the page keeps the search in the URL
(`useTableParams`) and decides what the button opens. Live examples, Light and Dark: Storybook →
**Shared/TableToolbar**.

The search label comes from `common.searchField` in `messages/en.json`, so it needs
`NextIntlClientProvider` above it (the root layout in the app, `.storybook/preview.tsx` in Storybook).
The button label is translated by the page.

```tsx
import { DataTable, TableToolbar } from '@/shared/components/table';

const { search, setSearch } = useTableParams({ … });

<>
  <TableToolbar
    search={search}
    onSearch={setSearch}
    action={{ label: t('createButton'), onClick: () => setModal({ type: 'create' }) }}
  />
  <DataTable … />
</>;
```

## Props

| Prop       | Type                                                        | What it does                                                    |
| ---------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `search`   | `string`                                                    | current search, shown in the field                              |
| `onSearch` | `(search: string) => void`                                  | called after typing stops (`SearchField` debounce, 300 ms)      |
| `action`   | `{ label: string; onClick: () => void; ungated?: boolean }` | the **+** button on the right; leave out for a list without one |

- The button is always `Button` `variant="text"` `size="sm"` (40px, the same height as the search) with
  `PlusIcon`; the label is uppercased by `Button`, so pass it in normal case (`Create department`).
- The button is `type="button"`: it never submits a surrounding form.
- The button is `gated`: under a closed action gate (unverified email, see
  `shared/lib/action-gate`) it is `aria-disabled` and the click shows a toast instead of `onClick`.
  `ungated: true` only for a button that changes nothing.
- Without `action` only the search is shown (e.g. a list the current role can't add to).
- Search and button are 20px (`--space-5`) in from the content edge, in line with the breadcrumbs; the
  table under it starts at the content edge, as in Figma.

## Files

| File                       | What                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `TableToolbar.tsx`         | `SearchField` + optional action `Button` with `PlusIcon`   |
| `TableToolbar.module.css`  | `toolbar` (row, gap, side padding), `withIcon` (icon gap)  |
| `TableToolbar.test.tsx`    | value, debounced `onSearch`, button only with `action`     |
| `TableToolbar.stories.tsx` | default, without action, with search, layout, Light / Dark |

## Tests and stories

| Unit test               | Checks                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TableToolbar.test.tsx` | the search shows `search`; typing calls `onSearch`; no button without `action`; the button has the label, is `type="button"` and calls `onClick` |

| Story (Shared/TableToolbar)                               | Checks                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `ActionLayout`                                            | the button is as high as the search and stands to its right   |
| `Typing`                                                  | typed text is shown and reaches `onSearch` after the debounce |
| `Default`, `WithoutAction`, `WithSearch`, `Light`, `Dark` | visual only                                                   |
