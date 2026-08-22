import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { isExternalUrl } from "../../lib/links";
import type { SavedItem, TripOutfit } from "../../types";

interface OutfitImageProps {
  outfit: TripOutfit;
  savedItems: SavedItem[];
  className?: string;
}

/**
 * The picture for a look, or an honest statement that there is not one.
 *
 * A Pinterest page is a link, not an image: it is stored and shown as a badge
 * rather than given a stand-in drawing. Substituting artwork for somebody's
 * reference photograph would look like the photograph and hide the fact that
 * there isn't one.
 */
export function OutfitImage({ outfit, savedItems, className }: OutfitImageProps) {
  const { t } = useTranslation(["trips"]);

  const savedItem = outfit.savedItemId
    ? savedItems.find((item) => item.id === outfit.savedItemId)
    : undefined;

  if (outfit.imageUrl || savedItem) {
    return (
      <BoardImage
        className={className}
        imageUrl={outfit.imageUrl}
        thumb={outfit.imageUrl ? undefined : savedItem?.thumb}
      />
    );
  }

  return (
    <span className={`focus-image-fallback${className ? " " + className : ""}`}>
      <Icon name={isExternalUrl(outfit.pinterestUrl) ? "link" : "image"} size={20} />
      <span className="focus-image-fallback__text">
        {isExternalUrl(outfit.pinterestUrl) ? t("trips:outfits.linkOnly") : t("trips:outfits.noPicture")}
      </span>
    </span>
  );
}
