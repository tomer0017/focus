import { useCallback, useMemo, type ReactNode } from "react";
import { trainingPlansRepository } from "../repositories";
import { normaliseUrl } from "../lib/links";
import { duplicatePlan, trainingId } from "../lib/training";
import type { ProjectNote, TrainingPlan, TrainingPlanDraft } from "../types";
import { TrainingContext, type TrainingContextValue } from "./trainingContext";
import { usePersistentState } from "./usePersistentState";

/**
 * Training plans.
 *
 * Every structural edit — adding a group, reordering an exercise, duplicating a
 * plan — happens in `lib/training.ts` and arrives here as a whole plan. One
 * mutator (`putPlan`) rather than a dozen narrow ones, which is the arrangement
 * the trip editor already uses: the rules stay pure and testable, and the
 * provider only decides where the result is stored.
 */
export function TrainingProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = usePersistentState(trainingPlansRepository);

  const getPlan = useCallback((id: string) => plans.find((plan) => plan.id === id), [plans]);

  const createPlan = useCallback(
    (draft: TrainingPlanDraft): TrainingPlan => {
      const now = new Date().toISOString();
      const plan: TrainingPlan = {
        ...draft,
        id: trainingId("plan"),
        title: draft.title.trim(),
        imageUrl: normaliseUrl(draft.imageUrl),
        groups: [],
        order: 0,
        createdAt: now,
        updatedAt: now,
      };
      // Newest first, then everything else shifts down a place.
      setPlans((current) => [plan, ...current].map((entry, index) => ({ ...entry, order: index })));
      return plan;
    },
    [setPlans]
  );

  const putPlan = useCallback(
    (plan: TrainingPlan) =>
      setPlans((current) => current.map((entry) => (entry.id === plan.id ? plan : entry))),
    [setPlans]
  );

  const updatePlan = useCallback(
    (id: string, patch: Partial<TrainingPlan>) =>
      setPlans((current) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...patch,
                imageUrl:
                  patch.imageUrl !== undefined ? normaliseUrl(patch.imageUrl) : entry.imageUrl,
                updatedAt: new Date().toISOString(),
              }
            : entry
        )
      ),
    [setPlans]
  );

  const setNotes = useCallback(
    (id: string, notes: ProjectNote[]) => updatePlan(id, { notes }),
    [updatePlan]
  );

  const duplicate = useCallback(
    (id: string, title: string): TrainingPlan | undefined => {
      const source = plans.find((plan) => plan.id === id);
      if (!source) return undefined;

      const copy = duplicatePlan(source, title);
      setPlans((current) => [copy, ...current].map((entry, index) => ({ ...entry, order: index })));
      return copy;
    },
    [plans, setPlans]
  );

  const deletePlan = useCallback(
    (id: string) => setPlans((current) => current.filter((plan) => plan.id !== id)),
    [setPlans]
  );

  const value = useMemo<TrainingContextValue>(
    () => ({ plans, getPlan, createPlan, putPlan, updatePlan, setNotes, duplicate, deletePlan }),
    [plans, getPlan, createPlan, putPlan, updatePlan, setNotes, duplicate, deletePlan]
  );

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}
