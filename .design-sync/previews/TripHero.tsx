import { TripHero } from "focus-client";
import type { Trip } from "../../client/src/types";

/**
 * The band that gives a trip its identity without taking the screen.
 *
 * The cover is capped and sits beside the facts rather than above them — the
 * screen this replaced gave it 230px of full-width height and pushed the
 * countdown, the readiness and the next action below the fold.
 *
 * Fixture dates are hard-coded ahead of the present so the countdown reads
 * plausibly; they need refreshing on a future sync.
 */

const trip: Trip = {
  id: "fixture",
  title: "Japan 2027",
  countries: ["Japan"],
  startDate: "2026-11-25",
  endDate: "2026-12-06",
  coverThumb: "city",
  status: "booking",
  kind: "abroad",
  nextAction: "Book the Kyoto ryokan before the autumn rates change.",
  flights: [],
  stays: [],
  destinations: [],
  days: [],
  food: [],
  outfits: [],
  createdAt: "2026-01-04T09:00:00.000Z",
};

export const Upcoming = () => (
  <TripHero
    trip={trip}
    readiness={{ done: 3, total: 5, missing: ["stays", "packing"] }}
    onEdit={() => {}}
  />
);

/**
 * A finished trip. No countdown, no readiness meter, no next action: none of
 * them is a fact about a trip that already happened.
 */
export const BeenThere = () => (
  <TripHero
    trip={{
      ...trip,
      id: "lisbon",
      title: "Lisbon, last spring",
      countries: ["Portugal"],
      startDate: "2026-04-02",
      endDate: "2026-04-07",
      status: "done",
      nextAction: undefined,
    }}
    readiness={{ done: 3, total: 5, missing: ["stays", "packing"] }}
    onEdit={() => {}}
  />
);

/** Hebrew content and no cover picture — an honest placeholder, not artwork. */
export const HebrewAndNoCover = () => (
  <TripHero
    trip={{
      ...trip,
      id: "camp",
      title: "קמפינג בצפון",
      countries: ["ישראל"],
      kind: "outdoors",
      coverThumb: undefined,
      status: "planned",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      nextAction: "לבדוק שהגז עובד לפני שיוצאים.",
    }}
    readiness={{ done: 3, total: 4, missing: ["packing"] }}
    onEdit={() => {}}
  />
);
