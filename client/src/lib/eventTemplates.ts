import type { EventKind, EventSection, EventSectionKind } from "../types";

/**
 * What each kind of event starts with.
 *
 * A template is a starting point, never a structure the user is stuck with:
 * every section can be renamed, reordered, removed, and new ones added. The
 * two rich templates are Birthday and Holiday; the rest start deliberately
 * small, because guessing at somebody's wedding is worse than giving them four
 * sections and letting them build the rest.
 */
export const EVENT_TEMPLATES: Record<EventKind, EventSectionKind[]> = {
  birthday: ["tasks", "gifts", "budget", "guests", "food", "greeting", "links", "vision"],
  holiday: ["guests", "menu", "tasks", "shopping", "decor", "recipes", "inspiration"],
  wedding: ["tasks", "guests", "budget", "links"],
  barMitzvah: ["tasks", "guests", "budget", "links"],
  batMitzvah: ["tasks", "guests", "budget", "links"],
  anniversary: ["tasks", "gifts", "links"],
  party: ["tasks", "guests", "shopping", "links"],
  hosting: ["guests", "menu", "shopping", "tasks"],
  family: ["tasks", "guests", "notes"],
  custom: ["notes", "tasks"],
};

/** Every kind, in the order the template picker offers them. */
export const EVENT_KINDS: EventKind[] = [
  "birthday",
  "holiday",
  "wedding",
  "barMitzvah",
  "batMitzvah",
  "anniversary",
  "party",
  "hosting",
  "family",
  "custom",
];

/** Sections a user can add to any event, whatever its kind. */
export const ADDABLE_SECTION_KINDS: EventSectionKind[] = [
  "tasks",
  "notes",
  "guests",
  "budget",
  "gifts",
  "food",
  "menu",
  "shopping",
  "decor",
  "greeting",
  "links",
  "recipes",
  "inspiration",
  "vision",
];

/** Sections that hold a checkable list rather than free text. */
export const LIST_SECTION_KINDS: EventSectionKind[] = ["tasks", "guests", "shopping", "gifts"];

/** Sections that reference saved items instead of holding content. */
export const REFERENCE_SECTION_KINDS: EventSectionKind[] = ["links", "inspiration", "decor"];

export function isListSection(kind: EventSectionKind): boolean {
  return LIST_SECTION_KINDS.includes(kind);
}

export function isReferenceSection(kind: EventSectionKind): boolean {
  return REFERENCE_SECTION_KINDS.includes(kind);
}

/**
 * Builds the starting sections for a kind. No titles are written: a section
 * shows the translated name for its `kind` until the user renames it, so
 * seeding a template never bakes one language into stored data.
 */
export function createEventSections(kind: EventKind, idPrefix: string): EventSection[] {
  return EVENT_TEMPLATES[kind].map((sectionKind, index) => ({
    id: `${idPrefix}-${sectionKind}`,
    kind: sectionKind,
    order: index,
    ...(isListSection(sectionKind) ? { items: [] } : {}),
    ...(isReferenceSection(sectionKind) || sectionKind === "recipes" ? { savedItemIds: [] } : {}),
  }));
}

/** Re-numbers `order` after a move or a removal, keeping array order canonical. */
export function normaliseSectionOrder(sections: EventSection[]): EventSection[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index }));
}

/** Moves a section one step up or down. Pure. */
export function moveSection(
  sections: EventSection[],
  sectionId: string,
  direction: -1 | 1
): EventSection[] {
  const ordered = normaliseSectionOrder(sections);
  const index = ordered.findIndex((section) => section.id === sectionId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= ordered.length) return ordered;

  const next = [...ordered];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((section, position) => ({ ...section, order: position }));
}
