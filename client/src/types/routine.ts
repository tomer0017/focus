import type { SpaceId } from "./space";

/**
 * What a routine is about. Drives grouping and which screen surfaces it —
 * `training` is the one domain with a dedicated area (`/training`).
 */
export type RoutineDomain =
  | "training"
  | "health"
  | "home"
  | "vehicle"
  | "personal"
  | "other";

/**
 * How often a routine is expected to happen.
 *
 * A rule produces *planned* dates. It never produces completions — those are
 * recorded by the user and stored separately, because "planned" and "done" are
 * different facts and conflating them is what makes habit trackers lie.
 */
export type RoutineScheduleRule =
  /** Every N days, counted from the last completion (or the start date). */
  | { kind: "everyNDays"; days: number }
  /** Fixed weekdays, 0 = Sunday … 6 = Saturday. */
  | { kind: "weekdays"; weekdays: number[] }
  /** Once a month on a given day of the month. */
  | { kind: "monthly"; dayOfMonth: number }
  /** Recurring in principle, but with no fixed cadence. */
  | { kind: "none" }
  /** A reminder only: nothing is scheduled, nothing is "overdue". */
  | { kind: "reminderOnly" };

export type RoutineScheduleKind = RoutineScheduleRule["kind"];

/**
 * One completion. A calendar day, not a timestamp: "I went to the gym" is a
 * fact about a day, and storing a time would invent precision nobody typed.
 */
export interface RoutineCompletion {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** The user's own words about that session. Never translated. */
  note?: string;
}

export interface Routine {
  id: string;
  title: string;
  domain: RoutineDomain;
  spaceId: SpaceId;
  /** Why this routine exists. User content. */
  description?: string;
  schedule: RoutineScheduleRule;
  /** Local calendar date the routine started, `YYYY-MM-DD`. */
  startDate: string;
  /** Free-form notes the user keeps against the routine. */
  notes?: string;
  /** Saved items (documents, links, plans) attached to this routine. */
  documentIds: string[];
  completions: RoutineCompletion[];
  favorite: boolean;
  createdAt: string;
}

/** The fields the create/edit form actually writes. */
export type RoutineDraft = Pick<
  Routine,
  "title" | "domain" | "spaceId" | "description" | "schedule" | "startDate" | "notes"
>;
