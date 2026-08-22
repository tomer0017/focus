import { createContext, useContext } from "react";
import type { Routine, RoutineDraft } from "../types";

export interface RoutinesContextValue {
  routines: Routine[];
  getRoutine: (id: string) => Routine | undefined;
  createRoutine: (draft: RoutineDraft) => Routine;
  updateRoutine: (id: string, draft: RoutineDraft) => void;
  /** Marks a day done, or removes the mark if it is already there. */
  toggleCompletionOn: (id: string, dateKey: string) => void;
  deleteRoutine: (id: string) => void;
}

export const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function useRoutines(): RoutinesContextValue {
  const value = useContext(RoutinesContext);
  if (!value) {
    throw new Error("useRoutines must be used inside <RoutinesProvider>");
  }
  return value;
}
