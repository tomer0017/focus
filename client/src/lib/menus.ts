/**
 * Turning a menu into a shopping list.
 *
 * The single rule that matters: **nothing happens without being asked.** A menu
 * never writes to a checklist as a side effect of being edited, and generating
 * a list a second time never doubles it. The failure this guards against is
 * concrete — you are standing in a supermarket, and the list you are reading
 * has each item twice because you opened the menu again on the way there.
 */
import { checklistId } from "./checklist";
import type { Checklist, ChecklistGroup, ChecklistItem } from "../types/checklist";
import type { CollectionEntry } from "../types/savedItem";
import type { Menu, MenuCourse, MenuDish } from "../types/menu";

/** Menus own their dishes, so one write covers a whole edit — as trips do. */
export function menuId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function dishesByCourse(menu: Menu): Map<MenuCourse, MenuDish[]> {
  const grouped = new Map<MenuCourse, MenuDish[]>();
  for (const dish of [...menu.dishes].sort((a, b) => a.order - b.order)) {
    const list = grouped.get(dish.course) ?? [];
    list.push(dish);
    grouped.set(dish.course, list);
  }
  return grouped;
}

/**
 * Everything a menu says it needs bought, in the user's own words.
 *
 * Ingredients are pulled from an attached recipe when the dish has one, because
 * that is the only place they exist; a dish typed by hand contributes whatever
 * the user listed under it, and a dish with neither contributes nothing rather
 * than its own name. "Roast chicken" on a shopping list is not a shopping list.
 */
export function shoppingLinesFor(menu: Menu, entries: CollectionEntry[]): Map<MenuCourse, string[]> {
  const byCourse = new Map<MenuCourse, string[]>();

  for (const dish of [...menu.dishes].sort((a, b) => a.order - b.order)) {
    const lines: string[] = [...(dish.shoppingItems ?? [])];

    if (dish.entryId) {
      const recipe = entries.find((entry) => entry.id === dish.entryId);
      lines.push(...(recipe?.ingredients ?? []));
    }

    const cleaned = lines.map((line) => line.trim()).filter(Boolean);
    if (cleaned.length === 0) continue;

    byCourse.set(dish.course, [...(byCourse.get(dish.course) ?? []), ...cleaned]);
  }

  return byCourse;
}

/** Case- and space-insensitive key for "the same thing written twice". */
function normalise(line: string): string {
  return line.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * A shopping checklist for a menu, merged into whatever list is already there.
 *
 * Merging rather than replacing is the whole contract:
 *
 * - An item already on the list — ticked or not — is left exactly as it is.
 *   Regenerating never un-ticks the wine you have already bought.
 * - Two dishes needing eggs produce one line, not two.
 * - Items the user added by hand are untouched, because only the *new* lines
 *   are appended.
 *
 * `existing` absent means "there is no list yet", and a fresh one is built.
 */
export function mergeMenuIntoChecklist(
  ownerId: string,
  menu: Menu,
  entries: CollectionEntry[],
  existing: Checklist | undefined,
  groupTitleFor: (course: MenuCourse) => string
): Checklist {
  const base: Checklist = existing ?? {
    ownerId,
    title: menu.title,
    groups: [],
    updatedAt: new Date().toISOString(),
  };

  // Every line already on the list, wherever it sits — dedupe is list-wide, not
  // per group, so moving a dish between courses cannot resurrect an item.
  const seen = new Set(
    base.groups.flatMap((group) => group.items.map((item) => normalise(item.text ?? item.textKey ?? "")))
  );

  const groups: ChecklistGroup[] = [...base.groups];
  const lines = shoppingLinesFor(menu, entries);

  for (const [course, courseLines] of lines) {
    const title = groupTitleFor(course);
    const fresh: ChecklistItem[] = [];

    for (const line of courseLines) {
      const key = normalise(line);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      fresh.push({ id: checklistId("item"), text: line, done: false });
    }

    if (fresh.length === 0) continue;

    const index = groups.findIndex((group) => group.title === title);
    if (index === -1) {
      groups.push({ id: checklistId("group"), title, items: fresh });
    } else {
      groups[index] = { ...groups[index], items: [...groups[index].items, ...fresh] };
    }
  }

  return { ...base, groups, updatedAt: new Date().toISOString() };
}

/** How many new lines a regeneration would actually add — shown before it runs. */
export function newLineCount(
  menu: Menu,
  entries: CollectionEntry[],
  existing: Checklist | undefined
): number {
  const seen = new Set(
    (existing?.groups ?? []).flatMap((group) =>
      group.items.map((item) => normalise(item.text ?? item.textKey ?? ""))
    )
  );

  let count = 0;
  for (const [, lines] of shoppingLinesFor(menu, entries)) {
    for (const line of lines) {
      const key = normalise(line);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      count += 1;
    }
  }
  return count;
}
