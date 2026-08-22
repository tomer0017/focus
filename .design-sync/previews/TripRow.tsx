import { TripRow } from "focus-client";
import type { Trip } from "../../client/src/types";

/**
 * A trip as one scannable line and a half.
 *
 * The three cells are the three states a row has to survive: a trip that is
 * ready, one that is missing things, and one that is over. Fixture dates are
 * hard-coded and sit a few months ahead of the present, so the countdown reads
 * plausibly — they will need refreshing on a future sync, as every card with a
 * countdown in this system does.
 */

const base: Trip = {
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

export const Ready = () => (
  <ul className="focus-trip-rows list-unstyled mb-0">
    <li>
      <TripRow
        trip={base}
        readiness={{ done: 5, total: 5, missing: [] }}
        progress={{ done: 42, total: 42 }}
      />
    </li>
  </ul>
);

/** The state most trips are actually in: booked, but not finished. */
export const StillMissingThings = () => (
  <ul className="focus-trip-rows list-unstyled mb-0">
    <li>
      <TripRow
        trip={base}
        readiness={{ done: 3, total: 5, missing: ["stays", "packing"] }}
        progress={{ done: 11, total: 42 }}
      />
    </li>
    <li>
      <TripRow
        trip={{
          ...base,
          id: "eilat",
          title: "ארבעה לילות באילת",
          countries: ["ישראל"],
          kind: "hotel",
          coverThumb: "sea",
          startDate: "2026-09-08",
          endDate: "2026-09-12",
          nextAction: "לבדוק אם הבריכה מחוממת בתאריכים האלה.",
        }}
        readiness={{ done: 2, total: 4, missing: ["stays", "packing"] }}
      />
    </li>
  </ul>
);

/**
 * A finished trip: no countdown in accent, no "still missing", no next action.
 * Nothing on it asks to be prepared.
 */
export const BeenThere = () => (
  <ul className="focus-trip-rows list-unstyled mb-0">
    <li>
      <TripRow
        trip={{
          ...base,
          id: "lisbon",
          title: "Lisbon, last spring",
          countries: ["Portugal"],
          startDate: "2026-04-02",
          endDate: "2026-04-07",
          status: "done",
        }}
        readiness={{ done: 3, total: 5, missing: ["stays", "packing"] }}
      />
    </li>
  </ul>
);

/** No cover: an honest placeholder, never invented artwork. */
export const WithoutAPicture = () => (
  <ul className="focus-trip-rows list-unstyled mb-0">
    <li>
      <TripRow
        trip={{ ...base, id: "bare", title: "סופ״ש בגליל", countries: ["ישראל"], kind: "weekend", coverThumb: undefined, nextAction: undefined, startDate: "2026-10-16", endDate: "2026-10-17" }}
        readiness={{ done: 2, total: 3, missing: ["packing"] }}
      />
    </li>
  </ul>
);
