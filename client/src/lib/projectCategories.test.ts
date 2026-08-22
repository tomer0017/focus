import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  canRemove,
  categoryLabel,
  categoryOf,
  countIn,
  defaultCategoryFor,
  sortedCategories,
} from "./projectCategories";
import type { PageSummary, ProjectCategory, SpaceId } from "../types";

function page(patch: Partial<PageSummary> = {}): PageSummary {
  return {
    id: "p1",
    type: "project",
    spaceId: "personal",
    status: "active",
    title: "A project",
    lastUpdatedAt: "2026-08-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...patch,
  };
}

describe("defaultCategoryFor", () => {
  it("files each space under a sensible starting category", () => {
    expect(defaultCategoryFor("work-tech")).toBe("tech");
    expect(defaultCategoryFor("home")).toBe("physical");
    expect(defaultCategoryFor("personal")).toBe("personal");
  });

  it("falls back to personal for a space with no obvious home", () => {
    expect(defaultCategoryFor("cooking" as SpaceId)).toBe("personal");
    expect(defaultCategoryFor("trips" as SpaceId)).toBe("personal");
  });

  it("names a category that actually ships by default", () => {
    const ids = DEFAULT_CATEGORIES.map((entry) => entry.id);
    for (const space of ["work-tech", "home", "personal", "cooking", "trips"] as SpaceId[]) {
      expect(ids).toContain(defaultCategoryFor(space));
    }
  });
});

describe("categoryOf", () => {
  it("uses the category the user chose", () => {
    expect(categoryOf(page({ spaceId: "work-tech", categoryId: "physical" }))).toBe("physical");
  });

  it("derives one from the space when none was chosen", () => {
    expect(categoryOf(page({ spaceId: "work-tech" }))).toBe("tech");
  });

  it("never writes the derived answer back onto the page", () => {
    // A migration that stamped this in would freeze the guess, and moving the
    // project to another space afterwards could never correct it.
    const bare = page({ spaceId: "home" });
    categoryOf(bare);
    expect(bare.categoryId).toBeUndefined();
  });

  it("keeps an explicit choice even when the page moves space", () => {
    const chosen = page({ spaceId: "home", categoryId: "tech" });
    expect(categoryOf({ ...chosen, spaceId: "personal" })).toBe("tech");
  });
});

describe("categoryLabel", () => {
  const t = (key: string) => `T(${key})`;

  it("translates a seeded category through its key", () => {
    const seeded: ProjectCategory = { id: "tech", nameKey: "categories.tech", order: 1 };
    expect(categoryLabel(seeded, t)).toBe("T(projects:categories.tech)");
  });

  it("prints the user's own word untranslated once renamed", () => {
    const renamed: ProjectCategory = { id: "tech", name: "צד לקוח", order: 1 };
    expect(categoryLabel(renamed, t)).toBe("צד לקוח");
  });

  it("prefers the name over a key that somehow survived", () => {
    const both: ProjectCategory = { id: "x", name: "Mine", nameKey: "categories.tech", order: 0 };
    expect(categoryLabel(both, t)).toBe("Mine");
  });
});

describe("counting and removal", () => {
  const pages = [
    page({ id: "a", spaceId: "work-tech" }),
    page({ id: "b", spaceId: "work-tech" }),
    page({ id: "c", spaceId: "home" }),
    page({ id: "d", spaceId: "home", categoryId: "tech" }),
  ];

  it("counts derived and explicit members alike", () => {
    expect(countIn(pages, "tech")).toBe(3);
    expect(countIn(pages, "physical")).toBe(1);
    expect(countIn(pages, "personal")).toBe(0);
  });

  it("refuses to remove a category that still holds projects", () => {
    expect(canRemove(pages, "tech")).toBe(false);
    expect(canRemove(pages, "physical")).toBe(false);
  });

  it("allows removing an empty one", () => {
    expect(canRemove(pages, "personal")).toBe(true);
    expect(canRemove([], "tech")).toBe(true);
  });
});

describe("sortedCategories", () => {
  it("orders by the stored order, not by insertion", () => {
    const categories: ProjectCategory[] = [
      { id: "c", name: "third", order: 2 },
      { id: "a", name: "first", order: 0 },
      { id: "b", name: "second", order: 1 },
    ];
    expect(sortedCategories(categories).map((entry) => entry.name)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("does not mutate the array it was given", () => {
    const categories: ProjectCategory[] = [
      { id: "b", order: 1 },
      { id: "a", order: 0 },
    ];
    sortedCategories(categories);
    expect(categories[0].id).toBe("b");
  });
});
