import type { SavedItemKind, ThumbKey } from "../types";

/**
 * Small facts about saved items that more than one screen needs.
 *
 * Extracted when the learning page became the second place that creates a
 * `SavedItem`. Two call sites inventing their own ids and their own idea of
 * which artwork a document gets is how the same kind of thing starts looking
 * different depending on where it was added from.
 */

/**
 * The local artwork a newly saved item starts with.
 *
 * Artwork, not a picture *of* the thing: nothing is fetched from YouTube,
 * TikTok, Instagram or Pinterest, and no thumbnail is ever invented for a link.
 * `BoardImage` only ever falls back to this when the item has no address of its
 * own — a picture that fails to load says so instead.
 */
export const THUMB_FOR_KIND: Record<SavedItemKind, ThumbKey> = {
  link: "city",
  video: "camera",
  image: "camera",
  recipe: "salad",
  product: "sideboard",
  document: "document",
  note: "notebook",
  inspiration: "plant",
  location: "mountain",
};

/** Ids only need to be unique in one browser; no id service exists yet. */
export function savedItemId(): string {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
