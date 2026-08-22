import { addDaysToKey, daysBetweenKeys, todayKey } from "./dateKey";
import type { Trip, TripDayPlan, TripDestination } from "../types";

/** Whole days from the first to the last, inclusive. */
export function tripLength(trip: Trip): number {
  return daysBetweenKeys(trip.startDate, trip.endDate) + 1;
}

/** Every date of the trip, in order. */
export function tripDates(trip: Trip): string[] {
  const total = tripLength(trip);
  return Array.from({ length: Math.max(0, total) }, (_, index) =>
    addDaysToKey(trip.startDate, index)
  );
}

/** The destination a given day belongs to, from the day plan or the dates. */
export function destinationForDate(trip: Trip, date: string): TripDestination | undefined {
  const planned = trip.days.find((day) => day.date === date);
  if (planned) {
    return trip.destinations.find((destination) => destination.id === planned.destinationId);
  }
  return trip.destinations.find(
    (destination) =>
      destination.arriveOn !== undefined &&
      destination.leaveOn !== undefined &&
      date >= destination.arriveOn &&
      date <= destination.leaveOn
  );
}

export function daysForDestination(trip: Trip, destinationId: string): TripDayPlan[] {
  return trip.days
    .filter((day) => day.destinationId === destinationId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nightsAt(destination: TripDestination): number | null {
  if (!destination.arriveOn || !destination.leaveOn) return null;
  return daysBetweenKeys(destination.arriveOn, destination.leaveOn);
}

/** The next flight that has not departed yet. */
export function nextFlight(trip: Trip, now: Date = new Date()) {
  return trip.flights
    .filter((flight) => flight.departsAt && flight.departsAt >= now.toISOString())
    .sort((a, b) => (a.departsAt ?? "").localeCompare(b.departsAt ?? ""))[0];
}

/** The next place to sleep, counting from today. */
export function nextStay(trip: Trip) {
  const today = todayKey();
  return trip.stays
    .filter((stay) => !stay.checkOut || stay.checkOut >= today)
    .sort((a, b) => (a.checkIn ?? "").localeCompare(b.checkIn ?? ""))[0];
}

/* ------------------------------------------------------------ editing ---- */

/** New id for something created inside a trip. */
export function tripId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Moves an item one place in an array. Pure; returns the array unchanged at the ends. */
export function moveInArray<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Reorders a day within its destination by swapping dates with its neighbour.
 *
 * Days are ordered by their date, so "move up" has to mean "happen earlier" —
 * an extra order field would let the list disagree with the calendar, and then
 * the itinerary and the day cards would tell two different stories.
 */
export function swapDayDates(days: TripDayPlan[], dayId: string, direction: -1 | 1): TripDayPlan[] {
  const day = days.find((entry) => entry.id === dayId);
  if (!day) return days;

  const siblings = days
    .filter((entry) => entry.destinationId === day.destinationId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const index = siblings.findIndex((entry) => entry.id === dayId);
  const neighbour = siblings[index + direction];
  if (!neighbour) return days;

  return days.map((entry) => {
    if (entry.id === day.id) return { ...entry, date: neighbour.date };
    if (entry.id === neighbour.id) return { ...entry, date: day.date };
    return entry;
  });
}

/** Every date in the trip that has no day plan yet. */
export function freeDates(trip: Trip): string[] {
  const taken = new Set(trip.days.map((day) => day.date));
  return tripDates(trip).filter((date) => !taken.has(date));
}
