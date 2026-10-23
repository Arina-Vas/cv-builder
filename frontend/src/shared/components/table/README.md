# DataTable

Shared table for every list page in Figma: Users, User CVs, CVs, Skills, Languages, Departments,
Positions, Projects and CV Projects. It only shows the rows it gets: search, sorting and paging
are done on the backend, the page passes the result and the callbacks.
Paging is a separate component under the table: [`Pagination`](../pagination/README.md).
Live examples, Light and Dark: Storybook → **Shared/DataTable** (states, scroll, pagination)
and **Shared/DataTable/Figma** (one story per Figma frame).

```tsx
import { DataTable, type Column } from '@/shared/components/table';
```

## Props

```tsx
<DataTable<UserRow>
  columns={columns}
  rows={data.items}
  getRowId={(user) => user.id}
  caption="Employees"
  emptyMessage="No users found"
  sort={sort}
  onSortChange={setSort}
  rowActions={(user) => [{ label: 'View', onSelect: openUser }]}
  getRowLabel={(user) => `${user.firstName} ${user.lastName}`}
  isLoading={!data && loading}
  isRefreshing={!!data && loading}
  error={error && 'Failed to load users'}
  onRetry={refetch}
/>
```

| Prop               | Type                      | What it does                                               |
| ------------------ | ------------------------- | ---------------------------------------------------------- |
| `columns`          | `Column<T>[]`             | columns, see below                                         |
| `rows`             | `T[]`                     | rows from the backend, already sorted                      |
| `getRowId`         | `(row) => string`         | React key of the row                                       |
| `caption`          | `string`                  | table name for screen readers (hidden)                     |
| `emptyMessage`     | `string`                  | text when `rows` is empty, e.g. `No users found`           |
| `sort`             | `SortState`               | current sort: `{ field, order: 'ASC' \| 'DESC' }`          |
| `onSortChange`     | `(sort) => void`          | header click; without it no column is sortable             |
| `rowActions`       | `(row) => RowAction<T>[]` | ⋮ menu in the last column                                  |
| `onRowClick`       | `(row) => void`           | › arrow in the last column (Employee on Users)             |
| `getRowLabel`      | `(row) => string`         | row name in `Actions for …` / `Open …`; default `row {id}` |
| `renderRowDetails` | `(row) => ReactNode`      | extra full-width row under the row, e.g. description       |
| `isLoading`        | `boolean`                 | no rows yet (first load): skeleton                         |
| `isRefreshing`     | `boolean`                 | page / sort / search changed: old rows dimmed and inert    |
| `error`            | `string`                  | request failed: message + RETRY                            |
| `onRetry`          | `() => void`              | RETRY: repeat the same request                             |
| `scrollResetKey`   | `string \| number`        | on change the table scrolls to its first row               |

## Columns

```tsx
const columns: Column<UserRow>[] = [
  {
    key: 'avatar',
    header: '',
    width: '72px',
    render: (user) => <Avatar fallback={user.firstName} src={user.avatarUrl} size="md" />,
  },
  { key: 'firstName', header: 'First Name', sortable: true, render: (user) => user.firstName },
];
```

- `key` is the React key and the sort field sent in `onSortChange`: use the backend's
  `*SortField` enum value so the page passes it on as is.
- `render` returns any node: text, `Avatar`, `Chip`s, a formatted date.
- `sortable` shows the arrow and makes the header a button. It only works together with `onSortChange`.
- `width` goes to the `<th>` style. Leave it out and the browser shares the width.

## Row actions

The last column is one of:

- `rowActions`: ⋮ button with a menu (`RowActionsMenu`, Radix DropdownMenu). Only one menu is open
  at a time; it closes on outside click, action select, Escape and scroll.
- `onRowClick`: › button that opens the row.

If both are passed, the menu wins. The buttons are named from `getRowLabel`, so pass it:
`Actions for Christopher Nolan` reads better than `Actions for row 2`.

## Row details

`renderRowDetails` adds a full-width row right under the row (CVs, Projects, CV Projects:
the description). The two rows share one bottom line and the hover background.
`null`, `undefined` or `''` → no details row.

## States

| State      | When            | What is shown                               |
| ---------- | --------------- | ------------------------------------------- |
| loading    | `isLoading`     | 5 skeleton rows, `aria-busy` on the table   |
| error      | `error`         | message + RETRY (`onRetry`), `role="alert"` |
| empty      | `rows` is empty | `emptyMessage`                              |
| rows       | otherwise       | the rows                                    |
| refreshing | `isRefreshing`  | the old rows at half opacity, `inert`       |

The order is the same as in the table: `isLoading` beats `error`, `error` beats empty.
"No data" and "no search results" are both `emptyMessage`: the page picks the text
(`You have no CVs yet` / `No CVs found`).

## Loading: first load vs next page

A skeleton on every page change would shrink the table (10 rows ≈ 730px, skeleton ≈ 280px),
the pagination would jump up under the cursor and back. So:

- `isLoading` — there are no rows yet: skeleton.
- `isRefreshing` — rows are shown and a new page / sort / search is loading: the old rows stay,
  dimmed and `inert` (a stale row cannot be opened or edited), the height does not change.

With Apollo: `loading && !data` → `isLoading`; `loading` while `previousData` is shown → `isRefreshing`.

## Scroll to the first row

The user scrolls down, clicks the next page in `Pagination` → the table should start from the top.
Pass `scrollResetKey={page}`: when it changes, the table scrolls its top
(the sticky header + first row) into view, smoothly or at once with `prefers-reduced-motion`.
It waits for the response (new `rows` or a new `error`): while the page loads the user stays
at the pagination and sees the dimmed rows; a cached page scrolls at once. Not on the first render.

## Accessibility

- `<caption>` (hidden) names the table; headers have `scope="col"`.
- Sortable headers are buttons with `aria-sort` (`ascending` / `descending` / `none`).
- The ⋮ and › buttons have names from `getRowLabel`; the menu works with the keyboard and Escape,
  focus goes back to ⋮ on close.
- `aria-busy` while loading or refreshing; skeleton rows are `aria-hidden`.
- Errors are `role="alert"`.
- A hidden `role="status"` region says `Loading rows` while refreshing.

## Files

| Folder                  | What it is                                           |
| ----------------------- | ---------------------------------------------------- |
| `data-table/`           | `DataTable`, its CSS, stories and Figma stories      |
| `sortable-header-cell/` | header cell with the sort button and arrow           |
| `row-actions-menu/`     | ⋮ button and menu                                    |
| `table-skeleton/`       | skeleton rows                                        |
| `table-message/`        | empty / error row with RETRY                         |
| `__fixtures__/`         | sample rows for the stories                          |
| `types.ts`              | `Column`, `RowAction`, `SortState`, `DataTableProps` |
