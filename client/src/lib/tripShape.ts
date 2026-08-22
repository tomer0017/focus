import { daysBetweenKeys, todayKey } from "./dateKey";
import { tripLength } from "./trips";
import type { ProjectNote, Trip, TripKind } from "../types";

/**
 * What kind of trip this is, for a trip that never said.
 *
 * Derived on every read, never written back. A trip stored before `kind`
 * existed still has to open on the right shape of screen, and a migration that
 * guessed one and saved it would freeze the guess: the user could never see it
 * change after adding a flight. Reading it fresh means the answer improves as
 * the trip fills in.
 *
 * The order matters. Flights are the only unambiguous signal — nobody flies to
 * a campsite up north — so they win. After that it is length: two or three days
 * is a weekend however it is spent, and a single place with somewhere booked to
 * sleep is a hotel holiday.
 */
export function tripKindOf(trip: Trip): TripKind {
  if (trip.kind) return trip.kind;
  if (trip.flights.length > 0) return "abroad";
  if (tripLength(trip) <= 3) return "weekend";
  if (trip.destinations.length <= 1 && trip.stays.length > 0) return "hotel";
  return "abroad";
}

/**
 * The parts of a trip screen.
 *
 * There is no `overview` any more. Everything an overview held — the identity,
 * the route, the next action, the first flight, what is missing and how the
 * packing is going — now sits *above* the tabs, where it is read without a
 * click. A tab repeating it was the same information twice on one screen, which
 * is the duplication this app refuses.
 */
export const TRIP_AREAS = [
  "itinerary",
  "bookings",
  "outfits",
  "checklist",
  "saved",
  "notes",
] as const;

export type TripArea = (typeof TRIP_AREAS)[number];

/**
 * Which areas this trip shows.
 *
 * An area appears when it *holds* something, or when the kind of trip says it
 * is a place the user will want to start filling in. That second clause is what
 * keeps a new trip abroad from opening with no itinerary tab and no way to make
 * one; the first is what keeps a camping weekend from carrying an empty
 * "bookings" tab and an outfit planner nobody asked for.
 *
 * `overview` and `checklist` are unconditional: every trip has something worth
 * saying at the top, and a checklist is the one thing every kind of trip uses.
 */
export function tripAreas(trip: Trip, savedCount = 0, now: Date = new Date()): TripArea[] {
  const kind = tripKindOf(trip);
  /*
   * Once a trip is over, the kind stops earning an area — only content does.
   * "You will want to fill this in" is a statement about the future, and a
   * finished trip has none: an empty outfit planner on a trip you took last
   * spring is a tab that can only ever stay empty.
   */
  const over = tripPhase(trip, now) === "past";
  const has = {
    itinerary: trip.days.length > 0 || trip.destinations.length > 0,
    bookings: trip.flights.length > 0 || trip.stays.length > 0,
    outfits: trip.outfits.length > 0,
    saved: savedCount > 0,
    notes: noteBlocksFor(trip).length > 0,
  };

  const present = TRIP_AREAS.filter((area) => {
    switch (area) {
      case "checklist":
        return true;
      case "itinerary":
        return has.itinerary || (!over && (kind === "abroad" || kind === "hotel"));
      case "bookings":
        return has.bookings || (!over && (kind === "abroad" || kind === "hotel"));
      case "outfits":
        return has.outfits || (!over && kind === "abroad");
      case "saved":
        return has.saved || (!over && kind === "outdoors");
      case "notes":
        // Always reachable: somewhere to write the thing you just remembered.
        return true;
    }
  });

  return orderAreas(present, kind, over);
}

/**
 * Which area a trip opens on, and the order of the rest.
 *
 * A camping trip *is* what somebody wrote down and the pictures they kept, so
 * it opens on notes; a finished trip opens there too, because the only thing
 * still worth doing to it is writing down what to change next time. Everything
 * else opens on the itinerary, which is the thing the route strip above the
 * tabs is already pointing at.
 */
function orderAreas(areas: TripArea[], kind: TripKind, over: boolean): TripArea[] {
  const lead: TripArea[] =
    over || kind === "outdoors" ? ["notes", "saved", "checklist"] : ["itinerary", "bookings"];

  return [...areas].sort((a, b) => {
    const rankA = lead.indexOf(a);
    const rankB = lead.indexOf(b);
    if (rankA !== -1 || rankB !== -1) {
      return (rankA === -1 ? lead.length : rankA) - (rankB === -1 ? lead.length : rankB);
    }
    return TRIP_AREAS.indexOf(a) - TRIP_AREAS.indexOf(b);
  });
}

