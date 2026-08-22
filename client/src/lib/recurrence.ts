/**
 * Recurrence arithmetic — the pure rules behind `RecurrenceRule`.
 *
 * Kept out of the type module for the reason every other rule in `lib/` is:
 * it takes data as arguments, returns data, touches no storage and no React,
 * and is therefore the part of the app that can be tested exhaustively.
 */
import type { RecurrenceKind, RecurrenceRule } from "../types/recurrence";

export const RECURRENCE_KINDS: RecurrenceKind[] = [
  "once",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
];

/** True when the rule can produce a date after the one it was given. */
export function repeats(rule: RecurrenceRule | undefined): boolean {
  return Boolean(rule) && rule!.kind !== "once" && rule!.kind !== "custom";
}

function intervalOf(rule: RecurrenceRule): number {
  const raw = "interval" in rule ? rule.interval : undefined;
  // A zero or negative interval would loop forever; one is the honest default.
  return raw !== undefined && Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

/**
 * Adds months without letting the 31st silently become the 1st.
 *
 * `setMonth` overflows: 31 January plus one month is 3 March. A monthly charge
 * on the 31st has to land on the last day of a short month instead, which is
 * what every bank actually does.
 */
function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date.getTime());
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

/** Adds years, with the same guard for 29 February. */
function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

/**
 * The single next date the rule produces after `from`.
 *
 * One step only — `nextOccurrenceAfter` is what callers normally want. Split
 * because the weekly case genuinely needs the one-step form: pinned weekdays
 * advance within a week before the interval applies.
 */
export function advance(rule: RecurrenceRule, from: Date): Date | undefined {
  switch (rule.kind) {
    case "once":
    case "custom":
      return undefined;

    case "daily": {
      const next = new Date(from.getTime());
      next.setDate(next.getDate() + intervalOf(rule));
      return next;
    }

    case "weekly": {
      const interval = intervalOf(rule);
      const weekdays = [...new Set(rule.weekdays ?? [])].sort((a, b) => a - b);

      if (weekdays.length === 0) {
        const next = new Date(from.getTime());
        next.setDate(next.getDate() + 7 * interval);
        return next;
      }

      // The next pinned weekday later in the same week, if there is one.
      const current = from.getDay();
      const later = weekdays.find((day) => day > current);
      const next = new Date(from.getTime());
      if (later !== undefined) {
        next.setDate(next.getDate() + (later - current));
        return next;
      }
      // Otherwise the first pinned weekday of the week `interval` weeks on.
      next.setDate(next.getDate() + (7 - current + weekdays[0]) + 7 * (interval - 1));
      return next;
    }

    case "monthly":
      return addMonths(from, intervalOf(rule));

    case "yearly":
      return addYears(from, intervalOf(rule));
  }
}

/** Guard against a rule that somehow fails to move forward. */
const MAX_STEPS = 400;

/**
 * The first occurrence strictly after `after`, starting from `anchor`.
 *
 * `anchor` is the original due date, not "today" — that is what keeps a monthly
 * charge on the 4th on the 4th, however long the app went unopened. Returns
 * `undefined` for a rule that does not repeat, and for one that cannot reach
 * past `after` within a sane number of steps.
 */
export function nextOccurrenceAfter(
  rule: RecurrenceRule | undefined,
  anchor: string,
  after: Date = new Date()
): string | undefined {
  if (!rule || !repeats(rule)) return undefined;

  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) return undefined;

  let current = start;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    if (current.getTime() > after.getTime()) {
      return current.toISOString();
    }
    const next = advance(rule, current);
    // A rule that stops moving would otherwise spin here forever.
    if (!next || next.getTime() <= current.getTime()) return undefined;
    current = next;
  }
  return undefined;
}

/**
 * Every occurrence inside a window, oldest first.
 *
 * Used for "what falls in the next fortnight" rather than for drawing a
 * calendar, so the cap is low and deliberate: nothing in this app needs three
 * hundred instances of a daily rule.
 */
export function occurrencesBetween(
  rule: RecurrenceRule | undefined,
  anchor: string,
  from: Date,
  to: Date,
  limit = 40
): string[] {
  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) return [];

  const found: string[] = [];
  if (!rule || !repeats(rule)) {
    return start >= from && start <= to ? [start.toISOString()] : [];
  }

  let current = start;
  for (let step = 0; step < MAX_STEPS && found.length < limit; step += 1) {
    if (current > to) break;
    if (current >= from) found.push(current.toISOString());
    const next = advance(rule, current);
    if (!next || next.getTime() <= current.getTime()) break;
    current = next;
  }
  return found;
}

/**
 * Translation key for a rule, in the `manage` namespace.
 *
 * The interval is interpolated rather than baked in, so "every 3 weeks" needs
 * one key per kind instead of one per number.
 */
export function recurrenceLabelKey(rule: RecurrenceRule | undefined): {
  key: string;
  count: number;
} {
  if (!rule) return { key: "recurrence.once", count: 1 };
  const interval = intervalOf(rule);
  const suffix = interval > 1 ? "Every" : "";
  return { key: `recurrence.${rule.kind}${suffix}`, count: interval };
}
