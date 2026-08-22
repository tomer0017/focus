import type { EntityReference } from "./reference";

/**
 * A medication or a vitamin the user typed in.
 *
 * The boundary matters more than the fields. Focus stores what somebody was
 * told by a professional and reminds them about it. It does **not** suggest a
 * dose, flag an interaction, warn about a missed one, or imply that anything
 * here is medical advice. Every value in this model is the user's own text,
 * repeated back unchanged, and the screens that render it say so.
 */
export type MedicationForm = "medication" | "vitamin" | "supplement";

export interface Medication {
  id: string;
  /** User content. */
  name: string;
  form: MedicationForm;
  /**
   * The dose, exactly as the user wrote it: "half a tablet", "5ml", "one
   * capsule". Free text on purpose — parsing it would be the first step towards
   * calculating with it, which this app must never do.
   */
  dosage?: string;
  /**
   * Days of the week, 0 = Sunday. Empty or absent means every day, which is by
   * far the common case and should not need clicking seven boxes.
   */
  weekdays?: number[];
  /** Times of day, `HH:MM`, in the user's own timezone. */
  times: string[];
  /** "with food", "on an empty stomach" — the user's words. */
  withFood?: string;
  /** Local calendar dates, `YYYY-MM-DD`. */
  startsOn?: string;
  endsOn?: string;
  /** How many are left, when the user chose to track it. */
  stockCount?: number;
  /** ISO date to be reminded to get more. */
  refillRemindAt?: string;
  note?: string;
  /** Whose it is — a family profile, usually. */
  relatedEntity?: EntityReference;
  /**
   * Doses marked taken, as `YYYY-MM-DD@HH:MM` keys.
   *
   * A day plus a scheduled time, never a timestamp: the fact recorded is "the
   * 8am one is done", and storing the moment the button was pressed would
   * invent a precision that then has to be explained.
   */
  taken: string[];
  status: "active" | "stopped";
  createdAt: string;
  updatedAt: string;
}

export type MedicationDraft = Omit<Medication, "id" | "createdAt" | "updatedAt" | "taken">;

/** One scheduled dose on one day, as the "today" list renders it. */
export interface MedicationDose {
  medicationId: string;
  name: string;
  dosage?: string;
  withFood?: string;
  /** `HH:MM`. */
  time: string;
  /** `YYYY-MM-DD@HH:MM`. */
  key: string;
  taken: boolean;
}
