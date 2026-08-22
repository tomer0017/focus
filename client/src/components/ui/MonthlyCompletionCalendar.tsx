import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { useLocale } from "../../i18n/useLocale";
import { buildMonthGrid, shiftMonth, weekdayOrder, weekStartFor } from "../../lib/monthGrid";
import {
  formatDayKeyLong,
  formatMonthName,
  formatWeekdayLong,
  formatWeekdayNarrow,
} from "../../lib/format";

interface MonthlyCompletionCalendarProps {
  year: number;
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  isCompleted: (dateKey: string) => boolean;
  /** A day the schedule plans. Only drawn for today and the future. */
  isPlanned: (dateKey: string) => boolean;
  onToggle: (dateKey: string) => void;
  /** Completions in the month on display. */
  completedCount: number;
  /** Accessible name for the whole grid, e.g. the routine's title. */
  label: string;
}

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Five years back and one forward covers every history worth scrolling to. */
function yearRange(current: number): number[] {
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let year = thisYear - 5; year <= thisYear + 1; year += 1) years.push(year);
  if (!years.includes(current)) years.push(current);
  return years.sort((a, b) => a - b);
}

/**
 * One month of completions, for any recurring activity — the gym and a laser
 * appointment use the same component with different data.
 *
 * The rules that matter are about what is *not* drawn. A day that was not done
 * is left blank, never marked red: a calendar that scolds you for a missed
 * Tuesday six weeks ago is a calendar people stop opening. Only three states
 * are shown — done, today, and planned ahead — and each carries a shape, not
 * just a colour.
 *
 * Navigation is one step back, one step forward, and two selects. The four
 * arrow buttons it replaced were two ways of doing the same thing, and the
 * year jump was never the fast route to a specific month anyway.
 */
export function MonthlyCompletionCalendar({
  year,
  month,
  onChangeMonth,
  isCompleted,
  isPlanned,
  onToggle,
  completedCount,
  label,
}: MonthlyCompletionCalendarProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale, language } = useLocale();

  const weekStart = weekStartFor(language);
  const cells = buildMonthGrid(year, month, weekStart);
  const weekdays = weekdayOrder(weekStart);

  const step = (months: number): void => {
    const next = shiftMonth(year, month, months);
    onChangeMonth(next.year, next.month);
  };

  return (
    <div className="focus-calendar">
      <div className="focus-calendar__head">
        <button
          type="button"
          className="focus-calendar__step"
          onClick={() => step(-1)}
          aria-label={t("pages:calendar.previousMonth")}
        >
          <Icon name="arrowBack" size={16} flipForRtl />
        </button>

        <div className="focus-calendar__pickers">
          <label className="visually-hidden" htmlFor={`cal-month-${label}`}>
            {t("pages:calendar.month")}
          </label>
          <select
            id={`cal-month-${label}`}
            className="form-select form-select-sm"
            value={month}
            onChange={(event) => onChangeMonth(year, Number(event.target.value))}
          >
            {MONTHS.map((value) => (
              <option key={value} value={value}>
                {formatMonthName(value, locale)}
              </option>
            ))}
          </select>

          <label className="visually-hidden" htmlFor={`cal-year-${label}`}>
            {t("pages:calendar.year")}
          </label>
          <select
            id={`cal-year-${label}`}
            className="form-select form-select-sm focus-calendar__year"
            value={year}
            onChange={(event) => onChangeMonth(Number(event.target.value), month)}
          >
            {yearRange(year).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="focus-calendar__step"
          onClick={() => step(1)}
          aria-label={t("pages:calendar.nextMonth")}
        >
          <Icon name="arrowForward" size={16} flipForRtl />
        </button>
      </div>

      <div className="focus-calendar__grid" role="grid" aria-label={label}>
        <div className="focus-calendar__row focus-calendar__row--head" role="row">
          {weekdays.map((weekday) => (
            <abbr
              key={weekday}
              role="columnheader"
              className="focus-calendar__weekday"
              title={formatWeekdayLong(weekday, locale)}
            >
              {formatWeekdayNarrow(weekday, locale)}
            </abbr>
          ))}
        </div>

        <div className="focus-calendar__cells" role="rowgroup">
          {cells.map((cell) => {
            const done = isCompleted(cell.key);
            // Planned days are only useful looking forward; the past has history.
            const planned = !done && (cell.isFuture || cell.isToday) && isPlanned(cell.key);
            const state = done
              ? t("pages:calendar.stateDone")
              : planned
                ? t("pages:calendar.statePlanned")
                : t("pages:calendar.stateOpen");

            return (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                aria-pressed={done}
                aria-label={`${formatDayKeyLong(cell.key, locale)} — ${state}`}
                className={[
                  "focus-day",
                  cell.inMonth ? "" : "focus-day--outside",
                  done ? "is-done" : "",
                  planned ? "is-planned" : "",
                  cell.isToday ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onToggle(cell.key)}
              >
                <span className="focus-day__number">{cell.dayOfMonth}</span>
                {done && (
                  <span className="focus-day__mark" aria-hidden="true">
                    <Icon name="check" size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="focus-calendar__foot mb-0">
        <span className="focus-calendar__count">
          {t("pages:calendar.doneThisMonth", { count: completedCount })}
        </span>
        <span className="focus-calendar__legend">
          <span className="focus-legend focus-legend--done" aria-hidden="true" />
          {t("pages:calendar.stateDone")}
          <span className="focus-legend focus-legend--planned" aria-hidden="true" />
          {t("pages:calendar.statePlanned")}
        </span>
      </p>
    </div>
  );
}
