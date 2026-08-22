/**
 * A training plan: what to actually do when you get there.
 *
 * Three things were tangled together before this existed, and separating them
 * is the whole point:
 *
 * - **A plan** is a structure — "Plan B: back and biceps, five exercises". It
 *   has no date.
 * - **A scheduled session** is a date — the gym on Sunday, training with Dad
 *   every three days. That is a `Routine` (recurring activity with a history)
 *   or a `ScheduledItem` (one dated obligation), both of which already exist.
 *   A plan never becomes an event, and an event never carries a copy of the
 *   exercises.
 * - **Material** is a document, a video, a picture or a link. That is a
 *   `SavedItem`, attached by `contextIds`, exactly as everywhere else.
 *
 * Before this, "the plan" was whichever training document happened to be newest
 * (`const [activePlan, ...previous] = plans`). That made two things impossible:
 * running Plan A and Plan B at the same time, which is how most people train,
 * and writing down what is *in* a plan at all.
 *
 * This is not a fitness app. There is no RPE, no rest timer, no one-rep max, no
 * muscle analytics and no superset engine — a set count and a note is what
 * somebody actually re-reads six months later.
 */
import type { ProjectNote } from "./page";

/** Three states, matching the page and project vocabulary exactly. */
export type TrainingPlanStatus = "active" | "paused" | "completed";

/**
 * Where the plan happens.
 *
 * It earns a field because it is the one thing you filter on when deciding what
 * to do today: the gym is shut, so what can I do at home? `custom` is the
 * honest answer for anything else, and the user's own words go in the title.
 */
export type TrainingEnvironment = "gym" | "home" | "outdoor" | "custom";

/**
 * One exercise in a group.
 *
 * Every field past the name is optional, and they are **strings** rather than
 * numbers on purpose: people write "3–4", "8-12 each side" and "20kg, maybe 22
 * next time". Parsing those would be the first step towards calculating with
 * them, and Focus records rather than interprets.
 */
export interface TrainingExercise {
  id: string;
  /** User content. */
  name: string;
  sets?: string;
  reps?: string;
  /** What you lifted last time. A memory jog, never a metric. User content. */
  lastWeight?: string;
  /** One line — form cues, a niggle, what to change. User content. */
  note?: string;
  order: number;
}

/**
 * A named part of a plan: "chest and triceps", "warm-up", "Plan A".
 *
 * The titles are the user's own words and there is no fixed list. A plan that
 * is one flat list has one group, and that is a normal plan rather than an
 * unfinished one.
 */
export interface TrainingGroup {
  id: string;
  /** User content. */
  title: string;
  /** One line about the group. User content. */
  description?: string;
  exercises: TrainingExercise[];
  order: number;
}

/**
 * A plan, with its groups and exercises.
 *
 * They are **embedded** rather than three separate slices, for the reason
 * `Trip` owns its destinations and days: a group is never read without its
 * plan, so keeping them together means one write per edit instead of three that
 * could disagree. The document stays small — twenty groups of a hundred
 * exercises is a few kilobytes — and it is a *plan* document, not one giant
 * user document.
 *
 * Notes are embedded for the same reason and use the shared `ProjectNote`; they
 * are the same blocks a project, a learning page and a leisure item carry.
 * Material is **not** embedded: a `SavedItem` belongs to many contexts at once
 * and is attached by `contextIds`.
 */
export interface TrainingPlan {
  id: string;
  /** User content. */
  title: string;
  status: TrainingPlanStatus;
  environment?: TrainingEnvironment;
  /**
   * The short name people actually use — "A", "B", "Full body", "Push".
   *
   * Free text, never a closed list: "A/B/C" is one household's convention and
   * "Push/Pull/Legs" is another's. It is shown as the row's sigil when the plan
   * has no picture, because "today is B" is how these are referred to out loud.
   */
  label?: string;
  /** One or two lines about the plan. User content. */
  description?: string;
  /** An address only — never bytes, never a data URI. */
  imageUrl?: string;
  groups: TrainingGroup[];
  /** The plan's own blocks, using the shared note model. */
  notes?: ProjectNote[];
  /** Position in the list; lower comes first. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** What the create form collects. Everything else is added by the provider. */
export type TrainingPlanDraft = Pick<
  TrainingPlan,
  "title" | "status" | "environment" | "label" | "description" | "imageUrl"
>;
