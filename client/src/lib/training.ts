/**
 * Training plans — the rules, with no React in them.
 *
 * Everything here is a pure function over a `TrainingPlan`, so the parts that
 * can silently lose somebody's data — duplicating a plan, reordering a group,
 * deleting an exercise — are testable without rendering anything.
 */
import type { ProjectNoteTemplate } from "./projectNotes";
import type {
  TrainingEnvironment,
  TrainingExercise,
  TrainingGroup,
  TrainingPlan,
  TrainingPlanStatus,
} from "../types";

/** Ids only need to be unique in one browser; no id service exists yet. */
export function trainingId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const PLAN_STATUSES: TrainingPlanStatus[] = ["active", "paused", "completed"];

export const ENVIRONMENTS: TrainingEnvironment[] = ["gym", "home", "outdoor", "custom"];

/** How many exercises a plan holds, across every group. */
export function exerciseCount(plan: TrainingPlan): number {
  return plan.groups.reduce((sum, group) => sum + group.exercises.length, 0);
}

/* --------------------------------------------------------------- filters -- */

export interface PlanFilter {
  /** A status, or absent for "all". */
  status?: TrainingPlanStatus;
  environment?: TrainingEnvironment;
  query?: string;
}

/**
 * The plans one tab shows.
 *
 * Search runs over the whole set rather than the current status, because
 * looking for the home routine you wrote in spring is exactly the moment you do
 * not recall whether you parked it. It matches the plan's own words — title,
 * label, description — and the exercise names, since "where did I write down
 * that hip thing?" is a real way of looking for a plan.
 */
