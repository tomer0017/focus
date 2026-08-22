import type { EntityReference } from "./reference";

/**
 * Money, at the level a person actually needs and no further.
 *
 * Focus is not an accounting package. There is no bank connection, no budget
 * engine, no invoices, no tax, no forecasting. What a personal operating system
 * owes you is smaller and more useful: what leaves your account every month,
 * what is about to leave it, and whether you have paid the thing you meant to.
 */

/**
 * An insurance policy and a streaming subscription are the same record.
 *
 * Both are "a company takes this much, this often, until I stop it, and there
 * is a date I should look at before it renews". The only differences are which
 * fields get filled in, so they share a model and differ by `kind`.
 */
export type CommitmentKind = "insurance" | "subscription";

export type BillingCycle = "monthly" | "quarterly" | "yearly" | "oneOff";

export interface Commitment {
  id: string;
  kind: CommitmentKind;
  /** User content: "car insurance", "Netflix". */
  title: string;
  /** The company. User content. */
  provider?: string;
  /** What sort of policy or service. User content, never a fixed list. */
  category?: string;
  amount?: number;
  /** ISO 4217, defaulting to the app's display currency. */
  currency?: string;
  cycle: BillingCycle;
  /** ISO date of the next charge. */
  nextChargeAt?: string;
  /** ISO date the policy renews or the commitment period ends. */
  renewalAt?: string;
  /** ISO date it stops entirely. */
  endsAt?: string;
  /** An agent, an account manager, a phone number. User content. */
  contact?: string;
  /**
   * How it is paid, in the user's own words — "the joint card", "direct debit".
   *
   * Never card numbers. There is no server, no encryption and no reason: a full
   * card number in `localStorage` is a liability with no upside, and the field
   * exists to jog a memory, not to make a payment.
   */
  paymentMethod?: string;
  /** Where to manage or cancel it. A real destination, or absent. */
  manageUrl?: string;
  /** Policy documents and screenshots. References, never copies. */
  savedItemIds?: string[];
  /** How many days before a charge or renewal to start asking. */
  remindDaysBefore?: number;
  status: "active" | "cancelled";
  note?: string;
  relatedEntity?: EntityReference;
  createdAt: string;
  updatedAt: string;
}

export type CommitmentDraft = Omit<Commitment, "id" | "createdAt" | "updatedAt">;

/* ----------------------------------------------------------------- money -- */

export type MoneyDirection = "income" | "expense";

/**
 * One line in or out.
 *
 * `paid` is separate from the date on purpose: "the invoice is dated the 1st"
 * and "I have actually paid it" are different facts, and an app that conflates
 * them will tell you a bill is settled because the date went past.
 */
export interface MoneyEntry {
  id: string;
  direction: MoneyDirection;
  amount: number;
  currency?: string;
  /** User content. Free text, because everyone's categories are their own. */
  category?: string;
  /** Local calendar date, `YYYY-MM-DD`. */
  occurredOn: string;
  /** True for something that comes round every month rather than once. */
  recurring: boolean;
  note?: string;
  paid: boolean;
  relatedEntity?: EntityReference;
  createdAt: string;
  updatedAt: string;
}

export type MoneyEntryDraft = Omit<MoneyEntry, "id" | "createdAt" | "updatedAt">;

/** The month summary the manage screen prints. Three numbers, no chart. */
export interface MonthSummary {
  /** `YYYY-MM`. */
  month: string;
  income: number;
  expenses: number;
  /** Income minus expenses. Negative is a real and useful answer. */
  balance: number;
  /** Expenses not yet marked paid. */
  unpaid: number;
}
