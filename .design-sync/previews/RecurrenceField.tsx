import { RecurrenceField } from "focus-client";
import type { RecurrenceRule } from "../../client/src/types";

/**
 * Six kinds of repetition and no seventh. There is no RRULE here on purpose:
 * "every second Tuesday except in August" is a calendar's problem, and `custom`
 * — "I will tell you the next date myself" — is the escape hatch that keeps the
 * other five simple.
 *
 * Two behaviours are worth seeing side by side. The interval box appears only
 * for the four rules that can take one, so "once" and "custom" never present a
 * number field that does nothing; and `custom` gets a line of explanation
 * underneath, because the word on its own reads like a missing feature rather
 * than a deliberate choice.
 *
 * These are controlled inputs, so every cell arrives with the value already
 * set — an empty control would show nothing about how the field behaves.
 */

const hold = (_rule: RecurrenceRule | undefined): void => {};

/** The default a new reminder starts from: repeats once and never again. */
export const Once = () => (
  <div className="focus-form-stack">
    <RecurrenceField value={undefined} onChange={hold} />
  </div>
);

/** Every day, interval 1 — a morning tablet. The number box is live but quiet. */
export const Daily = () => (
  <div className="focus-form-stack">
    <RecurrenceField value={{ kind: "daily", interval: 1 }} onChange={hold} />
  </div>
);

/** The interval doing real work: physiotherapy every second week. */
export const EveryOtherWeek = () => (
  <div className="focus-form-stack">
    <RecurrenceField value={{ kind: "weekly", interval: 2 }} onChange={hold} />
  </div>
);

/** A standing order on the 4th. The arithmetic counts from the anchor, never from today. */
export const Monthly = () => (
  <div className="focus-form-stack">
    <RecurrenceField value={{ kind: "monthly", interval: 1 }} onChange={hold} />
  </div>
);

/** No interval box, and a line saying why: nothing is computed ahead. */
export const Custom = () => (
  <div className="focus-form-stack">
    <RecurrenceField value={{ kind: "custom" }} onChange={hold} />
  </div>
);

/** Where it actually sits: three fields down the scheduled-item form, on a yearly car test. */
export const InScheduledForm = () => (
  <div className="focus-form-stack">
    <div>
      <label htmlFor="sched-title-demo" className="form-label fw-medium">
        מה זה
      </label>
      <input
        id="sched-title-demo"
        className="form-control"
        dir="auto"
        value="טסט שנתי לרכב — מוסך אבנר"
        readOnly
      />
    </div>
    <div className="focus-field-row">
      <div>
        <label htmlFor="sched-due-demo" className="form-label fw-medium">
          מתי
        </label>
        <input id="sched-due-demo" type="date" className="form-control" value="2026-11-04" readOnly />
      </div>
    </div>
    <RecurrenceField value={{ kind: "yearly", interval: 1 }} onChange={hold} />
  </div>
);
