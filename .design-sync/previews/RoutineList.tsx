import { RoutineList } from "focus-client";
import type { Routine } from "../../client/src/types";

/**
 * Recurring activity as chip cards: the cadence, when it was last done, when
 * it is next planned.
 *
 * Plan and history are separate facts. A schedule rule produces *planned*
 * days; `completions` records what actually happened, as calendar days rather
 * than timestamps. A missed day is never drawn as a failure — the only flag is
 * "overdue", and it is written out in words next to an icon so colour is never
 * carrying it alone.
 */

const STRENGTH: Routine = {
  id: "strength",
  title: "אימון כוח",
  domain: "training",
  spaceId: "personal",
  description: "תוכנית של שלוש פעמים בשבוע, מהמאמן בחדר כושר.",
  schedule: { kind: "weekdays", weekdays: [0, 2, 4] },
  startDate: "2026-01-05",
  documentIds: [],
  completions: [
    { date: "2026-08-05" },
    { date: "2026-08-07" },
    { date: "2026-08-10" },
    { date: "2026-08-12" },
    { date: "2026-08-17" },
    { date: "2026-08-19", note: "סקוואט 60 קילו, הרגיש טוב" },
  ],
  favorite: true,
  createdAt: "2026-01-05T06:00:00.000Z",
};

const RUNNING: Routine = {
  id: "running",
  title: "ריצה קלה",
  domain: "training",
  spaceId: "personal",
  schedule: { kind: "everyNDays", days: 3 },
  startDate: "2026-03-01",
  documentIds: [],
  completions: [{ date: "2026-08-13" }, { date: "2026-08-16" }, { date: "2026-08-19" }],
  favorite: false,
  createdAt: "2026-03-01T05:30:00.000Z",
};

const LASER: Routine = {
  id: "laser",
  title: "טיפול לייזר",
  domain: "health",
  spaceId: "personal",
  description: "סדרה של שמונה טיפולים, פעם בחודש.",
  schedule: { kind: "monthly", dayOfMonth: 12 },
  startDate: "2026-02-12",
  documentIds: [],
  completions: [{ date: "2026-06-12" }, { date: "2026-07-12" }, { date: "2026-08-12" }],
  favorite: false,
  createdAt: "2026-02-01T09:00:00.000Z",
};

const CAR_SERVICE: Routine = {
  id: "car-service",
  title: "טיפול תקופתי לרכב",
  domain: "vehicle",
  spaceId: "personal",
  schedule: { kind: "everyNDays", days: 180 },
  startDate: "2025-08-02",
  documentIds: [],
  completions: [{ date: "2026-02-02", note: "החליפו שמן ומסנן אוויר" }],
  favorite: false,
  createdAt: "2025-08-02T08:00:00.000Z",
};

const WATER_PLANTS: Routine = {
  id: "water-plants",
  title: "השקיית הצמחים במרפסת",
  domain: "home",
  spaceId: "home",
  schedule: { kind: "everyNDays", days: 4 },
  startDate: "2026-04-18",
  documentIds: [],
  completions: [{ date: "2026-07-02" }],
  favorite: false,
  createdAt: "2026-04-18T07:00:00.000Z",
};

const TYRE_PRESSURE: Routine = {
  id: "tyre-pressure",
  title: "בדיקת לחץ אוויר בגלגלים",
  domain: "vehicle",
  spaceId: "personal",
  schedule: { kind: "reminderOnly" },
  startDate: "2026-08-01",
  documentIds: [],
  completions: [],
  favorite: false,
  createdAt: "2026-08-01T08:00:00.000Z",
};

/** The section as a space view builds it — four cadences, four shapes of rule. */
export const RecurringActivity = () => (
  <div className="focus-sections">
    <RoutineList title="פעילויות חוזרות" routines={[STRENGTH, RUNNING, LASER, CAR_SERVICE]} span="full" />
  </div>
);

/**
 * Overdue says so in words, beside an alert icon. Both of these are past their
 * cadence — the car by months, the plants by weeks.
 */
export const OverdueSaysSo = () => (
  <div className="focus-sections">
    <RoutineList title="באיחור" routines={[CAR_SERVICE, WATER_PLANTS]} />
  </div>
);

/**
 * A reminder-only routine is never overdue and has no planned date — that is
 * the whole reason the rule exists. Never done reads as "not done yet", not as
 * a missed target.
 */
export const ReminderOnlyAndNeverDone = () => (
  <div className="focus-sections">
    <RoutineList title="תזכורות" routines={[TYRE_PRESSURE]} />
  </div>
);

/** No recurring activity renders nothing — no heading, no empty panel. */
export const NothingRecurring = () => (
  <div className="focus-sections">
    <RoutineList title="פעילויות חוזרות" routines={[]} />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
