/** How much of the section grid a section occupies. */
export type SectionSpan = "auto" | "full";

/**
 * Default width for a section, from how many cards it holds.
 *
 * The section grid is two columns on a wide screen, so "auto" means *share a
 * row with the next short section*. Three cards is the point where a shared
 * column starts squeezing them into one narrow stack, which was the original
 * complaint: two cards piled up in a thin column with two thirds of the row
 * blank.
 *
 * Sections that need the row whatever their contents — a board, a strip of
 * wide rows — pass `span` explicitly instead of relying on this.
 */
export function spanFor(count: number): SectionSpan {
  return count > 2 ? "full" : "auto";
}
