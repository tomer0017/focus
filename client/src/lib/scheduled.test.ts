import { describe, expect, it } from "vitest";
import {
  completeOccurrence,
  dueItems,
  firstReminderAt,
  isDue,
  isOverdue,
  isSnoozed,
  snoozeByHours,
  upcomingItems,
} from "./scheduled";
import type { ScheduledItem } from "../types/scheduled";

const NOW = new Date(2026, 2, 10, 12, 0, 0);

function item(overrides: Partial<ScheduledItem> = {}): ScheduledItem {
  return {
    id: "s1",
    title: "Call the garage",
    category: "reminder",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const at = (day: number, hour = 12): string =>
  new Date(2026, 2, day, hour, 0, 0).toISOString();

describe("firstReminderAt", () => {
  it("is the due date itself when no offset was set", () => {
    expect(firstReminderAt(item({ dueAt: at(12) }))).toBe(at(12));
  });

  it("uses the widest offset, because asking early is the point", () => {
    const from = firstReminderAt(
      item({ dueAt: at(12), reminderOffsets: [60, 24 * 60, 7 * 24 * 60] })
    );
    // Seven days before the 12th is the 5th.
    expect(new Date(from!).getDate()).toBe(5);
  });

  it("is undefined for an item with no date to be late for", () => {
    expect(firstReminderAt(item())).toBeUndefined();
  });
});

describe("isDue", () => {
  it("is false before the reminder window opens", () => {
    expect(isDue(item({ dueAt: at(20), reminderOffsets: [24 * 60] }), NOW)).toBe(false);
  });

  it("is true once the window has opened, even though the date has not arrived", () => {
    // Due the 12th, asking from five days before: today is the 10th.
    expect(isDue(item({ dueAt: at(12), reminderOffsets: [5 * 24 * 60] }), NOW)).toBe(true);
  });

  it("stays true after the date has passed", () => {
    // A renewal nobody did does not stop mattering on the renewal date.
    expect(isDue(item({ dueAt: at(1) }), NOW)).toBe(true);
    expect(isOverdue(item({ dueAt: at(1) }), NOW)).toBe(true);
  });

  it("is false while snoozed and true again once the snooze expires", () => {
    const snoozed = item({ dueAt: at(1), snoozedUntil: at(11), status: "snoozed" });
    expect(isSnoozed(snoozed, NOW)).toBe(true);
    expect(isDue(snoozed, NOW)).toBe(false);

    const later = new Date(2026, 2, 12, 12, 0, 0);
    expect(isSnoozed(snoozed, later)).toBe(false);
    expect(isDue(snoozed, later)).toBe(true);
  });

  it("is false for anything already completed or cancelled", () => {
    expect(isDue(item({ dueAt: at(1), status: "completed" }), NOW)).toBe(false);
    expect(isDue(item({ dueAt: at(1), status: "cancelled" }), NOW)).toBe(false);
  });
});

describe("snoozeByHours", () => {
  it("sets both the status and the date, and clears neither the due date nor the item", () => {
    const snoozed = snoozeByHours(item({ dueAt: at(1) }), 24, NOW);
    expect(snoozed.status).toBe("snoozed");
    expect(new Date(snoozed.snoozedUntil!).getDate()).toBe(11);
    // Still owed: snoozing is not completing.
    expect(snoozed.dueAt).toBe(at(1));
    expect(snoozed.lastCompletedAt).toBeUndefined();
  });
});

describe("completeOccurrence", () => {
  it("completes a one-off", () => {
    const done = completeOccurrence(item({ dueAt: at(1) }), NOW);
    expect(done.status).toBe("completed");
    expect(done.completionCount).toBe(1);
    expect(done.lastCompletedAt).toBeTruthy();
  });

  it("advances a recurring item instead of completing it", () => {
    const monthly = item({ dueAt: at(1), recurrence: { kind: "monthly" } });
    const next = completeOccurrence(monthly, NOW);

    expect(next.status).toBe("active");
    // Advanced from the stored date, so the 1st stays the 1st.
    expect(new Date(next.dueAt!).getDate()).toBe(1);
    expect(new Date(next.dueAt!).getMonth()).toBe(3);
    expect(next.completionCount).toBe(1);
  });

  it("clears a snooze when an occurrence is completed", () => {
    const snoozed = item({
      dueAt: at(1),
      recurrence: { kind: "weekly" },
      status: "snoozed",
      snoozedUntil: at(20),
    });
    const next = completeOccurrence(snoozed, NOW);
    expect(next.snoozedUntil).toBeUndefined();
    expect(next.status).toBe("active");
  });

  it("completes a `custom` recurrence rather than inventing the next date", () => {
    // The user said they would choose each date themselves; making one up is
    // the opposite of what they asked for.
    const next = completeOccurrence(item({ dueAt: at(1), recurrence: { kind: "custom" } }), NOW);
    expect(next.status).toBe("completed");
  });

  it("counts completions across repeats", () => {
    let current = item({ dueAt: at(1), recurrence: { kind: "daily" }, completionCount: 4 });
    current = completeOccurrence(current, NOW);
    current = completeOccurrence(current, NOW);
    expect(current.completionCount).toBe(6);
  });
});

describe("selection", () => {
  const items = [
    item({ id: "overdue", dueAt: at(1) }),
    item({ id: "soon", dueAt: at(13) }),
    item({ id: "far", dueAt: at(28) }),
    item({ id: "snoozed", dueAt: at(2), status: "snoozed", snoozedUntil: at(15) }),
    item({ id: "done", dueAt: at(2), status: "completed" }),
  ];

  it("dueItems returns only what is asking now, soonest first", () => {
    expect(dueItems(items, NOW).map((entry) => entry.id)).toEqual(["overdue"]);
  });

  it("upcomingItems excludes what is already due, so nothing appears twice", () => {
    const soon = upcomingItems(items, 7, NOW).map((entry) => entry.id);
    expect(soon).toContain("soon");
    expect(soon).not.toContain("overdue");
    expect(soon).not.toContain("far");
  });
});
