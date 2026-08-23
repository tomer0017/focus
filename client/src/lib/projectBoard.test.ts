/**
 * Project ordering.
 *
 * `boardOrder` numbers a whole **status column** — every active project, across
 * every category. The projects screen shows **one category at a time**. Those
 * two index spaces only agree when a category happens to contain the entire
 * column, which is exactly why the bug they caused survived a unit-tested
 * release and a full route sweep: it is invisible until the categories
 * interleave.
 *
 * A real pointer found it. In `physical / active`, "move down" on the first row
 * did nothing visible — the project jumped over a *tech* project instead,
 * because the on-screen index 0 was applied to the global column.
 */
import { describe, expect, it } from "vitest";
import { boardProjects, columnPages, insertAt, targetIndexBeside } from "./projectBoard";
import type { PageStatus, PageSummary } from "../types";

function project(id: string, order: number, extra: Partial<PageSummary> = {}): PageSummary {
  return {
    id,
    type: "project",
    spaceId: "home",
    status: "active",
    title: id,
    boardOrder: order,
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...extra,
  };
}

/*
 * The seeded shape that exposed the defect: two categories interleaved down one
 * active column.
 *
 *   0 painter (tech)   1 sorcol (tech)   2 living-room (physical)
 *   3 focus (tech)     4 shelves (physical)   5 shed (physical)
 */
const COLUMN = [
  project("painter", 0, { categoryId: "tech" }),
  project("sorcol", 1, { categoryId: "tech" }),
  project("living-room", 2, { categoryId: "physical" }),
  project("focus", 3, { categoryId: "tech" }),
  project("shelves", 4, { categoryId: "physical" }),
  project("shed", 5, { categoryId: "physical" }),
];

const ids = (pages: PageSummary[]) => pages.map((page) => page.id);
const columnIds = ids(columnPages(COLUMN, "active"));
const inCategory = (category: string) =>
  ids(columnPages(COLUMN, "active").filter((page) => page.categoryId === category));

describe("targetIndexBeside", () => {
  it("puts a project immediately after the neighbour it was moved past", () => {
    // physical view: [living-room, shelves, shed]. Move living-room down.
    const target = targetIndexBeside(columnIds, "living-room", "shelves", 1);
    const after = insertAt(columnIds, "living-room", target);
    expect(after).toEqual(["painter", "sorcol", "focus", "shelves", "living-room", "shed"]);

    // What the user sees is the swap they asked for.
    const visible = after.filter((id) => inCategory("physical").includes(id));
    expect(visible).toEqual(["shelves", "living-room", "shed"]);
  });

  it("puts a project immediately before the neighbour when moving up", () => {
    const target = targetIndexBeside(columnIds, "shed", "shelves", -1);
    const after = insertAt(columnIds, "shed", target);
    const visible = after.filter((id) => inCategory("physical").includes(id));
    expect(visible).toEqual(["living-room", "shed", "shelves"]);
  });

  it("is the defect's regression: an on-screen index moves the wrong thing", () => {
    // The old code passed the visible index. living-room is visible index 0, so
    // moving it "down" passed 1 — which lands it between two *tech* projects
    // and leaves the physical order completely unchanged.
    const broken = insertAt(columnIds, "living-room", 0 + 1);
    expect(broken.filter((id) => inCategory("physical").includes(id)))
      .toEqual(["living-room", "shelves", "shed"]); // nothing moved

    // The fix moves it, from the same starting gesture.
    const fixed = insertAt(columnIds, "living-room", targetIndexBeside(columnIds, "living-room", "shelves", 1));
    expect(fixed.filter((id) => inCategory("physical").includes(id)))
      .toEqual(["shelves", "living-room", "shed"]);
  });

  it("never disturbs the relative order of another category", () => {
    const before = inCategory("tech");
    const after = insertAt(columnIds, "living-room", targetIndexBeside(columnIds, "living-room", "shelves", 1));
    expect(after.filter((id) => before.includes(id))).toEqual(before);
  });

  it("appends rather than guessing when the neighbour is gone", () => {
    expect(targetIndexBeside(columnIds, "sorcol", "deleted-project", 1)).toBe(-1);
    // insertAt reads -1 as "put it at the end", which is a defined outcome.
    expect(insertAt(columnIds, "sorcol", -1).at(-1)).toBe("sorcol");
  });

  it("loses and duplicates nothing, whichever way it moves", () => {
    for (const direction of [-1, 1] as const) {
      for (const moved of columnIds) {
        for (const neighbour of columnIds) {
          if (moved === neighbour) continue;
          const after = insertAt(columnIds, moved, targetIndexBeside(columnIds, moved, neighbour, direction));
          expect(after).toHaveLength(columnIds.length);
          expect(new Set(after).size).toBe(columnIds.length);
          expect([...after].sort()).toEqual([...columnIds].sort());
        }
      }
    }
  });

  it("keeps order values a bounded, dense integer run", () => {
    const after = insertAt(columnIds, "shed", targetIndexBeside(columnIds, "shed", "painter", -1));
    const orders = after.map((_, index) => index);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("columnPages", () => {
  it("orders by boardOrder and keeps unordered projects at the end", () => {
    const mixed = [
      project("b", 1),
      project("a", 0),
      { ...project("new", 0), boardOrder: undefined, lastUpdatedAt: "2026-05-01T00:00:00.000Z" },
    ];
    expect(ids(columnPages(mixed, "active"))).toEqual(["a", "b", "new"]);
  });

  it("keeps each status in its own column", () => {
    const mixed = [
      project("live", 0),
      project("parked", 0, { status: "paused" as PageStatus }),
      project("done", 0, { status: "completed" as PageStatus }),
    ];
    expect(ids(columnPages(mixed, "active"))).toEqual(["live"]);
    expect(ids(columnPages(mixed, "paused"))).toEqual(["parked"]);
    expect(ids(columnPages(mixed, "completed"))).toEqual(["done"]);
  });

  it("counts only projects, never collections or checklists", () => {
    const mixed = [
      project("real", 0),
      { ...project("list", 1), type: "checklist" as const },
      { ...project("recipes", 2), type: "collection" as const },
    ];
    expect(ids(boardProjects(mixed))).toEqual(["real"]);
  });
});

describe("a heavy archive", () => {
  it("reorders inside seventy completed projects without losing one", () => {
    const many = Array.from({ length: 70 }, (_, i) =>
      project(`p${i}`, i, { status: "completed" as PageStatus })
    );
    const all = ids(columnPages(many, "completed"));
    const after = insertAt(all, "p0", targetIndexBeside(all, "p0", "p1", 1));

    expect(after).toHaveLength(70);
    expect(new Set(after).size).toBe(70);
    expect(after.slice(0, 3)).toEqual(["p1", "p0", "p2"]);
  });
});
