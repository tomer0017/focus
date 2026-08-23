import type { PageStatus, PageSummary } from "../types";

/** The three columns, in order. There is no "blocked" column — see `PageStatus`. */
export const PROJECT_COLUMNS: PageStatus[] = ["active", "paused", "completed"];

/** Only real projects go on the board. Collections and checklists are not work items. */
export function boardProjects(pages: PageSummary[]): PageSummary[] {
  return pages.filter((page) => page.type === "project");
}

/**
 * One column, in its stored order.
 *
 * `boardOrder` wins where it is set, so a card the user dragged stays put.
 * Anything without one falls to the end, most recently touched first — which
 * is the only sensible answer for a project that has never been arranged.
 */
export function columnPages(pages: PageSummary[], status: PageStatus): PageSummary[] {
  return boardProjects(pages)
    .filter((page) => page.status === status)
    .sort((a, b) => {
      const orderA = a.boardOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.boardOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
    });
}

/**
 * The ids of a column after `movedId` is inserted at `targetIndex`.
 * Pure, and works for a move within a column as well as between two.
 */
export function insertAt(ids: string[], movedId: string, targetIndex: number): string[] {
  const without = ids.filter((id) => id !== movedId);
  const index = targetIndex < 0 ? without.length : Math.min(targetIndex, without.length);
  return [...without.slice(0, index), movedId, ...without.slice(index)];
}

/**
 * Where a project must land so that it swaps with the row *beside it on screen*.
 *
 * This exists because of a defect a real pointer found. The projects screen
 * shows one category at a time, but `boardOrder` numbers a whole status column
 * across every category — so the two index spaces only agree when a category
 * happens to hold every project in its column. Passing the on-screen index
 * straight through meant "move down" on the first physical project silently
 * jumped it over a *tech* project instead, and the visible order did not change
 * at all. Nothing moved, as far as the user could tell.
 *
 * So the screen names the neighbour it wants to swap with, and this works out
 * the index in the column's own space. Moving down lands immediately after that
 * neighbour; moving up lands immediately before it. Both are exact however the
 * categories are interleaved.
 *
 * Returns `-1` when the neighbour is not in the column, which `insertAt` reads
 * as "append" — the honest answer for a row that is no longer where it was.
 */
export function targetIndexBeside(
  columnIds: string[],
  movedId: string,
  neighbourId: string,
  direction: -1 | 1
): number {
  const without = columnIds.filter((id) => id !== movedId);
  const at = without.indexOf(neighbourId);
  if (at === -1) return -1;
  return direction === 1 ? at + 1 : at;
}
