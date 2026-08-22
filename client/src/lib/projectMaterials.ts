/**
 * A project's materials — one shelf, not three.
 *
 * The page used to split what a project holds across two tabs: "materials" and
 * "inspiration", divided by a hard-coded list of saved-item kinds. That split
 * was invented by the screen and not by the user: a photograph of the existing
 * garden is reference *and* inspiration depending on the day, and nobody
 * opening a project thinks "is this an inspiration item?". They think "where is
 * that Figma link".
 *
 * So there is one shelf, filtered by what a thing *is* — a link, a document, a
 * picture, a video — which is a fact about the item rather than a judgement
 * about its purpose.
 */
import type { SavedItem, SavedItemKind } from "../types";

/** The four shelves, plus the default that shows everything. */
export const MATERIAL_KINDS = ["links", "documents", "images", "videos"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];
export type MaterialFilter = MaterialKind | "all";

/**
 * Which shelf a saved item lands on.
 *
 * Nine `SavedItemKind`s map onto four shelves. The groupings answer "what would
 * I be looking for?": a product, a place and a recipe are all *an address to
 * somewhere*, and a saved note is read like a document. Nothing is dropped —
 * every kind has a shelf, so no item can become invisible.
 */
const SHELF_FOR_KIND: Record<SavedItemKind, MaterialKind> = {
  link: "links",
  product: "links",
  location: "links",
  recipe: "links",
  document: "documents",
  note: "documents",
  image: "images",
  inspiration: "images",
  video: "videos",
};

export function shelfOf(item: SavedItem): MaterialKind {
  return SHELF_FOR_KIND[item.kind];
}

/** Images and videos read as a grid; links and documents read as a list. */
export function isGridShelf(filter: MaterialFilter): boolean {
  return filter === "images" || filter === "videos";
}

/**
 * How many fit on a page.
 *
 * Twelve tiles or twenty rows — a tile is roughly twice the height of a row, so
 * the two produce a page of about the same length rather than one that scrolls
 * twice as far because it happens to be showing pictures.
 */
export const GRID_PAGE_SIZE = 12;
export const LIST_PAGE_SIZE = 20;

export function pageSizeFor(filter: MaterialFilter): number {
  return isGridShelf(filter) ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
}

export interface MaterialQuery {
  filter: MaterialFilter;
  query?: string;
}

/**
 * One project's materials, narrowed.
 *
 * Search runs over the whole shelf rather than the current page, because
 * looking for "that quote from the electrician" is exactly the moment you do
 * not know which page it is on. It matches the title, the note and the source.
 */
export function filterMaterials(items: SavedItem[], { filter, query }: MaterialQuery): SavedItem[] {
  const term = query?.trim().toLowerCase();

  return items.filter((item) => {
    if (filter !== "all" && shelfOf(item) !== filter) return false;

    if (term) {
      const haystack = [item.title, item.note, item.source, item.url]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** Newest first, then by title so the order never shuffles between renders. */
export function sortMaterials(items: SavedItem[]): SavedItem[] {
  return [...items].sort(
    (a, b) => b.savedAt.localeCompare(a.savedAt) || a.title.localeCompare(b.title)
  );
}

export interface Paged<T> {
  items: T[];
  /** 1-based, and always clamped into range. */
  page: number;
  pageCount: number;
  total: number;
}

/**
 * One page of results.
 *
 * The page number is **clamped rather than trusted**: `?page=9` on a shelf with
 * two pages shows the last page, not an empty screen. A URL somebody kept from
 * a fuller project should still land somewhere useful.
 */
export function paginate<T>(items: T[], page: number, size: number): Paged<T> {
  const pageCount = Math.max(Math.ceil(items.length / size), 1);
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = (current - 1) * size;

  return { items: items.slice(start, start + size), page: current, pageCount, total: items.length };
}

/** How many items sit on each shelf — the counts beside the filter chips. */
export function countByShelf(items: SavedItem[]): Record<MaterialKind, number> {
  const counts: Record<MaterialKind, number> = {
    links: 0,
    documents: 0,
    images: 0,
    videos: 0,
  };
  for (const item of items) counts[shelfOf(item)] += 1;
  return counts;
}
