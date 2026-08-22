import { toDateKey, todayKey } from "./dateKey";

export interface MonthCell {
  /** `YYYY-MM-DD`. */
  key: string;
  dayOfMonth: number;
  /** False for the leading/trailing days borrowed from the neighbouring month. */
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/** Sunday-first in Hebrew, Monday-first in English, matching each calendar. */
export function weekStartFor(language: string): number {
  return language === "he" ? 0 : 1;
}

/** The seven weekday indices in display order for a given week start. */
export function weekdayOrder(weekStartsOn: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => (weekStartsOn + offset) % 7);
}

/**
 * A six-week grid for one month, always whole weeks so the calendar never
 * changes height between months — a jumping layout is the fastest way to make
 * month navigation feel broken.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStartsOn: number,
  now: Date = new Date()
): MonthCell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;

  const start = new Date(year, month, 1 - lead);
  const today = todayKey(now);

  const cells: MonthCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = toDateKey(date);
    cells.push({
      key,
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
      isToday: key === today,
      isFuture: key > today,
    });
  }
  return cells;
}

/** Steps a year/month pair by whole months, wrapping the year. */
export function shiftMonth(year: number, month: number, by: number): { year: number; month: number } {
  const date = new Date(year, month + by, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
