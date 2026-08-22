import { MonthlyCompletionCalendar } from "focus-client";

/**
 * One month of completions, for anything that comes round again — the gym and
 * a laser course use the identical grid with different data.
 *
 * What is *not* drawn is the point. A day that was not done is left blank and
 * never marked red: a calendar that scolds you for a missed Tuesday six weeks
 * ago is a calendar people stop opening. Three states only — done, today,
 * planned ahead — and each carries a shape, not just a colour.
 *
 * The fixtures target **August 2026**, the month around the day these were
 * written, so the shipped card renders a filled month on the real clock. The
 * capture harness pins its own clock to 2024, so the review sheet will not
 * draw a "today" ring; that is the harness, not the component.
 */

const AUGUST_2026 = { year: 2026, month: 7 };
const SEPTEMBER_2026 = { year: 2026, month: 8 };

const noop = () => {};

/** Sunday, Tuesday, Thursday — the shape of a three-times-a-week routine. */
const GYM_DAYS = [0, 2, 4];

const GYM_DONE = new Set([
  "2026-08-02",
  "2026-08-04",
  "2026-08-06",
  "2026-08-09",
  "2026-08-11",
  "2026-08-16",
  "2026-08-18",
  "2026-08-20",
]);

/** Local midnight for a `YYYY-MM-DD` key — the same rule as `lib/dateKey`. */
function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/**
 * The canonical use: a routine with a cadence and a history. Eight sessions
 * done, one week skipped without comment, and the planned days ahead marked so
 * the rest of the month is legible.
 */
export const RoutineMonth = () => (
  <MonthlyCompletionCalendar
    year={AUGUST_2026.year}
    month={AUGUST_2026.month}
    onChangeMonth={noop}
    isCompleted={(dateKey) => GYM_DONE.has(dateKey)}
    isPlanned={(dateKey) => GYM_DAYS.includes(weekdayOf(dateKey))}
    onToggle={noop}
    completedCount={GYM_DONE.size}
    label="חדר כושר"
  />
);

/**
 * A routine with no cadence at all — a laser course is booked appointment by
 * appointment, so nothing is planned and one day is done. The foot line takes
 * Hebrew's singular form rather than "1 times".
 */
export const NoSchedule = () => (
  <MonthlyCompletionCalendar
    year={AUGUST_2026.year}
    month={AUGUST_2026.month}
    onChangeMonth={noop}
    isCompleted={(dateKey) => dateKey === "2026-08-05"}
    isPlanned={() => false}
    onToggle={noop}
    completedCount={1}
    label="לייזר — טיפול רביעי"
  />
);

/**
 * A month that has not happened yet: nothing done, the plan drawn ahead.
 * An empty grid is the honest render — the missed days of the past are blank
 * for the same reason.
 */
export const MonthAhead = () => (
  <MonthlyCompletionCalendar
    year={SEPTEMBER_2026.year}
    month={SEPTEMBER_2026.month}
    onChangeMonth={noop}
    isCompleted={() => false}
    isPlanned={(dateKey) => [1, 3, 5].includes(weekdayOf(dateKey))}
    onToggle={noop}
    completedCount={0}
    label="ריצה"
  />
);
