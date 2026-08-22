import { useState } from "react";
import { initialsOf } from "../../lib/familySelectors";
import { isImageUrl } from "../../lib/links";

interface AvatarProps {
  /** User content — used for the initials and for the accessible name. */
  name: string;
  /** An address only. Never bytes, never a data URI. */
  photoUrl?: string;
  size?: number;
}

/**
 * A picture, or the initials — never an empty grey square.
 *
 * The failed-image rule from `<BoardImage>` applies for the same reason it does
 * everywhere else: substituting artwork for somebody's photograph would look
 * like their photograph. Initials are visibly not a photo, so a broken address
 * stays legible as a broken address rather than as a picture of a stranger.
 */
export function Avatar({ name, photoUrl, size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const usable = isImageUrl(photoUrl) && !failed;

  return (
    <span
      className="focus-avatar"
      style={{ inlineSize: size, blockSize: size, fontSize: Math.round(size / 2.6) }}
    >
      {usable ? (
        <img
          src={photoUrl}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
