import { BoardImage } from "./BoardImage";
import type { ThumbKey } from "../../types";

interface ThumbnailProps {
  imageUrl?: string;
  thumb?: ThumbKey;
  /** `sm` is 44px, `md` is 56px. Rows use `md`; nested lists use `sm`. */
  size?: "sm" | "md";
}

/**
 * A picture at the start of a row, or nothing at all.
 *
 * The "or nothing at all" is the whole point. A row that reserves a 56px square
 * for a picture the item does not have leaves an empty box in every list, and a
 * list of mostly-pictureless things then reads as broken rather than plain.
 * Returning `null` lets the row's flex layout close the gap.
 *
 * When there *is* an address it goes through `BoardImage`, so a picture that
 * fails to load says so instead of being quietly replaced with artwork.
 */
export function Thumbnail({ imageUrl, thumb, size = "md" }: ThumbnailProps) {
  if (!imageUrl && !thumb) return null;

  return (
    <BoardImage
      className={`focus-thumb focus-thumb--${size}`}
      imageUrl={imageUrl}
      thumb={thumb}
    />
  );
}
