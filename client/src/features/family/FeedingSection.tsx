import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { Icon } from "../../components/ui/Icon";
import { ShowMore } from "../../components/ui/ShowMore";
import { useLocale } from "../../i18n/useLocale";
import { formatDateTime, formatRelativeDay } from "../../lib/format";
import { todayKey } from "../../lib/dateKey";
import { logsFor } from "../../lib/familySelectors";
import { useFamily } from "../../state/familyContext";
import type { EntityReference, QuickLogEntry } from "../../types";
import { QuickLogModal } from "./QuickLogModal";

interface FeedingSectionProps {
  profileId: string;
  owner: EntityReference;
}

/**
 * Feeds: the last one, today's, and nothing else.
 *
 * No chart, no daily total in millilitres, no "expected intake". Those belong
 * to a medical app, and a personal operating system that grows them is
 * pretending to a competence it does not have. What a tired parent actually
 * needs at 3am is "when was the last one" — so that is the first line.
 */
export function FeedingSection({ profileId, owner }: FeedingSectionProps) {
  const { t } = useTranslation(["family", "common"]);
  const { locale } = useLocale();
  const { logs, deleteLog } = useFamily();
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState<QuickLogEntry | undefined>(undefined);

  const feeds = useMemo(() => logsFor(logs, profileId, "feeding"), [logs, profileId]);
  const today = todayKey();
  const todayCount = feeds.filter((entry) => entry.occurredAt.startsWith(today)).length;
  const last = feeds[0];

  const describe = (entry: QuickLogEntry): string | undefined => {
    const parts = [
      entry.variant ? t(`family:log.variants.${entry.variant}`) : undefined,
      entry.title,
      entry.value !== undefined ? `${entry.value}${entry.unit ? ` ${entry.unit}` : ""}` : undefined,
      entry.note,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  return (
    <div className="focus-panel">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h3 className="focus-panel__title mb-0">{t("family:sections.feeding")}</h3>
        <span className="focus-dense-row__eyebrow">
          {todayCount > 0 ? t("family:log.todayCount", { count: todayCount }) : t("family:log.noneToday")}
        </span>
      </div>

      {last && (
        <p className="focus-panel__lead">
          {t("family:log.lastFeed", { when: formatRelativeDay(last.occurredAt, locale) })}
          {" · "}
          <time dateTime={last.occurredAt}>{formatDateTime(last.occurredAt, locale)}</time>
        </p>
      )}

      {/* A large target: this is pressed one-handed. */}
      <div className="focus-quicklog mb-2">
        <button type="button" className="focus-quicklog__button" onClick={() => setLogging(true)}>
          <Icon name="plus" size={16} />
          {t("family:log.addFeeding")}
        </button>
      </div>

      {feeds.length === 0 ? (
        <p className="focus-panel__lead mb-0">{t("family:log.empty")}</p>
      ) : (
        <ShowMore items={feeds} limit={4}>
          {(visible) => (
            <CompactList>
              {visible.map((entry) => (
                <li key={entry.id}>
                  <CompactRow
                    title={
                      entry.variant
                        ? t(`family:log.variants.${entry.variant}`)
                        : t("family:log.feeding")
                    }
                    detail={describe(entry)}
                    meta={
                      <time dateTime={entry.occurredAt}>
                        {formatDateTime(entry.occurredAt, locale)}
                      </time>
                    }
                    actions={
                      <>
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("common:actions.edit")}
                          onClick={() => setEditing(entry)}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("family:log.delete")}
                          onClick={() => deleteLog(entry.id)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </>
                    }
                  />
                </li>
              ))}
            </CompactList>
          )}
        </ShowMore>
      )}

      <QuickLogModal
        show={logging || Boolean(editing)}
        kind="feeding"
        owner={owner}
        entry={editing}
        onClose={() => {
          setLogging(false);
          setEditing(undefined);
        }}
      />
    </div>
  );
}
