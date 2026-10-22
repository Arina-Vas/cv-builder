# DataTable

Shared table for every list page in Figma: Users, User CVs, CVs, Skills, Languages, Departments,
Positions, Projects and CV Projects. It only shows the rows it gets: search, sorting and paging
are done on the backend, the page passes the result and the callbacks.
Live examples, Light and Dark: Storybook → **Shared/DataTable** (states, scroll, infinite scroll)
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
  isLoading={loading}
  error={error && 'Failed to load users'}
  onRetry={refetch}
  hasMore={data.items.length < data.total}
  isLoadingMore={loadingMore}
  loadMoreError={loadMoreError}
  onLoadMore={fetchNextPage}
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
| `isLoading`        | `boolean`                 | first page loading: skeleton                               |
| `error`            | `string`                  | first page failed: message + RETRY                         |
| `onRetry`          | `() => void`              | RETRY of the first page                                    |
| `hasMore`          | `boolean`                 | the backend has more rows                                  |
| `isLoadingMore`    | `boolean`                 | next page loading                                          |
| `loadMoreError`    | `string`                  | next page failed: message + RETRY under the rows           |
| `onLoadMore`       | `() => void`              | load the next page; without it there is no infinite scroll |

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

| State               | When            | What is shown                                 |
| ------------------- | --------------- | --------------------------------------------- |
| loading             | `isLoading`     | 5 skeleton rows, `aria-busy` on the table     |
| error               | `error`         | message + RETRY (`onRetry`), `role="alert"`   |
| empty               | `rows` is empty | `emptyMessage`                                |
| rows                | otherwise       | the rows                                      |
| loading more        | `isLoadingMore` | 1 skeleton row under the rows                 |
| loading more failed | `loadMoreError` | message + RETRY (`onLoadMore`) under the rows |

The order is the same as in the table: `isLoading` beats `error`, `error` beats empty.
"No data" and "no search results" are both `emptyMessage`: the page picks the text
(`You have no CVs yet` / `No CVs found`).

## Infinite scroll

Figma has no pagination control, so pages are loaded on scroll:

1. The page loads the first page and passes `hasMore` (e.g. `items.length < total`) and `onLoadMore`.
2. Under the last row `LoadMoreTrigger` puts an invisible 1px row and watches it with `IntersectionObserver`.
3. When it comes into view, `onLoadMore` is called once; while `isLoadingMore` or `loadMoreError`
   is set the observer is off, so there are no duplicate requests.
4. The page appends the next page to `rows`. If the rows still do not fill the screen,
   the next page is loaded right away.
5. `hasMore = false` → nothing more is loaded.

It works both when the whole page scrolls and when only the content area under the header does.
Changing search or sort must reset the list to the first page: that is the page's job.
Not shown under the first page's loading, error or empty states.

## Accessibility

- `<caption>` (hidden) names the table; headers have `scope="col"`.
- Sortable headers are buttons with `aria-sort` (`ascending` / `descending` / `none`).
- The ⋮ and › buttons have names from `getRowLabel`; the menu works with the keyboard and Escape,
  focus goes back to ⋮ on close.
- `aria-busy` while the first or the next page loads; skeleton rows are `aria-hidden`.
- Errors are `role="alert"`.
- With `onLoadMore` a hidden `role="status"` region says `Loading more rows` and then
  `{n} rows loaded`, so a screen reader hears that new rows came.

## Files

| Folder                  | What it is                                           |
| ----------------------- | ---------------------------------------------------- |
| `data-table/`           | `DataTable`, its CSS, stories and Figma stories      |
| `sortable-header-cell/` | header cell with the sort button and arrow           |
| `row-actions-menu/`     | ⋮ button and menu                                    |
| `table-skeleton/`       | skeleton rows                                        |
| `table-message/`        | empty / error row with RETRY                         |
| `load-more-trigger/`    | next page: observer, skeleton row, error + RETRY     |
| `__fixtures__/`         | sample rows for the stories                          |
| `types.ts`              | `Column`, `RowAction`, `SortState`, `DataTableProps` |
