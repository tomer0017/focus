/**
 * The learning rules.
 *
 * Three of these describe failures the app actually shipped: a study plan that
 * could be created from a supermarket template, material that vanished the
 * moment somebody narrowed to a level, and "remove this from my page" that had
 * no way of meaning anything other than "delete it everywhere".
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEARNING_TOPICS,
  LEARNING_NOTE_TEMPLATES,
  inLearningGroup,
  isForeignChecklist,
  kindForTab,
  learningPages,
  learningResources,
  levelFilterFrom,
  matchesLevel,
  resourceCounts,
  resourceTabOf,
  resourcesIn,
  topicLabel,
  topicOf,
  withResource,
  withoutResource,
} from "./learning";
import { PROJECT_NOTE_TEMPLATES } from "./projectNotes";
import type {
  Checklist,
  ChecklistTemplate,
  PageSummary,
  SavedItem,
  SavedItemKind,
} from "../types";

function page(patch: Partial<PageSummary> = {}): PageSummary {
  return {
    id: "learn-1",
    type: "learning",
    spaceId: "personal",
    status: "active",
    title: "אנגלית",
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...patch,
  };
}

function item(id: string, kind: SavedItemKind, patch: Partial<SavedItem> = {}): SavedItem {
  return {
    id,
    kind,
    title: id,
    source: "web",
    spaceId: "personal",
    thumb: "books",
    contextIds: ["learn-1"],
    savedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

describe("levels", () => {
  it("shows an item filed under the selected level", () => {
    expect(matchesLevel("beginner", "beginner")).toBe(true);
    expect(matchesLevel("advanced", "beginner")).toBe(false);
  });

  it("shows general material at every level", () => {
    // The rule the filter lives or dies by: a dictionary link with no level is
    // material that applies throughout, and hiding it when somebody narrows to
    // "beginner" removes it exactly when they went looking for it.
    for (const filter of ["all", "beginner", "intermediate", "advanced"] as const) {
      expect(matchesLevel(undefined, filter)).toBe(true);
    }
  });

  it("shows everything at 'all levels'", () => {
    expect(matchesLevel("advanced", "all")).toBe(true);
  });

  it("reads a level out of a query string and refuses anything else", () => {
    expect(levelFilterFrom("intermediate")).toBe("intermediate");
    expect(levelFilterFrom("expert")).toBe("all");
    expect(levelFilterFrom(null)).toBe("all");
  });
});

describe("groups", () => {
  it("maps a tab to the page status it already had", () => {
    expect(inLearningGroup(page({ status: "paused" }), "paused")).toBe(true);
    expect(inLearningGroup(page({ status: "paused" }), "active")).toBe(false);
  });

  it("puts everything in 'all', whatever its status", () => {
    expect(inLearningGroup(page({ status: "completed" }), "all")).toBe(true);
  });

  it("sorts by when it was last studied, not when it was last tidied", () => {
    const tidied = page({
      id: "tidied",
      lastUpdatedAt: "2026-05-01T00:00:00.000Z",
      learning: { lastStudiedAt: "2026-01-01T00:00:00.000Z" },
    });
    const studied = page({
      id: "studied",
      lastUpdatedAt: "2026-02-01T00:00:00.000Z",
      learning: { lastStudiedAt: "2026-04-01T00:00:00.000Z" },
    });
    expect(learningPages([tidied, studied]).map((entry) => entry.id)).toEqual([
      "studied",
      "tidied",
    ]);
  });

  it("ignores pages that are not learning pages", () => {
    expect(learningPages([page({ type: "project" })])).toEqual([]);
  });
});

describe("subjects", () => {
  it("seeds three, each carrying a key rather than a language", () => {
    expect(DEFAULT_LEARNING_TOPICS.map((entry) => entry.id)).toEqual([
      "languages",
      "career",
      "leisure",
    ]);
    expect(DEFAULT_LEARNING_TOPICS.every((entry) => entry.nameKey && !entry.name)).toBe(true);
  });

  it("derives nothing: an unfiled page has no subject", () => {
    // Unlike projects, which fall back to a subject derived from their space.
    // "React Native" filed under "personal" is not a subject, it is a guess.
    expect(topicOf(page())).toBeUndefined();
    expect(topicOf(page({ categoryId: "career" }))).toBe("career");
  });

  it("prefers the user's own word over the seeded key", () => {
    const topics = [
      { id: "languages", nameKey: "learning.topics.languages", order: 0 },
      { id: "mine", name: "שפות זרות", order: 1 },
    ];
    expect(topicLabel(topics, "mine", (key) => key)).toBe("שפות זרות");
    expect(topicLabel(topics, "languages", (key) => key)).toBe(
      "pages:learning.topics.languages"
    );
    expect(topicLabel(topics, "gone", (key) => key)).toBeUndefined();
  });
});

describe("note templates", () => {
  it("offers learning prompts, and none of the project ones", () => {
    expect(LEARNING_NOTE_TEMPLATES.map((entry) => entry.id)).toEqual([
      "stoppedAt",
      "plan",
      "nextSteps",
      "remember",
    ]);
    const projectIds = new Set(PROJECT_NOTE_TEMPLATES.map((entry) => entry.id));
    expect(LEARNING_NOTE_TEMPLATES.some((entry) => projectIds.has(entry.id))).toBe(false);
  });

  it("carries a title and a hint, and no content", () => {
    for (const template of LEARNING_NOTE_TEMPLATES) {
      expect(template.titleKey.startsWith("learning.notes.")).toBe(true);
      expect(template.hintKey.endsWith(".hint")).toBe(true);
      expect(Object.keys(template).sort()).toEqual(["hintKey", "id", "titleKey"]);
    }
  });
});

describe("material panels", () => {
  it("routes each kind to exactly one panel", () => {
    expect(resourceTabOf(item("a", "video"))).toBe("videos");
    expect(resourceTabOf(item("a", "document"))).toBe("documents");
    expect(resourceTabOf(item("a", "image"))).toBe("images");
    expect(resourceTabOf(item("a", "inspiration"))).toBe("images");
    expect(resourceTabOf(item("a", "link"))).toBe("links");
    // Anything else is still something you open.
    expect(resourceTabOf(item("a", "product"))).toBe("links");
  });

  it("creates the kind the panel implies", () => {
    expect(kindForTab("videos")).toBe("video");
    expect(kindForTab("documents")).toBe("document");
    expect(kindForTab("images")).toBe("image");
    expect(kindForTab("links")).toBe("link");
  });
});

describe("resources", () => {
  const items = [
    item("link-1", "link"),
    item("doc-1", "document"),
    item("vid-1", "video"),
    item("other", "link", { contextIds: ["some-other-page"] }),
  ];

  it("reads the attachment from contextIds, not from the page's own list", () => {
    const resolved = learningResources(page(), items);
    expect(resolved.map((entry) => entry.item.id)).toEqual(["link-1", "doc-1", "vid-1"]);
  });

  it("decorates an attachment with the level the page filed it under", () => {
    const decorated = page({
      learning: { resources: [{ savedItemId: "vid-1", level: "advanced", order: 0 }] },
    });
    const resolved = learningResources(decorated, items);
    expect(resolved[0].item.id).toBe("vid-1");
    expect(resolved[0].level).toBe("advanced");
    // Everything else is general, which is a real answer and not a missing one.
    expect(resolved.slice(1).every((entry) => entry.level === undefined)).toBe(true);
  });

  it("ignores decoration for an item that no longer references the page", () => {
    const stale = page({ learning: { resources: [{ savedItemId: "other", level: "beginner" }] } });
    expect(learningResources(stale, items).some((entry) => entry.item.id === "other")).toBe(false);
  });

  it("filters a panel by level, keeping general material visible", () => {
    const filed = page({
      learning: {
        resources: [
          { savedItemId: "link-1", level: "advanced" },
          { savedItemId: "doc-1", level: "beginner" },
        ],
      },
    });
    const resolved = learningResources(filed, items);
    expect(resourcesIn(resolved, "links", "beginner")).toHaveLength(0);
    expect(resourcesIn(resolved, "documents", "beginner")).toHaveLength(1);
    // The video has no level, so it stays.
    expect(resourcesIn(resolved, "videos", "beginner")).toHaveLength(1);
  });

  it("counts each panel at the current level", () => {
    const filed = page({
      learning: { resources: [{ savedItemId: "link-1", level: "advanced" }] },
    });
    const resolved = learningResources(filed, items);
    expect(resourceCounts(resolved, "all")).toEqual({
      links: 1,
      documents: 1,
      images: 0,
      videos: 1,
    });
    expect(resourceCounts(resolved, "beginner").links).toBe(0);
  });
});

describe("filing and removing", () => {
  it("files a resource without disturbing the others", () => {
    const facts = withResource({ resources: [{ savedItemId: "a", level: "beginner" }] }, "b", {
      level: "advanced",
    });
    expect(facts.resources).toEqual([
      { savedItemId: "a", level: "beginner" },
      { savedItemId: "b", level: "advanced" },
    ]);
  });

  it("treats an explicit 'general' as a value, not as leaving it alone", () => {
    const facts = withResource({ resources: [{ savedItemId: "a", level: "beginner" }] }, "a", {
      level: undefined,
    });
    expect(facts.resources?.[0].level).toBeUndefined();
  });

  it("keeps the goal, the method and the last session untouched", () => {
    const facts = withResource(
      { level: "beginner", goal: "לדבר", method: "קורס", lastStudiedAt: "2026-01-01" },
      "a",
      { level: "advanced" }
    );
    expect(facts.goal).toBe("לדבר");
    expect(facts.method).toBe("קורס");
    expect(facts.lastStudiedAt).toBe("2026-01-01");
    expect(facts.level).toBe("beginner");
  });

  it("removes a resource from the page and leaves the saved item alone", () => {
    const items = [item("vid-1", "video", { contextIds: ["learn-1", "trip-japan"] })];
    const facts = withoutResource({ resources: [{ savedItemId: "vid-1" }] }, "vid-1");

    expect(learningResources(page({ learning: facts }), items)).toEqual([]);
    // The item itself, and every other context it belongs to, is untouched.
    expect(items[0].contextIds).toEqual(["learn-1", "trip-japan"]);
  });

  it("un-removes an item that is attached again", () => {
    const removed = withoutResource({}, "vid-1");
    const readded = withResource(removed, "vid-1", { level: "beginner" });
    expect(readded.detachedResourceIds).toEqual([]);
    expect(readded.resources).toEqual([{ savedItemId: "vid-1", level: "beginner" }]);
  });

  it("does not record the same tombstone twice", () => {
    const once = withoutResource({}, "vid-1");
    expect(withoutResource(once, "vid-1").detachedResourceIds).toEqual(["vid-1"]);
  });
});

describe("a list from the wrong domain", () => {
  const templates: ChecklistTemplate[] = [
    { id: "shop-weekly", category: "shopping", groups: [] },
    { id: "trip-standard", category: "trip", groups: [] },
    { id: "mine", name: "שלי", groups: [] },
  ];
  const list = (patch: Partial<Checklist> = {}): Checklist => ({
    ownerId: "page:learn-1",
    groups: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  });

  it("recognises the supermarket list this page could once create", () => {
    expect(isForeignChecklist(list({ templateId: "shop-weekly" }), templates)).toBe(true);
    expect(isForeignChecklist(list({ templateId: "trip-standard" }), templates)).toBe(true);
  });

  it("leaves a list the user wrote or saved themselves alone", () => {
    expect(isForeignChecklist(list(), templates)).toBe(false);
    expect(isForeignChecklist(list({ templateId: "mine" }), templates)).toBe(false);
    // A template that no longer exists is not evidence of anything.
    expect(isForeignChecklist(list({ templateId: "gone" }), templates)).toBe(false);
    expect(isForeignChecklist(undefined, templates)).toBe(false);
  });
});
