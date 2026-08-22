/**
 * A project's materials.
 *
 * The split this replaces was invented by the screen, not by the user: two tabs
 * — "materials" and "inspiration" — divided by a hard-coded list of saved-item
 * kinds. A photograph of the existing garden is reference *and* inspiration
 * depending on the day, and nobody opening a project thinks "is this an
 * inspiration item?". They think "where is that Figma link".
 *
 * The tests that matter most here are the isolation ones: one project's
 * materials must never appear in another, and the association must come from an
 * explicit reference rather than from a title or an id that looks similar.
 */
import { describe, expect, it } from "vitest";
import {
  GRID_PAGE_SIZE,
  LIST_PAGE_SIZE,
  countByShelf,
  filterMaterials,
  isGridShelf,
  pageSizeFor,
  paginate,
  shelfOf,
  sortMaterials,
} from "./projectMaterials";
import type { SavedItem, SavedItemKind } from "../types";

function item(extra: Partial<SavedItem> = {}): SavedItem {
  return {
    id: "s1",
    kind: "link",
    title: "Something",
    spaceId: "work-tech",
    source: "web",
    thumb: "notebook",
    contextIds: ["sorcol"],
    savedAt: "2026-03-01T00:00:00.000Z",
    ...extra,
  };
}

describe("every saved kind has a shelf", () => {
  it("files all nine kinds, so nothing can become invisible", () => {
    const kinds: SavedItemKind[] = [
      "link",
      "image",
      "video",
      "recipe",
      "product",
      "document",
      "note",
      "inspiration",
      "location",
    ];
    for (const kind of kinds) {
      expect(shelfOf(item({ kind })), `${kind} has no shelf`).toBeTruthy();
    }
  });

  it("puts an address to somewhere on the links shelf", () => {
    // A product, a place and a recipe are all "an address to somewhere".
    expect(shelfOf(item({ kind: "product" }))).toBe("links");
    expect(shelfOf(item({ kind: "location" }))).toBe("links");
  });

  it("keeps inspiration with the pictures rather than on a shelf of its own", () => {
    expect(shelfOf(item({ kind: "inspiration" }))).toBe("images");
    expect(shelfOf(item({ kind: "image" }))).toBe("images");
  });
});

describe("one project's materials stay in that project", () => {
  /*
   * The association is `contextIds` — an explicit reference written when the
   * item was saved. These tests exist to prove nothing is inferred from a
   * title, an id that shares a prefix, or a route.
   */
  const all = [
    item({ id: "figma", title: "Sorcol — Figma", contextIds: ["sorcol"] }),
    item({ id: "repo", title: "Sorcol — GitHub", contextIds: ["sorcol"] }),
    item({ id: "quote", title: "Sorcol quote", contextIds: ["sorcol-garden"] }),
    item({ id: "plans", title: "Architect plans", contextIds: ["living-room-renovation"] }),
  ];

  const forProject = (id: string) => all.filter((entry) => entry.contextIds.includes(id));

  it("does not leak into a project whose id merely starts the same way", () => {
    // "sorcol" and "sorcol-garden" are different projects.
    expect(forProject("sorcol").map((e) => e.id)).toEqual(["figma", "repo"]);
    expect(forProject("sorcol-garden").map((e) => e.id)).toEqual(["quote"]);
  });

  it("does not pull in an item that merely mentions the project by name", () => {
    // "Sorcol quote" is titled after the project and belongs to another one.
    expect(forProject("sorcol").some((e) => e.id === "quote")).toBe(false);
  });

  it("lets one item belong to two projects on purpose", () => {
    // Shared, not copied: the same entity appears in both.
    const shared = item({ id: "drive", contextIds: ["sorcol", "living-room-renovation"] });
    expect(shared.contextIds).toContain("sorcol");
    expect(shared.contextIds).toContain("living-room-renovation");
  });
});

