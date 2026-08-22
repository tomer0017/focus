import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import { BoardImage } from "../../components/ui/BoardImage";
import type { VisionTile } from "../../types";

interface VisionTileCardProps {
  tile: VisionTile;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * One tile in the collage.
 *
 * The caption is not painted over the picture any more. A permanent black
 * gradient across every image turned a personal collage into a row of stock
 * cards with headlines, so the text now appears on hover and on keyboard
 * focus, and the picture is left alone the rest of the time.
 *
 * Clicking a tile never opens a URL: the image may have come from anywhere,
 * and a board is for looking at.
 */
export function VisionTileCard({
  tile,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onRemove,
}: VisionTileCardProps) {
  const { t } = useTranslation(["vision", "common"]);
  const label = tile.caption ?? t("vision:untitledTile");

  return (
    <figure className={`focus-tile-card focus-tile-card--${tile.size}`} tabIndex={0}>
      <BoardImage
        className="focus-tile-card__image"
        imageUrl={tile.imageUrl}
        thumb={tile.thumb}
      />

      {(tile.caption || tile.category) && (
        <figcaption className="focus-tile-card__caption">
          {tile.caption && (
            <span className="focus-tile-card__text" dir="auto">
              {tile.caption}
            </span>
          )}
          {tile.category && (
            <span className="focus-tile-card__category" dir="auto">
              {tile.category}
            </span>
          )}
        </figcaption>
      )}

      {/*
        Five icon buttons sat on every tile, over the picture and across the
        caption — on a phone they covered the thing the board exists to show.
        One trigger instead, always visible, opening the same five actions.
        Opening the linked goal stays a real link, so it can be middle-clicked.
      */}
      <div className="focus-tile-card__controls">
        {tile.linkedPageId && (
          <Link
            to={`/pages/${tile.linkedPageId}`}
            className="focus-tile-card__button"
            aria-label={t("vision:openGoal", { name: label })}
          >
            <Icon name="link" size={14} />
          </Link>
        )}
        <OverflowMenu
          label={label}
          actions={[
            {
              id: "edit",
              label: t("vision:editTile", { name: label }),
              onSelect: onEdit,
            },
            ...(isFirst
              ? []
              : [{ id: "earlier", label: t("vision:moveEarlier", { name: label }), onSelect: () => onMove(-1) }]),
            ...(isLast
              ? []
              : [{ id: "later", label: t("vision:moveLater", { name: label }), onSelect: () => onMove(1) }]),
            {
              id: "remove",
              label: t("vision:removeTile", { name: label }),
              onSelect: onRemove,
              danger: true,
            },
          ]}
        />
      </div>
    </figure>
  );
}
