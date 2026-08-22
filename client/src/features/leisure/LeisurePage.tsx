import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { ShowMore } from "../../components/ui/ShowMore";
import { filterLeisure, type LeisureFilter } from "../../lib/leisureRules";
import { LEISURE_KINDS } from "../../types/leisure";
import { useLeisure } from "../../state/leisureContext";
import type { LeisureItem, LeisureKind, LeisureStatus } from "../../types";
import { LeisureCard } from "./LeisureCard";
import { LeisureFormModal } from "./LeisureFormModal";
import { SuggestionCard } from "./SuggestionCard";

const ALL = "all" as const;

/**
 * Leisure: the ideas themselves, with the suggester one press away.
 *
 * "What suits right now?" is a good question and a bad landing screen. Asking
 * it costs three or four answers before anything appears, so the top of the
 * page was a form — and someone who arrived knowing they wanted to find that
 * film had to scroll past it every time. The ideas lead now; the suggester is a
 * panel behind its own button, opened by the people who want to be asked.
 *
 * Both read the same items. There is no separate "ideas" store.
 */
export function LeisurePage() {
  const { t } = useTranslation(["leisure", "common"]);
  const { items, acceptItem, markItemDone } = useLeisure();
  const [searchParams] = useSearchParams();

  const [kind, setKind] = useState<LeisureKind | typeof ALL>(ALL);
  const [status, setStatus] = useState<LeisureStatus | typeof ALL>(ALL);
  const [editing, setEditing] = useState<LeisureItem | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [asking, setAsking] = useState(false);

  const query = searchParams.get("q") ?? "";

  const filter: LeisureFilter = useMemo(
    () => ({
      kind: kind === ALL ? undefined : kind,
      status: status === ALL ? undefined : status,
      query: query || undefined,
    }),
    [kind, status, query]
  );

  const visible = useMemo(
    () =>
      filterLeisure(items, filter).sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title)
      ),
    [items, filter]
  );

  const kindOptions: FilterOption<LeisureKind | typeof ALL>[] = [
    { value: ALL, label: t("leisure:filters.all"), count: items.length },
    ...LEISURE_KINDS.map((value) => ({
      value,
      label: t(`leisure:kinds.${value}`),
      count: items.filter((item) => item.kind === value).length,
    })).filter((option) => option.count > 0),
  ];

  const statusOptions: FilterOption<LeisureStatus | typeof ALL>[] = [
    { value: ALL, label: t("leisure:filters.all") },
    ...(["idea", "planned", "done"] as LeisureStatus[]).map((value) => ({
      value,
      label: t(`leisure:status.${value}`),
      count: items.filter((item) => item.status === value).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title={t("leisure:title")}
        lead={t("leisure:lead")}
        action={
          <>
            <Button
              variant="outline-primary"
              size="sm"
              aria-expanded={asking}
              aria-controls="leisure-suggester"
              onClick={() => setAsking((current) => !current)}
            >
              <Icon name="star" size={14} /> {t("leisure:suggestMe")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
              <Icon name="plus" size={14} /> {t("leisure:add")}
            </Button>
          </>
        }
      />

      {/* Collapsed by default, and never popped up on its own. */}
      {asking && (
        <div id="leisure-suggester" className="focus-suggester">
          <SuggestionCard />
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState title={t("leisure:empty")} hint={t("leisure:emptyHint")} />
        </div>
      ) : (
        <>
          <div className="focus-toolbar mt-3">
            <FilterChips
              label={t("leisure:filters.kind")}
              options={kindOptions}
              value={kind}
              onChange={setKind}
            />
            {/*
              Status only earns a second row of chips once something has
              actually moved on from "idea". Two filter strips over a list where
              every item is in one bucket is control without content.
            */}
            {items.some((item) => item.status !== "idea") && (
              <FilterChips
                label={t("leisure:filters.status")}
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            )}
          </div>

          {visible.length === 0 ? (
            <p className="focus-panel__lead">{t("leisure:noMatches")}</p>
          ) : (
            <ShowMore items={visible} limit={9}>
              {(shown) => (
                <div className="focus-profile-grid">
                  {shown.map((item) => (
                    <LeisureCard
                      key={item.id}
                      item={item}
                      onEdit={setEditing}
                      onPlan={acceptItem}
                      onDone={markItemDone}
                    />
                  ))}
                </div>
              )}
            </ShowMore>
          )}
        </>
      )}

      <LeisureFormModal
        show={creating || Boolean(editing)}
        item={editing}
        onClose={() => {
          setCreating(false);
          setEditing(undefined);
        }}
      />
    </>
  );
}
