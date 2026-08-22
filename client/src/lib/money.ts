/**
 * Sums, and nothing that resembles accounting.
 *
 * Three numbers are worth showing — what came in, what went out, and what is
 * still unpaid — plus a list of charges about to land. Anything past that is a
 * chart nobody reads, and a chart nobody reads is worse than a number they do.
 */
import { addDaysToKey, todayKey } from "./dateKey";
import { daysUntil } from "./format";
import type { BillingCycle, Commitment, MoneyEntry, MonthSummary } from "../types/finance";

/** The one display currency for now. Multi-currency is not a local-first problem. */
export const DEFAULT_CURRENCY = "ILS";

/**
 * A cycle expressed as a monthly figure.
 *
 * A yearly policy is a twelfth of itself each month for the purposes of "what
 * do my commitments cost me", which is the only question this answers. A
 * one-off is zero: it is not a running cost, and folding it in would make the
 * monthly figure jump every time somebody records a single payment.
 */
export function monthlyAmount(amount: number | undefined, cycle: BillingCycle): number {
  if (!amount || !Number.isFinite(amount)) return 0;
  switch (cycle) {
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    case "oneOff":
      return 0;
  }
}

export function yearlyAmount(amount: number | undefined, cycle: BillingCycle): number {
  if (!amount || !Number.isFinite(amount)) return 0;
  return cycle === "oneOff" ? amount : monthlyAmount(amount, cycle) * 12;
}

export interface CommitmentTotals {
  monthly: number;
  yearly: number;
  activeCount: number;
}

/** Cancelled commitments are excluded: they cost nothing and would inflate both. */
export function commitmentTotals(commitments: Commitment[]): CommitmentTotals {
  const active = commitments.filter((entry) => entry.status === "active");
  return {
    monthly: active.reduce((sum, entry) => sum + monthlyAmount(entry.amount, entry.cycle), 0),
    yearly: active.reduce((sum, entry) => sum + yearlyAmount(entry.amount, entry.cycle), 0),
    activeCount: active.length,
  };
}

/** `YYYY-MM` for a date. */
export function monthKey(date: Date = new Date()): string {
  return todayKey(date).slice(0, 7);
}

/**
 * Income, expenses, balance and what is still unpaid, for one month.
 *
 * `unpaid` counts expenses only. An unpaid income line is money somebody owes
 * you, which is a different worry and does not belong in the same number.
 */
export function summariseMonth(entries: MoneyEntry[], month: string): MonthSummary {
  const inMonth = entries.filter((entry) => entry.occurredOn.startsWith(month));

  const income = inMonth
    .filter((entry) => entry.direction === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = inMonth
    .filter((entry) => entry.direction === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const unpaid = inMonth
    .filter((entry) => entry.direction === "expense" && !entry.paid)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return { month, income, expenses, balance: income - expenses, unpaid };
}

/** Entries in one month, newest first. */
export function entriesInMonth(entries: MoneyEntry[], month: string): MoneyEntry[] {
  return entries
    .filter((entry) => entry.occurredOn.startsWith(month))
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
}

/** Unpaid expenses, oldest first — the oldest is the one most likely forgotten. */
export function unpaidEntries(entries: MoneyEntry[]): MoneyEntry[] {
  return entries
    .filter((entry) => entry.direction === "expense" && !entry.paid)
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
}

/** A commitment about to be charged, with how far off it is. */
export interface UpcomingCharge {
  commitment: Commitment;
  /** ISO date of the charge or renewal. */
  at: string;
  daysAway: number;
  /** True when this is the renewal date rather than a charge. */
  isRenewal: boolean;
}

/**
 * Charges and renewals inside a window.
 *
 * The window per commitment is the user's own `remindDaysBefore` when they set
 * one, capped by the caller's horizon. Somebody who wants a month's warning
 * before a yearly policy renews gets a month; somebody who set nothing gets the
 * default, and neither gets an insurance renewal in August on a screen about
 * this week.
 */
export function upcomingCharges(
  commitments: Commitment[],
  now: Date = new Date(),
  horizonDays = 30
): UpcomingCharge[] {
  const charges: UpcomingCharge[] = [];

  for (const commitment of commitments) {
    if (commitment.status !== "active") continue;
    const window = Math.min(commitment.remindDaysBefore ?? horizonDays, horizonDays);

    const consider = (at: string | undefined, isRenewal: boolean): void => {
      if (!at) return;
      const daysAway = daysUntil(at, now);
      if (daysAway < 0 || daysAway > window) return;
      charges.push({ commitment, at, daysAway, isRenewal });
    };

    consider(commitment.nextChargeAt, false);
    // Only when it is a different date — a policy that renews on the day it is
    // charged is one event, not two.
    if (commitment.renewalAt !== commitment.nextChargeAt) {
      consider(commitment.renewalAt, true);
    }
  }

  return charges.sort((a, b) => a.daysAway - b.daysAway);
}

/**
 * The next charge date after one has been paid.
 *
 * Advances from the *stored* date rather than from today, so a monthly charge
 * on the 4th stays on the 4th even when it is marked paid on the 9th.
 */
export function advanceCharge(at: string, cycle: BillingCycle): string | undefined {
  if (cycle === "oneOff") return undefined;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return undefined;

  const months = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : 12;
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date.toISOString();
}

/** A `YYYY-MM-DD` key `days` from today, for date-input defaults. */
export function dateKeyIn(days: number, now: Date = new Date()): string {
  return addDaysToKey(todayKey(now), days);
}
