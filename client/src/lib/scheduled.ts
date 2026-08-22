/**
 * When a scheduled item is asking for something, and what happens when it is
 * answered.
 *
 * Every rule here is pure and takes `now` as an argument. That is not
 * ceremony: "is this due?" is the single question the whole reminder half of
 * Focus turns on, and a function that reads the clock itself cannot be tested
 * against the day before, the day after, or the moment a snooze expires.
 */
import { advance, nextOccurrenceAfter, repeats } from "./recurrence";
import { daysUntil } from "./format";
import type { RecurrenceRule } from "../types/recurrence";
import type { ScheduledItem, ScheduledStatus } from "../types/scheduled";

const MS_PER_MINUTE = 60 * 1000;

/** True while the item has been told to stop asking. */
export function isSnoozed(item: ScheduledItem, now: Date = new Date()): boolean {
  return Boolean(item.snoozedUntil && item.snoozedUntil > now.toISOString());
}

/** Still owed: neither done nor abandoned. */
export function isOpen(item: ScheduledItem): boolean {
  return item.status === "active" || item.status === "snoozed";
}

/**
 * The moment this item starts asking, which is **not** its due date.
 *
 * An annual charge with "remind me 5 days before" wants to appear on day five,
 * not on the day the money leaves. The widest offset wins, because the point of
 * asking early is to leave time to act.
 */
export function firstReminderAt(item: ScheduledItem): string | undefined {
  if (!item.dueAt) return undefined;
  const offsets = item.reminderOffsets ?? [];
  if (offsets.length === 0) return item.dueAt;

  const widest = Math.max(...offsets.filter((value) => Number.isFinite(value) && value >= 0), 0);
  return new Date(new Date(item.dueAt).getTime() - widest * MS_PER_MINUTE).toISOString();
}

/**
 * Due right now: open, not snoozed, and past the moment it starts asking.
 *
 * An item whose date has been and gone still counts. "Renew the policy" that
 * was never done does not stop mattering on the renewal date — it starts
 * mattering more, and hiding it would be the worst possible moment to go quiet.
 */
export function isDue(item: ScheduledItem, now: Date = new Date()): boolean {
  if (!isOpen(item)) return false;
  if (isSnoozed(item, now)) return false;
  const from = firstReminderAt(item);
  if (!from) return false;
  return from <= now.toISOString();
}

/** Past its due date and still open. Strictly stronger than `isDue`. */
export function isOverdue(item: ScheduledItem, now: Date = new Date()): boolean {
  if (!isOpen(item) || isSnoozed(item, now)) return false;
  return Boolean(item.dueAt && item.dueAt < now.toISOString());
}

/** Whole calendar days until it is due. Negative when it has passed. */
export function daysUntilDue(item: ScheduledItem, now: Date = new Date()): number | undefined {
  return item.dueAt ? daysUntil(item.dueAt, now) : undefined;
}

/* ------------------------------------------------------------- transitions -- */

function stamp<T extends ScheduledItem>(item: T, patch: Partial<ScheduledItem>): T {
  return { ...item, ...patch, updatedAt: new Date().toISOString() };
}

/**
 * Marks an occurrence done.
 *
 * A recurring item does **not** become `completed`: it moves to its next date
 * and stays active, which is the entire difference between "the vet visit is
 * done" and "there will never be another vet visit". `lastCompletedAt` records
 * what actually happened, so a fortnightly visit can print "last done 9 days
 * ago" without a separate history table.
 *
 * A `custom` recurrence is deliberately completed rather than advanced: the
 * user said they would name the next date themselves, so inventing one would be
 * the opposite of what they asked for.
 */
export function completeOccurrence(item: ScheduledItem, now: Date = new Date()): ScheduledItem {
  const moment = now.toISOString();
  const count = (item.completionCount ?? 0) + 1;

  if (item.dueAt && repeats(item.recurrence)) {
    const next = nextOccurrenceAfter(item.recurrence, item.dueAt, now);
    if (next) {
      return stamp(item, {
        dueAt: next,
        status: "active",
        snoozedUntil: undefined,
        lastCompletedAt: moment,
        completionCount: count,
      });
    }
  }

  return stamp(item, {
    status: "completed",
    snoozedUntil: undefined,
    lastCompletedAt: moment,
    completionCount: count,
  });
}

/** Puts an item back into play after it was completed or cancelled. */
export function reopen(item: ScheduledItem): ScheduledItem {
  return stamp(item, { status: "active", snoozedUntil: undefined });
}

/**
 * Silences an item for a while without pretending it is done.
 *
 * The status becomes `snoozed` as well as the date being set, so a list can
 * show "3 snoozed" without re-deriving it from a timestamp comparison on every
 * render. When the date passes, `isDue` starts returning true again on its own —
 * nothing has to sweep the store and un-snooze anything.
 */
export function snoozeUntil(item: ScheduledItem, until: Date): ScheduledItem {
  return stamp(item, { status: "snoozed", snoozedUntil: until.toISOString() });
}

/** The offsets the snooze menu offers, in hours. */
export const SNOOZE_PRESETS = [3, 24, 24 * 3, 24 * 7] as const;

export function snoozeByHours(item: ScheduledItem, hours: number, now: Date = new Date()): ScheduledItem {
  return snoozeUntil(item, new Date(now.getTime() + hours * 60 * MS_PER_MINUTE));
}

export function setStatus(item: ScheduledItem, status: ScheduledStatus): ScheduledItem {
  return stamp(item, {
    status,
    snoozedUntil: status === "snoozed" ? item.snoozedUntil : undefined,
  });
}

/* -------------------------------------------------------------- selection -- */

/** Open items with a due date, soonest first; undated ones last. */
export function byDueDate(a: ScheduledItem, b: ScheduledItem): number {
  if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  return a.dueAt.localeCompare(b.dueAt);
}

export function dueItems(items: ScheduledItem[], now: Date = new Date()): ScheduledItem[] {
  return items.filter((item) => isDue(item, now)).sort(byDueDate);
}

/**
 * Items falling inside the next `days`, excluding what is already due.
 *
 * The exclusion is what stops the same vet appointment appearing under both
 * "today" and "this week" — the same no-duplication rule the overview follows.
 */
export function upcomingItems(
  items: ScheduledItem[],
  days: number,
  now: Date = new Date()
): ScheduledItem[] {
  return items
    .filter((item) => {
      if (!isOpen(item) || isDue(item, now)) return false;
      const until = daysUntilDue(item, now);
      return until !== undefined && until >= 0 && until <= days;
    })
    .sort(byDueDate);
}

export function snoozedItems(items: ScheduledItem[], now: Date = new Date()): ScheduledItem[] {
  return items.filter((item) => isOpen(item) && isSnoozed(item, now)).sort(byDueDate);
}

/**
 * The date a brand-new recurring item should start from.
 *
 * Used by the create form so "every two weeks" does not silently mean "every
 * two weeks starting whenever you happen to press save at 14:37".
 */
export function firstOccurrence(rule: RecurrenceRule, from: Date): string {
  const next = advance(rule, from);
  return (next ?? from).toISOString();
}
