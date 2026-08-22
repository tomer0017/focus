import { describe, expect, it } from "vitest";
import { doseKey, dosesForDay, dosesOn, isActiveOn, needsRefill, toggleDose } from "./medications";
import type { Medication } from "../types/health";

function medication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    name: "The evening one",
    form: "medication",
    times: ["08:00", "20:00"],
    taken: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// 2026-03-10 is a Tuesday (weekday 2).
const TUESDAY = "2026-03-10";

describe("isActiveOn", () => {
  it("treats no weekdays as every day", () => {
    // The common case must not cost seven clicks, so empty means daily —
    // and an absent array means the same thing.
    expect(isActiveOn(medication({ weekdays: [] }), TUESDAY)).toBe(true);
    expect(isActiveOn(medication(), TUESDAY)).toBe(true);
  });

  it("honours pinned weekdays", () => {
    expect(isActiveOn(medication({ weekdays: [2] }), TUESDAY)).toBe(true);
    expect(isActiveOn(medication({ weekdays: [0, 3] }), TUESDAY)).toBe(false);
  });

  it("respects a start and an end date", () => {
    expect(isActiveOn(medication({ startsOn: "2026-03-11" }), TUESDAY)).toBe(false);
    expect(isActiveOn(medication({ endsOn: "2026-03-09" }), TUESDAY)).toBe(false);
    expect(isActiveOn(medication({ startsOn: "2026-03-01", endsOn: "2026-03-31" }), TUESDAY)).toBe(true);
  });

  it("is false once stopped", () => {
    expect(isActiveOn(medication({ status: "stopped" }), TUESDAY)).toBe(false);
  });
});

describe("dosesOn", () => {
  it("returns one dose per time, in order, keyed by day and slot", () => {
    const doses = dosesOn(medication({ times: ["20:00", "08:00"] }), TUESDAY);
    expect(doses.map((dose) => dose.time)).toEqual(["08:00", "20:00"]);
    expect(doses[0].key).toBe(doseKey(TUESDAY, "08:00"));
  });

  it("marks a dose taken from the stored key, not from a timestamp", () => {
    const med = medication({ taken: [doseKey(TUESDAY, "08:00")] });
    const doses = dosesOn(med, TUESDAY);
    expect(doses[0].taken).toBe(true);
    expect(doses[1].taken).toBe(false);
  });

  it("returns nothing on a day the medication is not active", () => {
    expect(dosesOn(medication({ weekdays: [0] }), TUESDAY)).toEqual([]);
  });
});

describe("dosesForDay", () => {
  it("merges every medication and sorts by time", () => {
    const doses = dosesForDay(
      [
        medication({ id: "a", name: "B vitamin", times: ["09:00"] }),
        medication({ id: "b", name: "A tablet", times: ["07:00", "09:00"] }),
      ],
      TUESDAY
    );
    expect(doses.map((dose) => `${dose.time} ${dose.name}`)).toEqual([
      "07:00 A tablet",
      "09:00 A tablet",
      "09:00 B vitamin",
    ]);
  });
});

describe("toggleDose", () => {
  it("adds then removes the key, and never touches anything else", () => {
    const key = doseKey(TUESDAY, "08:00");
    const med = medication();

    const ticked = toggleDose(med, key);
    expect(ticked.taken).toEqual([key]);
    // Nothing is decremented: Focus has no idea how many are in the box.
    expect(ticked.stockCount).toBeUndefined();

    const unticked = toggleDose(ticked, key);
    expect(unticked.taken).toEqual([]);
  });
});

describe("needsRefill", () => {
  const NOW = new Date(2026, 2, 10, 12, 0, 0);

  it("only fires on a date the user chose", () => {
    expect(needsRefill(medication(), NOW)).toBe(false);
    expect(
      needsRefill(medication({ refillRemindAt: new Date(2026, 2, 9).toISOString() }), NOW)
    ).toBe(true);
    expect(
      needsRefill(medication({ refillRemindAt: new Date(2026, 2, 20).toISOString() }), NOW)
    ).toBe(false);
  });

  it("stays quiet once the medication is stopped", () => {
    expect(
      needsRefill(
        medication({ status: "stopped", refillRemindAt: new Date(2026, 2, 9).toISOString() }),
        NOW
      )
    ).toBe(false);
  });
});
