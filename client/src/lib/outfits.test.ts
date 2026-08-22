import { describe, expect, it } from "vitest";
import {
  addSuggestionsToChecklist,
  checklistNames,
  normaliseName,
  packingSuggestions,
} from "./outfits";
import type { Checklist } from "../types/checklist";
import type { Trip, TripOutfit } from "../types/trip";

/** Ids are irrelevant to the merge, but the model requires them. */
let counter = 0;
const itemId = (): string => `ci-${(counter += 1)}`;

function outfit(overrides: Partial<TripOutfit> = {}): TripOutfit {
  return {
    id: "o1",
    dayIds: ["d1"],
    clothingItems: [],
    status: "selected",
    order: 0,
    ...overrides,
  };
}

function trip(outfits: TripOutfit[]): Trip {
  return {
    id: "japan-2027",
    title: "Japan",
    status: "planning",
    startsAt: "2027-04-01T00:00:00.000Z",
    endsAt: "2027-04-14T00:00:00.000Z",
    destinations: [],
    days: [],
    flights: [],
    stays: [],
    food: [],
    outfits,
    createdAt: "2026-01-01T00:00:00.000Z",
  } as unknown as Trip;
}

describe("normaliseName", () => {
  it("folds case and collapses whitespace", () => {
    expect(normaliseName("  Black   Shirt ")).toBe("black shirt");
    expect(normaliseName("Walking shoes")).toBe(normaliseName("walking  SHOES"));
  });
});

describe("packingSuggestions", () => {
  it("merges the same garment across looks", () => {
    const suggestions = packingSuggestions(
      trip([
        outfit({ id: "a", dayIds: ["d1"], clothingItems: [{ id: itemId(), name: "Walking shoes" }] }),
        outfit({ id: "b", dayIds: ["d2"], clothingItems: [{ id: itemId(), name: "walking  shoes" }] }),
      ])
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].dayIds).toEqual(["d1", "d2"]);
  });

  it("takes the maximum quantity, never the sum", () => {
    // Three looks needing walking shoes need one pair. A suggestion that says
    // three is worse than no suggestion.
    const suggestions = packingSuggestions(
      trip([
        outfit({ id: "a", clothingItems: [{ id: itemId(), name: "Socks", quantity: 3 }] }),
        outfit({ id: "b", clothingItems: [{ id: itemId(), name: "Socks", quantity: 5 }] }),
        outfit({ id: "c", clothingItems: [{ id: itemId(), name: "Socks", quantity: 2 }] }),
      ])
    );
    expect(suggestions[0].quantity).toBe(5);
  });

  it("keeps the first spelling the user used", () => {
    const suggestions = packingSuggestions(
      trip([
        outfit({ id: "a", clothingItems: [{ id: itemId(), name: "Linen Shirt" }] }),
        outfit({ id: "b", clothingItems: [{ id: itemId(), name: "linen shirt" }] }),
      ])
    );
    expect(suggestions[0].name).toBe("Linen Shirt");
  });

  it("ignores looks that are only ideas", () => {
    const suggestions = packingSuggestions(
      trip([outfit({ id: "idea", status: "idea", clothingItems: [{ id: itemId(), name: "Hat" }] })])
    );
    expect(suggestions).toHaveLength(0);
  });

  it("skips a blank garment name", () => {
    const suggestions = packingSuggestions(
      trip([outfit({ clothingItems: [{ id: itemId(), name: "   " }, { id: itemId(), name: "Hat" }] })])
    );
    expect(suggestions.map((entry) => entry.name)).toEqual(["Hat"]);
  });
});

describe("addSuggestionsToChecklist", () => {
  const empty: Checklist = {
    ownerId: "trip:japan-2027",
    groups: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("adds nothing twice", () => {
    const suggestions = packingSuggestions(trip([outfit({ clothingItems: [{ id: itemId(), name: "Hat" }] })]));
    const once = addSuggestionsToChecklist(empty, suggestions);
    const twice = addSuggestionsToChecklist(once, suggestions);

    const count = (list: Checklist): number =>
      list.groups.reduce((total, group) => total + group.items.length, 0);
    expect(count(twice)).toBe(count(once));
  });

  it("returns the same list untouched when there is nothing new", () => {
    const suggestions = packingSuggestions(trip([outfit({ clothingItems: [{ id: itemId(), name: "Hat" }] })]));
    const once = addSuggestionsToChecklist(empty, suggestions);
    expect(addSuggestionsToChecklist(once, suggestions)).toBe(once);
  });

  it("does not re-add something the user already wrote by hand", () => {
    const byHand: Checklist = {
      ...empty,
      groups: [{ id: "g", title: "Mine", items: [{ id: "i", text: "hat", done: true }] }],
    };
    const suggestions = packingSuggestions(trip([outfit({ clothingItems: [{ id: itemId(), name: "Hat" }] })]));
    expect(addSuggestionsToChecklist(byHand, suggestions)).toBe(byHand);
  });

  it("reads existing names case-insensitively", () => {
    const list: Checklist = {
      ...empty,
      groups: [{ id: "g", title: "Mine", items: [{ id: "i", text: "  WALKING shoes ", done: false }] }],
    };
    expect(checklistNames(list).has("walking shoes")).toBe(true);
  });
});
