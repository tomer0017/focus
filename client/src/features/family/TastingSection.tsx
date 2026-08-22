import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { ShowMore } from "../../components/ui/ShowMore";
import { useLocale } from "../../i18n/useLocale";
import { formatShortDate, formatRelativeDay, daysUntil } from "../../lib/format";
import { logsFor } from "../../lib/familySelectors";
import { useFamily } from "../../state/familyContext";
import type { EntityReference, QuickLogEntry } from "../../types";
import { QuickLogModal } from "./QuickLogModal";

interface TastingSectionProps {
  profileId: string;
  owner: EntityReference;
}

type TastingView = "tried" | "planned" | "week" | "followUp";

/**
 * New foods, as a log with four views over it.
 *
 * Every view is a filter on what the parent recorded — never an assessment.
 * "Needs follow-up" contains exactly the entries somebody ticked as such;
 * Focus does not decide that a reaction warrants one, because it has no idea
 * what a reaction is and must not act as though it does.
 */
export function TastingSection({ profileId, owner }: TastingSectionProps) {
  const { t } = useTranslation(["family", "common"]);
  const { locale } = useLocale();
  const { logs, deleteLog } = useFamily();

  const [view, setView] = useState<TastingView>("tried");
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState<QuickLogEntry | undefined>(undefined);

  const tastings = useMemo(() => logsFor(logs, profileId, "tasting"), [logs, profileId]);

  const buckets = useMemo(() => {
    const planned = tastings.filter(
      (entry) => entry.followUpAt && daysUntil(entry.followUpAt) >= 0
    );
    const week = tastings.filter((entry) => {
      const ago = -daysUntil(entry.occurredAt);
      return ago >= 0 && ago <= 7;
    });
    return {
      tried: tastings,
      planned,
      week,
      followUp: tastings.filter((entry) => entry.followUp),
    };
  }, [tastings]);

  const options: FilterOption<TastingView>[] = (
    ["tried", "week", "planned", "followUp"] as TastingView[]
  ).map((value) => ({
    value,
    label: t(
      value === "tried"
        ? "family:log.tried"
        : value === "week"
          ? "family:log.thisWeek"
          : value === "planned"
            ? "family:log.planned"
            : "family:log.needsFollowUp"
    ),
    count: buckets[value].length,
  }));

  const rows = buckets[view];

  return (
    <div className="focus-panel">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h3 className="focus-panel__title mb-0">{t("family:sections.tasting")}</h3>
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0"
          onClick={() => setLogging(true)}
        >
          {t("family:log.addTasting")}
        </button>
      </div>

      <div className="focus-toolbar">
        <FilterChips
          label={t("family:sections.tasting")}
          options={options}
          value={view}
          onChange={setView}
        />
      </div>

      {rows.length === 0 ? (
        <p className="focus-panel__lead mb-0">{t("family:log.empty")}</p>
      ) : (
        <ShowMore items={rows} limit={5}>
          {(visible) => (
            <CompactList>
              {visible.map((entry) => (
                <li key={entry.id}>
                  <CompactRow
                    title={entry.title ?? t("family:log.tasting")}
                    detail={entry.note}
                    badges={
                      <>
                        {entry.firstTime && (
                          <span className="focus-chip focus-chip--info">
                            {t("family:log.firstTime")}
                          </span>
                        )}
                        {entry.followUp && (
                          <span className="focus-chip focus-chip--warning">
                            {t("family:log.needsFollowUp")}
                          </span>
                        )}
                      </>
                    }
                    meta={
                      <>
                        <time dateTime={entry.occurredAt}>
                          {formatShortDate(entry.occurredAt, locale)}
                        </time>
                        {entry.followUpAt && (
                          <time dateTime={entry.followUpAt}>
                            {t("family:log.followUpAt")}:{" "}
                            {formatRelativeDay(entry.followUpAt, locale)}
                          </time>
                        )}
                      </>
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

      <div className="mt-2">
        <InfoNote tone="caution">{t("family:safety.baby")}</InfoNote>
      </div>

      <QuickLogModal
        show={logging || Boolean(editing)}
        kind="tasting"
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