/**
 * How ready a trip is, as a count of the things it asked for and has.
 *
 * Deliberately not a percentage of "the trip": there is no such number, and
 * inventing one would be the vanity metric this app refuses. These are five
 * concrete questions a trip either answers or does not, and which five depends
 * on the kind — asking a camping weekend for a flight would make it permanently
 * 80% ready.
 */
export interface TripReadiness {
  done: number;
  total: number;
  /** The checks not yet answered, as translation-key suffixes. */
  missing: string[];
}

export function tripReadiness(trip: Trip, checklistDone = 0, checklistTotal = 0): TripReadiness {
  const kind = tripKindOf(trip);

  const checks: { key: string; ok: boolean }[] = [
    { key: "dates", ok: Boolean(trip.startDate && trip.endDate) },
    { key: "where", ok: trip.destinations.length > 0 || trip.countries.length > 0 },
  ];

  if (kind === "abroad") {
    checks.push({ key: "flights", ok: trip.flights.length > 0 });
    checks.push({ key: "stays", ok: trip.stays.length > 0 });
    checks.push({ key: "days", ok: trip.days.length > 0 });
  } else if (kind === "hotel") {
    checks.push({ key: "stays", ok: trip.stays.length > 0 });
  } else if (kind === "outdoors") {
    checks.push({ key: "notes", ok: noteBlocksFor(trip).length > 0 });
  }

  checks.push({ key: "packing", ok: checklistTotal > 0 && checklistDone === checklistTotal });

  return {
    done: checks.filter((check) => check.ok).length,
    total: checks.length,
    missing: checks.filter((check) => !check.ok).map((check) => check.key),
  };
}

/**
 * Where the trip is in time. `travelling` is a fact about the calendar, not the
 * planning status the user set — a trip can be marked `booking` and still be
 * happening, and the screen has to stop nagging about preparation on day one.
 */
export type TripPhase = "upcoming" | "travelling" | "past";

export function tripPhase(trip: Trip, now: Date = new Date()): TripPhase {
  const today = todayKey(now);
  if (today > trip.endDate) return "past";
  if (today >= trip.startDate) return "travelling";
  return "upcoming";
}

/** Whole days until departure. Negative once it has started. */
export function daysUntilTrip(trip: Trip, now: Date = new Date()): number {
  return daysBetweenKeys(todayKey(now), trip.startDate);
}

/**
 * Upcoming and current trips first, soonest first; past trips after, most
 * recent first — a trip you just got back from is the one you want to write up.
 */
export function sortTripsForList(trips: Trip[], now: Date = new Date()): Trip[] {
  return [...trips].sort((a, b) => {
    const phaseA = tripPhase(a, now);
    const phaseB = tripPhase(b, now);
    if (phaseA === "past" && phaseB === "past") return b.startDate.localeCompare(a.startDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

export function upcomingTrips(trips: Trip[], now: Date = new Date()): Trip[] {
  return sortTripsForList(trips, now).filter((trip) => tripPhase(trip, now) !== "past");
}

export function pastTrips(trips: Trip[], now: Date = new Date()): Trip[] {
  return sortTripsForList(trips, now).filter((trip) => tripPhase(trip, now) === "past");
}

/**
 * The trip the screen leads with: the one happening now, or the next one.
 * Nothing is featured when everything is behind us — a screen that insists on a
 * hero would have to promote a trip from two years ago.
 */
export function featuredTrip(trips: Trip[], now: Date = new Date()): Trip | undefined {
  return upcomingTrips(trips, now)[0];
}

/* ----------------------------------------------------------------- notes -- */

/** Marks the block derived from the legacy single note, so it is never stored. */
export const LEGACY_NOTE_ID = "trip-note-legacy";

/**
 * A trip's notes as blocks.
 *
 * `noteBlocks === undefined` means the trip has never had its notes edited, so
 * the old single `notes` string is read as one block. `[]` means the user
 * deleted every block and must stay empty. Collapsing those two would silently
 * wipe the note off every trip written before blocks existed.
 */
export function noteBlocksFor(trip: Trip): ProjectNote[] {
  if (trip.noteBlocks !== undefined) {
    return [...trip.noteBlocks].sort((a, b) => a.order - b.order);
  }
  if (trip.notes?.trim()) {
    return [{ id: LEGACY_NOTE_ID, content: trip.notes, order: 0 }];
  }
  return [];
}
