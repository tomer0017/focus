import { daysUntil } from "./format";
import type { EventReminder, FocusEvent } from "../types";

/**
 * When an event starts asking for attention, and how loudly.
 *
 * The rule this module exists to break is "urgency equals days remaining".
 * A flight in two months needs nothing from anybody yet; a 60th birthday in
 * two months needs a hall booked this week. Both are sixty days away, so the
 * calendar cannot tell them apart — only the user can, by saying how long the
 * preparation takes (`prepDaysBefore`). An event that says nothing stays quiet
 * until the week before it happens.
 */

/**
 * Five states, in order of loudness.
 *
 * These are never signalled by colour alone: every place that renders one also
 * renders its label and an icon, because "the orange one" is not a fact a
 * colour-blind user, a screen reader, or a printed page can recover.
 */
export type EventUrgency = "neutral" | "preparing" | "soon" | "critical" | "done";

/** Under a week is "soon" everywhere in the app. */
const SOON_DAYS = 7;

/** The last stretch, where an unfinished task is a problem rather than a plan. */
const CRITICAL_DAYS = 1;

/** Every task on the event, across all its sections. */
export function eventTasks(event: FocusEvent): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const section of event.sections) {
    for (const item of section.items ?? []) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { total, done };
}

/** The moment a reminder is asking about, resolved against the event. */
export function reminderTime(event: FocusEvent, reminder: EventReminder): string {
  if (reminder.at) return reminder.at;
  const start = new Date(event.startsAt).getTime();
  const hours = reminder.hoursBefore ?? 0;
  return new Date(start - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Reminders that should be showing right now: due, not handled, not snoozed
 * past this moment. A reminder for an event that has already happened still
 * counts — "print the tickets" that was never done is worth seeing afterwards,
 * because it explains why the morning went badly.
 */
export function dueReminders(
  event: FocusEvent,
  now: Date = new Date()
): EventReminder[] {
  const moment = now.toISOString();
  return (event.reminders ?? []).filter((reminder) => {
    if (reminder.handled) return false;
    if (reminder.snoozedUntil && reminder.snoozedUntil > moment) return false;
    return reminderTime(event, reminder) <= moment;
  });
}

/**
 * How loudly this event should be asking, right now.
 *
 * Read top to bottom: the first condition that holds wins, so "it already
 * happened" beats "there is an overdue reminder", and an event with every box
 * ticked is finished no matter how close it is.
 */
export function urgencyOf(event: FocusEvent, now: Date = new Date()): EventUrgency {
  const days = daysUntil(event.startsAt, now);
  const tasks = eventTasks(event);
  const overdue = dueReminders(event, now).length > 0;

  // Already happened. Green, not red: nothing can be done about it now.
  if (days < 0) return "done";

  // Everything that was going to be prepared has been prepared.
  if (tasks.total > 0 && tasks.done === tasks.total && !overdue) return "done";

  // Today or tomorrow, or something was supposed to happen already.
  if (days <= CRITICAL_DAYS || overdue) return "critical";

  if (days < SOON_DAYS) return "soon";

  /*
   * The preparation window. A low-importance event skips it entirely — that is
   * what stops a small, distant occasion from sitting in the same list as a
   * wedding for two months.
   */
  const prep = event.prepDaysBefore;
  if (prep !== undefined && days <= prep && event.importance !== "low") {
    return "preparing";
  }

  return "neutral";
}

/** True when the event is inside the window its owner asked for. */
export function isPreparing(event: FocusEvent, now: Date = new Date()): boolean {
  return urgencyOf(event, now) === "preparing";
}

/**
 * Events that want attention, loudest first, then soonest.
 *
 * `neutral` events are left out on purpose: an insurance renewal eight months
 * out does not belong on a screen about today. See CLAUDE.md → Overview.
 */
const RANK: Record<EventUrgency, number> = {
  critical: 0,
  soon: 1,
  preparing: 2,
  done: 3,
  neutral: 4,
};

export function needsAttention(events: FocusEvent[], now: Date = new Date()): FocusEvent[] {
  return events
    .map((event) => ({ event, urgency: urgencyOf(event, now) }))
    .filter(({ urgency }) => urgency === "critical" || urgency === "soon" || urgency === "preparing")
    .sort(
      (a, b) =>
        RANK[a.urgency] - RANK[b.urgency] || a.event.startsAt.localeCompare(b.event.startsAt)
    )
    .map(({ event }) => event);
}

/** Ids are generated here so every call site makes them the same way. */
export function reminderId(): string {
  return `reminder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** The offsets offered when adding a reminder, in hours before the event. */
export const REMINDER_PRESETS = [24 * 7, 24, 2] as const;
