import { createContext, useContext } from "react";
import type { ProjectNote, TrainingPlan, TrainingPlanDraft } from "../types";

export interface TrainingContextValue {
  plans: TrainingPlan[];
  getPlan: (id: string) => TrainingPlan | undefined;
  createPlan: (draft: TrainingPlanDraft) => TrainingPlan;
  /** Replaces a plan wholesale — every edit goes through `lib/training.ts`. */
  putPlan: (plan: TrainingPlan) => void;
  updatePlan: (id: string, patch: Partial<TrainingPlan>) => void;
  setNotes: (id: string, notes: ProjectNote[]) => void;
  /** A copy with fresh ids, parked rather than live. */
  duplicate: (id: string, title: string) => TrainingPlan | undefined;
  deletePlan: (id: string) => void;
}

export const TrainingContext = createContext<TrainingContextValue | null>(null);

export function useTraining(): TrainingContextValue {
  const value = useContext(TrainingContext);
  if (!value) throw new Error("useTraining must be used inside <TrainingProvider>");
  return value;
}
