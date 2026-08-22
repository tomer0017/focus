/**
 * The rules behind the learning area.
 *
 * Everything here is a pure function over data the app already had. There is no
 * learning entity, no course, no lesson and no grade: a learning page is a
 * `PageSummary` of type `learning`, its plan is a `Checklist`, its writing is
 * `ProjectNote[]` and its material is `SavedItem[]`. What this module adds is
 * the one idea those mechanisms did not have — **a level** — and the arithmetic
 * that makes it useful.
 */
import type {
  Checklist,
  ChecklistTemplate,
  LearningFacts,
  LearningLevel,
  LearningResource,
  PageStatus,
  PageSummary,
  ProjectCategory,
  SavedItem,
  SavedItemKind,
} from "../types";
import type { ProjectNoteTemplate } from "./projectNotes";

/* ---------------------------------------------------------------- levels -- */

export const LEARNING_LEVELS: LearningLevel[] = ["beginner", "intermediate", "advanced"];

/** What the level strip can be set to. `all` is a filter, never a stored value. */
export type LearningLevelFilter = LearningLevel | "all";

export function isLearningLevel(value: string | null | undefined): value is LearningLevel {
  return LEARNING_LEVELS.includes(value as LearningLevel);
}

/** Reads a level filter out of a URL query, falling back to "all". */
export function levelFilterFrom(value: string | null | undefined): LearningLevelFilter {
  return isLearningLevel(value) ? value : "all";
}

/**
 * Whether a note or a resource belongs in the current level view.
 *
 * **An item with no level is general, and general shows at every level.** That
 * is the decision, and it is the one that decides whether the filter is worth
 * having. The alternative — hiding unlevelled material unless "all levels" is
 * selected — means the dictionary link and the "where I stopped" note vanish
 * the moment somebody narrows to beginner, which is precisely when they are
 * looking for them. Absent here means "applies throughout", not "not filed
 * yet"; the UI labels it as general so the user can see which it is.
 */
export function matchesLevel(
  level: LearningLevel | undefined,
  filter: LearningLevelFilter
): boolean {
  if (filter === "all") return true;
  return level === undefined || level === filter;
}

/* ---------------------------------------------------------------- groups -- */

/**
 * The learning list's tabs.
 *
 * These are `PageStatus` values and nothing else — no `LearningStatus` type was
 * added, because "on hold" and "paused" are the same fact with two names, and
 * two names is how a board starts disagreeing with itself. `all` is a view, not
 * a state.
 */
export type LearningGroup = PageStatus | "all";

export const LEARNING_GROUPS: LearningGroup[] = ["active", "paused", "completed", "all"];

export function isLearningGroup(value: string | null | undefined): value is LearningGroup {
  return LEARNING_GROUPS.includes(value as LearningGroup);
}

export function inLearningGroup(page: PageSummary, group: LearningGroup): boolean {
  return group === "all" || page.status === group;
}

/**
 * Every learning page, most recently *studied* first.
 *
 * `lastStudiedAt` leads and `lastUpdatedAt` is only the fallback: tidying the
 * notes is not studying, and a list sorted by the second one puts the page you
 * proof-read yesterday above the one you actually practised.
 */
export function learningPages(pages: PageSummary[]): PageSummary[] {
  return pages
    .filter((page) => page.type === "learning")
    .sort((a, b) => {
      const left = a.learning?.lastStudiedAt ?? a.lastUpdatedAt;
      const right = b.learning?.lastStudiedAt ?? b.lastUpdatedAt;
      return right.localeCompare(left);
    });
}

/* ---------------------------------------------------------------- topics -- */

/**
 * The subjects a fresh install starts with.
 *
 * The same `ProjectCategory` model the projects board uses — a label with an
 * order, no rules, no container — but a **separate list**, because "languages"
 * has no business appearing as a tab on the projects board and "physical" has
 * none here. One model, two lists, is the 80/20 rule working correctly; one
 * model, one list would have been the rule applied without thinking.
 *
 * They store a `nameKey` in the `pages` namespace, so the app ships in both
 * languages without either being written into stored data. Renaming drops the
 * key, exactly as everywhere else.
 */
export const DEFAULT_LEARNING_TOPICS: ProjectCategory[] = [
  { id: "languages", nameKey: "learning.topics.languages", order: 0 },
  { id: "career", nameKey: "learning.topics.career", order: 1 },
  { id: "leisure", nameKey: "learning.topics.leisure", order: 2 },
];

