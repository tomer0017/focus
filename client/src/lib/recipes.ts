import type { CollectionEntry, EntryStatus } from "../types";

/** The three groups the cooking board shows, in order. */
export type RecipeGroup = "want_to_try" | "tried" | "recommended";

export const RECIPE_GROUPS: RecipeGroup[] = ["want_to_try", "tried", "recommended"];

/**
 * Which group an entry belongs to.
 *
 * Recommended entries appear under "recommended" and not also under "tried" —
 * showing them twice on one board is exactly the duplication the rest of the
 * app avoids — but they remain `tried` in the data, which is the truth.
 */
export function groupOf(entry: CollectionEntry): RecipeGroup {
  if (entry.recommended) return "recommended";
  return entry.status === "tried" ? "tried" : "want_to_try";
}

/** What dropping an entry into a group means for its two fields. */
export function statusForGroup(group: RecipeGroup): {
  status: EntryStatus;
  recommended: boolean;
} {
  switch (group) {
    case "want_to_try":
      // Back to the queue: it has not been done, so it cannot be recommended.
      return { status: "want_to_try", recommended: false };
    case "tried":
      // Out of "recommended" only clears the flag; it stays tried.
      return { status: "tried", recommended: false };
    case "recommended":
      // You cannot recommend something you have not tried.
      return { status: "tried", recommended: true };
  }
}

export function entriesInGroup(entries: CollectionEntry[], group: RecipeGroup): CollectionEntry[] {
  return entries
    .filter((entry) => groupOf(entry) === group)
    .sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
}

/** Every tag in use, most-used first, then alphabetically. */
export function allTags(entries: CollectionEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

export function hasTag(entry: CollectionEntry, tag: string): boolean {
  const needle = tag.trim().toLowerCase();
  return entry.tags.some((value) => value.toLowerCase() === needle);
}

/**
 * Search across an entry's own words *and its tags*, so typing a holiday name
 * finds the recipes filed under it.
 */
export function searchEntries(entries: CollectionEntry[], query: string): CollectionEntry[] {
  const term = query.trim().toLowerCase();
  if (!term) return entries;

  return entries.filter((entry) =>
    [entry.title, entry.note, entry.description, entry.nextTime, ...entry.tags]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(term))
  );
}

/** Total time, when both halves are known. */
export function totalMinutes(entry: CollectionEntry): number | null {
  if (entry.prepMinutes === undefined && entry.cookMinutes === undefined) return null;
  return (entry.prepMinutes ?? 0) + (entry.cookMinutes ?? 0);
}

/**
 * Two recipes with their positions exchanged, and **nothing else touched**.
 *
 * This exists because of a defect a real pointer found. Ordering used to
 * renumber a whole group `0..n` — but only the entries sharing the moved
 * recipe's `pageId`, while the column on screen merges every collection page
 * and sorts by `order`. Renumbering one page's run therefore slid it wholesale
 * past the others: one press of "move down" changed the stored order of
 * fifteen recipes and visibly reshuffled cards the user had never touched.
 *
 * Swapping is the smallest thing that cannot do that. Exactly two records
 * change, so no third recipe can move, whichever collections the two belong to
 * — and a future server writes it as a two-row scoped update rather than a
 * renumbering pass.
 *
 * Where either side has no `order` yet, both take their current positions in
 * the group first, so the swap has two distinct numbers to exchange instead of
 * silently doing nothing.
 */
export function swapOrder(
  entries: CollectionEntry[],
  aId: string,
  bId: string
): CollectionEntry[] {
  if (aId === bId) return entries;

  const a = entries.find((entry) => entry.id === aId);
  const b = entries.find((entry) => entry.id === bId);
  if (!a || !b) return entries;

  const group = groupOf(a);
  // Positions within the group as it is actually displayed, used only as a
  // fallback for entries that have never been ordered.
  const positions = new Map(
    entriesInGroup(entries, group).map((entry, index) => [entry.id, index])
  );

  const orderA = a.order ?? positions.get(a.id) ?? 0;
  const orderB = b.order ?? positions.get(b.id) ?? 0;
  // Equal values would sort by title and the swap would be invisible.
  const [nextA, nextB] =
    orderA === orderB ? [orderB + 1, orderA] : [orderB, orderA];

  return entries.map((entry) => {
    if (entry.id === aId) return { ...entry, order: nextA };
    if (entry.id === bId) return { ...entry, order: nextB };
    return entry;
  });
}
