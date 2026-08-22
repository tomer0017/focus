import { describe, expect, it } from "vitest";
import { mergeMenuIntoChecklist, newLineCount, shoppingLinesFor } from "./menus";
import type { Checklist } from "../types/checklist";
import type { CollectionEntry } from "../types/savedItem";
import type { Menu } from "../types/menu";

const groupTitleFor = (course: string): string => `[${course}]`;

const menu: Menu = {
  id: "menu-1",
  title: "Shabbat",
  kind: "shabbat",
  servings: 4,
  dishes: [
    { id: "d1", course: "main", title: "Roast chicken", shoppingItems: ["Chicken", "Lemons"], order: 0 },
    { id: "d2", course: "salad", title: "Salad", shoppingItems: ["Tomatoes", "Lemons"], order: 1 },
    { id: "d3", course: "dessert", title: "Cake", entryId: "recipe-cake", order: 2 },
    // A dish with nothing under it contributes nothing — not its own name.
    { id: "d4", course: "side", title: "Rice", order: 3 },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const recipes: CollectionEntry[] = [
  {
    id: "recipe-cake",
    pageId: "cooking",
    title: "Cake",
    status: "tried",
    recommended: true,
    tags: [],
    thumb: "cake",
    ingredients: ["Flour", "Sugar", "Eggs"],
  },
];

describe("shoppingLinesFor", () => {
  it("collects what each dish says it needs", () => {
    const lines = shoppingLinesFor(menu, recipes);
    expect(lines.get("main")).toEqual(["Chicken", "Lemons"]);
  });

  it("pulls ingredients from an attached recipe", () => {
    expect(shoppingLinesFor(menu, recipes).get("dessert")).toEqual(["Flour", "Sugar", "Eggs"]);
  });

  it("contributes nothing for a dish with neither", () => {
    // "Roast chicken" on a shopping list is not a shopping list.
    expect(shoppingLinesFor(menu, recipes).has("side")).toBe(false);
  });
});

describe("mergeMenuIntoChecklist", () => {
  it("builds a list when there is none", () => {
    const list = mergeMenuIntoChecklist("page:l", menu, recipes, undefined, groupTitleFor);
    const texts = list.groups.flatMap((group) => group.items.map((item) => item.text));
    expect(texts).toContain("Chicken");
    expect(list.ownerId).toBe("page:l");
  });

  it("writes a repeated ingredient once, not once per dish", () => {
    const list = mergeMenuIntoChecklist("page:l", menu, recipes, undefined, groupTitleFor);
    const texts = list.groups.flatMap((group) => group.items.map((item) => item.text));
    expect(texts.filter((text) => text === "Lemons")).toHaveLength(1);
  });

  it("adds nothing on a second run — no duplicates", () => {
    // The concrete failure this guards: standing in a supermarket reading a
    // list with every item on it twice.
    const first = mergeMenuIntoChecklist("page:l", menu, recipes, undefined, groupTitleFor);
    const second = mergeMenuIntoChecklist("page:l", menu, recipes, first, groupTitleFor);

    const count = (list: Checklist): number =>
      list.groups.reduce((total, group) => total + group.items.length, 0);
    expect(count(second)).toBe(count(first));
  });

  it("never un-ticks something already bought", () => {
    const first = mergeMenuIntoChecklist("page:l", menu, recipes, undefined, groupTitleFor);
    const ticked: Checklist = {
      ...first,
      groups: first.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({ ...item, done: true })),
      })),
    };
    const second = mergeMenuIntoChecklist("page:l", menu, recipes, ticked, groupTitleFor);
    expect(second.groups.every((group) => group.items.every((item) => item.done))).toBe(true);
  });

  it("leaves items the user added by hand alone", () => {
    const withOwn: Checklist = {
      ownerId: "page:l",
      groups: [{ id: "g", title: "Mine", items: [{ id: "i", text: "Batteries", done: false }] }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const merged = mergeMenuIntoChecklist("page:l", menu, recipes, withOwn, groupTitleFor);
    const texts = merged.groups.flatMap((group) => group.items.map((item) => item.text));
    expect(texts).toContain("Batteries");
  });

  it("matches case- and space-insensitively when deciding what is new", () => {
    const existing: Checklist = {
      ownerId: "page:l",
      groups: [{ id: "g", title: "[main]", items: [{ id: "i", text: "  chicken ", done: true }] }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const merged = mergeMenuIntoChecklist("page:l", menu, recipes, existing, groupTitleFor);
    const texts = merged.groups.flatMap((group) => group.items.map((item) => item.text!.trim().toLowerCase()));
    expect(texts.filter((text) => text === "chicken")).toHaveLength(1);
  });

  it("de-duplicates across groups, so moving a dish cannot resurrect an item", () => {
    const existing: Checklist = {
      ownerId: "page:l",
      groups: [{ id: "g", title: "[salad]", items: [{ id: "i", text: "Chicken", done: false }] }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const merged = mergeMenuIntoChecklist("page:l", menu, recipes, existing, groupTitleFor);
    const texts = merged.groups.flatMap((group) => group.items.map((item) => item.text));
    expect(texts.filter((text) => text === "Chicken")).toHaveLength(1);
  });
});

describe("newLineCount", () => {
  it("says how many lines a run would actually add, before it runs", () => {
    expect(newLineCount(menu, recipes, undefined)).toBe(6);
  });

  it("is zero once everything is already there", () => {
    const list = mergeMenuIntoChecklist("page:l", menu, recipes, undefined, groupTitleFor);
    expect(newLineCount(menu, recipes, list)).toBe(0);
  });
});
