import { useState } from "react";
import { useRoutines } from "../../state/routinesContext";
import { MonthlyCompletionCalendar } from "../../components/ui/MonthlyCompletionCalendar";
import { completionsInMonth, isCompletedOn, isPlannedOn } from "../../lib/routineSchedule";
import type { Routine } from "../../types";

/**
 * The completion calendar bound to one routine.
 *
 * Wrapping it here is what lets the gym, a laser appointment and the training
 * area all use the identical grid — the calendar knows nothing about routines,
 * and this knows nothing about drawing.
 */
export function RoutineCalendarCard({ routine }: { routine: Routine }) {
  const { toggleCompletionOn } = useRoutines();
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  return (
    <MonthlyCompletionCalendar
      year={view.year}
      month={view.month}
      onChangeMonth={(year, month) => setView({ year, month })}
      isCompleted={(dateKey) => isCompletedOn(routine, dateKey)}
      isPlanned={(dateKey) => isPlannedOn(routine, dateKey)}
      onToggle={(dateKey) => toggleCompletionOn(routine.id, dateKey)}
      completedCount={completionsInMonth(routine, view.year, view.month)}
      label={routine.title}
    />
  );
}
