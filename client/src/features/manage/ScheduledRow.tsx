import { useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "react-bootstrap/Dropdown";
import { CompactRow } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate, formatDateTime } from "../../lib/format";
import { recurrenceLabelKey } from "../../lib/recurrence";
import { daysUntilDue, isOverdue, isSnoozed, SNOOZE_PRESETS } from "../../lib/scheduled";
import { useManage } from "../../state/manageContext";
import type { ScheduledItem } from "../../types";

interface ScheduledRowProps {
  item: ScheduledItem;
  /** Hides the category eyebrow where the surrounding list already says it. */
  hideCategory?: boolean;
  onEdit?: (item: ScheduledItem) => void;
}

/**
 * One dated obligation, as a row.
 *
 * Two things are always true here regardless of where the row appears:
 * marking done stays available in view mode (ticking something off is not
 * editing), and the state is written in words next to the accent stripe, so
 * "the red one" is never the only way to know something is late.
 */
export function ScheduledRow({ item, hideCategory, onEdit }: ScheduledRowProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { completeScheduled, snoozeScheduled, deleteScheduled, reopenScheduled } = useManage();
  const [confirming, setConfirming] = useState(false);

  const overdue = isOverdue(item);
  const snoozed = isSnoozed(item);
  const days = daysUntilDue(item);
  const recurrence = recurrenceLabelKey(item.recurrence);

  const tone = overdue ? "due" : days !== undefined && days <= 7 ? "soon" : "neutral";

  const snoozeLabel = (hours: number): string =>
    hours < 24
      ? t("manage:reminders.snoozeHours", { count: hours })
      : t("manage:reminders.snoozeDays", { count: Math.round(hours / 24) });

  return (
    <li>
      <CompactRow
        title={item.title}
        eyebrow={hideCategory ? undefined : t(`manage:categories.${item.category}`)}
        detail={item.appointment?.location ?? item.note}
        tone={item.status === "completed" ? "done" : tone}
        badges={
          <>
            {item.recurrence && item.recurrence.kind !== "once" && (
              <span className="focus-chip focus-chip--muted">
                {t(`manage:${recurrence.key}`, { count: recurrence.count })}
              </span>
            )}
            {/* The words, not the colour: an overdue row says so. */}
            {overdue && <span className="focus-overdue">{t("manage:now.overdue")}</span>}
          </>
        }
        meta={
          <>
            {item.dueAt ? (
              <>
                <time dateTime={item.dueAt}>
                  {item.allDay
                    ? formatShortDate(item.dueAt, locale)
                    : formatDateTime(item.dueAt, locale)}
                </time>
                <span className={overdue ? "focus-overdue" : undefined}>
                  {formatRelativeDay(item.dueAt, locale)}
                </span>
              </>
            ) : (
              <span>{t("manage:scheduled.undated")}</span>
            )}
            {snoozed && item.snoozedUntil && (
              <span>
                {t("manage:scheduled.snoozedUntil", {
                  when: formatRelativeDay(item.snoozedUntil, locale),
                })}
              </span>
            )}
          </>
        }
        actions={
          <>
            {item.status === "completed" ? (
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => reopenScheduled(item.id)}
              >
                {t("manage:scheduled.reopen")}
              </button>
            ) : (
              <button
                type="button"
                className="focus-icon-button btn btn-sm btn-link text-secondary"
                aria-label={`${t("manage:scheduled.markDone")} — ${item.title}`}
                onClick={() => completeScheduled(item.id)}
              >
                <Icon name="check" size={16} />
              </button>
            )}

            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                type="button"
                className="focus-icon-button btn btn-sm btn-link text-secondary"
                aria-label={`${t("manage:scheduled.snooze")} — ${item.title}`}
              >
                <Icon name="snooze" size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {SNOOZE_PRESETS.map((hours) => (
                  <Dropdown.Item
                    key={hours}
                    as="button"
                    type="button"
                    onClick={() => snoozeScheduled(item.id, hours)}
                  >
                    {t("manage:scheduled.snoozeFor", { label: snoozeLabel(hours) })}
                  </Dropdown.Item>
                ))}
                {onEdit && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" type="button" onClick={() => onEdit(item)}>
                      {t("common:actions.edit")}
                    </Dropdown.Item>
                  </>
                )}
                <Dropdown.Item as="button" type="button" onClick={() => setConfirming(true)}>
                  {t("common:actions.delete")}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>
        }
      />

      <ConfirmDialog
        show={confirming}
        title={t("manage:scheduled.deleteTitle")}
        body={t("manage:scheduled.deleteBody", { title: item.title })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          deleteScheduled(item.id);
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </li>
  );
}
