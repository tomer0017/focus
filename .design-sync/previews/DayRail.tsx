import { useState } from "react";
import { DayRail } from "focus-client";
import type { TripDayPlan } from "../../client/src/types";

/**
 * The days of a leg, as ticks on a line — the one drawn element in the trips
 * design, and the only place the shape of a trip is shown rather than listed.
 *
 * The point is the gap. A filled tick is a day with a plan; a hollow one is a
 * day with nothing in it, which is the thing a list of day cards cannot show
 * and the thing people actually scan for. The state is also written out for
 * screen readers, so the drawing is never the only reading.
 */

const days: TripDayPlan[] = [
  {
    id: "d1",
    date: "2026-11-26",
    destinationId: "tokyo",
    morning: "Land, train into the city, drop the bags.",
  },
  { id: "d2", date: "2026-11-27", destinationId: "tokyo", morning: "Fish market, early." },
  // No slots filled: this is the hollow tick the rail exists to surface.
  { id: "d3", date: "2026-11-28", destinationId: "tokyo" },
  { id: "d4", date: "2026-11-29", destinationId: "tokyo", evening: "Back late." },
];

export const AWeekWithAGap = () => {
  const [value, setValue] = useState("d2");
  return (
    <DayRail
      days={days}
      value={value}
      onChange={setValue}
      numberOf={(day) => days.findIndex((entry) => entry.id === day.id) + 1}
      idPrefix="preview-rail"
    />
  );
};

/** A long leg scrolls horizontally rather than wrapping into a second line. */
export const ALongLeg = () => {
  const long: TripDayPlan[] = Array.from({ length: 11 }, (_, index) => ({
    id: `long-${index}`,
    date: `2026-11-${String(20 + index).padStart(2, "0")}`,
    destinationId: "kyoto",
    morning: index % 3 === 0 ? undefined : "Something planned.",
  }));
  const [value, setValue] = useState("long-0");
  return (
    <DayRail
      days={long}
      value={value}
      onChange={setValue}
      numberOf={(day) => long.findIndex((entry) => entry.id === day.id) + 1}
      idPrefix="preview-rail-long"
    />
  );
};

/** Two days is still a rail: a weekend gets the same control, not a different one. */
export const AWeekend = () => {
  const short = days.slice(0, 2);
  const [value, setValue] = useState("d1");
  return (
    <DayRail
      days={short}
      value={value}
      onChange={setValue}
      numberOf={(day) => short.findIndex((entry) => entry.id === day.id) + 1}
      idPrefix="preview-rail-short"
    />
  );
};