export function filterPlans(plans: TrainingPlan[], filter: PlanFilter): TrainingPlan[] {
  const term = filter.query?.trim().toLowerCase();

  return plans.filter((plan) => {
    if (filter.status && plan.status !== filter.status) return false;
    if (filter.environment && plan.environment !== filter.environment) return false;

    if (term) {
      const haystack = [
        plan.title,
        plan.label,
        plan.description,
        ...plan.groups.map((group) => group.title),
        ...plan.groups.flatMap((group) => group.exercises.map((entry) => entry.name)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** The user's own order, then newest first for anything sharing a position. */
export function sortPlans(plans: TrainingPlan[]): TrainingPlan[] {
  return [...plans].sort((a, b) => a.order - b.order || b.updatedAt.localeCompare(a.updatedAt));
}

export function countByStatus(plans: TrainingPlan[]): Record<TrainingPlanStatus, number> {
  const counts: Record<TrainingPlanStatus, number> = { active: 0, paused: 0, completed: 0 };
  for (const plan of plans) counts[plan.status] += 1;
  return counts;
}

/* ----------------------------------------------------------- pure edits -- */

function touch(plan: TrainingPlan): TrainingPlan {
  return { ...plan, updatedAt: new Date().toISOString() };
}

/** Renumbers so `order` stays canonical after an add, a drop or a move. */
function renumber<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index }));
}

export function addGroup(plan: TrainingPlan, title: string): TrainingPlan {
  const trimmed = title.trim();
  if (!trimmed) return plan;

  return touch({
    ...plan,
    groups: renumber([
      ...plan.groups,
      { id: trainingId("group"), title: trimmed, exercises: [], order: plan.groups.length },
    ]),
  });
}

export function updateGroup(
  plan: TrainingPlan,
  groupId: string,
  patch: Partial<Pick<TrainingGroup, "title" | "description">>
): TrainingPlan {
  return touch({
    ...plan,
    groups: plan.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
  });
}

export function removeGroup(plan: TrainingPlan, groupId: string): TrainingPlan {
  return touch({
    ...plan,
    groups: renumber(plan.groups.filter((group) => group.id !== groupId)),
  });
}

/**
 * Moves a group one place.
 *
 * Buttons rather than dragging, everywhere: a drag target is unusable on a
 * phone and unreachable by keyboard, and this is the only reordering mechanism
 * the training screens offer.
 */
export function moveGroup(plan: TrainingPlan, groupId: string, direction: -1 | 1): TrainingPlan {
  const index = plan.groups.findIndex((group) => group.id === groupId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= plan.groups.length) return plan;

  const groups = [...plan.groups];
  [groups[index], groups[target]] = [groups[target], groups[index]];
  return touch({ ...plan, groups: renumber(groups) });
}

export function addExercise(plan: TrainingPlan, groupId: string, name: string): TrainingPlan {
  const trimmed = name.trim();
  if (!trimmed) return plan;

  return touch({
    ...plan,
    groups: plan.groups.map((group) =>
      group.id !== groupId
        ? group
        : {
            ...group,
            exercises: renumber([
              ...group.exercises,
              { id: trainingId("ex"), name: trimmed, order: group.exercises.length },
            ]),
          }
    ),
  });
}

export function updateExercise(
  plan: TrainingPlan,
  groupId: string,
  exerciseId: string,
  patch: Partial<Omit<TrainingExercise, "id" | "order">>
): TrainingPlan {
  return touch({
    ...plan,
    groups: plan.groups.map((group) =>
      group.id !== groupId
        ? group
        : {
            ...group,
            exercises: group.exercises.map((entry) =>
              entry.id === exerciseId ? { ...entry, ...patch } : entry
            ),
          }
    ),
  });
}

export function removeExercise(
  plan: TrainingPlan,
  groupId: string,
  exerciseId: string
): TrainingPlan {
  return touch({
    ...plan,
    groups: plan.groups.map((group) =>
      group.id !== groupId
        ? group
        : { ...group, exercises: renumber(group.exercises.filter((e) => e.id !== exerciseId)) }
    ),
  });
}

export function moveExercise(
  plan: TrainingPlan,
  groupId: string,
  exerciseId: string,
  direction: -1 | 1
): TrainingPlan {
  return touch({
    ...plan,
    groups: plan.groups.map((group) => {
      if (group.id !== groupId) return group;

      const index = group.exercises.findIndex((entry) => entry.id === exerciseId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= group.exercises.length) return group;

      const exercises = [...group.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...group, exercises: renumber(exercises) };
    }),
  });
}

/**
 * A copy of a plan, with fresh ids all the way down.
 *
 * The same rule templates follow: nothing the user does to the copy may reach
 * the original. It starts **paused** rather than active — duplicating is what
 * you do when you are about to change something, and silently adding a second
 * live plan is a decision the app should not make on somebody's behalf.
 *
 * Notes come along; they are part of the plan. Material does not: a `SavedItem`
 * is attached to the original by `contextIds`, and copying the attachment would
 * either duplicate the item or make the copy quietly share it.
 */
export function duplicatePlan(plan: TrainingPlan, title: string): TrainingPlan {
  const now = new Date().toISOString();

  return {
    ...plan,
    id: trainingId("plan"),
    title,
    status: "paused",
    groups: plan.groups.map((group) => ({
      ...group,
      id: trainingId("group"),
      exercises: group.exercises.map((entry) => ({ ...entry, id: trainingId("ex") })),
    })),
    notes: plan.notes?.map((note) => ({ ...note, id: trainingId("note") })),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * The starting points offered when writing a note on a plan.
 *
 * A title and a prompt, nothing more — the same rule every other template in
 * the app follows, and scoped to training for the reason learning has its own
 * set: "what to change next time" is the right question here and the wrong one
 * on a shopping list.
 *
 * "Limits or pain" is the user's own words about their own body. Focus records
 * it and repeats it back; it never interprets it, and it is not medical advice.
 */
export const TRAINING_NOTE_TEMPLATES: ProjectNoteTemplate[] = [
  { id: "weights", titleKey: "trainingNotes.weights.title", hintKey: "trainingNotes.weights.hint" },
  { id: "tips", titleKey: "trainingNotes.tips.title", hintKey: "trainingNotes.tips.hint" },
  { id: "changeNext", titleKey: "trainingNotes.changeNext.title", hintKey: "trainingNotes.changeNext.hint" },
  { id: "stoppedAt", titleKey: "trainingNotes.stoppedAt.title", hintKey: "trainingNotes.stoppedAt.hint" },
  { id: "limits", titleKey: "trainingNotes.limits.title", hintKey: "trainingNotes.limits.hint" },
  { id: "goal", titleKey: "trainingNotes.goal.title", hintKey: "trainingNotes.goal.hint" },
];
