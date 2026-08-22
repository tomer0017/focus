import type { EntityReference } from "./reference";
import type { RecurrenceRule } from "./recurrence";
import type { SpaceId } from "./space";

/**
 * One dated thing that wants doing.
 *
 * This is the shared primitive the whole "ongoing management" half of Focus is
 * built from: a vet visit, a phone call to a grandparent, an annual renewal, a
 * follow-up blood test, a bill that has not been marked paid. Building an
 * `Appointment`, a `ContactReminder`, a `Renewal` and a `Bill` would have been
 * four models with the same five fields and four separate ideas of what
 * "snoozed" means.
 *
 * It is **not** a god object. Everything a particular category needs beyond the
 * common shape sits in an optional named block (`appointment`, `money`), so the
 * type stays readable and a reminder stays four fields long.
 *
 * Where an existing model already fits, it wins: recurring *activity with a
 * history* is a `Routine`, and a dated *occasion with sections* is a
 * `FocusEvent`. A `ScheduledItem` is the thing neither of those was: a single
 * obligation with a due date and no ceremony.
 */
export type ScheduledItemCategory =
  /** Plain "remind me". The default, and the one most items are. */
  | "reminder"
  /** A payment or charge that has to be marked paid. */
  | "bill"
  /** A booked slot with a person: doctor, dentist, vet, garage. */
  | "appointment"
  /** A recurring medical follow-up — the test itself, not the appointment. */
  | "checkup"
  /** A vaccination, for a person or an animal. */
  | "vaccination"
  /** A repeating treatment: flea drops, deworming, a filter change. */
  | "treatment"
  /** Keeping in touch: call, visit, drop something round. */
  | "contact"
  /** Something to buy. */
  | "shopping"
  /** A policy or subscription coming up for renewal. */
  | "renewal"
  /** A date worth not missing that needs nothing else modelled. */
  | "date";

export const SCHEDULED_CATEGORIES: ScheduledItemCategory[] = [
  "reminder",
  "bill",
  "appointment",
  "checkup",
  "vaccination",
  "treatment",
  "contact",
  "shopping",
  "renewal",
  "date",
];

/**
 * Four states, and the reason there are four.
 *
 * `snoozed` is not "completed later": a snoozed item is still owed, it has just
 * been told to stop asking until `snoozedUntil`. `cancelled` is the user saying
 * it will never happen, which is different from having done it — collapsing the
 * two would put things in "done" that were never done.
 */
export type ScheduledStatus = "active" | "completed" | "snoozed" | "cancelled";

/** Extra facts an appointment carries. Absent for everything else. */
export interface AppointmentDetails {
  /** Where. User content. */
  location?: string;
  /** What to take along. User content. */
  bring?: string;
  /** What to do beforehand — fast, stop a tablet, bring results. User content. */
  prepare?: string;
  /** What has to happen afterwards. User content, never generated. */
  followUp?: string;
}

/** Extra facts a bill carries. */
export interface ScheduledMoney {
  amount: number;
  currency?: string;
}

export interface ScheduledItem {
  id: string;
  /** User content. */
  title: string;
  category: ScheduledItemCategory;
  /** ISO 8601. Absent for an item with nothing to be late for. */
  dueAt?: string;
  /**
   * True when the item is a calendar day rather than a moment. A vaccination
   * is due "on Thursday"; printing a midnight nobody typed is inventing
   * precision.
   */
  allDay?: boolean;
  recurrence?: RecurrenceRule;
  /**
   * Minutes before `dueAt` to start asking. Local reminders only: Focus can
   * show these the next time it is opened and cannot deliver them while the tab
   * is closed, and every surface that renders one says so.
   */
  reminderOffsets?: number[];
  status: ScheduledStatus;
  /** ISO 8601; the item stays quiet until this passes. */
  snoozedUntil?: string;
  /** User content. */
  note?: string;
  /**
   * What the user recorded as the outcome — a reading, a result, what the vet
   * said. Their words, never interpreted and never used to derive advice.
   */
  result?: string;
  appointment?: AppointmentDetails;
  money?: ScheduledMoney;
  /** What this belongs to: a family profile, a page, a trip. */
  relatedEntity?: EntityReference;
  /** Documents and links. References, never copies. */
  savedItemIds?: string[];
  spaceId?: SpaceId;
  /** ISO 8601 of the most recent completion, for "last done" on a recurrence. */
  lastCompletedAt?: string;
  /** How many times a recurring item has been completed. */
  completionCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** What the create/edit form writes. Everything else is derived or stamped. */
export type ScheduledDraft = Omit<
  ScheduledItem,
  "id" | "createdAt" | "updatedAt" | "lastCompletedAt" | "completionCount"
>;
