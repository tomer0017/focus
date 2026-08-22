import { UpcomingStrip } from "focus-client";
import type { UpcomingEntry } from "../../client/src/lib/pageSelectors";

/**
 * "What is near" — the first thing the overview answers.
 *
 * One tile per real upcoming thing, never padded out to a fixed number of
 * columns: three items render three tiles. Routines carry a "mark done"
 * button that sits above the stretched link so it stays independently
 * clickable, because recording something that just happened is not editing.
 *
 * A birthday is derived, never stored — its title is the person's name and the
 * strip composes the label at render, so no language is written into data.
 * `allDay` matters: a routine is due "on Tuesday", never "on Tuesday at
 * 00:00", and printing a midnight it never had would invent precision nobody
 * typed.
 */

const ENTRIES: UpcomingEntry[] = [
  {
    id: "routine-strength",
    href: "/routines/strength",
    title: "אימון כוח",
    kind: "routine",
    routineId: "strength",
    allDay: true,
    at: "2026-08-21T00:00:00.000Z",
    daysAway: 0,
  },
  {
    id: "event-hosting-friday",
    href: "/events/hosting-friday",
    title: "ארוחת שישי אצלנו",
    kind: "event",
    allDay: false,
    at: "2026-08-22T18:00:00.000Z",
    daysAway: 1,
  },
  {
    id: "birthday-mum",
    href: "/family/mum",
    title: "אמא",
    kind: "birthday",
    allDay: true,
    at: "2026-08-26T00:00:00.000Z",
    daysAway: 5,
  },
  {
    id: "page-before-a-flight",
    href: "/pages/before-a-flight",
    title: "לפני טיסה",
    kind: "checklist",
    allDay: true,
    at: "2026-09-03T00:00:00.000Z",
    daysAway: 13,
  },
];

/** The overview's strip: four kinds of thing, one shape of tile. */
export const WhatIsNear = () => (
  <div className="focus-sections">
    <UpcomingStrip entries={ENTRIES} span="full" onMarkRoutineDone={() => {}} />
  </div>
);

/**
 * Only routines can be ticked off from the strip — an event and a checklist
 * have somewhere to go, not something to record.
 */
export const RoutinesCanBeMarkedDone = () => (
  <div className="focus-sections">
    <UpcomingStrip
      entries={[
        ENTRIES[0],
        {
          id: "routine-water-plants",
          href: "/routines/water-plants",
          title: "השקיית הצמחים במרפסת",
          kind: "routine",
          routineId: "water-plants",
          allDay: true,
          at: "2026-08-23T00:00:00.000Z",
          daysAway: 2,
        },
      ]}
      span="full"
      onMarkRoutineDone={() => {}}
    />
  </div>
);

/**
 * One entry renders one tile. The strip is never padded out to a fixed number
 * of columns, and with nothing to record there is no button on the card.
 */
export const OneDatedThing = () => (
  <div className="focus-sections">
    <UpcomingStrip entries={[ENTRIES[1]]} onMarkRoutineDone={() => {}} />
  </div>
);

/** A day with nothing near renders nothing — no heading, no empty panel. */
export const NothingNear = () => (
  <div className="focus-sections">
    <UpcomingStrip entries={[]} onMarkRoutineDone={() => {}} />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