/**
 * A learning page's topic, or `undefined`.
 *
 * Unlike `categoryOf` for projects, nothing is derived from the space: a
 * learning page with no topic is a normal, complete learning page, and guessing
 * one would put "React Native" under whichever space it happened to be filed
 * in and then keep insisting on it.
 */
export function topicOf(page: PageSummary): string | undefined {
  return page.categoryId;
}

export function topicLabel(
  topics: ProjectCategory[],
  id: string | undefined,
  translate: (key: string) => string
): string | undefined {
  const topic = topics.find((entry) => entry.id === id);
  if (!topic) return undefined;
  return topic.name ?? (topic.nameKey ? translate(`pages:${topic.nameKey}`) : topic.id);
}

export function learningTopicId(): string {
  return `topic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* --------------------------------------------------------- note templates -- */

/**
 * The note starting points offered on a learning page.
 *
 * Learning-only, and that is the point of them existing separately from
 * `PROJECT_NOTE_TEMPLATES`: "Budget" and "Measurements" are the wrong prompts
 * for learning French, and a shopping-list template has no business anywhere
 * near this screen. A template supplies a title and a hint. It never writes
 * content, and none of them is applied unless the user picks it.
 */
export const LEARNING_NOTE_TEMPLATES: ProjectNoteTemplate[] = [
  {
    id: "stoppedAt",
    titleKey: "learning.notes.stoppedAt.title",
    hintKey: "learning.notes.stoppedAt.hint",
  },
  {
    id: "plan",
    titleKey: "learning.notes.plan.title",
    hintKey: "learning.notes.plan.hint",
  },
  {
    id: "nextSteps",
    titleKey: "learning.notes.nextSteps.title",
    hintKey: "learning.notes.nextSteps.hint",
  },
  {
    id: "remember",
    titleKey: "learning.notes.remember.title",
    hintKey: "learning.notes.remember.hint",
  },
];

/* ------------------------------------------------------------- resources -- */

/** The four kinds of material, one panel at a time. */
export type LearningResourceTab = "links" | "documents" | "images" | "videos";

export const LEARNING_RESOURCE_TABS: LearningResourceTab[] = [
  "links",
  "documents",
  "images",
  "videos",
];

export function isResourceTab(value: string | null | undefined): value is LearningResourceTab {
  return LEARNING_RESOURCE_TABS.includes(value as LearningResourceTab);
}

/**
 * Which panel a saved item shows up in.
 *
 * Derived from `SavedItem.kind`, so there is one storage model for all four
 * panels rather than four parallel lists that could disagree about what a
 * "document" is. Everything that is not a video, a document or a picture is a
 * link, which is the honest default: a recipe or a product saved onto a
 * learning page is still something you open.
 */
export function resourceTabOf(item: SavedItem): LearningResourceTab {
  switch (item.kind) {
    case "video":
      return "videos";
    case "document":
      return "documents";
    case "image":
    case "inspiration":
      return "images";
    default:
      return "links";
  }
}

/** The kind a new resource gets, given the panel it is being added to. */
export function kindForTab(tab: LearningResourceTab): SavedItemKind {
  switch (tab) {
    case "videos":
      return "video";
    case "documents":
      return "document";
    case "images":
      return "image";
    case "links":
      return "link";
  }
}

/** A saved item together with how this page files it. */
export interface ResolvedLearningResource {
  item: SavedItem;
  level?: LearningLevel;
  /** The page's own line about the item, falling back to the item's note. */
  note?: string;
  /**
   * Where the user put it. Absent for anything never arranged, which then falls
   * to the end, most recently saved first — the same convention the projects
   * board uses for a card nobody has dragged.
   */
  order?: number;
}

function resourceMap(facts: LearningFacts | undefined): Map<string, LearningResource> {
  return new Map((facts?.resources ?? []).map((entry) => [entry.savedItemId, entry]));
}

/**
 * Everything attached to a learning page, in order.
 *
 * The link itself is `SavedItem.contextIds` — the app's one answer to "what is
 * this attached to" — and this reads it rather than replacing it. The page's
 * own `resources` array only *decorates* those links with a level, a note and a
 * position, and `detachedResourceIds` removes one from this page without
 * touching an item three other pages may share.
 *
 * A `resources` entry for an item that no longer references the page is ignored
 * rather than resurrected: the reference is the fact, the decoration is not.
 */
export function learningResources(
  page: PageSummary,
  savedItems: SavedItem[]
): ResolvedLearningResource[] {
  const decoration = resourceMap(page.learning);
  const detached = new Set(page.learning?.detachedResourceIds ?? []);

  return savedItems
    .filter((item) => item.contextIds.includes(page.id) && !detached.has(item.id))
    .map((item) => {
      const entry = decoration.get(item.id);
      return {
        item,
        level: entry?.level,
        note: entry?.note?.trim() || item.note,
        order: entry?.order,
      };
    })
    .sort((a, b) => {
      const left = a.order ?? Number.MAX_SAFE_INTEGER;
      const right = b.order ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return b.item.savedAt.localeCompare(a.item.savedAt);
    });
}

/** The resources in one panel, already filtered by level. */
export function resourcesIn(
  resources: ResolvedLearningResource[],
  tab: LearningResourceTab,
  filter: LearningLevelFilter
): ResolvedLearningResource[] {
  return resources.filter(
    (resource) => resourceTabOf(resource.item) === tab && matchesLevel(resource.level, filter)
  );
}

/** How many resources each panel holds at the current level. Drives the counts. */
export function resourceCounts(
  resources: ResolvedLearningResource[],
  filter: LearningLevelFilter
): Record<LearningResourceTab, number> {
  const counts: Record<LearningResourceTab, number> = {
    links: 0,
    documents: 0,
    images: 0,
    videos: 0,
  };
  for (const resource of resources) {
    if (matchesLevel(resource.level, filter)) counts[resourceTabOf(resource.item)] += 1;
  }
  return counts;
}

/**
 * Files a resource — sets its level or its note — without disturbing the rest.
 *
 * Pure, and returns the whole `LearningFacts` block, because that is the shape
 * the provider writes in one go. `undefined` for `level` is a real value here:
 * it means "general", not "leave it alone".
 */
export function withResource(
  facts: LearningFacts | undefined,
  savedItemId: string,
  patch: Omit<Partial<LearningResource>, "savedItemId">
): LearningFacts {
  const existing = facts?.resources ?? [];
  const found = existing.some((entry) => entry.savedItemId === savedItemId);
  const resources = found
    ? existing.map((entry) =>
        entry.savedItemId === savedItemId ? { ...entry, ...patch } : entry
      )
    : [...existing, { savedItemId, ...patch }];

  return {
    ...facts,
    resources,
    // Attaching something that was previously removed un-removes it.
    detachedResourceIds: (facts?.detachedResourceIds ?? []).filter((id) => id !== savedItemId),
  };
}

/**
 * Takes a resource off this learning page.
 *
 * It records a tombstone; it does not delete the `SavedItem`, which may be
 * attached to a trip, a recipe and two other pages. "Remove this from my
 * English page" and "delete this video" are different requests.
 */
export function withoutResource(
  facts: LearningFacts | undefined,
  savedItemId: string
): LearningFacts {
  const detached = facts?.detachedResourceIds ?? [];
  return {
    ...facts,
    resources: (facts?.resources ?? []).filter((entry) => entry.savedItemId !== savedItemId),
    detachedResourceIds: detached.includes(savedItemId) ? detached : [...detached, savedItemId],
  };
}

/* ------------------------------------------------------- foreign lists -- */

/**
 * True when the list attached to a learning page came from another domain's
 * template — a weekly shop, a packing list, an event checklist.
 *
 * This existed as a bug before it existed as a function: the learning page
 * offered the app-wide template picker, so "start a study plan" could produce a
 * supermarket list of fruit, dairy and bakery. The picker is gone, but the
 * lists it already created are on people's machines, and a migration that
 * deleted them would be destroying user data to tidy up a mistake the app made.
 * So the page recognises one, says what it is, and offers to remove it. Nothing
 * is removed without being asked.
 */
export function isForeignChecklist(
  checklist: Checklist | undefined,
  templates: ChecklistTemplate[]
): boolean {
  if (!checklist?.templateId) return false;
  const template = templates.find((entry) => entry.id === checklist.templateId);
  if (!template) return false;
  const category = template.category ?? "general";
  return category !== "general";
}