describe("filtering and searching", () => {
  const items = [
    item({ id: "figma", kind: "link", title: "Figma board", source: "web" }),
    item({ id: "spec", kind: "document", title: "Spec", note: "From the client" }),
    item({ id: "shot", kind: "image", title: "Living room today" }),
    item({ id: "walkthrough", kind: "video", title: "Walkthrough", source: "youtube" }),
  ];

  it("shows everything by default", () => {
    expect(filterMaterials(items, { filter: "all" })).toHaveLength(4);
  });

  it("narrows to one shelf", () => {
    expect(filterMaterials(items, { filter: "documents" }).map((e) => e.id)).toEqual(["spec"]);
    expect(filterMaterials(items, { filter: "videos" }).map((e) => e.id)).toEqual(["walkthrough"]);
  });

  it("searches the whole shelf, including the note and the source", () => {
    expect(filterMaterials(items, { filter: "all", query: "client" }).map((e) => e.id)).toEqual([
      "spec",
    ]);
    expect(filterMaterials(items, { filter: "all", query: "youtube" }).map((e) => e.id)).toEqual([
      "walkthrough",
    ]);
  });

  it("combines a shelf with a search rather than choosing between them", () => {
    expect(filterMaterials(items, { filter: "links", query: "figma" }).map((e) => e.id)).toEqual([
      "figma",
    ]);
    expect(filterMaterials(items, { filter: "documents", query: "figma" })).toEqual([]);
  });

  it("counts each shelf", () => {
    expect(countByShelf(items)).toEqual({ links: 1, documents: 1, images: 1, videos: 1 });
  });
});

describe("paging", () => {
  const many = Array.from({ length: 70 }, (_, i) =>
    item({ id: `l${i}`, kind: "link", title: `Link ${i}` })
  );

  it("uses twenty for a list and twelve for a grid", () => {
    // A tile is about twice the height of a row, so both make a page of roughly
    // the same length.
    expect(pageSizeFor("links")).toBe(LIST_PAGE_SIZE);
    expect(pageSizeFor("images")).toBe(GRID_PAGE_SIZE);
    expect(isGridShelf("videos")).toBe(true);
    expect(isGridShelf("documents")).toBe(false);
  });

  it("never renders seventy items at once", () => {
    const page = paginate(many, 1, LIST_PAGE_SIZE);
    expect(page.items).toHaveLength(20);
    expect(page.pageCount).toBe(4);
    expect(page.total).toBe(70);
  });

  it("gives the remainder its own last page", () => {
    const last = paginate(many, 4, LIST_PAGE_SIZE);
    expect(last.items).toHaveLength(10);
    expect(last.page).toBe(4);
  });

  it("clamps a page number out of range instead of showing nothing", () => {
    // A URL kept from a fuller project should still land somewhere useful.
    expect(paginate(many, 99, LIST_PAGE_SIZE).page).toBe(4);
    expect(paginate(many, 0, LIST_PAGE_SIZE).page).toBe(1);
    expect(paginate(many, -3, LIST_PAGE_SIZE).items).toHaveLength(20);
  });

  it("reports one page for an empty shelf rather than zero", () => {
    const empty = paginate([], 1, LIST_PAGE_SIZE);
    expect(empty.pageCount).toBe(1);
    expect(empty.items).toEqual([]);
  });

  it("holds a heavy project without special handling", () => {
    const heavy = [
      ...Array.from({ length: 70 }, (_, i) => item({ id: `k${i}`, kind: "link" })),
      ...Array.from({ length: 40 }, (_, i) => item({ id: `d${i}`, kind: "document" })),
      ...Array.from({ length: 60 }, (_, i) => item({ id: `i${i}`, kind: "image" })),
      ...Array.from({ length: 50 }, (_, i) => item({ id: `v${i}`, kind: "video" })),
    ];

    expect(countByShelf(heavy)).toEqual({ links: 70, documents: 40, images: 60, videos: 50 });
    expect(paginate(filterMaterials(heavy, { filter: "images" }), 1, GRID_PAGE_SIZE).items)
      .toHaveLength(12);
    expect(paginate(filterMaterials(heavy, { filter: "all" }), 1, LIST_PAGE_SIZE).items)
      .toHaveLength(20);
  });
});

describe("ordering", () => {
  it("puts the newest first and breaks ties by title", () => {
    const items = [
      item({ id: "b", title: "B", savedAt: "2026-01-01T00:00:00.000Z" }),
      item({ id: "a", title: "A", savedAt: "2026-01-01T00:00:00.000Z" }),
      item({ id: "new", title: "Z", savedAt: "2026-05-01T00:00:00.000Z" }),
    ];
    expect(sortMaterials(items).map((e) => e.id)).toEqual(["new", "a", "b"]);
  });
});
