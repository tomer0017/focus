import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { TagList } from "./TagList";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { RECIPE_GROUPS, groupOf, totalMinutes, type RecipeGroup } from "../../lib/recipes";
import type { CollectionEntry } from "../../types";

interface RecipeCardProps {
  entry: CollectionEntry;
  /**
   * Distinguishes the tabbed rendering from the three-column one. Both are in
   * the DOM at once with CSS hiding one, so control ids have to be scoped or
   * they collide and every `<label for>` on the screen silently breaks.
   */
  scope: string;
  isFirst: boolean;
  isLast: boolean;
  onGroupChange: (group: RecipeGroup) => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

/**
 * A recipe on the cooking board.
 *
 * The card carries what you scan for — picture, name, two lines, total time,
 * whether you recommended it, three tags — and nothing else. The grip, the
 * reorder buttons and the group select appear on hover and on keyboard focus.
 *
 * On a touch screen there is no hover, so the controls stay visible: dragging
 * is not a usable gesture there, and the select is the only way to move a card.
 */
export function RecipeCard({
  entry,
  scope,
  isFirst,
  isLast,
  onGroupChange,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging,
}: RecipeCardProps) {
  const { t } = useTranslation(["cooking", "common"]);
  const { locale } = useLocale();
  const minutes = totalMinutes(entry);

  return (
    <article
      className={`focus-recipe-card ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", entry.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <BoardImage
        className="focus-recipe-card__thumb"
        imageUrl={entry.imageUrl}
        thumb={entry.thumb}
      />

      <div className="focus-recipe-card__body">
        <div className="focus-recipe-card__head">
          <span className="focus-recipe-card__grip" aria-hidden="true">
            <Icon name="drag" size={15} />
          </span>
          <h3 className="focus-recipe-card__title">
            <Link to={`/recipes/${entry.id}`} className="stretched-link" dir="auto">
              {entry.title}
            </Link>
          </h3>
        </div>

        {entry.note && (
          <p className="focus-recipe-card__note focus-clamp-2" dir="auto">
            {entry.note}
          </p>
        )}

        <p className="focus-recipe-card__meta mb-0">
          {entry.recommended && (
            <span className="focus-chip focus-chip--success focus-chip--icon">
              <Icon name="star" size={11} />
              {t("cooking:groups.recommended")}
            </span>
          )}
          {minutes !== null && (
            <span className="focus-recipe-card__time">
              <Icon name="clock" size={12} />
              {t("cooking:minutes", { count: minutes })}
            </span>
          )}
          {entry.lastDoneAt && (
            <time dateTime={entry.lastDoneAt}>{formatRelativeDay(entry.lastDoneAt, locale)}</time>
          )}
        </p>

        <TagList tags={entry.tags} limit={3} />

        <div className="focus-recipe-card__controls">
          <label className="visually-hidden" htmlFor={`recipe-group-${scope}-${entry.id}`}>
            {t("cooking:groupFor", { name: entry.title })}
          </label>
          <select
            id={`recipe-group-${scope}-${entry.id}`}
            className="form-select form-select-sm"
            value={groupOf(entry)}
            onChange={(event) => onGroupChange(event.target.value as RecipeGroup)}
          >
            {RECIPE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {t(`cooking:groups.${group}`)}
              </option>
            ))}
          </select>

          <div className="focus-recipe-card__order">
            <button
              type="button"
              className="focus-icon-button border"
              disabled={isFirst}
              onClick={() => onMove(-1)}
              aria-label={t("cooking:moveUp", { name: entry.title })}
            >
              <Icon name="chevronUp" size={14} />
            </button>
            <button
              type="button"
              className="focus-icon-button border"
              disabled={isLast}
              onClick={() => onMove(1)}
              aria-label={t("cooking:moveDown", { name: entry.title })}
            >
              <Icon name="chevronDown" size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
