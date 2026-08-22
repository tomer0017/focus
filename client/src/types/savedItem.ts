import type { SpaceId } from "./space";

/**
 * What a saved item is. One item, many possible contexts — a recipe saved for
 * a holiday is the same entity as the recipe in the cooking collection.
 */
export type SavedItemKind =
  | "link"
  | "image"
  | "video"
  | "recipe"
  | "product"
  | "document"
  | "note"
  | "inspiration"
  | "location";

/**
 * Where an item came from. Drives the source chip on a link card. No metadata
 * is fetched from any of these services — the label is the user's own answer
 * to "where did I get this?".
 */
export type SavedItemSource =
  | "tiktok"
  | "youtube"
  | "instagram"
  | "pinterest"
  | "web"
  | "maps"
  | "store"
  | "file"
  | "own";

/**
 * Key into the local illustration set (`assets/thumbs`). Mock thumbnails are
 * real local SVG artwork, not a coloured rectangle — a saved item is far easier
 * to recognise months later by its picture than by its title.
 */
export type ThumbKey =
  | "pizza"
  | "livingRoom"
  | "sideboard"
  | "spring"
  | "mountain"
  | "laptop"
  | "gym"
  | "notebook"
  | "document"
  | "running"
  | "cake"
  | "table"
  | "plant"
  | "city"
  | "books"
  | "camera"
  | "salad"
  | "sea";

/**
 * Something the user dropped into Focus quickly — a link, a clip, a product.
 * Link previews are not fetched: source, kind and the user's own note are what
 * make an item recognisable, which is the whole point.
 */
export interface SavedItem {
  id: string;
  kind: SavedItemKind;
  /** User content. */
  title: string;
  /** The one line of context that makes this item worth having kept. */
  note?: string;
  source: SavedItemSource;
  /**
   * A real destination, or absent. Never a placeholder: a card that opens
   * `example.com` looks like a working link and is not one. Items without a
   * URL open an internal preview instead. See `lib/links.ts`.
   */
  url?: string;
  spaceId: SpaceId;
  thumb: ThumbKey;
  /** Optional free-text category. User content. */
  category?: string;
  /**
   * Every context this item belongs to — page ids, event ids, routine ids.
   * An item is referenced by many contexts and duplicated into none.
   */
  contextIds: string[];
  savedAt: string;
}

/**
 * Whether the thing has been done yet. Two values, and only two.
 *
 * "Recommended" is deliberately **not** one of them: a recipe you liked is a
 * recipe you have tried, so recommending is a separate flag. Modelling it as a
 * third status would mean recommending something silently un-tried it.
 */
export type EntryStatus = "want_to_try" | "tried";

/** The old three-way field, kept only so stored data can be migrated. */
export type CollectionEntryState = "recommended" | "wantToTry" | "recentlyDone";

/**
 * An item inside a `collection` page — a recipe, a place, a piece of gear.
 *
 * One model for all of them. The recipe-specific fields are optional: a place
 * has no ingredients, and giving places their own type would have duplicated
 * the status, tags and notes that both need.
 */
export interface CollectionEntry {
  id: string;
  /** The `collection` page this belongs to. */
  pageId: string;
  /** User content. */
  title: string;
  note?: string;
  status: EntryStatus;
  /** Worth doing again, and worth telling someone about. */
  recommended: boolean;
  /** Free-text labels. User content, never translated. */
  tags: string[];
  thumb: ThumbKey;
  /** A picture from a link, when the user added one. Only the address is kept. */
  imageUrl?: string;
  /** Position within its group on the board; lower comes first. */
  order?: number;
  /** When this was last cooked / visited / used. */
  lastDoneAt?: string;

  /* ---- Recipe-shaped extras. All optional. ---- */

  description?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  ingredients?: string[];
  steps?: string[];
  /** 1–5, the user's own. */
  rating?: number;
  /** What to change next time. The single most valuable line in a recipe. */
  nextTime?: string;
  /** Where it came from. A real address, or absent. */
  sourceUrl?: string;
  /** Saved items attached to this entry: videos, variations, inspiration. */
  savedItemIds?: string[];

  /** Legacy field, read by the migration and then dropped. */
  state?: CollectionEntryState;
}
