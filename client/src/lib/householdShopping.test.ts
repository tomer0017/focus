/**
 * Household shopping, and the boundary around it.
 *
 * Two failures are being guarded here, and only one of them has ever happened.
 *
 * The one that happened: a camping packing list called "Trip North" appeared on
 * the supermarket screen, because both are stored as a `checklist` page and the
 * query asked for the storage shape. That was fixed by `checklistContextOf`;
 * these tests exist so it stays fixed.
 *
 * The one that has not: a menu writing fourteen groceries into that same
 * packing list. A menu can be pointed at a target, so the target needs the same
 * boundary the screen has — which is what `canReceiveShopping` is.
 */
import { describe, expect, it } from "vitest";
import {
  checklistContextOf,
  countByListType,
  filterShoppingLists,
  progressOf,
  selectHouseholdShoppingLists,
  startNextCycle,
} from "./checklist";
import { canReceiveShopping, mergeMenuIntoChecklist, mergePreview } from "./menus";
import { MOCK_PAGES } from "../mocks/pages";
import type { Checklist, Menu, PageSummary } from "../types";

function page(id: string, extra: Partial<PageSummary> = {}): PageSummary {
  return {
    id,
    type: "checklist",
    spaceId: "home",
    status: "active",
    title: id,
    lastUpdatedAt: "2026-03-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...extra,
  };
}

const household = { purpose: "shopping", scope: "household" } as const;

function list(ownerId: string, items: { text: string; done?: boolean }[]): Checklist {
  return {
    ownerId,
    groups: [
      {
        id: "g",
        title: "Group",
        items: items.map((entry, index) => ({
          id: `i${index}`,
          text: entry.text,
          done: entry.done ?? false,
        })),
      },
    ],
    updatedAt: "2026-03-01T00:00:00.000Z",
  };
}

