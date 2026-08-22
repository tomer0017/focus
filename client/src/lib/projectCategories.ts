import type { PageSummary, ProjectCategory, SpaceId } from "../types";

/**
 * The categories a fresh install starts with.
 *
 * They store a `nameKey` rather than a name, so the app ships in both languages
 * without writing either one into stored data — the same rule checklist groups,
 * event sections and note templates follow. The moment the user renames one it
 * stores `name` and the key is dropped.
 */
export const DEFAULT_CATEGORIES: ProjectCategory[] = [
  { id: "personal", nameKey: "categories.personal", order: 0 },
  { id: "tech", nameKey: "categories.tech", order: 1 },
  { id: "physical", nameKey: "categories.physical", order: 2 },
];

/**
 * Which default category a page written before categories existed belongs to.
 *
 * Derived from the space it was already filed under, and **never written back**:
 * a migration that stamped a category onto every old project would freeze this
 * guess, and moving the project to another space afterwards could never correct
 * it. Reading it fresh means the answer stays right until the user overrides it.
 */
export function defaultCategoryFor(spaceId: SpaceId): string {
  switch (spaceId) {
    case "work-tech":
      return "tech";
    case "home":
      return "physical";
    default:
      return "personal";
  }
}

/** The category a project is in, stored or derived. */
export function categoryOf(page: PageSummary): string {
  return page.categoryId ?? defaultCategoryFor(page.spaceId);
}

/**
 * A category's label. `name` is the user's own words and is never translated;
 * `nameKey` belongs to a category the user has not renamed.
 */
export function categoryLabel(
  category: ProjectCategory,
  t: (key: string) => string
): string {
  return category.name ?? (category.nameKey ? t(`projects:${category.nameKey}`) : category.id);
}

export function sortedCategories(categories: ProjectCategory[]): ProjectCategory[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

/** How many projects sit in a category. Drives the counts beside each tab. */
export function countIn(pages: PageSummary[], categoryId: string): number {
  return pages.filter((page) => categoryOf(page) === categoryId).length;
}

/**
 * A category can only be deleted when nothing is filed under it.
 *
 * The alternative — deleting it and moving its projects somewhere — is a
 * destructive operation dressed up as tidying, and the "somewhere" would be the
 * app's choice rather than the user's.
 */
export function canRemove(pages: PageSummary[], categoryId: string): boolean {
  return countIn(pages, categoryId) === 0;
}

export function categoryId(): string {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------------------------- shared list operations -- */

/*
 * Two lists now use this model — project categories and learning subjects — so
 * the four list edits live here once rather than twice in the provider. They
 * are pure: the caller decides which slice they are applied to.
 */

/** A new entry at the end of the list. Returns both, so the caller can use it. */
export function addTo(
  list: ProjectCategory[],
  name: string,
  id: string
): { list: ProjectCategory[]; category: ProjectCategory } {
  const category: ProjectCategory = { id, name: name.trim(), order: list.length };
  return { list: [...list, category], category };
}

/**
 * Renaming drops `nameKey`: from here on it is the user's own word, and
 * switching language must never overwrite it.
 */
export function renameIn(
  list: ProjectCategory[],
  id: string,
  name: string
): ProjectCategory[] {
  return list.map((entry) =>
    entry.id === id ? { ...entry, name: name.trim(), nameKey: undefined } : entry
  );
}

/** Moves an entry one place, if there is a place to move it to, and renumbers. */
export function moveIn(
  list: ProjectCategory[],
  id: string,
  direction: -1 | 1
): ProjectCategory[] {
  const ordered = sortedCategories(list);
  const index = ordered.findIndex((entry) => entry.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return list;

  const next = [...ordered];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((entry, position) => ({ ...entry, order: position }));
}
