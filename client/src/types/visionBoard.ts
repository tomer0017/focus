import type { ThumbKey } from "./savedItem";

/** How much room a tile takes in the collage. */
export type VisionTileSize = "small" | "medium" | "large";

/**
 * One image on a board. A tile *points at* its picture and, optionally, at the
 * saved item or page it stands for — it never duplicates either.
 */
export interface VisionTile {
  id: string;
  /**
   * Local artwork. Present when the tile was not created from a URL, and used
   * as the fallback when a remote image fails to load.
   */
  thumb?: ThumbKey;
  /**
   * A remote image, `http(s)` only. Only the address is stored — the image is
   * never downloaded and never turned into a data URI, so a board stays a few
   * hundred bytes and a picture the user no longer wants is genuinely gone.
   */
  imageUrl?: string;
  /** Short caption. User content. */
  caption?: string;
  /** Optional free-text grouping. User content. */
  category?: string;
  size: VisionTileSize;
  /** Position in the collage; lower comes first. */
  order: number;
  /** The saved item this tile came from, when it came from one. */
  savedItemId?: string;
  /** The goal (page) this tile stands for. */
  linkedPageId?: string;
}

export interface VisionBoard {
  id: string;
  /** User content. */
  title: string;
  year: number;
  tiles: VisionTile[];
  createdAt: string;
}

/** How the once-a-day board reminder behaves. Stored locally, off by default. */
export interface VisionDailyPreference {
  enabled: boolean;
  /** Board to show. */
  boardId: string | null;
  /** Local calendar date it was last shown, `YYYY-MM-DD`. */
  lastShownDate: string | null;
}
