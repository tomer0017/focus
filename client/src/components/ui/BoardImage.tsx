import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { THUMBS } from "../../assets/thumbs";
import { isImageUrl } from "../../lib/links";
import type { ThumbKey } from "../../types";

interface BoardImageProps {
  /** A remote image. Tried first when it is a real `http(s)` address. */
  imageUrl?: string;
  /**
   * Local artwork. Used **only** when there is no `imageUrl` at all — never as
   * a substitute for a picture the user chose. See the note below.
   */
  thumb?: ThumbKey;
  className?: string;
  /** Decorative by default; captions carry the meaning. */
  alt?: string;
  /** Rendered inside the failure placeholder, e.g. "edit the address". */
  action?: ReactNode;
}

/**
 * A picture that may live on someone else's server.
 *
 * When a remote image fails, this shows a neutral placeholder that says so —
 * it does **not** quietly swap in a piece of local artwork. Substituting a
 * drawing for the photograph somebody chose is worse than showing nothing: it
 * looks like their picture, so they never find out the address is broken.
 * Artwork is only ever used for items that were seeded with it and have no URL.
 */
export function BoardImage({ imageUrl, thumb, className, alt = "", action }: BoardImageProps) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  // A new address deserves a fresh attempt.
  useEffect(() => setFailed(false), [imageUrl]);

  const hasRemote = isImageUrl(imageUrl);

  if (hasRemote && !failed) {
    return (
      <img
        className={className}
        src={imageUrl}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  if (!hasRemote && thumb) {
    return <img className={className} src={THUMBS[thumb]} alt={alt} loading="lazy" />;
  }

  return (
    <span className={`focus-image-fallback${className ? " " + className : ""}`}>
      <Icon name="image" size={20} />
      <span className="focus-image-fallback__text">
        {hasRemote ? t("media.imageFailed") : t("media.noImage")}
      </span>
      {action && <span className="focus-image-fallback__action">{action}</span>}
    </span>
  );
}
