import { addDaysToKey, daysBetweenKeys, fromDateKey, todayKey } from "./dateKey";
import type { Routine, RoutineScheduleRule } from "../types";

/** How far ahead a planned-day search will look before giving up. */
const MAX_LOOKAHEAD_DAYS = 400;

/** The most recent completion, or `null` if the routine has never been done. */
export function lastCompletionKey(routine: Routine): string | null {
  if (routine.completions.length === 0) return null;
  return routine.completions.reduce(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    routine.completions[0].date
  );
}

export function isCompletedOn(routine: Routine, dateKey: string): boolean {
  return routine.completions.some((entry) => entry.date === dateKey);
}

/** Completions in a given calendar month — the one number a routine page owes. */
export function completionsInMonth(routine: Routine, year: number, month: number): number {
  return routine.completions.filter((entry) => {
    const date = fromDateKey(entry.date);
    return date.getFullYear() === year && date.getMonth() === month;
  }).length;
}

/**
 * Whether a rule plans this day.
 *
 * `everyNDays` counts from the anchor — the last completion, or the start date
 * for a routine never done — so a missed session shifts the plan forward
 * instead of stacking up a queue of "overdue" days nobody will ever do.
 */
export function isPlannedOn(routine: Routine, dateKey: string): boolean {
  const rule = routine.schedule;
  if (dateKey < routine.startDate) return false;

  switch (rule.kind) {
    case "everyNDays": {
      if (rule.days <= 0) return false;
      const anchor = lastCompletionKey(routine) ?? routine.startDate;
      const delta = daysBetweenKeys(anchor, dateKey);
      return delta > 0 && delta % rule.days === 0;
    }
    case "weekdays":
      return rule.weekdays.includes(fromDateKey(dateKey).getDay());
    case "monthly":
      return fromDateKey(dateKey).getDate() === rule.dayOfMonth;
    case "none":
    case "reminderOnly":
      return false;
  }
}

/**
 * The next planned day on or after `fromKey`, or `null` when the rule plans
 * nothing. Walks day by day — the horizon is a year and the cost is a few
 * hundred integer comparisons, which is cheaper than special-casing four rules.
 */
export function nextPlannedKey(routine: Routine, fromKey: string = todayKey()): string | null {
  const rule = routine.schedule;
  if (rule.kind === "none" || rule.kind === "reminderOnly") return null;

  const start = fromKey < routine.startDate ? routine.startDate : fromKey;
  for (let offset = 0; offset <= MAX_LOOKAHEAD_DAYS; offset += 1) {
    const candidate = addDaysToKey(start, offset);
    if (isPlannedOn(routine, candidate)) return candidate;
  }
  return null;
}

/**
 * A routine is overdue when its next planned day has already passed and it was
 * not done. Reminder-only and cadence-free routines are never overdue by
 * design — that is the whole reason those rules exist.
 */
export function isOverdue(routine: Routine, today: string = todayKey()): boolean {
  const rule = routine.schedule;
  if (rule.kind === "none" || rule.kind === "reminderOnly") return false;
  if (rule.kind !== "everyNDays") {
    const next = nextPlannedKey(routine, today);
    return next !== null && next < today;
  }

  const anchor = lastCompletionKey(routine) ?? routine.startDate;
  return daysBetweenKeys(anchor, today) > rule.days;
}

/** Short human summary of a rule, as translation arguments. */
export function scheduleSummaryArgs(rule: RoutineScheduleRule): {
  key: string;
  values: Record<string, unknown>;
} {
  switch (rule.kind) {
    case "everyNDays":
      return { key: "schedule.everyNDaysValue", values: { count: rule.days } };
    case "weekdays":
      return { key: "schedule.weekdaysValue", values: { count: rule.weekdays.length } };
    case "monthly":
      return { key: "schedule.monthlyValue", values: { day: rule.dayOfMonth } };
    case "none":
      return { key: "schedule.noneValue", values: {} };
    case "reminderOnly":
      return { key: "schedule.reminderOnlyValue", values: {} };
  }
}

/** Adds or removes one completion. Pure: returns a new routine. */
export function toggleCompletion(routine: Routine, dateKey: string): Routine {
  const exists = isCompletedOn(routine, dateKey);
  return {
    ...routine,
    completions: exists
      ? routine.completions.filter((entry) => entry.date !== dateKey)
      : [...routine.completions, { date: dateKey }].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
