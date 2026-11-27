# DatePicker

Shared date field from the Figma design system ("Design system (components)" → DatePicker).
Like `Input` and `Select`, it is built on [`Field`](../field/Field.tsx): floating label, outline and the error text
under the field. A trigger button opens a calendar in a Radix
[`Popover`](https://www.radix-ui.com/primitives/docs/components/popover);
the calendar itself is [`react-datepicker`](https://reactdatepicker.com) in `inline` mode with a custom header,
dates are formatted with `date-fns`.
Live examples of every state, Light and Dark: Storybook → **Shared/DatePicker**.

The default placeholder and the ← / → names come from `common.datePicker` in `messages/en.json`, so
the picker needs `NextIntlClientProvider` above it: the root layout mounts it in the app,
`.storybook/preview.tsx` in Storybook.

The calendar follows the app language: `useDateFnsLocale()` (`@/shared/lib/date/date-fns-locale`) maps the
`next-intl` locale to a `date-fns` locale, and the picker passes it to `react-datepicker` (`locale`) and to the
month name in the header. That gives translated month and week-day names and the language's first day of the
week. The object is passed directly, so `registerLocale` is not needed. The value in the trigger stays
`MM/dd/yyyy` in every language (Figma).

## Files

| File                     | What                                                     |
| ------------------------ | -------------------------------------------------------- |
| `DatePicker.tsx`         | component                                                |
| `DatePicker.module.css`  | trigger, popover, header + overrides of react-datepicker |
| `DatePicker.stories.tsx` | states + `play` interaction tests                        |

```tsx
import { DatePicker } from '@/shared/components/date-picker/DatePicker';
```

## Usage

```tsx
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);

<DatePicker label={t('startDate')} value={startDate} onChange={setStartDate} />
<DatePicker
  label={t('endDate')}
  value={endDate}
  onChange={setEndDate}
  minDate={startDate ?? undefined}         // end can't be before start
/>
<DatePicker
  label={t('startDate')}
  value={startDate}
  onChange={setStartDate}
  minDate={project.startDate}              // a range that may be fully in the past
  maxDate={project.endDate}
  openToDate={project.startDate}           // empty → open on the project start, not on today
/>
<DatePicker label={t('date')} value={date} onChange={setDate} excludeDates={holidays} />
<DatePicker label={t('date')} value={date} onChange={setDate} error={t('dateRequired')} />
<DatePicker label={t('date')} value={date} onChange={setDate} disabled />
```

| Prop           | Values                                                  | Default                                         |
| -------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `label`        | `string`: the `Field` label, names the trigger          | required                                        |
| `value`        | `Date` · `null` = empty                                 | required ⚠️                                     |
| `onChange`     | `(date: Date \| null) => void`                          | required                                        |
| `error`        | `string`: text under the field, red outline and icon    | —                                               |
| `placeholder`  | `string`: shown only while the calendar is open         | `common.datePicker.placeholder` (`Select date`) |
| `minDate`      | `Date`: earlier days disabled                           | —                                               |
| `maxDate`      | `Date`: later days disabled                             | —                                               |
| `openToDate`   | `Date`: month to open on while `value` is empty         | today                                           |
| `excludeDates` | `Date[]`: single days disabled                          | —                                               |
| `disabled`     | `boolean`                                               | `false`                                         |
| `onOpenChange` | `(open: boolean) => void`: the calendar opened / closed | —                                               |
| `onBlur`       | `() => void`: called when the calendar closes           | —                                               |
| `id`           | `string`: id of the trigger                             | `useId()`                                       |
| `ref`          | `Ref<HTMLButtonElement>`: the trigger                   | —                                               |
| `clearable`    | `boolean`: ✕ button that empties the date               | `false`                                         |

- ⚠️ **Controlled only**: there is no `defaultValue`, the parent always owns the date. Empty is `null`, not `undefined`.
- `onChange` is called when a **day** is clicked; it gets a local `Date` at 00:00. The popover closes after it.
- `clearable` is for **optional** dates only (e.g. the CV project End Date, empty = "Present"). The ✕ shows while a
  date is set and the field is not disabled. Clicking it calls `onChange(null)` and `onBlur`, and moves focus back
  to the trigger, because the ✕ disappears together with the value. The ✕ is a **sibling** of the trigger rather
  than its child (a button inside a button is invalid HTML), so its click never opens the calendar and no
  `stopPropagation` is needed. Its label is `common.datePicker.clear`.
- The trigger shows the value as `MM/dd/yyyy` (Figma), via `formatDate` from `@/shared/lib/date/format-date`,
  the same helper the tables use, so a date looks the same everywhere in the app.
- Disabled days (`minDate` / `maxDate` / `excludeDates`) are greyed out and struck through, they can't be clicked.
- `onOpenChange` is called on every open and close, including the close after a day is picked; `onBlur` on
  every close.
- Hover, focus, open, error and disabled are drawn by `Field` (outline colour, label position, background); only
  `error` and `disabled` are props.

## Label and placeholder

As in `Select`, the label sits inside the empty field and moves up when the calendar is open (`active`) or a date
is chosen (`filled`):

| State           | Label  | In the trigger |
| --------------- | ------ | -------------- |
| closed, empty   | inside | —              |
| open, empty     | raised | `placeholder`  |
| a date selected | raised | `MM/dd/yyyy`   |

## Calendar views

The calendar has three views, switched from the header:

| View    | Opened by                    | Clicking an item                    | ← / →           |
| ------- | ---------------------------- | ----------------------------------- | --------------- |
| `day`   | default, every time it opens | picks the date → `onChange`, closes | month           |
| `month` | the month name in the header | goes to `day` of that month         | year            |
| `year`  | the year in the header       | goes to `month` of that year        | year range (12) |

- ← / → are named `Previous` / `Next` (`common.datePicker.previous` / `next`) in every view; what
  they move is in the table above, and the header says where the calendar is after a click.
- Every open starts from the `day` view on the month of `value`; when it's empty, on `openToDate`, or today
  without it. That date is then moved into `minDate` / `maxDate`: a range fully in the past (a finished
  project) opens on the month of `maxDate`, a range in the future on the month of `minDate`, never on a month
  where every day is disabled. Switching views or months without picking a day changes nothing outside.
- The first day of the week comes from the locale: **Sunday** for `en` and `pt`, **Monday** for the other
  languages. Don't set `calendarStartDay`, it would override the locale for every language.
- Week days are shown as one capital letter (`S M T W T F S`, `П В С Ч П С Н`); screen readers get the full
  name (`Sunday`, `понеділок`).
- The month in the header uses `LLLL`, the standalone name: `листопад`, not the genitive `листопада` that
  `MMMM` gives in Slavic languages.
- The active view's label in the header is highlighted with `--datepicker-active-label`.

## Dates and the API

`value` is a local date at midnight. Don't send it with `toISOString()`: it converts to UTC, and in
any timezone ahead of UTC the day moves back by one (`2025-09-04T00:00` in Minsk → `2025-09-03T21:00Z`).

```tsx
format(date, 'yyyy-MM-dd'); // send
parseISO('2025-09-04'); // receive → local midnight
formatDate('2025-09-04'); // show → '09/04/2025' (also takes a Date)
formatDate('2025-09-04', 'MM.yyyy'); // month and year → '09.2025' (CV preview project period)
```

`formatDate` is for display only; the API always gets `yyyy-MM-dd`. It takes only the formats listed in its
`DateFormat` type (`MM/dd/yyyy` by default, `MM.yyyy`); add a new one there with a test. Use `yyyy`, not `YYYY`:
in `date-fns` `YYYY` is the week-numbering year and shows the wrong year around New Year.

## Usage with react-hook-form

```tsx
<Controller
  name="startDate"
  control={control}
  render={({ field, fieldState }) => (
    <DatePicker
      ref={field.ref}
      label={t('startDate')}
      value={field.value ?? null}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

- `ref` points at the trigger: react-hook-form focuses it on a validation error.
- `onBlur` fires when the calendar **closes** (a day picked, Escape, click outside), not when the trigger loses
  focus: opening moves focus into the popover, which would mark the field touched on the first open. Pass
  `field.onBlur` as is; with `mode: 'onTouched'` "required" shows after the calendar was opened and closed
  without picking a day.
- In the form the value is `Date | null`; the zod schema turns it into `Date` (`requiredDate` in
  `shared/lib/form`), the mutation gets `format(date, 'yyyy-MM-dd')`.

## Accessibility

- The trigger is a `<button>` named by the label (`<label for>` → trigger `id`); Radix adds
  `aria-haspopup="dialog"` and `aria-expanded`.
- With `error` the trigger gets `aria-describedby` → the error text (`role="alert"`). `aria-invalid` is not used:
  it is not allowed on role `button` (jsx-a11y `role-supports-aria-props`). The red icon is styled with
  `data-invalid`.
- Keyboard focus highlights the `Field` outline (`[aria-haspopup]:focus-visible` in `Field.module.css`).

## Sizing rules

The trigger owns its **height** (`--input-height`, same as other inputs); its **width comes from the parent**
(`Field` is `width: 100%`), so it fits a half column of a form grid. The popover is a fixed `448px` card, aligned to
the trigger's left edge.

- Form column → the parent sets the width, the trigger fills it.
- No room on screen → Radix shifts / flips the popover and keeps `16px` from the viewport edge
  (`collisionPadding`); on narrow screens the card shrinks to `100vw - 32px`.
- Text in the trigger and the calendar uses `--type-datepicker-size` (18px from Figma), not the regular input size.

## Styling react-datepicker

`DatePicker.tsx` imports `react-datepicker/dist/react-datepicker.css` for the layout, and
`DatePicker.module.css` overrides its look under `.content` with `:global(.react-datepicker__…)` selectors.

- Keep every override inside `.content`: the library CSS is global, an unscoped rule would leak into the app.
- The library bolds today and the selected day and adds its own keyboard highlight; both are reset.
- The **selected** rules stay last in the file so they win over hover.
- After a `react-datepicker` update check Storybook: the overrides depend on its class names.

## Tokens

Styles use component / semantic tokens from [`theme/tokens.css`](../../theme/tokens.css) only, so Light / Dark
switch automatically: `--input-*` for the field (via `Field`) and the error icon, `--datepicker-*` for the card,
`--type-datepicker-size`.
To change a size or colour, change the token, not the component CSS.

## Tests

`play` functions in `DatePicker.stories.tsx` run in Storybook (Interactions panel) and in Vitest
(`@storybook/addon-vitest`, needs `npx playwright install chromium` once).

| Story                      | Checks                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SelectsDate`              | clicking a day calls `onChange`, shows the date in the trigger, closes the calendar with `onOpenChange(false)` |
| `OpenClose`                | open, Escape (focus back on the trigger), click outside, `onOpenChange`; reopening resets to the day view      |
| `BlursOnClose`             | opening does not call `onBlur`; Escape and picking a day do, once each                                         |
| `PlaceholderOnlyWhenOpen`  | empty and closed: no placeholder under the label; open: the placeholder is shown                               |
| `LabelNamesTrigger`        | `<label for>` points at the trigger `id`                                                                       |
| `WithError`                | the error text is `role="alert"` and is the trigger's accessible description                                   |
| `Disabled`                 | the trigger is disabled                                                                                        |
| `OpensWithinRange`         | empty, range in the past: opens on the month of `maxDate`, not today                                           |
| `OpensOnOpenToDate`        | empty: opens on the month of `openToDate`                                                                      |
| `OpenToDateClampedToRange` | `openToDate` before `minDate`: opens on the month of `minDate`                                                 |
| `ValueWinsOverOpenToDate`  | with a value: opens on its month, `openToDate` is ignored                                                      |
| `EnglishLocale`            | `en`: header `November`, week starts on Sunday (`S M T W T F S`)                                               |
| `UkrainianLocale`          | `uk`: header `листопад`, week starts on Monday (`П В С Ч П С Н`), full day name for screen readers             |
| `UkrainianMonthView`       | `uk`: the month view lists month names in Ukrainian                                                            |

The other stories (`Default`, `WithValue`, `EndDate`, `ExcludeDates`, `Dark`, `DarkWithError`) are visual.

- The locale stories wrap the picker in their own `NextIntlClientProvider` (decorator `withLocale`); the
  others use `en` from `.storybook/preview.tsx`.
- The trigger is found by its label, `getByRole('button', { name: 'Start Date' })`; the date is checked with
  `toHaveTextContent`.
- The `Field` label has `pointer-events: none` (clicks go through to the control), so tests don't click it.

- The popover is portaled to `<body>`: query it with `within(canvasElement.ownerDocument.body)`.
- Radix gives the popover `role="dialog"`, react-datepicker names the month grid
  `Month September, 2025` (`role="rowgroup"`): use those to find the calendar.
- Visual stories with `minDate` / `excludeDates` build dates relative to **today**, so the disabled days are
  on the month the calendar opens on. The opening-month stories use a fixed range in the past (2025) instead:
  it stays in the past whenever they run.
