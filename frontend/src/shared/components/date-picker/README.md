# DatePicker

Shared date field from the Figma design system ("Design system (components)" → DatePicker).
A trigger button opens a calendar in a Radix [`Popover`](https://www.radix-ui.com/primitives/docs/components/popover);
the calendar itself is [`react-datepicker`](https://reactdatepicker.com) in `inline` mode with a custom header,
dates are formatted with `date-fns`.
Live examples of every state, Light and Dark: Storybook → **Shared/DatePicker**.

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

<DatePicker value={startDate} onChange={setStartDate} placeholder="Start Date" />
<DatePicker
  value={endDate}
  onChange={setEndDate}
  placeholder="End Date"
  minDate={startDate ?? undefined}         // end can't be before start
/>
<DatePicker value={date} onChange={setDate} excludeDates={holidays} />
<DatePicker value={date} onChange={setDate} disabled />
```

| Prop           | Values                          | Default         |
| -------------- | ------------------------------- | --------------- |
| `value`        | `Date` · `null` = empty         | required ⚠️     |
| `onChange`     | `(date: Date \| null) => void`  | required        |
| `placeholder`  | `string`                        | `'Select date'` |
| `minDate`      | `Date`: earlier days disabled   | —               |
| `maxDate`      | `Date`: later days disabled     | —               |
| `excludeDates` | `Date[]`: single days disabled  | —               |
| `disabled`     | `boolean`                       | `false`         |

- ⚠️ **Controlled only**: there is no `defaultValue`, the parent always owns the date. Empty is `null`, not `undefined`.
- `onChange` is called only when a **day** is clicked; it gets a local `Date` at 00:00. The popover closes after it.
  There is no "clear" button yet, so `onChange` is never called with `null` by the component itself.
- The trigger shows the value as `dd.MM.yyyy`. The format is fixed in the component.
- Disabled days (`minDate` / `maxDate` / `excludeDates`) are greyed out and struck through, they can't be clicked.
- Hover / Open / Focus / Disabled are CSS states (`:hover`, `[data-state='open']`, `:focus-visible`, `:disabled`),
  the placeholder look is `[data-empty='true']`. None of them are props.

## Calendar views

The calendar has three views, switched from the header:

| View    | Opened by                       | Clicking an item                  | ← / →           |
| ------- | ------------------------------- | --------------------------------- | --------------- |
| `day`   | default, every time it opens    | picks the date → `onChange`, closes | month           |
| `month` | the month name in the header    | goes to `day` of that month       | year            |
| `year`  | the year in the header          | goes to `month` of that year      | year range (12) |

- Every open starts from the `day` view on the month of `value`, or today when it's empty.
  Switching views or months without picking a day changes nothing outside.
- The week starts on **Sunday**, week days are shown as one letter (`S M T W T F S`).
- The active view's label in the header is highlighted with `--datepicker-active-label`.

## Dates and the API

`value` is a local date at midnight. Don't send it with `toISOString()`: it converts to UTC, and in
any timezone ahead of UTC the day moves back by one (`2025-09-04T00:00` in Minsk → `2025-09-03T21:00Z`).

```tsx
format(date, 'yyyy-MM-dd');     // send
parseISO('2025-09-04');         // receive → local midnight
```

## Usage with react-hook-form

```tsx
<Controller
  name="startDate"
  control={control}
  render={({ field }) => (
    <DatePicker value={field.value ?? null} onChange={field.onChange} placeholder="Start Date" />
  )}
/>
```

The component has no `ref`, `name`, `label` or `error` props, so the label, error text and focus-on-error
are handled by the form around it for now.

## Sizing rules

The trigger owns its **height and look** (`--input-height`, same as other inputs) and takes the parent's width,
but never less than `400px`. The popover is a fixed `448px` card, aligned to the trigger's left edge.

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
switch automatically: `--input-*` for the trigger, `--datepicker-*` for the card, `--type-datepicker-size`.
To change a size or colour, change the token, not the component CSS.

## Tests

`play` functions in `DatePicker.stories.tsx` run in Storybook (Interactions panel) and in Vitest
(`@storybook/addon-vitest`, needs `npx playwright install chromium` once).

| Story         | Checks                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `SelectsDate` | clicking a day calls `onChange` with that date and shows it in the trigger      |
| `OpenClose`   | open, Escape (focus back on the trigger), click outside, reopening resets to the day view |

The other stories (`Default`, `WithValue`, `EndDate`, `ExcludeDates`, `Disabled`, `Dark`) are visual.

- The popover is portaled to `<body>`: query it with `within(canvasElement.ownerDocument.body)`.
- Radix gives the popover `role="dialog"`, react-datepicker names the month grid
  `Month September, 2025` (`role="rowgroup"`): use those to find the calendar.
- Stories with `minDate` / `excludeDates` build dates relative to **today**, otherwise the calendar opens on a
  month where nothing is disabled.
