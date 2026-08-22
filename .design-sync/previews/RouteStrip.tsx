import { useState } from "react";
import { RouteStrip } from "focus-client";
import type { Trip, TripDestination } from "../../client/src/types";

/**
 * Where a trip goes, in order, as one line.
 *
 * This exists because the screen used to say "Japan 2027, 12 days" and then
 * make you open three cards to find out that it meant Tokyo, then Kyoto, then
 * Osaka. A trip's shape is a sequence of places with nights in each, and that
 * is a route — so it is drawn as one.
 *
 * The connector is not decoration: it is the leg of travel between two stops.
 * Order flows with the writing direction, so in Hebrew the first stop is on the
 * right and the arrow points left — reading order and travel order agree, which
 * is what stops an RTL route from reading backwards.
 *
 * Below `md` it becomes a vertical timeline; at the capture width the
 * horizontal form is what renders.
 */

const stop = (
  id: string,
  name: string,
  arriveOn: string,
  leaveOn: string,
  thumb?: TripDestination["thumb"]
): TripDestination => ({
  id,
  name,
  thumb,
  arriveOn,
  leaveOn,
  goodToKnow: [],
  savedItemIds: [],
});

const trip = (destinations: TripDestination[]): Trip => ({
  id: "fixture",
  title: "Japan 2027",
  countries: ["Japan"],
  startDate: "2026-11-25",
  endDate: "2026-12-06",
  status: "booking",
  kind: "abroad",
  flights: [],
  stays: [],
  destinations,
  days: [],
  food: [],
  outfits: [],
  createdAt: "2026-01-04T09:00:00.000Z",
});

const THREE = trip([
  stop("tokyo", "Tokyo", "2026-11-26", "2026-11-30", "city"),
  stop("kyoto", "Kyoto", "2026-11-30", "2026-12-04", "spring"),
  stop("osaka", "אוסקה", "2026-12-04", "2026-12-06", "sea"),
]);

export const ThreeStops = () => {
  const [value, setValue] = useState("kyoto");
  return <RouteStrip trip={THREE} value={value} onSelect={setValue} />;
};

/**
 * One stop is a fact, not a route: no node, no connector, and no bordered card
 * either — a single outlined box in an otherwise empty row reads as a route
 * with a piece missing.
 */
export const OneStop = () => {
  const single = trip([stop("eilat", "אילת", "2026-09-08", "2026-09-12", "sea")]);
  const [value, setValue] = useState("eilat");
  return <RouteStrip trip={single} value={value} onSelect={setValue} />;
};

/** Ten stops scroll rather than shrinking each one past legibility. */
export const TenStops = () => {
  const many = trip(
    Array.from({ length: 10 }, (_, index) =>
      stop(
        `s${index}`,
        index % 2 ? `City ${index + 1}` : `עיר ${index + 1}`,
        `2026-11-${String(10 + index).padStart(2, "0")}`,
        `2026-11-${String(11 + index).padStart(2, "0")}`
      )
    )
  );
  const [value, setValue] = useState("s0");
  return <RouteStrip trip={many} value={value} onSelect={setValue} />;
};

/** No pictures and a long name: the row closes the gap rather than reserving it. */
export const LongNamesWithoutPictures = () => {
  const long = trip([
    stop("a", "Kanazawa and the Noto peninsula", "2026-11-26", "2026-11-30"),
    stop("b", "הרי היפן האלפיניים", "2026-11-30", "2026-12-03"),
  ]);
  const [value, setValue] = useState("a");
  return <RouteStrip trip={long} value={value} onSelect={setValue} />;
};
