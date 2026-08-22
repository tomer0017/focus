import type { EntityReference } from "./reference";

/**
 * A line the user jotted down, with a time on it.
 *
 * The whole point is the number of taps. "He had 120ml at 14:20" is not a form
 * with nine fields, and a parent holding a baby is not going to fill one in.
 * One model covers feeds, first tastes, visits, treatments and payments,
 * because all of them are the same shape: when, what, how much, and a line of
 * the user's own words.
 *
 * Focus records; it never interprets. There is no expected volume, no
 * "reaction" taxonomy, no derived advice. A tasting note says what the parent
 * observed, and the app repeats it back and stops there.
 */
export type QuickLogKind =
  | "feeding"
  | "tasting"
  | "visit"
  | "call"
  | "treatment"
  | "payment"
  | "measure"
  | "dose"
  | "other";

export interface QuickLogEntry {
  id: string;
  kind: QuickLogKind;
  /** ISO 8601 — a log entry is a moment, unlike a routine completion. */
  occurredAt: string;
  /** User content: the food, the person, what was done. */
  title?: string;
  /** How much. A number when it is one, otherwise the user's own words. */
  value?: string | number;
  /** User content: "ml", "g", "minutes". Never converted. */
  unit?: string;
  /**
   * A short label for the kind of entry — breast, bottle, solids; first try or
   * a repeat. User content or a translation key resolved at render.
   */
  variant?: string;
  /** User content. */
  note?: string;
  /** True the first time this thing was tried. The parent's own answer. */
  firstTime?: boolean;
  /** Flagged by the user as worth coming back to. Never inferred. */
  followUp?: boolean;
  /** ISO date the user wants to try again. */
  followUpAt?: string;
  relatedEntity?: EntityReference;
}
