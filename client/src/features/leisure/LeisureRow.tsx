import { useTranslation } from "react-i18next";
import { CompactRow } from "../../components/ui/CompactRow";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { primaryStatusOf, statusKeyFor, tracksOwnership } from "../../lib/leisureCollections";
import type { LeisureItem } from "../../types";

interface LeisureRowProps {
  item: LeisureItem;
  onEdit: (item: LeisureItem) => void;
  onDelete: (item: LeisureItem) => void;
}

/** Two tags, then the rest are counted. A row is for finding, not for reading. */
const TAG_LIMIT = 2;

/**
 * Which chip colour a status gets. The word always carries the meaning; the
 * colour only reinforces it, so nothing here is signalled by colour alone.
 */
const TONE: Record<string, string> = {
  not_started: "muted",
  in_progress: "primary",
  completed: "success",
  abandoned: "muted",
  want_to_visit: "primary",
  visited: "success",
  revisit: "info",
  researching: "primary",
  want_to_buy: "warning",
  waiting: "muted",
  purchased: "success",
  idea: "muted",
  planned: "primary",
  done: "success",
};

/**
 * One saved thing, on one line.
 *
 * The design decision this row exists for: **a book has two statuses and only
 * one of them belongs in the badge.** Progress is what you scan a shelf for, so
 * it is the chip; ownership is what you check before buying another copy, so it
 * sits quietly in the meta column and only when it has actually been recorded.
 * Two badges of equal weight would be two things to read on every line, and a
 * hundred books would be two hundred.
 *
 * The whole row opens the item. Editing and deleting live in the overflow menu,
 * whose trigger is always visible — there is no hover-only control here.
 */
export function LeisureRow({ item, onEdit, onDelete }: LeisureRowProps) {
  const { t } = useTranslation(["leisure", "common"]);
  const { locale } = useLocale();

  const status = primaryStatusOf(item);
  const statusLabel = status ? t(`leisure:${statusKeyFor(item.kind)}.${status}`) : undefined;

  const tags = (item.tags ?? []).slice(0, TAG_LIMIT);
  const hiddenTags = (item.tags ?? []).length - tags.length;

  return (
    <CompactRow
      title={item.title}
      href={`/leisure/${item.id}`}
      eyebrow={t(`leisure:kinds.${item.kind}`)}
      detail={item.note}
      leading={<Thumbnail imageUrl={item.imageUrl} thumb={item.thumb} size="sm" />}
      badges={
        statusLabel ? (
          <span className={`focus-chip focus-chip--${TONE[status!] ?? "muted"}`}>
            {statusLabel}
          </span>
        ) : undefined
      }
      meta={
        <>
          {/* The second fact about a book, deliberately quieter than the first. */}
          {tracksOwnership(item.kind) && item.ownershipStatus && (
            <span>{t(`leisure:ownership.${item.ownershipStatus}`)}</span>
          )}
          {item.region && <span dir="auto">{item.region}</span>}
          {item.estimatedBudget !== undefined && (
            <span dir="auto">
              {item.currency ?? ""}
              {item.estimatedBudget}
            </span>
          )}
          {tags.length > 0 && (
            <span dir="auto">
              {tags.join(" · ")}
              {hiddenTags > 0 && ` +${hiddenTags}`}
            </span>
          )}
          <time dateTime={item.updatedAt}>{formatRelativeDay(item.updatedAt, locale)}</time>
        </>
      }
      actions={
        <OverflowMenu
          label={t("common:actions.moreFor", { name: item.title })}
          actions={[
            {
              id: "edit",
              label: t("common:actions.edit"),
              onSelect: () => onEdit(item),
            },
            {
              id: "delete",
              label: t("common:actions.delete"),
              danger: true,
              onSelect: () => onDelete(item),
            },
          ]}
        />
      }
    />
  );
}
