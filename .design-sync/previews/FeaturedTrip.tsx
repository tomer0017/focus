import { FeaturedTrip } from "focus-client";
import type { Trip } from "../../client/src/types";

/**
 * The one trip a screen leads with. Never a carousel: "what is next" has
 * exactly one answer, and the countdown, the next action and what is still
 * owed are what the reader came for — which is why this is a wide row and not
 * a photograph with a caption.
 *
 * Fixture dates are hard-coded a few months ahead so the countdown reads
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

export const NextTrip = () => (
  <FeaturedTrip trip={trip} readiness={{ done: 3, total: 5, missing: ["stays", "packing"] }} />
);

/** Hebrew content, and a trip with nothing outstanding. */
export const NothingOutstanding = () => (
  <FeaturedTrip
    trip={{
      ...trip,
      id: "camp",
      title: "קמפינג בצפון",
      countries: ["ישראל"],
      kind: "outdoors",
      coverThumb: "mountain",
      status: "planned",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      nextAction: "לבדוק שהגז עובד לפני שיוצאים.",
    }}
    readiness={{ done: 4, total: 4, missing: [] }}
  />
);
