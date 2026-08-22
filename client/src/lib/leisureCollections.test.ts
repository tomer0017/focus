/**
 * Leisure collections.
 *
 * The defect these tests are written against is a model defect, not a layout
 * one: **ownership and progress were the same field.** `status` was
 * `idea | planned | done`, so a book you own but have not read had nowhere to
 * live — you could call it an idea, or call it done, and neither was true.
 *
 * So the first group is not about a function. It is about the states that were
 * impossible before and must be possible now, and about the promise that
 * changing one axis never moves the other.
 */
import { describe, expect, it } from "vitest";
import {
  AXIS_BY_KIND,
  LEGACY_KIND_MAP,
  LEISURE_NOTE_TEMPLATES,
  countByKind,
  filterCollection,
  isSettled,
  migrateLeisureItem,
  primaryStatusOf,
  setPrimaryStatus,
  statusValuesFor,
  tracksOwnership,
} from "./leisureCollections";
import { MOCK_LEISURE } from "../mocks/leisure";
import type { LeisureItem } from "../types";

function item(extra: Partial<LeisureItem> = {}): LeisureItem {
  return {
    id: "x",
    kind: "book",
    title: "Something",
    tags: [],
    status: "idea",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("ownership and progress are independent", () => {
  it("records a book you own and have not started", () => {
    const book = item({ ownershipStatus: "owned", consumptionStatus: "not_started" });
    expect(book.ownershipStatus).toBe("owned");
    expect(book.consumptionStatus).toBe("not_started");
  });

  it("records a book you want to buy and have not started", () => {
    const book = item({ ownershipStatus: "wishlist", consumptionStatus: "not_started" });
    expect(book.ownershipStatus).toBe("wishlist");
    expect(book.consumptionStatus).toBe("not_started");
  });

  it("records a book you own and have finished", () => {
    const book = item({ ownershipStatus: "owned", consumptionStatus: "completed" });
    expect(book.ownershipStatus).toBe("owned");
    expect(book.consumptionStatus).toBe("completed");
  });

  it("records a borrowed book you are part-way through", () => {
    const book = item({ ownershipStatus: "borrowed", consumptionStatus: "in_progress" });
    expect(isSettled(book)).toBe(false);
  });

  it("changing progress never touches ownership", () => {
    const before = item({ ownershipStatus: "owned", consumptionStatus: "not_started" });
    const after = { ...before, ...setPrimaryStatus("book", "completed") };
    expect(after.consumptionStatus).toBe("completed");
    expect(after.ownershipStatus).toBe("owned");
  });

  it("changing ownership never touches progress", () => {
    const before = item({ ownershipStatus: "wishlist", consumptionStatus: "in_progress" });
    const after = { ...before, ownershipStatus: "owned" as const };
    expect(after.ownershipStatus).toBe("owned");
    expect(after.consumptionStatus).toBe("in_progress");
  });

  it("only tracks ownership where it means something", () => {
    // A streamed film is not owned and a destination cannot be.
    expect(tracksOwnership("book")).toBe(true);
    expect(tracksOwnership("movie")).toBe(false);
    expect(tracksOwnership("destination")).toBe(false);
  });
});

describe("each kind has its own status vocabulary", () => {
  it("gives films the four consumption states", () => {
    expect(statusValuesFor("movie")).toEqual([
      "not_started",
      "in_progress",
      "completed",
      "abandoned",
    ]);
  });

  it("gives destinations three", () => {
    expect(statusValuesFor("destination")).toEqual(["want_to_visit", "visited", "revisit"]);
  });

  it("gives purchases five, including waiting", () => {
    expect(statusValuesFor("future_purchase")).toEqual([
      "researching",
      "want_to_buy",
      "waiting",
      "purchased",
      "abandoned",
    ]);
  });

  it("writes each kind's status to its own field", () => {
    expect(setPrimaryStatus("book", "completed")).toEqual({ consumptionStatus: "completed" });
    expect(setPrimaryStatus("destination", "visited")).toEqual({ destinationStatus: "visited" });
    expect(setPrimaryStatus("future_purchase", "waiting")).toEqual({ purchaseStatus: "waiting" });
    expect(setPrimaryStatus("idea", "planned")).toEqual({ status: "planned" });
  });

  it("says nothing rather than a default when nothing was recorded", () => {
    // "Not started" and "never said" are different, and printing the first for
    // the second is a small lie that accumulates over a hundred rows.
    expect(primaryStatusOf(item({ consumptionStatus: undefined }))).toBeUndefined();
  });
});

describe("filters never mix the collections", () => {
  const items = [
    item({ id: "book", kind: "book", consumptionStatus: "completed", title: "Lisbon nights" }),
    item({ id: "film", kind: "movie", consumptionStatus: "not_started" }),
    item({ id: "place", kind: "destination", destinationStatus: "visited", region: "Portugal" }),
    item({ id: "buy", kind: "future_purchase", purchaseStatus: "waiting" }),
  ];

  it("returns only the requested kind", () => {
    expect(filterCollection(items, { kind: "book" }).map((e) => e.id)).toEqual(["book"]);
    expect(filterCollection(items, { kind: "movie" }).map((e) => e.id)).toEqual(["film"]);
  });

  it("cannot match a status belonging to another axis", () => {
    // Even hand-edited into the URL: "visited" is not a state a book can be in.
    expect(filterCollection(items, { kind: "book", status: "visited" })).toEqual([]);
    expect(filterCollection(items, { kind: "destination", status: "completed" })).toEqual([]);
  });

  it("searches the whole category, not one status or one page", () => {
    const found = filterCollection(items, { kind: "book", query: "lisbon" });
    expect(found.map((e) => e.id)).toEqual(["book"]);
    // It matched a finished book without the finished filter being on.
    expect(found[0].consumptionStatus).toBe("completed");
  });

  it("searches the region as well as the title and note", () => {
    expect(
      filterCollection(items, { kind: "destination", query: "portugal" }).map((e) => e.id)
    ).toEqual(["place"]);
  });

  it("narrows books by ownership independently of progress", () => {
    const books = [
      item({ id: "mine", ownershipStatus: "owned", consumptionStatus: "not_started" }),
      item({ id: "wanted", ownershipStatus: "wishlist", consumptionStatus: "not_started" }),
    ];
    expect(
      filterCollection(books, { kind: "book", ownership: "owned" }).map((e) => e.id)
    ).toEqual(["mine"]);
  });
});

describe("migrating data written before the five collections", () => {
  /*
   * These are real old payloads: the vocabulary the app shipped with, before
   * kinds were consolidated and before ownership existed as a fact of its own.
   */
  const old = (extra: Partial<LeisureItem>) =>
    ({
      id: "old",
      title: "Saved thing",
      tags: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...extra,
    }) as unknown as LeisureItem;

  it("renames every old kind to one of the five", () => {
    for (const [from, to] of Object.entries(LEGACY_KIND_MAP)) {
      const migrated = migrateLeisureItem(old({ kind: from as never, status: "idea" }));
      expect(migrated.kind).toBe(to);
    }
  });

  it("keeps the original kind when the rename loses a distinction", () => {
    expect(migrateLeisureItem(old({ kind: "series" as never, status: "idea" })).legacyKind).toBe(
      "series"
    );
    expect(migrateLeisureItem(old({ kind: "evening" as never, status: "idea" })).legacyKind).toBe(
      "evening"
    );
  });

  it("records no legacy kind when the name did not change", () => {
    expect(migrateLeisureItem(old({ kind: "book", status: "idea" })).legacyKind).toBeUndefined();
  });

  it("derives a progress status from the old one where it is knowable", () => {
    expect(migrateLeisureItem(old({ kind: "book", status: "done" })).consumptionStatus).toBe(
      "completed"
    );
    expect(migrateLeisureItem(old({ kind: "place" as never, status: "done" })).destinationStatus).toBe(
      "visited"
    );
    expect(
      migrateLeisureItem(old({ kind: "wishlist" as never, status: "planned" })).purchaseStatus
    ).toBe("want_to_buy");
  });

  it("never invents in_progress or abandoned", () => {
    // Nothing in the old data distinguished "planned to read" from "reading",
    // so `planned` becomes `not_started` rather than a guess the user never made.
    expect(migrateLeisureItem(old({ kind: "book", status: "planned" })).consumptionStatus).toBe(
      "not_started"
    );
    const kinds = ["book", "movie"] as const;
    for (const kind of kinds) {
      for (const status of ["idea", "planned", "done"] as const) {
        expect(migrateLeisureItem(old({ kind, status })).consumptionStatus).not.toBe("abandoned");
      }
    }
  });

  it("never invents ownership, because the old field never meant it", () => {
    // This is the one place the migration deliberately does nothing. `saved`
    // meant neither "I own it" nor "I want it", and the honest migration of an
    // unknown is to leave it unrecorded.
    for (const status of ["idea", "planned", "done"] as const) {
      expect(migrateLeisureItem(old({ kind: "book", status })).ownershipStatus).toBeUndefined();
    }
  });

  it("keeps every old field, including the ones only the suggester reads", () => {
    const before = old({
      kind: "activity" as never,
      status: "planned",
      note: "keep me",
      minutes: 90,
      energy: "low",
      place: "out",
      cost: "cheap",
      company: ["partner"],
      tags: ["outdoors"],
      lastSuggestedAt: "2026-02-02T00:00:00.000Z",
      dismissedUntil: "2026-03-03T00:00:00.000Z",
    });
    const after = migrateLeisureItem(before);

    expect(after.status).toBe("planned");
    expect(after.note).toBe("keep me");
    expect(after.minutes).toBe(90);
    expect(after.energy).toBe("low");
    expect(after.place).toBe("out");
    expect(after.cost).toBe("cheap");
    expect(after.company).toEqual(["partner"]);
    expect(after.tags).toEqual(["outdoors"]);
    expect(after.lastSuggestedAt).toBe("2026-02-02T00:00:00.000Z");
    expect(after.dismissedUntil).toBe("2026-03-03T00:00:00.000Z");
    expect(after.id).toBe("old");
  });

  it("never overwrites an answer the user has already given", () => {
    const chosen = item({
      kind: "book",
      status: "done",
      consumptionStatus: "abandoned",
      ownershipStatus: "borrowed",
    });
    const after = migrateLeisureItem(chosen);
    expect(after.consumptionStatus).toBe("abandoned");
    expect(after.ownershipStatus).toBe("borrowed");
  });

  it("is idempotent", () => {
    const once = migrateLeisureItem(old({ kind: "place" as never, status: "done" }));
    expect(migrateLeisureItem(once)).toEqual(once);
    expect(migrateLeisureItem(migrateLeisureItem(once))).toEqual(once);
  });
});

describe("the suggester stops offering what is finished with", () => {
  it("treats each kind's own end state as settled", () => {
    expect(isSettled(item({ kind: "book", consumptionStatus: "completed" }))).toBe(true);
    expect(isSettled(item({ kind: "movie", consumptionStatus: "abandoned" }))).toBe(true);
    expect(isSettled(item({ kind: "destination", destinationStatus: "visited" }))).toBe(true);
    expect(isSettled(item({ kind: "future_purchase", purchaseStatus: "purchased" }))).toBe(true);
  });

  it("leaves anything still open alone", () => {
    expect(isSettled(item({ kind: "book", consumptionStatus: "in_progress" }))).toBe(false);
    expect(isSettled(item({ kind: "destination", destinationStatus: "revisit" }))).toBe(false);
    expect(isSettled(item({ kind: "future_purchase", purchaseStatus: "waiting" }))).toBe(false);
  });
});

describe("note templates are scoped to the kind", () => {
  it("offers a book's prompts to a book and a purchase's to a purchase", () => {
    const bookIds = LEISURE_NOTE_TEMPLATES.book.map((entry) => entry.id);
    const buyIds = LEISURE_NOTE_TEMPLATES.future_purchase.map((entry) => entry.id);

    expect(bookIds).toContain("stoppedAt");
    expect(buyIds).toContain("prosCons");
    // "Pros and cons" is the right question for a camera and the wrong one for
    // a novel — the same rule that keeps a supermarket list off a study plan.
    expect(bookIds).not.toContain("prosCons");
  });

  it("gives every kind at least one starting point", () => {
    for (const kind of Object.keys(AXIS_BY_KIND) as (keyof typeof AXIS_BY_KIND)[]) {
      expect(LEISURE_NOTE_TEMPLATES[kind].length).toBeGreaterThan(0);
    }
  });
});

describe("the seeded collections", () => {
  it("puts something in every tab", () => {
    const counts = countByKind(MOCK_LEISURE.map(migrateLeisureItem));
    for (const kind of Object.keys(counts) as (keyof typeof counts)[]) {
      expect(counts[kind], `${kind} is empty`).toBeGreaterThan(0);
    }
  });

  it("demonstrates the state that was impossible before", () => {
    const owned = MOCK_LEISURE.find(
      (entry) =>
        entry.kind === "book" &&
        entry.ownershipStatus === "owned" &&
        entry.consumptionStatus === "not_started"
    );
    expect(owned).toBeDefined();
  });
});
