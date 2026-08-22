import type { SectionSpan } from "../features/sections/sectionSpan";
import type { SpaceId } from "../types";

/**
 * The sections a space view can be built from. Each maps to one shared section
 * component — there is no per-space dashboard component anywhere.
 */
export type SectionKind =
  | "upcoming"
  | "trips"
  | "attention"
  | "continue"
  | "quickAccess"
  | "saved"
  | "activeProjects"
  | "blockedProjects"
  | "pausedProjects"
  | "completedProjects"
  | "routines"
  | "events"
  | "checklists"
  | "trainingPlans"
  | "inspiration"
  | "products"
  | "notes"
  | "gear"
  | "recipes"
  | "places";

/**
 * A section in a space, optionally with the width it should take.
 *
 * The width is part of the layout decision, not of the data: Work & Tech reads
 * as "stuck / active" then "parked / recently saved" because those four are
 * each half a row, and Home pairs inspiration with saved products for the same
 * reason. Leaving it out lets the card count decide.
 */
export type SectionEntry = SectionKind | { kind: SectionKind; span: SectionSpan };

export function sectionKindOf(entry: SectionEntry): SectionKind {
  return typeof entry === "string" ? entry : entry.kind;
}

export function sectionSpanOf(entry: SectionEntry): SectionSpan | undefined {
  return typeof entry === "string" ? undefined : entry.span;
}

/**
 * Which sections belong to which space, in render order.
 *
 * This is the whole reason space views stopped looking identical. Cooking is
 * about what you have and have not cooked; Work & Tech is about what is moving
 * and what is stuck; Trips is about what is coming and what you learned last
 * time. Any section with no data renders nothing, so these lists are an upper
 * bound, not a guarantee.
 */
export const SPACE_SECTIONS: Record<SpaceId, SectionEntry[]> = {
  // Two rows of two: what is stuck beside what is moving, then what is parked
  // beside what was saved.
  "work-tech": [
    { kind: "blockedProjects", span: "auto" },
    { kind: "activeProjects", span: "auto" },
    { kind: "pausedProjects", span: "auto" },
    { kind: "saved", span: "auto" },
  ],
  personal: [
    { kind: "events", span: "auto" },
    { kind: "routines", span: "auto" },
    { kind: "trainingPlans", span: "auto" },
    { kind: "activeProjects", span: "auto" },
    { kind: "quickAccess", span: "auto" },
  ],
  // Routines take a full row so inspiration and saved products land together
  // as a balanced pair rather than one of them ending up alone.
  home: [
    { kind: "events", span: "auto" },
    { kind: "activeProjects", span: "auto" },
    { kind: "routines", span: "full" },
    { kind: "inspiration", span: "auto" },
    { kind: "products", span: "auto" },
  ],
  cooking: [
    { kind: "recipes", span: "full" },
    { kind: "saved", span: "full" },
  ],
  trips: [
    { kind: "trips", span: "auto" },
    { kind: "upcoming", span: "auto" },
    { kind: "checklists", span: "full" },
    { kind: "places", span: "auto" },
    { kind: "notes", span: "auto" },
    { kind: "gear", span: "auto" },
  ],
};

/** Translation key for each section's heading, in the `dashboard` namespace. */
export const SECTION_TITLE_KEY: Record<SectionKind, string> = {
  upcoming: "sections.trips",
  trips: "sections.yourTrips",
  attention: "sections.attention",
  continue: "sections.continue",
  quickAccess: "sections.quickAccess",
  saved: "sections.saved",
  activeProjects: "sections.activeProjects",
  blockedProjects: "sections.stuckProjects",
  pausedProjects: "sections.pausedProjects",
  completedProjects: "sections.completedProjects",
  routines: "sections.routines",
  events: "sections.events",
  checklists: "sections.checklists",
  trainingPlans: "sections.trainingPlans",
  inspiration: "sections.inspiration",
  products: "sections.products",
  places: "sections.places",
  notes: "sections.notes",
  gear: "sections.gear",
  recipes: "sections.recipes",
};

/**
 * The topic a section belongs to, for the space view's tabs.
 *
 * A space used to render every one of its sections stacked down one page:
 * projects, then routines, then events, then four kinds of saved thing. That is
 * four unrelated questions asked at once, and it is the pattern this whole pass
 * exists to remove. Grouping them means the space asks one at a time.
 *
 * Deliberately four groups and no more. A fifth would be a distinction only the
 * code can see.
 */
export type SpaceTopic = "work" | "rhythm" | "saved" | "collection";

export function topicOf(kind: SectionKind): SpaceTopic {
  switch (kind) {
    case "activeProjects":
    case "blockedProjects":
    case "pausedProjects":
    case "completedProjects":
    case "checklists":
    case "quickAccess":
    case "attention":
    case "continue":
      return "work";
    case "routines":
    case "events":
    case "upcoming":
    case "trips":
      return "rhythm";
    case "recipes":
    case "places":
      return "collection";
    default:
      return "saved";
  }
}

/** Translation key for a topic tab, in the `dashboard` namespace. */
export const TOPIC_TITLE_KEY: Record<SpaceTopic, string> = {
  work: "topics.work",
  rhythm: "topics.rhythm",
  saved: "topics.saved",
  collection: "topics.collection",
};
