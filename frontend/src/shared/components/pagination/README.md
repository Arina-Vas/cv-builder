# Pagination

Page switcher + page-size select under a list (Figma: Design system → **Table (pagination)**).
It only shows the state it gets: the page keeps `page` / `pageSize` in the URL
([`useTableParams`](../../hooks/useTableParams.ts)), sends them to the backend and passes `total`
from the response. Wire it with [`usePagination`](#usepagination), which also keeps the page in
range. Live examples: Storybook → **Shared/Pagination** and **Shared/DataTable → Pagination**.

Its labels come from `common.pagination` in `messages/en.json`, so it needs `NextIntlClientProvider`
above it: the root layout mounts it in the app, `.storybook/preview.tsx` in Storybook.

```tsx
import { Pagination, usePagination } from '@/shared/components/pagination';
import { useTableParams } from '@/shared/hooks/useTableParams';

const tableParams = useTableParams<UserSortField>({ sortFields, defaultSort });
const { search, sort, page, pageSize } = tableParams;
const { data, previousData, loading } = useQuery(USERS, {
  variables: { page, pageSize, search, sortBy: sort.field, sortOrder: sort.order },
});
const shown = data ?? previousData;
const pagination = usePagination(tableParams, {
  total: shown?.users.total,
  freshTotal: data?.users.total,
});

<>
  <DataTable
    rows={shown?.users.items ?? []}
    isLoading={loading && !shown}
    isRefreshing={loading && !!shown}
    // …other props
  />
  <Pagination {...pagination} />
</>;
```

## usePagination

`usePagination(params, { total, freshTotal })` returns every prop `Pagination` needs except
`pageSizeOptions` / `label`, so it is spread as `<Pagination {...pagination} />`.

| Argument     | What to pass                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------- |
| `params`     | `page`, `pageSize`, `setPage`, `setPageSize`: the whole `useTableParams` result fits          |
| `total`      | total of `data ?? previousData`: what the switcher shows, so it does not jump while loading   |
| `freshTotal` | total of `data` only, the response for the current variables: decides whether the page exists |

When `freshTotal` says the page is past the end, the hook calls `setPage(lastPage, { replace: true })`:
the URL is corrected in place, so Back does not lead to the empty page. That covers an old link,
a hand-typed `?page=99`, and the last row of the last page deleted here or by someone else (the
refetch after a delete shrinks the total). `total = 0` goes to page 1. Pages do not go back a
page by hand after a delete.

Only `freshTotal` is used for this: while a new page or search loads, `data` is `undefined` and
`previousData` belongs to the old variables, so judging by it would redirect too early.

## Props

| Prop               | Type                 | What it does                                                   |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| `page`             | `number`             | current page, starts at 1                                      |
| `pageSize`         | `number`             | rows per page                                                  |
| `total`            | `number`             | `total` from the backend response                              |
| `pageCount`        | `number`             | number of pages, `getPageCount(total, pageSize)`               |
| `onPageChange`     | `(page) => void`     | arrow or page click                                            |
| `onPageSizeChange` | `(pageSize) => void` | select change; `useTableParams.setPageSize` resets `page` to 1 |
| `pageSizeOptions`  | `number[]`           | select options, default `[10, 20, 50]`                         |
| `label`            | `string`             | `aria-label` of the `<nav>`, default `common.pagination.label` |

## Behaviour

| Case                                      | What happens                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| first load / first load failed            | not rendered: `total` is unknown yet, `usePagination` passes 0             |
| page past the end                         | `usePagination` replaces the URL with the last page                        |
| everything fits on the smallest page size | not rendered (`total <= 10` with the default options)                      |
| one page, but 50 per page is chosen       | rendered, so the user can go back to 10                                    |
| next page loading                         | stays in place, the clicked page is current at once                        |
| next page failed                          | stays; the table shows the error + RETRY                                   |
| first / last page                         | ‹ / › disabled                                                             |
| more than 7 pages                         | always 7 slots: `1 2 3 4 5 … 20`, `1 … 9 10 11 … 20`, `1 … 16 17 18 19 20` |

Not this component's job:

- reset `page` to 1 when search, sort or page size changes: `useTableParams` does it;
- keep the page in range (old link, last row deleted): `usePagination` does it.

`pageCount` is a prop rather than computed inside so the page and the switcher use one value;
outside `usePagination` (stories, a list without the hook) pass `getPageCount(total, pageSize)`.

## Figma

Sizes and colours are tokens `--pagination-*` in `tokens.css`. Figma has no current-page and no
hover state: current page = selected option colours, hover = input hover border (`[A]`).
The select is sized by overriding `--input-*` tokens on its root (`.sizeSelect`); its dropdown
is in a portal, so it keeps the regular Select look.
Figma draws `1 2 … 20`; we keep a fixed 7 slots so the arrows do not move while clicking.

## Accessibility

Names below are the English texts; the keys are in `common.pagination`.

- `<nav aria-label="Pagination">` (`label`) with a list; pages are buttons named `Page 2`
  (`page`, with `{page}`), the current one has `aria-current="page"`.
- Arrows: `Previous page` / `Next page` (`previous` / `next`), `disabled` on the edges. Ellipses are
  `aria-hidden`.
- The page-size select is the shared [`Select`](../select/README.md) with `hideLabel`: the label
  `Rows per page` (`rowsPerPage`) is only for screen readers; keyboard, Escape, focus back to the
  trigger.

## Files

| File                     | What it is                                      |
| ------------------------ | ----------------------------------------------- |
| `Pagination.tsx`         | component                                       |
| `usePagination.ts`       | props for the component + keeping page in range |
| `getPageItems.ts`        | which pages / ellipses to show, `getPageCount`  |
| `*.test.ts(x)`           | unit tests                                      |
| `Pagination.stories.tsx` | stories with play tests                         |
