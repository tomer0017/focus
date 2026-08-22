/**
 * Checklist isolation.
 *
 * This file exists because of a bug a user could see: "Trip North" — a camping
 * packing list — appeared on the household **Shopping & Menus** screen, beside
 * the weekly supermarket run. Nothing was wrong with the rendering. The query
 * asked for every page whose `type` was `checklist`, which is the storage shape
 * and not the purpose, and a packing list is one of those.
 *
 * So the tests below are not about a function. They are about the promise the
 * function makes: **a list appears only on the screen it belongs to.**
 */
import { describe, expect, it } from "vitest";
import {
  UNCLASSIFIED_CONTEXT,
  checklistContextOf,
  matchesChecklistContext,
  selectHouseholdShoppingLists,
} from "./checklist";
import { MOCK_PAGES } from "../mocks/pages";
import { MOCK_CHECKLISTS } from "../mocks/checklists";
import type { ChecklistContext, PageSummary } from "../types";

function page(id: string, extra: Partial<PageSummary> = {}): PageSummary {
  return {
    id,
    type: "checklist",
    spaceId: "home",
    status: "active",
    title: id,
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...extra,
  };
}

const household: ChecklistContext = { purpose: "shopping", scope: "household" };

describe("checklistContextOf", () => {
  it("reads the parent an entity-owned list already recorded", () => {
    // The owner key *is* an EntityReference in string form, so this is reading
    // what the writer wrote — not guessing from a route or a title.
    expect(checklistContextOf("trip:japan-2027")).toEqual({ purpose: "packing", scope: "trip" });
    expect(checklistContextOf("event:wedding")).toEqual({ purpose: "event", scope: "event" });
    expect(checklistContextOf("project:sorcol")).toEqual({ purpose: "tasks", scope: "project" });
    expect(checklistContextOf("family:luna")).toEqual({ purpose: "general", scope: "person" });
  });

  it("lets a page-owned list answer for itself", () => {
    const shop = page("weekly", { checklist: household });
    expect(checklistContextOf("page:weekly", shop)).toEqual(household);

    const packing = page("north", { checklist: { purpose: "packing", scope: "trip" } });
    expect(checklistContextOf("page:north", packing)).toEqual({
      purpose: "packing",
      scope: "trip",
    });
  });

  it("calls an undeclared list unclassified rather than guessing", () => {
    // The safe failure. An unclassified list shows on no screen that filters,
    // which is quieter and more honest than showing it on the wrong one.
    expect(checklistContextOf("page:mystery", page("mystery"))).toEqual(UNCLASSIFIED_CONTEXT);
    expect(checklistContextOf("page:mystery")).toEqual(UNCLASSIFIED_CONTEXT);
    expect(checklistContextOf("nonsense")).toEqual(UNCLASSIFIED_CONTEXT);
  });

  it("never lets the space a page sits in decide its purpose", () => {
    // A packing list filed under Home is still a packing list. Deriving from
    // the space would re-guess every time the page moved.
    const packingAtHome = page("north", {
      spaceId: "home",
      checklist: { purpose: "packing", scope: "trip" },
    });
    expect(checklistContextOf("page:north", packingAtHome).scope).toBe("trip");
  });
});

describe("matchesChecklistContext", () => {
  it("requires both axes when both are asked for", () => {
    expect(matchesChecklistContext(household, household)).toBe(true);
    expect(matchesChecklistContext(household, { purpose: "packing", scope: "household" })).toBe(
      false
    );
    expect(matchesChecklistContext(household, { purpose: "shopping", scope: "trip" })).toBe(false);
  });

  it("treats an omitted axis as no constraint", () => {
    expect(matchesChecklistContext(household, { purpose: "shopping" })).toBe(true);
    expect(matchesChecklistContext(household, {})).toBe(true);
  });
});

describe("selectHouseholdShoppingLists", () => {
  it("excludes Trip North — the bug this file is named after", () => {
    const titles = selectHouseholdShoppingLists(MOCK_PAGES).map((entry) => entry.title);
    expect(titles).not.toContain("Trip North");
    expect(titles).not.toContain("Before a Flight");
  });

  it("still shows the household lists", () => {
    const ids = selectHouseholdShoppingLists(MOCK_PAGES).map((entry) => entry.id);
    expect(ids).toContain("weekly-shop");
    expect(ids).toContain("holiday-shop");
  });

  it("shows nothing that is not a checklist page", () => {
    const types = new Set(selectHouseholdShoppingLists(MOCK_PAGES).map((entry) => entry.type));
    expect([...types]).toEqual(["checklist"]);
  });

  it("drops an unclassified list rather than assuming it is shopping", () => {
    const pages = [page("declared", { checklist: household }), page("undeclared")];
    expect(selectHouseholdShoppingLists(pages).map((entry) => entry.id)).toEqual(["declared"]);
  });
});

describe("every seeded list is reachable from exactly the right screen", () => {
  it("classifies every seeded checklist, page-owned and entity-owned alike", () => {
    // The acceptance test in prose: no checklist in the seed lands in
    // "unclassified", because unclassified means nobody can find it.
    const byId = new Map(MOCK_PAGES.map((entry) => [entry.id, entry]));

    for (const ownerId of Object.keys(MOCK_CHECKLISTS)) {
      const [kind, id] = ownerId.split(":");
      const context = checklistContextOf(ownerId, kind === "page" ? byId.get(id) : undefined);
      expect(context, `${ownerId} is unclassified`).not.toEqual(UNCLASSIFIED_CONTEXT);
    }
  });

  it("keeps trip and household lists in disjoint sets", () => {
    const householdIds = new Set(selectHouseholdShoppingLists(MOCK_PAGES).map((p) => p.id));
    const tripIds = MOCK_PAGES.filter(
      (entry) =>
        entry.type === "checklist" &&
        checklistContextOf(`page:${entry.id}`, entry).scope === "trip"
    ).map((entry) => entry.id);

    expect(tripIds.length).toBeGreaterThan(0);
    for (const id of tripIds) expect(householdIds.has(id)).toBe(false);
  });
});
