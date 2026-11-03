# Pagination

Page switcher + page-size select under a list (Figma: Design system → **Table (pagination)**).
It only shows the state it gets: the page keeps `page` / `pageSize`, sends them to the backend
and passes `total` from the response. Live examples: Storybook → **Shared/Pagination** and
**Shared/DataTable → Pagination**.

Its labels come from `common.pagination` in `messages/en.json`, so it needs `NextIntlClientProvider`
above it: the root layout mounts it in the app, `.storybook/preview.tsx` in Storybook.

```tsx
import { Pagination } from '@/shared/components/pagination';

<>
  <DataTable
    rows={data?.items ?? []}
    isLoading={!data && loading}
    isRefreshing={!!data && loading}
    // …other props
  />
  {data && (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={data.total}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  )}
</>;
```

## Props

| Prop               | Type                 | What it does                                                   |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| `page`             | `number`             | current page, starts at 1                                      |
| `pageSize`         | `number`             | rows per page                                                  |
| `total`            | `number`             | `total` from the backend response                              |
| `onPageChange`     | `(page) => void`     | arrow or page click                                            |
| `onPageSizeChange` | `(pageSize) => void` | select change; **the page resets `page` to 1**                 |
| `pageSizeOptions`  | `number[]`           | select options, default `[10, 20, 50]`                         |
| `label`            | `string`             | `aria-label` of the `<nav>`, default `common.pagination.label` |

## Behaviour

| Case                                      | What happens                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| first load / first load failed            | not rendered: `total` is unknown yet (the page does not render it)         |
| everything fits on the smallest page size | not rendered (`total <= 10` with the default options)                      |
| one page, but 50 per page is chosen       | rendered, so the user can go back to 10                                    |
| next page loading                         | stays in place, the clicked page is current at once                        |
| next page failed                          | stays; the table shows the error + RETRY                                   |
| first / last page                         | ‹ / › disabled                                                             |
| more than 7 pages                         | always 7 slots: `1 2 3 4 5 … 20`, `1 … 9 10 11 … 20`, `1 … 16 17 18 19 20` |

The page's job, not this component's:

- reset `page` to 1 when search, sort or page size changes;
- after deleting the last row of the last page, go to the previous page
  (`getPageCount(total, pageSize)` helps).

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

| File                     | What it is                                     |
| ------------------------ | ---------------------------------------------- |
| `Pagination.tsx`         | component                                      |
| `getPageItems.ts`        | which pages / ellipses to show, `getPageCount` |
| `getPageItems.test.ts`   | unit tests                                     |
| `Pagination.stories.tsx` | stories with play tests                        |
