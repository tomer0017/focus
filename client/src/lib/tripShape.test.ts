import { describe, expect, it } from "vitest";
import {
  LEGACY_NOTE_ID,
  daysUntilTrip,
  featuredTrip,
  noteBlocksFor,
  pastTrips,
  tripAreas,
  tripKindOf,
  tripPhase,
  tripReadiness,
  upcomingTrips,
} from "./tripShape";
import { addDaysToKey, todayKey } from "./dateKey";
import type { Trip } from "../types";

const NOW = new Date("2026-05-10T09:00:00.000Z");

function trip(patch: Partial<Trip> = {}): Trip {
  return {
    id: "t1",
    title: "A trip",
    countries: [],
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    status: "planned",
    flights: [],
    stays: [],
    destinations: [],
    days: [],
    food: [],
    outfits: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

describe("tripKindOf", () => {
  it("uses the kind the user chose, whatever the trip looks like", () => {
    const stored = trip({ kind: "outdoors", flights: [{ id: "f" }] });
    expect(tripKindOf(stored)).toBe("outdoors");
  });

  it("reads a flight as a trip abroad", () => {
    expect(tripKindOf(trip({ flights: [{ id: "f" }] }))).toBe("abroad");
  });

  it("reads two or three days with no flight as a weekend", () => {
    expect(tripKindOf(trip({ startDate: "2026-06-01", endDate: "2026-06-02" }))).toBe("weekend");
    expect(tripKindOf(trip({ startDate: "2026-06-01", endDate: "2026-06-03" }))).toBe("weekend");
  });

  it("reads one place with somewhere booked to sleep as a hotel stay", () => {
    const stay = trip({
      startDate: "2026-06-01",
      endDate: "2026-06-06",
      destinations: [{ id: "d", name: "Eilat", goodToKnow: [], savedItemIds: [] }],
      stays: [{ id: "s", name: "Hotel" }],
    });
    expect(tripKindOf(stay)).toBe("hotel");
  });

  it("never writes the derived kind back onto the trip", () => {
    const bare = trip({ flights: [{ id: "f" }] });
    tripKindOf(bare);
    expect(bare.kind).toBeUndefined();
  });
});

describe("tripAreas", () => {
  it("always offers a checklist and somewhere to write", () => {
    // There is no `overview` area any more: the identity, the route and what
    // matters today sit above the tabs, so a tab repeating them would be the
    // same information twice on one screen.
    const areas = tripAreas(trip({ kind: "outdoors" }), 0, NOW);
    expect(areas).not.toContain("overview");
    expect(areas).toContain("checklist");
    expect(areas).toContain("notes");
  });

  it("opens a camping trip on its notes", () => {
    expect(tripAreas(trip({ kind: "outdoors" }), 0, NOW)[0]).toBe("notes");
  });

  it("opens a finished trip on its notes rather than on open work", () => {
    const over = trip({ kind: "abroad", startDate: "2026-01-05", endDate: "2026-01-09" });
    expect(tripAreas(over, 0, NOW)[0]).toBe("notes");
  });

  it("opens a trip abroad on the itinerary", () => {
    expect(tripAreas(trip({ kind: "abroad" }), 0, NOW)[0]).toBe("itinerary");
  });

  it("gives a camping trip no bookings tab and no outfit planner", () => {
    const areas = tripAreas(trip({ kind: "outdoors" }), 0, NOW);
    expect(areas).not.toContain("bookings");
    expect(areas).not.toContain("outfits");
  });

  it("gives a trip abroad both, even before anything is booked", () => {
    const areas = tripAreas(trip({ kind: "abroad" }), 0, NOW);
    expect(areas).toContain("bookings");
    expect(areas).toContain("outfits");
    expect(areas).toContain("itinerary");
  });

  it("adds an area as soon as it holds something", () => {
    const withFlight = trip({ kind: "outdoors", flights: [{ id: "f" }] });
    expect(tripAreas(withFlight, 0, NOW)).toContain("bookings");

    const withOutfit = trip({
      kind: "weekend",
      outfits: [{ id: "o", dayIds: [], clothingItems: [], status: "idea", order: 0 }],
    });
    expect(tripAreas(withOutfit, 0, NOW)).toContain("outfits");
  });

  it("shows saved items once the trip has some", () => {
    expect(tripAreas(trip({ kind: "weekend" }), 0, NOW)).not.toContain("saved");
    expect(tripAreas(trip({ kind: "weekend" }), 2, NOW)).toContain("saved");
  });

  it("drops an area a finished trip never filled in", () => {
    // "You will want to fill this in" is a claim about the future.
    const over = trip({
      kind: "abroad",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      destinations: [{ id: "d", name: "Lisbon", goodToKnow: [], savedItemIds: [] }],
      flights: [{ id: "f" }],
    });
    const areas = tripAreas(over, 0, NOW);
    expect(areas).toContain("itinerary");
    expect(areas).toContain("bookings");
    expect(areas).not.toContain("outfits");
  });

  it("keeps an area a finished trip did fill in", () => {
    const over = trip({
      kind: "abroad",
      startDate: "2026-01-05",
      endDate: "2026-01-09",
      outfits: [{ id: "o", dayIds: [], clothingItems: [], status: "idea", order: 0 }],
    });
    expect(tripAreas(over, 0, NOW)).toContain("outfits");
  });

  it("keeps the areas in one order for a given kind", () => {
    expect(tripAreas(trip({ kind: "abroad" }), 1, NOW)).toEqual([
      "itinerary",
      "bookings",
      "outfits",
      "checklist",
      "saved",
      "notes",
    ]);
  });
});

describe("tripReadiness", () => {
  it("does not ask a camping trip for a flight", () => {
    const readiness = tripReadiness(trip({ kind: "outdoors" }));
    expect(readiness.missing).not.toContain("flights");
    expect(readiness.missing).not.toContain("stays");
  });

  it("asks a trip abroad for flights, somewhere to sleep and a plan", () => {
    const readiness = tripReadiness(trip({ kind: "abroad" }));
    expect(readiness.missing).toEqual(
      expect.arrayContaining(["flights", "stays", "days", "where", "packing"])
    );
  });

  it("counts a check as done once the trip answers it", () => {
    const bare = tripReadiness(trip({ kind: "hotel" }));
    const booked = tripReadiness(trip({ kind: "hotel", stays: [{ id: "s", name: "Hotel" }] }));
    expect(booked.done).toBe(bare.done + 1);
    expect(booked.total).toBe(bare.total);
  });

  it("counts packing as done only when every item is ticked", () => {
    expect(tripReadiness(trip(), 3, 5).missing).toContain("packing");
    expect(tripReadiness(trip(), 5, 5).missing).not.toContain("packing");
    // No list at all is not a finished list.
    expect(tripReadiness(trip(), 0, 0).missing).toContain("packing");
  });

  it("never reports more done than there are checks", () => {
    const readiness = tripReadiness(
      trip({
        kind: "abroad",
        countries: ["Japan"],
        flights: [{ id: "f" }],
        stays: [{ id: "s", name: "Hotel" }],
        days: [{ id: "d", date: "2026-06-01", destinationId: "x" }],
      }),
      4,
      4
    );
    expect(readiness.done).toBe(readiness.total);
    expect(readiness.missing).toEqual([]);
  });
});

describe("tripPhase and daysUntilTrip", () => {
  it("counts a trip starting today as travelling, not upcoming", () => {
    const today = todayKey(NOW);
    expect(tripPhase(trip({ startDate: today, endDate: addDaysToKey(today, 3) }), NOW)).toBe(
      "travelling"
    );
  });

  it("counts the last day as still travelling, and the day after as past", () => {
    const today = todayKey(NOW);
    expect(tripPhase(trip({ startDate: addDaysToKey(today, -3), endDate: today }), NOW)).toBe(
      "travelling"
    );
    expect(
      tripPhase(trip({ startDate: addDaysToKey(today, -4), endDate: addDaysToKey(today, -1) }), NOW)
    ).toBe("past");
  });

  it("measures the countdown in whole days from today", () => {
    const today = todayKey(NOW);
    expect(daysUntilTrip(trip({ startDate: addDaysToKey(today, 7) }), NOW)).toBe(7);
    expect(daysUntilTrip(trip({ startDate: today }), NOW)).toBe(0);
  });
});

describe("sorting and featuring", () => {
  const today = todayKey(NOW);
  const soon = trip({ id: "soon", startDate: addDaysToKey(today, 5), endDate: addDaysToKey(today, 7) });
  const later = trip({ id: "later", startDate: addDaysToKey(today, 40), endDate: addDaysToKey(today, 44) });
  const oldTrip = trip({ id: "old", startDate: addDaysToKey(today, -300), endDate: addDaysToKey(today, -295) });
  const recent = trip({ id: "recent", startDate: addDaysToKey(today, -30), endDate: addDaysToKey(today, -25) });
  const all = [later, oldTrip, soon, recent];

  it("puts upcoming trips soonest first", () => {
    expect(upcomingTrips(all, NOW).map((entry) => entry.id)).toEqual(["soon", "later"]);
  });

  it("puts past trips most recent first", () => {
    expect(pastTrips(all, NOW).map((entry) => entry.id)).toEqual(["recent", "old"]);
  });

  it("features the next trip and nothing else", () => {
    expect(featuredTrip(all, NOW)?.id).toBe("soon");
  });

  it("features nothing when every trip is behind us", () => {
    expect(featuredTrip([oldTrip, recent], NOW)).toBeUndefined();
  });

  it("features a trip that is happening now over one that is merely next", () => {
    const current = trip({
      id: "current",
      startDate: addDaysToKey(today, -1),
      endDate: addDaysToKey(today, 2),
    });
    expect(featuredTrip([soon, current], NOW)?.id).toBe("current");
  });
});

describe("noteBlocksFor", () => {
  it("reads the legacy single note as one block when blocks were never written", () => {
    const blocks = noteBlocksFor(trip({ notes: "Eleven days, three cities." }));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe("Eleven days, three cities.");
    expect(blocks[0].id).toBe(LEGACY_NOTE_ID);
  });

  it("keeps an emptied list empty rather than resurrecting the old note", () => {
    expect(noteBlocksFor(trip({ notes: "Old text", noteBlocks: [] }))).toEqual([]);
  });

  it("prefers written blocks over the legacy note", () => {
    const blocks = noteBlocksFor(
      trip({ notes: "Old text", noteBlocks: [{ id: "n1", content: "New", order: 0 }] })
    );
    expect(blocks.map((block) => block.content)).toEqual(["New"]);
  });

  it("returns blocks in their stored order", () => {
    const blocks = noteBlocksFor(
      trip({
        noteBlocks: [
          { id: "b", content: "second", order: 1 },
          { id: "a", content: "first", order: 0 },
        ],
      })
    );
    expect(blocks.map((block) => block.content)).toEqual(["first", "second"]);
  });

  it("treats a whitespace-only legacy note as no note at all", () => {
    expect(noteBlocksFor(trip({ notes: "   " }))).toEqual([]);
  });
});
