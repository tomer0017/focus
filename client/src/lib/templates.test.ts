import { describe, expect, it } from "vitest";
import { fromTemplate, toggleItem } from "./checklist";
import {
  checklistFromTemplate,
  partitionTemplates,
  rememberTemplate,
  sharesNoIdentity,
  RECENT_LIMIT,
} from "./templates";
import { BUILT_IN_TEMPLATES, templatesFor } from "../mocks/checklistTemplates";
import type { ChecklistTemplate } from "../types/checklist";

const weekly = BUILT_IN_TEMPLATES.find((entry) => entry.id === "shop-weekly")!;

describe("cloning a template", () => {
  it("regenerates every id, so nothing is shared with the template", () => {
    const list = checklistFromTemplate("page:shop", weekly);
    const templateIds = weekly.groups.flatMap((group) => [
      group.id,
      ...group.items.map((item) => item.id),
    ]);
    const listIds = list.groups.flatMap((group) => [
      group.id,
      ...group.items.map((item) => item.id),
    ]);
    expect(listIds.some((id) => templateIds.includes(id))).toBe(false);
  });

  it("produces two independent lists from the same template", () => {
    const first = checklistFromTemplate("page:a", weekly);
    const second = checklistFromTemplate("page:b", weekly);
    expect(sharesNoIdentity(first, second)).toBe(true);
  });

  it("starts every box unticked", () => {
    const list = checklistFromTemplate("page:shop", weekly);
    expect(list.groups.every((group) => group.items.every((item) => !item.done))).toBe(true);
  });

  it("remembers which template it came from", () => {
    expect(checklistFromTemplate("page:shop", weekly).templateId).toBe("shop-weekly");
  });
});

describe("template independence", () => {
  it("ticking an item on a list never reaches the template", () => {
    // This is the acceptance criterion in plain form: a weekly shop you can
    // only use once is not a template.
    const before = JSON.stringify(weekly);
    const list = checklistFromTemplate("page:shop", weekly);
    const groupId = list.groups[0].id;
    const itemId = list.groups[0].items[0].id;

    const ticked = toggleItem(list, groupId, itemId);
    expect(ticked.groups[0].items[0].done).toBe(true);
    expect(JSON.stringify(weekly)).toBe(before);
  });

  it("editing one list never reaches another built from the same template", () => {
    const a = checklistFromTemplate("page:a", weekly);
    const b = checklistFromTemplate("page:b", weekly);
    const ticked = toggleItem(a, a.groups[0].id, a.groups[0].items[0].id);

    expect(ticked.groups[0].items[0].done).toBe(true);
    expect(b.groups[0].items[0].done).toBe(false);
  });

  it("`fromTemplate` in lib/checklist gives the same guarantee", () => {
    // The app uses this one; the wrapper exists only to carry a title across.
    const list = fromTemplate("page:shop", weekly);
    expect(sharesNoIdentity(list, checklistFromTemplate("page:other", weekly))).toBe(true);
  });
});

describe("built-in templates", () => {
  it("carries keys rather than words, so no language reaches stored data", () => {
    for (const template of BUILT_IN_TEMPLATES) {
      expect(template.nameKey).toBeTruthy();
      expect(template.name).toBeUndefined();
      for (const group of template.groups) {
        expect(group.titleKey).toBeTruthy();
        expect(group.title).toBeUndefined();
        for (const item of group.items) {
          expect(item.textKey).toBeTruthy();
          expect(item.text).toBeUndefined();
        }
      }
    }
  });

  it("splits cleanly into shopping and packing", () => {
    expect(templatesFor("shopping").length).toBeGreaterThan(0);
    expect(templatesFor("trip").length).toBeGreaterThan(0);
    expect(
      templatesFor("shopping").every((template) => !templatesFor("trip").includes(template))
    ).toBe(true);
  });

  it("gives every template a unique id", () => {
    const ids = BUILT_IN_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("partitionTemplates", () => {
  const templates = [
    { id: "a", recommended: true },
    { id: "b", recommended: true },
    { id: "c" },
    { id: "d" },
  ];

  it("puts a recently used template under Recent only, never twice", () => {
    const { recommended, recent } = partitionTemplates(templates, ["a"]);
    expect(recent.map((entry) => entry.id)).toEqual(["a"]);
    expect(recommended.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("ignores a remembered id that no longer exists", () => {
    const { recent } = partitionTemplates(templates, ["gone", "c"]);
    expect(recent.map((entry) => entry.id)).toEqual(["c"]);
  });

  it("always offers the full list", () => {
    expect(partitionTemplates(templates, []).all).toHaveLength(4);
  });
});

describe("rememberTemplate", () => {
  it("moves a repeat to the front rather than adding it twice", () => {
    expect(rememberTemplate(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("caps the history", () => {
    let history: string[] = [];
    for (const id of ["a", "b", "c", "d", "e", "f"]) {
      history = rememberTemplate(history, id);
    }
    expect(history).toHaveLength(RECENT_LIMIT);
    expect(history[0]).toBe("f");
  });
});

describe("a user-saved template", () => {
  it("keeps its own words and is treated as general", () => {
    const saved: ChecklistTemplate = {
      id: "mine",
      name: "My list",
      groups: [{ id: "g", title: "Things", items: [{ id: "i", text: "One", done: true }] }],
    };
    const list = checklistFromTemplate("page:x", saved);
    expect(list.title).toBe("My list");
    // A saved template captures the words, but never the ticks.
    expect(list.groups[0].items[0].done).toBe(false);
  });
});
