import { useCallback, useMemo, type ReactNode } from "react";
import { routinesRepository } from "../repositories";
import { toggleCompletion } from "../lib/routineSchedule";
import type { Routine, RoutineDraft } from "../types";
import { RoutinesContext, type RoutinesContextValue } from "./routinesContext";
import { usePersistentState } from "./usePersistentState";

/** Ids only need to be unique in one browser; no id service exists yet. */
function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Routines and their completion history, persisted locally.
 *
 * Completions are recorded per calendar day and never derived from the
 * schedule: a plan says what *should* happen, history says what did.
 */
export function RoutinesProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = usePersistentState(routinesRepository);

  const getRoutine = useCallback(
    (id: string) => routines.find((routine) => routine.id === id),
    [routines]
  );

  const createRoutine = useCallback(
    (draft: RoutineDraft): Routine => {
      const routine: Routine = {
        ...draft,
        id: newId("routine"),
        documentIds: [],
        completions: [],
        favorite: false,
        createdAt: new Date().toISOString(),
      };
      setRoutines((current) => [...current, routine]);
      return routine;
    },
    [setRoutines]
  );

  const updateRoutine = useCallback(
    (id: string, draft: RoutineDraft) => {
      setRoutines((current) =>
        current.map((routine) => (routine.id === id ? { ...routine, ...draft } : routine))
      );
    },
    [setRoutines]
  );

  const toggleCompletionOn = useCallback(
    (id: string, dateKey: string) => {
      setRoutines((current) =>
        current.map((routine) => (routine.id === id ? toggleCompletion(routine, dateKey) : routine))
      );
    },
    [setRoutines]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      setRoutines((current) => current.filter((routine) => routine.id !== id));
    },
    [setRoutines]
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({ routines, getRoutine, createRoutine, updateRoutine, toggleCompletionOn, deleteRoutine }),
    [routines, getRoutine, createRoutine, updateRoutine, toggleCompletionOn, deleteRoutine]
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}