function menu(lines: string[]): Menu {
  return {
    id: "m1",
    kind: "shabbat",
    dishes: [
      { id: "d1", course: "main", title: "Dish", shoppingItems: lines, order: 0 },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("the household boundary", () => {
  it("keeps Trip North off the shopping screen", () => {
    const titles = selectHouseholdShoppingLists(MOCK_PAGES).map((entry) => entry.title);
    expect(titles).not.toContain("Trip North");
    expect(titles).not.toContain("Before a Flight");
  });

  it("leaves Trip North intact as a page, so Trips still has it", () => {
    // Excluded from one screen is not deleted. The page is untouched.
    const north = MOCK_PAGES.find((entry) => entry.id === "trip-north");
    expect(north).toBeDefined();
    expect(north!.type).toBe("checklist");
    expect(north!.checklist).toEqual({ purpose: "packing", scope: "trip" });
  });

  it("excludes every other owner's list", () => {
    const pages = [
      page("weekly", { checklist: household }),
      page("packing", { checklist: { purpose: "packing", scope: "trip" } }),
      page("party", { checklist: { purpose: "event", scope: "event" } }),
      page("tasks", { type: "project", title: "A project" }),
    ];
    expect(selectHouseholdShoppingLists(pages).map((p) => p.id)).toEqual(["weekly"]);
  });

  it("fails safely on a list nobody classified", () => {
    // Never guessed from the title. "Weekly shop" with no context stays off.
    const undeclared = page("mystery", { title: "Weekly shop" });
    expect(selectHouseholdShoppingLists([undeclared])).toEqual([]);
    expect(checklistContextOf("page:mystery", undeclared)).toEqual({
      purpose: "general",
      scope: "page",
    });
  });

  it("never treats a family list as household shopping", () => {
    expect(checklistContextOf("family:grandma")).toEqual({
      purpose: "general",
      scope: "person",
    });
  });
});

describe("narrowing what already belongs there", () => {
  const pages = [
    page("weekly", { title: "Weekly shop", checklist: { ...household, listType: "weekly" } }),
    page("monthly", { title: "Household run", checklist: { ...household, listType: "monthly" } }),
    page("pesach", {
      title: "Passover",
      checklist: { ...household, listType: "holiday", occasion: "פסח" },
    }),
    page("cleaning", { title: "Cleaning things", checklist: { ...household, listType: "reusable" } }),
    page("packing", { checklist: { purpose: "packing", scope: "trip" } }),
  ];

  it("filters by type without ever letting another owner's list through", () => {
    expect(filterShoppingLists(pages, { listType: "weekly" }).map((p) => p.id)).toEqual(["weekly"]);
    // Even asking for a type a packing list might plausibly have.
    expect(filterShoppingLists(pages, { listType: "oneTime" })).toEqual([]);
  });

  it("searches the occasion as well as the title", () => {
    expect(filterShoppingLists(pages, { query: "פסח" }).map((p) => p.id)).toEqual(["pesach"]);
  });

  it("searches the whole collection rather than one type", () => {
    expect(filterShoppingLists(pages, { query: "shop" }).map((p) => p.id)).toEqual(["weekly"]);
  });

  it("counts each type", () => {
    expect(countByListType(pages)).toEqual({
      weekly: 1,
      monthly: 1,
      holiday: 1,
      reusable: 1,
      oneTime: 0,
    });
  });

  it("pages seventy lists rather than listing them all", () => {
    const many = Array.from({ length: 70 }, (_, i) =>
      page(`l${i}`, { checklist: { ...household, listType: "weekly" } })
    );
    const all = filterShoppingLists(many, {});
    expect(all).toHaveLength(70);
    expect(all.slice(0, 20)).toHaveLength(20);
  });
});

describe("starting the next round", () => {
  it("unticks everything and keeps every item", () => {
    // The point of a reusable list is that it already knows what you buy.
    const before = list("page:weekly", [
      { text: "חלב", done: true },
      { text: "לחם", done: true },
      { text: "ביצים", done: false },
    ]);

    const after = startNextCycle(before, new Date("2026-04-01T09:00:00.000Z"));
    expect(after.groups[0].items.map((i) => i.done)).toEqual([false, false, false]);
    expect(after.groups[0].items.map((i) => i.text)).toEqual(["חלב", "לחם", "ביצים"]);
    expect(progressOf(after).done).toBe(0);
    expect(progressOf(after).total).toBe(3);
  });

  it("keeps the same list rather than creating another one", () => {
    const before = list("page:weekly", [{ text: "חלב", done: true }]);
    const after = startNextCycle(before);
    // One list, one owner. Nothing spawns a page per week.
    expect(after.ownerId).toBe(before.ownerId);
  });

  it("keeps items the user added by hand", () => {
    const before = list("page:weekly", [
      { text: "חלב", done: true },
      { text: "משהו שהוספתי", done: true },
    ]);
    expect(startNextCycle(before).groups[0].items).toHaveLength(2);
  });

  it("changes nothing about a list that was never ticked", () => {
    const before = list("page:weekly", [{ text: "חלב" }]);
    const after = startNextCycle(before);
    expect(after.groups).toEqual(before.groups);
  });
});

describe("a menu may only write into a household list", () => {
  it("accepts a household shopping list", () => {
    expect(canReceiveShopping(page("weekly", { checklist: household }))).toBe(true);
  });

  it("refuses a packing list, however it is reached", () => {
    // The guard that stops the Trip North bug returning through the menu.
    const north = MOCK_PAGES.find((entry) => entry.id === "trip-north");
    expect(canReceiveShopping(north)).toBe(false);
  });

  it("refuses an unclassified list, a project and nothing at all", () => {
    expect(canReceiveShopping(page("mystery"))).toBe(false);
    expect(canReceiveShopping(page("proj", { type: "project" }))).toBe(false);
    expect(canReceiveShopping(undefined)).toBe(false);
  });
});

describe("generating shopping from a menu", () => {
  const groupTitle = () => "Main";

  it("reports what it would do before doing it", () => {
    const existing = list("page:weekly", [{ text: "ביצים", done: true }]);
    const preview = mergePreview(menu(["ביצים", "קמח", "קמח", "חמאה"]), [], existing);

    expect(preview.already).toBe(1); // eggs, already on the list
    expect(preview.duplicated).toBe(1); // flour, twice in the menu
    expect(preview.added).toBe(2); // flour once, butter
  });

  it("never unticks something already bought", () => {
    const existing = list("page:weekly", [{ text: "ביצים", done: true }]);
    const merged = mergeMenuIntoChecklist("page:weekly", menu(["ביצים", "קמח"]), [], existing, groupTitle);

    const eggs = merged.groups.flatMap((g) => g.items).find((i) => i.text === "ביצים");
    expect(eggs?.done).toBe(true);
  });

  it("adds one line for an ingredient two dishes both need", () => {
    const merged = mergeMenuIntoChecklist("page:weekly", menu(["קמח", "קמח"]), [], undefined, groupTitle);
    expect(merged.groups.flatMap((g) => g.items).filter((i) => i.text === "קמח")).toHaveLength(1);
  });

  it("matches on a normalised name, so spacing and case do not duplicate", () => {
    const existing = list("page:weekly", [{ text: "Olive  Oil" }]);
    expect(mergePreview(menu(["olive oil"]), [], existing).already).toBe(1);
    expect(mergePreview(menu(["olive oil"]), [], existing).added).toBe(0);
  });

  it("leaves items the user added by hand alone", () => {
    const existing = list("page:weekly", [{ text: "משהו שהוספתי", done: false }]);
    const merged = mergeMenuIntoChecklist("page:weekly", menu(["קמח"]), [], existing, groupTitle);
    expect(merged.groups.flatMap((g) => g.items).some((i) => i.text === "משהו שהוספתי")).toBe(true);
  });

  it("removes nothing when the menu shrinks", () => {
    // Editing a menu must never delete shopping the user has already accepted.
    const afterFirst = mergeMenuIntoChecklist(
      "page:weekly",
      menu(["קמח", "חמאה"]),
      [],
      undefined,
      groupTitle
    );
    const afterSmaller = mergeMenuIntoChecklist(
      "page:weekly",
      menu(["קמח"]),
      [],
      afterFirst,
      groupTitle
    );

    const texts = afterSmaller.groups.flatMap((g) => g.items).map((i) => i.text);
    expect(texts).toContain("קמח");
    expect(texts).toContain("חמאה");
  });

  it("is idempotent — generating twice adds nothing the second time", () => {
    const once = mergeMenuIntoChecklist("page:weekly", menu(["קמח"]), [], undefined, groupTitle);
    const twice = mergeMenuIntoChecklist("page:weekly", menu(["קמח"]), [], once, groupTitle);

    expect(twice.groups.flatMap((g) => g.items)).toHaveLength(1);
    expect(mergePreview(menu(["קמח"]), [], once).added).toBe(0);
  });
});

describe("a hundred items in one list", () => {
  it("stays one checklist and counts correctly", () => {
    const big = list(
      "page:weekly",
      Array.from({ length: 100 }, (_, i) => ({ text: `Item ${i}`, done: i % 3 === 0 }))
    );

    expect(progressOf(big).total).toBe(100);
    expect(progressOf(big).done).toBe(34);
    expect(startNextCycle(big).groups[0].items).toHaveLength(100);
    expect(progressOf(startNextCycle(big)).done).toBe(0);
  });
});
