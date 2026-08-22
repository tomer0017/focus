/**
 * Repetition, covering the eighty percent of real life and no more.
 *
 * There is deliberately no RRULE parser here. "Every second Tuesday except in
 * August" is a calendar's problem; a personal operating system needs daily,
 * weekly, monthly, yearly, every-N-of-those, and "I will tell you the next date
 * myself". `custom` is the escape hatch that keeps the other five simple: an
 * irregular check-up is not an incomplete recurrence rule, it is a different
 * kind of thing, and pretending otherwise is how recurrence engines grow.
 */

export type RecurrenceKind = "once" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type RecurrenceRule =
  /** Happens once and never again. */
  | { kind: "once" }
  /** Every `interval` days (default 1). */
  | { kind: "daily"; interval?: number }
  /**
   * Every `interval` weeks (default 1). `weekdays` (0 = Sunday) pins it to
   * particular days; without it the anchor's own weekday is used.
   */
  | { kind: "weekly"; interval?: number; weekdays?: number[] }
  /** Every `interval` months (default 1), on the anchor's day of the month. */
  | { kind: "monthly"; interval?: number }
  /** Every `interval` years (default 1), on the anchor's month and day. */
  | { kind: "yearly"; interval?: number }
  /** Recurring in principle; the user names the next date each time. */
  | { kind: "custom" };
