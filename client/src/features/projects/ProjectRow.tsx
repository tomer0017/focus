import { useTranslation } from "react-i18next";
import { CompactRow } from "../../components/ui/CompactRow";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { OverflowMenu, type OverflowAction } from "../../components/ui/OverflowMenu";
import { StatusBadge, BlockedBadge } from "../../components/ui/Badges";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { isBlocked, type PageStatus, type PageSummary } from "../../types";

interface ProjectRowProps {
  page: PageSummary;
  /** The category's label, already resolved. Interface copy or the user's word. */
  categoryLabel: string;
  /** Ticked / total on the project's checklist, when it has one. */
  progress?: { done: number; total: number };
  onStatusChange: (status: PageStatus) => void;
  onMove: (direction: -1 | 1) => void;
  onEditReason: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const OTHER_STATUSES: PageStatus[] = ["active", "paused", "completed"];

/**
 * One project, one line.
 *
 * This replaces a card that was ~200px tall and carried a status `<select>`,
 * two reorder buttons and a full paragraph of next action — three of which are
 * controls, not information. Eleven projects filled 1,800px of board; seventy
 * finished ones would have been unusable.
 *
 * The row keeps every capability the card had. Changing status, reordering and
 * editing the parked reason all moved into one overflow menu whose trigger is
 * always visible — a menu you can only find by hovering is not an answer on a
 * phone.
 *
 * The picture, when there is one, is a 56px thumbnail. When there is not, the
 * row reserves no space for one: a column of empty squares down a list is what
 * made the board read as broken rather than plain.
 */
export function ProjectRow({
  page,
  categoryLabel,
  progress,
  onStatusChange,
  onMove,
  onEditReason,
  isFirst,
  isLast,
}: ProjectRowProps) {
  const { t } = useTranslation(["projects", "common"]);
  const { locale } = useLocale();

  const actions: OverflowAction[] = [
    ...OTHER_STATUSES.filter((status) => status !== page.status).map((status) => ({
      id: `status-${status}`,
      label: t("projects:moveTo", { status: t(`common:status.${status}`) }),
      onSelect: () => onStatusChange(status),
    })),
    {
      id: "up",
      label: t("common:actions.moveUp"),
      onSelect: () => onMove(-1),
    },
    {
      id: "down",
      label: t("common:actions.moveDown"),
      onSelect: () => onMove(1),
    },
  ];

  // Only a parked project has a reason worth writing.
  if (page.status === "paused") {
    actions.push({
      id: "reason",
      label: t("projects:editReason"),
      onSelect: onEditReason,
    });
  }

  return (
    <CompactRow
      href={`/pages/${page.id}`}
      leading={<Thumbnail imageUrl={page.visionImageUrl} size="md" />}
      eyebrow={categoryLabel}
      title={page.title}
      detail={page.nextAction ?? page.pausedReason ?? page.currentState}
      badges={
        <>
          <StatusBadge status={page.status} />
          {isBlocked(page) && <BlockedBadge />}
        </>
      }
      progress={progress}
      meta={
        <time dateTime={page.lastUpdatedAt}>
          {formatRelativeDay(page.lastUpdatedAt, locale)}
        </time>
      }
      actions={
        <OverflowMenu
          label={page.title}
          actions={actions.filter(
            (action) =>
              !(action.id === "up" && isFirst) && !(action.id === "down" && isLast)
          )}
        />
      }
      tone={isBlocked(page) ? "due" : "neutral"}
    />
  );
}
