import { describe, expect, it } from "vitest";
import {
  advanceCharge,
  commitmentTotals,
  entriesInMonth,
  monthlyAmount,
  summariseMonth,
  unpaidEntries,
  upcomingCharges,
  yearlyAmount,
} from "./money";
import type { Commitment, MoneyEntry } from "../types/finance";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const inDays = (days: number): string => new Date(2026, 2, 10 + days, 9, 0, 0).toISOString();

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: "c1",
    kind: "subscription",
    title: "Streaming",
    cycle: "monthly",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function entry(overrides: Partial<MoneyEntry> = {}): MoneyEntry {
  return {
    id: "m1",
    direction: "expense",
    amount: 100,
    occurredOn: "2026-03-05",
    recurring: false,
    paid: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("cycle arithmetic", () => {
  it("spreads a yearly cost across twelve months", () => {
    expect(monthlyAmount(1200, "yearly")).toBe(100);
    expect(monthlyAmount(300, "quarterly")).toBe(100);
    expect(monthlyAmount(100, "monthly")).toBe(100);
  });

  it("treats a one-off as no running cost at all", () => {
    // Otherwise the monthly figure would jump every time a single payment is
    // recorded, which is exactly the wrong behaviour for "what do I pay out".
    expect(monthlyAmount(500, "oneOff")).toBe(0);
    expect(yearlyAmount(500, "oneOff")).toBe(500);
  });

  it("treats a missing amount as zero rather than NaN", () => {
    expect(monthlyAmount(undefined, "monthly")).toBe(0);
    expect(yearlyAmount(Number.NaN, "yearly")).toBe(0);
  });
});

describe("commitmentTotals", () => {
  it("counts active commitments only", () => {
    const totals = commitmentTotals([
      commitment({ id: "a", amount: 55, cycle: "monthly" }),
      commitment({ id: "b", amount: 1200, cycle: "yearly" }),
      commitment({ id: "c", amount: 999, cycle: "monthly", status: "cancelled" }),
    ]);
    expect(totals.activeCount).toBe(2);
    expect(totals.monthly).toBe(155);
    expect(totals.yearly).toBe(1860);
  });
});

describe("summariseMonth", () => {
  const entries = [
    entry({ id: "in", direction: "income", amount: 1000, paid: true }),
    entry({ id: "out", direction: "expense", amount: 400, paid: true }),
    entry({ id: "owed", direction: "expense", amount: 250, paid: false }),
    entry({ id: "other-month", occurredOn: "2026-04-01", amount: 9999 }),
  ];

  it("adds up one month and ignores the others", () => {
    const summary = summariseMonth(entries, "2026-03");
    expect(summary.income).toBe(1000);
    expect(summary.expenses).toBe(650);
    expect(summary.balance).toBe(350);
  });

  it("counts only unpaid expenses as unpaid", () => {
    const summary = summariseMonth(
      [...entries, entry({ id: "owed-to-me", direction: "income", amount: 500, paid: false })],
      "2026-03"
    );
    // Money somebody owes you is a different worry and not this number.
    expect(summary.unpaid).toBe(250);
  });

  it("reports a negative balance as a negative number", () => {
    const summary = summariseMonth([entry({ amount: 900 })], "2026-03");
    expect(summary.balance).toBe(-900);
  });
});

describe("listing", () => {
  it("lists a month newest first", () => {
    const rows = entriesInMonth(
      [entry({ id: "a", occurredOn: "2026-03-01" }), entry({ id: "b", occurredOn: "2026-03-20" })],
      "2026-03"
    );
    expect(rows.map((row) => row.id)).toEqual(["b", "a"]);
  });

  it("lists unpaid oldest first — the oldest is the one most likely forgotten", () => {
    const rows = unpaidEntries([
      entry({ id: "new", occurredOn: "2026-03-20", paid: false }),
      entry({ id: "old", occurredOn: "2026-01-02", paid: false }),
      entry({ id: "settled", occurredOn: "2026-01-01", paid: true }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(["old", "new"]);
  });
});

describe("upcomingCharges", () => {
  it("honours each commitment's own warning window", () => {
    const charges = upcomingCharges(
      [
        commitment({ id: "soon", nextChargeAt: inDays(4), remindDaysBefore: 5 }),
        commitment({ id: "quiet", nextChargeAt: inDays(20), remindDaysBefore: 5 }),
      ],
      NOW,
      30
    );
    expect(charges.map((charge) => charge.commitment.id)).toEqual(["soon"]);
  });

  it("does not list a charge and a renewal twice when they fall on the same day", () => {
    const same = inDays(3);
    const charges = upcomingCharges(
      [commitment({ nextChargeAt: same, renewalAt: same, remindDaysBefore: 30 })],
      NOW,
      30
    );
    expect(charges).toHaveLength(1);
  });

  it("lists a renewal separately when it is a different date", () => {
    const charges = upcomingCharges(
      [commitment({ nextChargeAt: inDays(3), renewalAt: inDays(9), remindDaysBefore: 30 })],
      NOW,
      30
    );
    expect(charges).toHaveLength(2);
    expect(charges.filter((charge) => charge.isRenewal)).toHaveLength(1);
  });

  it("skips a date that has already passed", () => {
    expect(upcomingCharges([commitment({ nextChargeAt: inDays(-2) })], NOW, 30)).toHaveLength(0);
  });

  it("sorts soonest first", () => {
    const charges = upcomingCharges(
      [
        commitment({ id: "later", nextChargeAt: inDays(8), remindDaysBefore: 30 }),
        commitment({ id: "sooner", nextChargeAt: inDays(2), remindDaysBefore: 30 }),
      ],
      NOW,
      30
    );
    expect(charges.map((charge) => charge.commitment.id)).toEqual(["sooner", "later"]);
  });
});

describe("advanceCharge", () => {
  it("keeps the day of the month, counting from the stored date", () => {
    const next = advanceCharge(new Date(2026, 0, 4, 9).toISOString(), "monthly");
    expect(new Date(next!).getDate()).toBe(4);
    expect(new Date(next!).getMonth()).toBe(1);
  });

  it("clamps a 31st into a short month rather than overflowing", () => {
    const next = advanceCharge(new Date(2026, 0, 31, 9).toISOString(), "monthly");
    expect(new Date(next!).getMonth()).toBe(1);
    expect(new Date(next!).getDate()).toBe(28);
  });

  it("has no next date for a one-off", () => {
    expect(advanceCharge(new Date(2026, 0, 4).toISOString(), "oneOff")).toBeUndefined();
  });
});
