import { useTranslation } from "react-i18next";
import Dropdown from "react-bootstrap/Dropdown";
import { CompactRow } from "../../components/ui/CompactRow";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate } from "../../lib/format";
import { SNOOZE_PRESETS } from "../../lib/scheduled";
import { useManage } from "../../state/manageContext";
import type { RelevanceItem } from "../../lib/relevance";

/**
 * One row in "what needs you", whatever produced it.
 *
 * Three affordances and no more: mark it done, put it off, open the thing it
 * came from. Anything else belongs on the screen that owns the record — this
 * list is a triage surface, and a triage surface with an edit form in it stops
 * being one.
 */
export function RelevanceRow({ item }: { item: RelevanceItem }) {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { completeScheduled, snoozeScheduled } = useManage();

  const isScheduled = item.reference?.kind === "scheduled";

  const snoozeLabel = (hours: number): string =>
    hours < 24
      ? t("manage:reminders.snoozeHours", { count: hours })
      : t("manage:reminders.snoozeDays", { count: Math.round(hours / 24) });

  return (
    <li>
      <CompactRow
        title={item.title}
        eyebrow={t(`manage:now.sources.${item.source}`)}
        detail={item.detail}
        href={item.href}
        tone={item.overdue ? "due" : item.bucket === "today" ? "soon" : "neutral"}
        badges={item.overdue ? <span className="focus-overdue">{t("manage:now.overdue")}</span> : undefined}
        meta={
          item.at ? (
            <>
              <time dateTime={item.at}>{formatShortDate(item.at, locale)}</time>
              <span className={item.overdue ? "focus-overdue" : undefined}>
                {formatRelativeDay(item.at, locale)}
              </span>
            </>
          ) : (
            <span>{t("manage:now.learningIdle")}</span>
          )
        }
        actions={
          isScheduled && item.reference ? (
            <>
              <button
                type="button"
                className="focus-icon-button btn btn-sm btn-link text-secondary"
                aria-label={`${t("manage:scheduled.markDone")} — ${item.title}`}
                onClick={() => completeScheduled(item.reference!.id)}
              >
                <Icon name="check" size={16} />
              </button>

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
                      onClick={() => snoozeScheduled(item.reference!.id, hours)}
                    >
                      {t("manage:scheduled.snoozeFor", { label: snoozeLabel(hours) })}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : undefined
        }
      />
    </li>
  );
}
