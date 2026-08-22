import { describe, expect, it } from "vitest";
import { dueReminders, isPreparing, needsAttention, reminderTime, urgencyOf } from "./eventTiming";
import type { FocusEvent } from "../types/event";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const inDays = (days: number, hour = 18): string =>
  new Date(2026, 2, 10 + days, hour, 0, 0).toISOString();

function event(overrides: Partial<FocusEvent> = {}): FocusEvent {
  return {
    id: "e1",
    kind: "custom",
    title: "Something",
    startsAt: inDays(30),
    spaceId: "personal",
    sections: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("urgencyOf", () => {
  it("stays neutral for a distant event that declared no preparation", () => {
    // The rule this module exists for: a flight in two months needs nothing yet.
    expect(urgencyOf(event({ startsAt: inDays(60) }), NOW)).toBe("neutral");
  });

  it("enters the preparation window the user asked for", () => {
    // Same sixty days, but the owner said preparation takes ninety.
    expect(urgencyOf(event({ startsAt: inDays(60), prepDaysBefore: 90 }), NOW)).toBe("preparing");
  });

  it("keeps a low-importance event quiet even inside its window", () => {
    expect(
      urgencyOf(event({ startsAt: inDays(60), prepDaysBefore: 90, importance: "low" }), NOW)
    ).toBe("neutral");
  });

  it("is `soon` under a week and `critical` today or tomorrow", () => {
    expect(urgencyOf(event({ startsAt: inDays(4) }), NOW)).toBe("soon");
    expect(urgencyOf(event({ startsAt: inDays(1) }), NOW)).toBe("critical");
    expect(urgencyOf(event({ startsAt: inDays(0) }), NOW)).toBe("critical");
  });

  it("is `done` once it has happened, whatever is unticked", () => {
    expect(urgencyOf(event({ startsAt: inDays(-1) }), NOW)).toBe("done");
  });

  it("is `done` when every task is ticked, however close it is", () => {
    const prepared = event({
      startsAt: inDays(1),
      sections: [
        {
          id: "s",
          kind: "tasks",
          order: 0,
          items: [
            { id: "a", title: "Book", done: true },
            { id: "b", title: "Cake", done: true },
          ],
        },
      ],
    });
    expect(urgencyOf(prepared, NOW)).toBe("done");
  });

  it("an overdue reminder makes it critical regardless of distance", () => {
    const nagging = event({
      startsAt: inDays(40),
      reminders: [{ id: "r", at: inDays(-1) }],
    });
    expect(urgencyOf(nagging, NOW)).toBe("critical");
  });
});

describe("dueReminders", () => {
  const base = event({ startsAt: inDays(2) });

  it("resolves a relative reminder against the event's own date", () => {
    const when = reminderTime(base, { id: "r", hoursBefore: 24 });
    expect(new Date(when).getDate()).toBe(11);
  });

  it("returns the ones that have come due", () => {
    const due = dueReminders(
      event({ startsAt: inDays(2), reminders: [{ id: "r", hoursBefore: 24 * 7 }] }),
      NOW
    );
    expect(due).toHaveLength(1);
  });

  it("ignores handled and snoozed reminders", () => {
    const quiet = event({
      startsAt: inDays(2),
      reminders: [
        { id: "handled", hoursBefore: 24 * 7, handled: true },
        { id: "snoozed", hoursBefore: 24 * 7, snoozedUntil: inDays(1) },
      ],
    });
    expect(dueReminders(quiet, NOW)).toHaveLength(0);
  });
});

describe("needsAttention", () => {
  it("orders by loudness and drops the ones that are not asking", () => {
    const ordered = needsAttention(
      [
        event({ id: "far", startsAt: inDays(60) }),
        event({ id: "soon", startsAt: inDays(3) }),
        event({ id: "critical", startsAt: inDays(1) }),
        event({ id: "preparing", startsAt: inDays(40), prepDaysBefore: 60 }),
      ],
      NOW
    );
    expect(ordered.map((entry) => entry.id)).toEqual(["critical", "soon", "preparing"]);
  });
});

describe("isPreparing", () => {
  it("is true only inside a window the user declared", () => {
    expect(isPreparing(event({ startsAt: inDays(40), prepDaysBefore: 60 }), NOW)).toBe(true);
    expect(isPreparing(event({ startsAt: inDays(40) }), NOW)).toBe(false);
  });
});
