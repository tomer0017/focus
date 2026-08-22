import type { Checklist, Trip, TripOutfit } from "../types";
import { checklistId } from "./checklist";

/** The group a packing suggestion lands in. Translated at render time. */
export const OUTFIT_GROUP_KEY = "groups.outfits";

export function outfitsForDay(outfits: TripOutfit[], dayId: string): TripOutfit[] {
  return outfits.filter((outfit) => outfit.dayIds.includes(dayId));
}

/** The look actually chosen for a day, if one has been. */
export function selectedOutfitForDay(outfits: TripOutfit[], dayId: string): TripOutfit | undefined {
  return outfitsForDay(outfits, dayId).find((outfit) => outfit.status === "selected");
}

export function sortedOutfits(outfits: TripOutfit[]): TripOutfit[] {
  return [...outfits].sort((a, b) => a.order - b.order);
}

/** Case- and space-insensitive, so "Black shirt" and "black  shirt" are one thing. */
export function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface PackingSuggestion {
  key: string;
  /** The first spelling the user used, kept as-is. */
  name: string;
  /** The largest count asked for by any one look. */
  quantity: number;
  dayIds: string[];
  outfitIds: string[];
}

/**
 * What the chosen looks require, merged.
 *
 * Only `selected` looks count: ideas are ideas. Quantities take the maximum
 * rather than the sum — three looks each needing "walking shoes" need one pair,
 * not three, and a suggestion that says three is worse than no suggestion.
 */
export function packingSuggestions(trip: Trip): PackingSuggestion[] {
  const merged = new Map<string, PackingSuggestion>();

  for (const outfit of trip.outfits.filter((entry) => entry.status === "selected")) {
    for (const item of outfit.clothingItems) {
      const key = normaliseName(item.name);
      if (!key) continue;

      const existing = merged.get(key);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, item.quantity ?? 1);
        existing.dayIds = [...new Set([...existing.dayIds, ...outfit.dayIds])];
        existing.outfitIds = [...new Set([...existing.outfitIds, outfit.id])];
      } else {
        merged.set(key, {
          key,
          name: item.name.trim(),
          quantity: item.quantity ?? 1,
          dayIds: [...outfit.dayIds],
          outfitIds: [outfit.id],
        });
      }
    }
  }

  return [...merged.values()].sort((a, b) => b.dayIds.length - a.dayIds.length);
}

/** Names already on a checklist, normalised, so nothing is added twice. */
export function checklistNames(checklist: Checklist | undefined): Set<string> {
  if (!checklist) return new Set();
  return new Set(
    checklist.groups.flatMap((group) =>
      group.items.map((item) => normaliseName(item.text ?? item.textKey ?? ""))
    )
  );
}

/**
 * Adds suggestions the list does not already hold, into one group.
 *
 * Nothing is added without being asked for, and removing a look later never
 * removes an item from the packing list: once it is on the list it is the
 * user's line, not a derived one.
 */
export function addSuggestionsToChecklist(
  checklist: Checklist,
  suggestions: PackingSuggestion[]
): Checklist {
  const existing = checklistNames(checklist);
  const wanted = suggestions.filter((suggestion) => !existing.has(suggestion.key));
  if (wanted.length === 0) return checklist;

  let next = checklist;
  let group = next.groups.find((entry) => entry.titleKey === OUTFIT_GROUP_KEY);
  if (!group) {
    next = {
      ...next,
      groups: [
        ...next.groups,
        { id: checklistId("group"), titleKey: OUTFIT_GROUP_KEY, items: [] },
      ],
    };
    group = next.groups[next.groups.length - 1];
  }

  const groupId = group.id;
  /*
   * The quantity goes in the note, not into the text.
   *
   * Writing "black shirt ×2" as the item's words means the next run compares
   * "black shirt" against "black shirt ×2", finds no match, and adds it a
   * second time. Keeping the name clean is what makes "already on the list"
   * decidable at all.
   */
  return {
    ...next,
    groups: next.groups.map((entry) =>
      entry.id !== groupId
        ? entry
        : {
            ...entry,
            items: [
              ...entry.items,
              ...wanted.map((suggestion) => ({
                id: checklistId("item"),
                text: suggestion.name,
                note: suggestion.quantity > 1 ? `×${suggestion.quantity}` : undefined,
                done: false,
              })),
            ],
          }
    ),
    updatedAt: new Date().toISOString(),
  };
}
