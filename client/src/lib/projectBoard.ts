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
