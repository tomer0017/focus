import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { LabelledText } from "../../components/ui/LabelledText";
import { BlockedBadge, SpaceBadge } from "../../components/ui/Badges";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { PROJECT_COLUMNS } from "../../lib/projectBoard";
import { isBlocked, type PageStatus, type PageSummary } from "../../types";

interface ProjectCardProps {
  page: PageSummary;
  /**
   * Distinguishes the two renderings of the board (the tabbed one below `lg`
   * and the three-column one above it). Both are in the DOM at once, with CSS
   * hiding one — so control ids have to be scoped or they would collide, and a
   * duplicated id silently breaks every `<label for>` on the screen.
   */
  scope: string;
  isFirst: boolean;
  isLast: boolean;
  onStatusChange: (status: PageStatus) => void;
  onMove: (direction: -1 | 1) => void;
  onEditReason: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

/**
 * A project on the board.
 *
 * Dragging is the fast path, not the only path: every card carries a status
 * select and two order buttons, all reachable by keyboard with real accessible
 * names. A board where the only way to move something is a mouse gesture is a
 * board a keyboard user cannot use at all.
 */
export function ProjectCard({
  page,
  scope,
  isFirst,
  isLast,
  onStatusChange,
  onMove,
  onEditReason,
  onDragStart,
  onDragEnd,
  isDragging,
}: ProjectCardProps) {
  const { t } = useTranslation(["projects", "common"]);
  const { locale } = useLocale();

  return (
    <article
      className={`focus-board-card ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", page.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="focus-board-card__head">
        <span className="focus-board-card__grip" aria-hidden="true">
          <Icon name="drag" size={16} />
        </span>
        <h3 className="focus-board-card__title">
          <Link to={`/pages/${page.id}`} className="stretched-link" dir="auto">
            {page.title}
          </Link>
        </h3>
      </div>

      <div className="focus-board-card__badges">
        <SpaceBadge spaceId={page.spaceId} />
        {isBlocked(page) && <BlockedBadge />}
      </div>

      {page.nextAction && page.status !== "completed" && (
        <LabelledText label={t("common:fields.nextAction")} className="focus-board-card__next">
          {page.nextAction}
        </LabelledText>
      )}

      {page.status === "paused" && page.pausedReason && (
        <p className="focus-board-card__reason focus-clamp-2" dir="auto">
          {page.pausedReason}
        </p>
      )}

      {page.status === "completed" && page.completedAt && (
        <p className="focus-board-card__reason mb-0">
          {t("projects:completedOn", { when: formatDate(page.completedAt, locale) })}
        </p>
      )}

      {page.status !== "completed" && (
        <p className="focus-board-card__meta mb-0">
          <time dateTime={page.lastUpdatedAt}>
            {t("common:time.updatedRelative", {
              when: formatRelativeDay(page.lastUpdatedAt, locale),
            })}
          </time>
        </p>
      )}

      {/* Controls sit above the stretched link so they stay clickable. */}
      <div className="focus-board-card__controls">
        <label className="visually-hidden" htmlFor={`status-${scope}-${page.id}`}>
          {t("projects:statusFor", { name: page.title })}
        </label>
        <select
          id={`status-${scope}-${page.id}`}
          className="form-select form-select-sm focus-board-card__select"
          value={page.status}
          onChange={(event) => onStatusChange(event.target.value as PageStatus)}
        >
          {PROJECT_COLUMNS.map((status) => (
            <option key={status} value={status}>
              {t(`common:status.${status}`)}
            </option>
          ))}
        </select>

        <div className="focus-board-card__order">
          <button
            type="button"
            className="focus-icon-button border"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={t("projects:moveUp", { name: page.title })}
          >
            <Icon name="chevronUp" size={15} />
          </button>
          <button
            type="button"
            className="focus-icon-button border"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={t("projects:moveDown", { name: page.title })}
          >
            <Icon name="chevronDown" size={15} />
          </button>
          {page.status === "paused" && (
            <button
              type="button"
              className="focus-icon-button border"
              onClick={onEditReason}
              aria-label={t("projects:reasonFor", { name: page.title })}
            >
              <Icon name="edit" size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
