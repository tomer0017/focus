import { describe, expect, it } from "vitest";
import { advance, nextOccurrenceAfter, occurrencesBetween, repeats } from "./recurrence";
import type { RecurrenceRule } from "../types/recurrence";

/** Local noon, so nothing in these tests depends on the machine's timezone. */
const at = (year: number, month: number, day: number, hour = 12): Date =>
  new Date(year, month - 1, day, hour, 0, 0, 0);

const iso = (date: Date): string => date.toISOString();

describe("repeats", () => {
  it("is false for the two rules that produce no further date", () => {
    expect(repeats(undefined)).toBe(false);
    expect(repeats({ kind: "once" })).toBe(false);
    // `custom` repeats in principle but the user names each date, so nothing
    // can be derived — treating it as repeating would invent one.
    expect(repeats({ kind: "custom" })).toBe(false);
  });

  it("is true for the four arithmetic rules", () => {
    for (const rule of [
      { kind: "daily" },
      { kind: "weekly" },
      { kind: "monthly" },
      { kind: "yearly" },
    ] as RecurrenceRule[]) {
      expect(repeats(rule)).toBe(true);
    }
  });
});

describe("advance", () => {
  it("adds whole days, respecting the interval", () => {
    expect(advance({ kind: "daily" }, at(2026, 3, 1))).toEqual(at(2026, 3, 2));
    expect(advance({ kind: "daily", interval: 10 }, at(2026, 3, 1))).toEqual(at(2026, 3, 11));
  });

  it("treats a zero or negative interval as one rather than looping", () => {
    expect(advance({ kind: "daily", interval: 0 }, at(2026, 3, 1))).toEqual(at(2026, 3, 2));
  });

  it("walks pinned weekdays within a week before applying the interval", () => {
    // Sunday 1 March 2026. Pinned to Sunday (0) and Wednesday (3).
    const sunday = at(2026, 3, 1);
    expect(sunday.getDay()).toBe(0);
    const wednesday = advance({ kind: "weekly", weekdays: [0, 3] }, sunday);
    expect(wednesday).toEqual(at(2026, 3, 4));
    // From Wednesday, the next pinned day is the following Sunday.
    expect(advance({ kind: "weekly", weekdays: [0, 3] }, wednesday!)).toEqual(at(2026, 3, 8));
  });

  it("uses the anchor's own weekday when none is pinned", () => {
    expect(advance({ kind: "weekly" }, at(2026, 3, 1))).toEqual(at(2026, 3, 8));
    expect(advance({ kind: "weekly", interval: 2 }, at(2026, 3, 1))).toEqual(at(2026, 3, 15));
  });

  it("clamps a month-end day instead of overflowing into the next month", () => {
    // 31 January + 1 month must be 28 February, not 3 March. `setMonth` alone
    // overflows, and a bank charge that jumps a month is a real bug.
    expect(advance({ kind: "monthly" }, at(2026, 1, 31))).toEqual(at(2026, 2, 28));
    // The clamp is per-step and does not permanently lose the 31st: the anchor
    // is what each subsequent call is given, so this documents one step only.
    expect(advance({ kind: "monthly" }, at(2026, 3, 31))).toEqual(at(2026, 4, 30));
  });

  it("clamps 29 February to the 28th in a common year", () => {
    expect(advance({ kind: "yearly" }, at(2024, 2, 29))).toEqual(at(2025, 2, 28));
  });

  it("returns nothing for rules that do not repeat", () => {
    expect(advance({ kind: "once" }, at(2026, 3, 1))).toBeUndefined();
    expect(advance({ kind: "custom" }, at(2026, 3, 1))).toBeUndefined();
  });
});

describe("nextOccurrenceAfter", () => {
  it("counts from the anchor, not from today", () => {
    // A monthly charge anchored on the 4th, asked about on the 9th, must land
    // on the 4th of next month — never on the 9th.
    const next = nextOccurrenceAfter({ kind: "monthly" }, iso(at(2026, 1, 4)), at(2026, 1, 9));
    expect(new Date(next!).getDate()).toBe(4);
    expect(new Date(next!).getMonth()).toBe(1);
  });

  it("skips as many periods as it needs after a long absence", () => {
    // Nine months untouched: the answer is the next one *after now*, not the
    // next one after the anchor.
    const next = nextOccurrenceAfter({ kind: "monthly" }, iso(at(2026, 1, 4)), at(2026, 10, 20));
    expect(new Date(next!).getMonth()).toBe(10);
    expect(new Date(next!).getDate()).toBe(4);
  });

  it("returns undefined for a non-repeating rule", () => {
    expect(nextOccurrenceAfter({ kind: "once" }, iso(at(2026, 1, 4)), at(2026, 1, 9))).toBeUndefined();
    expect(nextOccurrenceAfter(undefined, iso(at(2026, 1, 4)), at(2026, 1, 9))).toBeUndefined();
    expect(
      nextOccurrenceAfter({ kind: "custom" }, iso(at(2026, 1, 4)), at(2026, 1, 9))
    ).toBeUndefined();
  });

  it("returns undefined for a malformed anchor rather than an invalid date", () => {
    expect(nextOccurrenceAfter({ kind: "daily" }, "not-a-date", at(2026, 1, 9))).toBeUndefined();
  });

  it("always moves strictly forward", () => {
    const anchor = iso(at(2026, 5, 10));
    const next = nextOccurrenceAfter({ kind: "yearly" }, anchor, at(2026, 5, 10, 18));
    expect(new Date(next!).getTime()).toBeGreaterThan(at(2026, 5, 10, 18).getTime());
  });
});

describe("occurrencesBetween", () => {
  it("lists the dates inside a window", () => {
    const found = occurrencesBetween(
      { kind: "weekly" },
      iso(at(2026, 3, 1)),
      at(2026, 3, 1),
      at(2026, 3, 29)
    );
    expect(found).toHaveLength(5);
  });

  it("treats a one-off as a single date, inside the window or not at all", () => {
    const anchor = iso(at(2026, 3, 10));
    expect(occurrencesBetween({ kind: "once" }, anchor, at(2026, 3, 1), at(2026, 3, 31))).toHaveLength(1);
    expect(occurrencesBetween({ kind: "once" }, anchor, at(2026, 4, 1), at(2026, 4, 30))).toHaveLength(0);
  });

  it("honours the limit so a daily rule cannot flood a caller", () => {
    const found = occurrencesBetween(
      { kind: "daily" },
      iso(at(2026, 1, 1)),
      at(2026, 1, 1),
      at(2026, 12, 31),
      12
    );
    expect(found).toHaveLength(12);
  });
});
