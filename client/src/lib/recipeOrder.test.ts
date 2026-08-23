/**
 * Recipe ordering on the cooking board.
 *
 * The defect a real pointer found: the board merges every collection page into
 * three columns and sorts by `order`, but ordering renumbered `0..n` **only the
 * entries sharing the moved recipe's `pageId`**. That slid one collection's run
 * wholesale past the others — a single "move down" changed the stored order of
 * fifteen recipes and visibly reshuffled cards nobody had touched.
 *
 * Swapping is the smallest thing that cannot do that: exactly two records
 * change, so no third recipe can move.
 */
import { describe, expect, it } from "vitest";
import { entriesInGroup, groupOf, statusForGroup, swapOrder } from "./recipes";
import type { CollectionEntry } from "../types";

function recipe(
  id: string,
  page: string,
  order: number | undefined,
  extra: Partial<CollectionEntry> = {}
): CollectionEntry {
  return {
    id,
    pageId: page,
    title: id,
    status: "tried",
    recommended: false,
    tags: [],
    order,
    ...extra,
  } as CollectionEntry;
}

/*
 * Two collections interleaved down one column — the shape that exposed it.
 * pizza:  orders 10, 11, 12
 * holiday: orders 0, 1
 * Displayed by order: holiday-a, holiday-b, pizza-a, pizza-b, pizza-c
 */
const MIXED = [
  recipe("pizza-a", "pizza", 10),
  recipe("pizza-b", "pizza", 11),
  recipe("pizza-c", "pizza", 12),
  recipe("holiday-a", "holiday", 0),
  recipe("holiday-b", "holiday", 1),
];

const shown = (entries: CollectionEntry[]) =>
  entriesInGroup(entries, "tried").map((entry) => entry.id);

describe("swapping two recipes", () => {
  it("exchanges exactly the two positions asked for", () => {
    expect(shown(MIXED)).toEqual(["holiday-a", "holiday-b", "pizza-a", "pizza-b", "pizza-c"]);
    const after = swapOrder(MIXED, "pizza-a", "pizza-b");
    expect(shown(after)).toEqual(["holiday-a", "holiday-b", "pizza-b", "pizza-a", "pizza-c"]);
  });

  it("changes exactly two records — the regression", () => {
    // The old renumbering rewrote a whole page's group. This must not.
    const after = swapOrder(MIXED, "pizza-a", "pizza-b");
    const changed = after.filter((entry) => {
      const before = MIXED.find((x) => x.id === entry.id)!;
      return before.order !== entry.order;
    });
    expect(changed.map((entry) => entry.id).sort()).toEqual(["pizza-a", "pizza-b"]);
  });

  it("never disturbs a recipe from another collection", () => {
    const after = swapOrder(MIXED, "pizza-a", "pizza-b");
    for (const id of ["holiday-a", "holiday-b"]) {
      expect(after.find((e) => e.id === id)!.order).toBe(MIXED.find((e) => e.id === id)!.order);
    }
  });

  it("swaps across collections too, which the old model could not express", () => {
    // holiday-b sits directly above pizza-a on screen even though they belong
    // to different collections. Swapping their values swaps them on screen.
    const after = swapOrder(MIXED, "holiday-b", "pizza-a");
    expect(shown(after)).toEqual(["holiday-a", "pizza-a", "holiday-b", "pizza-b", "pizza-c"]);
  });

  it("gives two unordered recipes distinct positions rather than doing nothing", () => {
    const fresh = [recipe("a", "p", undefined), recipe("b", "p", undefined)];
    // Sorted by title while both are unordered.
    expect(shown(fresh)).toEqual(["a", "b"]);
    const after = swapOrder(fresh, "a", "b");
    expect(shown(after)).toEqual(["b", "a"]);
  });

  it("loses and duplicates nothing, whichever pair is swapped", () => {
    for (const a of MIXED) {
      for (const b of MIXED) {
        const after = swapOrder(MIXED, a.id, b.id);
        expect(after).toHaveLength(MIXED.length);
        expect(new Set(after.map((e) => e.id)).size).toBe(MIXED.length);
        expect([...shown(after)].sort()).toEqual([...shown(MIXED)].sort());
      }
    }
  });

  it("is a no-op for a recipe swapped with itself or with something gone", () => {
    expect(swapOrder(MIXED, "pizza-a", "pizza-a")).toBe(MIXED);
    expect(swapOrder(MIXED, "pizza-a", "deleted")).toBe(MIXED);
  });

  it("keeps status, recommended and every other field untouched", () => {
    const withData = [
      recipe("keep", "p", 0, { recommended: true, tags: ["dairy"], note: "the good one", rating: 5 }),
      recipe("other", "p", 1),
    ];
    const after = swapOrder(withData, "keep", "other");
    const kept = after.find((e) => e.id === "keep")!;

    expect(kept.recommended).toBe(true);
    expect(kept.status).toBe("tried");
    expect(kept.tags).toEqual(["dairy"]);
    expect(kept.note).toBe("the good one");
    expect(kept.rating).toBe(5);
    // Only the position moved.
    expect(kept.order).toBe(1);
  });

  it("reverses cleanly, so a mistaken nudge can be undone", () => {
    const once = swapOrder(MIXED, "pizza-b", "pizza-c");
    const back = swapOrder(once, "pizza-b", "pizza-c");
    expect(shown(back)).toEqual(shown(MIXED));
  });
});

describe("the three groups stay a view over two fields", () => {
  it("keeps recommended separate from tried", () => {
    // Recommending must never be able to un-try something.
    expect(statusForGroup("recommended")).toEqual({ status: "tried", recommended: true });
    expect(statusForGroup("tried")).toEqual({ status: "tried", recommended: false });
    expect(statusForGroup("want_to_try")).toEqual({ status: "want_to_try", recommended: false });
  });

  it("reads a recipe's group back from those two fields", () => {
    expect(groupOf(recipe("x", "p", 0, { status: "tried", recommended: true }))).toBe("recommended");
    expect(groupOf(recipe("x", "p", 0, { status: "tried", recommended: false }))).toBe("tried");
    expect(groupOf(recipe("x", "p", 0, { status: "want_to_try", recommended: false }))).toBe("want_to_try");
  });

  it("does not move a recipe between groups when only its order changes", () => {
    const after = swapOrder(MIXED, "pizza-a", "pizza-b");
    for (const entry of after) {
      expect(groupOf(entry)).toBe("tried");
    }
  });
});
