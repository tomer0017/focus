import type { Routine, RoutineCompletion } from "../types";
import { addDaysToKey, fromDateKey, todayKey } from "../lib/dateKey";
import { daysAgo } from "./relativeDates";

/**
 * Mock routines with several months of history, so switching months in the
 * completion calendar shows real data rather than five empty grids.
 *
 * History is generated relative to today for the same reason the other mocks
 * are: a demo whose "last workout" was in 2024 teaches nothing.
 */
const TODAY = todayKey();

/** `count` completions going back from `startOffset` days ago, every `gap` days. */
function backwards(count: number, gap: number, startOffset = 0, skip: number[] = []): RoutineCompletion[] {
  const entries: RoutineCompletion[] = [];
  for (let index = 0; index < count; index += 1) {
    if (skip.includes(index)) continue;
    entries.push({ date: addDaysToKey(TODAY, -(startOffset + index * gap)) });
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/** Completions on given weekdays for the last `weeks` weeks. */
function onWeekdays(weekdays: number[], weeks: number, skip: number[] = []): RoutineCompletion[] {
  const entries: RoutineCompletion[] = [];
  for (let back = 0; back <= weeks * 7; back += 1) {
    const key = addDaysToKey(TODAY, -back);
    if (weekdays.includes(fromDateKey(key).getDay()) && !skip.includes(back)) {
      entries.push({ date: key });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export const MOCK_ROUTINES: Routine[] = [
  {
    id: "routine-gym",
    title: "Gym",
    domain: "training",
    spaceId: "personal",
    description: "Push, pull, legs. Every third day, whatever the week looks like.",
    schedule: { kind: "everyNDays", days: 3 },
    startDate: addDaysToKey(TODAY, -150),
    notes: "Rows are the lift to push this block. Add a set when the last one feels easy.",
    documentIds: ["plan-push-pull-legs", "plan-full-body", "saved-form-check"],
    // ~4 months of sessions with two real gaps: a travel week and a quiet week.
    completions: backwards(42, 3, 2, [7, 8, 9, 24, 25]),
    favorite: true,
    createdAt: daysAgo(150, 9),
  },
  {
    id: "routine-run",
    title: "Run",
    domain: "training",
    spaceId: "personal",
    description: "Two easy runs a week. Tuesday and Friday mornings.",
    schedule: { kind: "weekdays", weekdays: [2, 5] },
    startDate: addDaysToKey(TODAY, -120),
    documentIds: ["plan-run-base"],
    completions: onWeekdays([2, 5], 14, [16, 19, 23]),
    favorite: false,
    createdAt: daysAgo(120, 8),
  },
  {
    id: "routine-laser",
    title: "Laser Treatment",
    domain: "health",
    spaceId: "personal",
    description: "Session every six weeks. Eight in the course.",
    schedule: { kind: "monthly", dayOfMonth: 12 },
    startDate: addDaysToKey(TODAY, -200),
    notes: "No sun the week before. Session 5 of 8.",
    documentIds: ["saved-laser-aftercare"],
    completions: backwards(5, 42, 18),
    favorite: false,
    createdAt: daysAgo(200, 12),
  },
  {
    id: "routine-weigh-in",
    title: "Weigh in",
    domain: "health",
    spaceId: "personal",
    description: "Same day, same time, before breakfast. Trend only, not the number.",
    schedule: { kind: "weekdays", weekdays: [0] },
    startDate: addDaysToKey(TODAY, -90),
    documentIds: [],
    completions: onWeekdays([0], 12, [35]),
    favorite: false,
    createdAt: daysAgo(90, 7),
  },
  {
    id: "routine-car-service",
    title: "Car service",
    domain: "vehicle",
    spaceId: "home",
    description: "Full service, or 15,000km, whichever lands first.",
    schedule: { kind: "everyNDays", days: 180 },
    startDate: addDaysToKey(TODAY, -400),
    notes: "Ask about the rear brake pads next time — they were borderline.",
    documentIds: [],
    completions: backwards(2, 180, 40),
    favorite: false,
    createdAt: daysAgo(400, 10),
  },
  {
    id: "routine-home-check",
    title: "Home maintenance round",
    domain: "home",
    spaceId: "home",
    description: "Filters, batteries, the slow drain in the bathroom. No fixed rhythm.",
    schedule: { kind: "none" },
    startDate: addDaysToKey(TODAY, -300),
    documentIds: [],
    completions: backwards(3, 70, 25),
    favorite: false,
    createdAt: daysAgo(300, 11),
  },
];
