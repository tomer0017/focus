import { useTranslation } from "react-i18next";
import { useLocale } from "../../i18n/useLocale";
import { formatWeekdayAndDay } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import type { TripDayPlan } from "../../types";

interface DayRailProps {
  days: TripDayPlan[];
  /** The day currently on screen. Exactly one, always. */
  value: string;
  onChange: (dayId: string) => void;
  /** Day numbers count from the whole trip, not from this destination. */
  numberOf: (day: TripDayPlan) => number;
  idPrefix: string;
}

/** A day with nothing in any of its three slots is a gap worth seeing. */
function isPlanned(day: TripDayPlan): boolean {
  return Boolean(day.morning?.trim() || day.afternoon?.trim() || day.evening?.trim());
}

/**
 * The days of a leg, as ticks on a line.
 *
 * This is the one place the trip is drawn rather than listed, and it earns it:
 * the shape of a trip *is* a strip of dates, and the thing you cannot see in a
 * list of day cards is the gap — the Tuesday with nothing on it. A filled tick
 * means the day has a plan, a hollow one means it does not, and the state is
 * written out for screen readers rather than left to the drawing.
 *
 * It replaces four day cards side by side, each with seven open textareas. One
 * day is selected at a time; its content is the panel underneath.
 */
export function DayRail({ days, value, onChange, numberOf, idPrefix }: DayRailProps) {
  const { t } = useTranslation(["trips"]);
  const { locale } = useLocale();

  return (
    <div className="focus-day-rail" role="tablist" aria-label={t("trips:chooseDay")}>
      {days.map((day) => {
        const active = day.id === value;
        const planned = isPlanned(day);
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${day.id}`}
            aria-controls={`${idPrefix}-panel`}
            aria-selected={active}
            className={`focus-day-rail__day${active ? " is-active" : ""}${planned ? "" : " is-empty"}`}
            onClick={() => onChange(day.id)}
          >
            <span className="focus-day-rail__num">
              {t("trips:dayNumber", { count: numberOf(day) })}
            </span>
            <span className="focus-day-rail__tick" aria-hidden="true" />
            {/* Weekday and day number only. The month and year are on the day
                panel and in the leg's dates; repeating them here turns a tick
                into a line of text and the rail into a horizontal wall. */}
            <span className="focus-day-rail__date">
              <time dateTime={dateKeyToIso(day.date)}>
                {formatWeekdayAndDay(dateKeyToIso(day.date), locale)}
              </time>
            </span>
            {!planned && (
              <span className="visually-hidden">{t("trips:day.nothingPlanned")}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
