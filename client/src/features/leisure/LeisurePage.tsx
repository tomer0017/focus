import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import type { SegmentedItem } from "../../components/ui/SegmentedNav";
import {
  countByKind,
  filterCollection,
  sortCollection,
  statusKeyFor,
  statusValuesFor,
} from "../../lib/leisureCollections";
import { LEISURE_KINDS } from "../../types/leisure";
import { useLeisure } from "../../state/leisureContext";
import type { LeisureItem, LeisureKind } from "../../types";
import { LeisureFormModal } from "./LeisureFormModal";
import { LeisureRow } from "./LeisureRow";
import { SuggestionCard } from "./SuggestionCard";

const ALL = "all";

function isKind(value: string | null): value is LeisureKind {
  return LEISURE_KINDS.includes(value as LeisureKind);
}

/**
 * Leisure and lists — five collections, one at a time.
 *
 * The screen this replaces put films, books, places, evening ideas and a
 * wishlist into a single grid of cards and led with a five-question form asking
 * what would suit right now. It read as a pile of ideas rather than somewhere
 * you could come back to after a year, and it could not answer the questions
 * people actually arrive with: which books do I own, what have I already read,
 * where have I been.
 *
 * So: the category is a tab, the state is a filter, and there is one list
 * underneath. Both choices and the search term live in the URL, so a refresh,
 * the back button and a shared link all land on the same view. The suggester is
 * still here and still works — it is one press behind its own button, which is
 * where a question you sometimes want to be asked belongs.
 */
export function LeisurePage() {
  const { t } = useTranslation(["leisure", "common"]);
  const { items, deleteItem } = useLeisure();
  const [params, setParams] = useSearchParams();

  const [editing, setEditing] = useState<LeisureItem | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState<LeisureItem | undefined>(undefined);

  const kindParam = params.get("kind");
  const kind: LeisureKind = isKind(kindParam) ? kindParam : "book";
  const status = params.get("status") ?? ALL;
  const query = params.get("q") ?? "";

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    // Changing the category cannot keep a status that belongs to another axis.
    if (key === "kind") next.delete("status");
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => countByKind(items), [items]);

  const inKind = useMemo(
    () => items.filter((item) => item.kind === kind),
    [items, kind]
  );

  const visible = useMemo(
    () =>
      sortCollection(
        filterCollection(items, {
          kind,
          status: status === ALL ? undefined : status,
          query: query || undefined,
        })
      ),
    [items, kind, status, query]
  );

  const tabs: SegmentedItem[] = LEISURE_KINDS.map((value) => ({
    id: value,
    label: t(`leisure:kinds.${value}`),
    badge: counts[value] > 0 ? String(counts[value]) : undefined,
  }));

  /*
   * Only the states this category actually uses, and only those that have
   * something in them. A chip for every possible value is a row of zeroes.
   */
  const statusOptions: FilterOption<string>[] = [
    { value: ALL, label: t("leisure:filters.all"), count: inKind.length },
    ...statusValuesFor(kind)
      .map((value) => ({
        value,
        label: t(`leisure:${statusKeyFor(kind)}.${value}`),
        count: inKind.filter((item) => {
          const key = statusKeyFor(kind);
          if (key === "consumption") return item.consumptionStatus === value;
          if (key === "destinationStatus") return item.destinationStatus === value;
          if (key === "purchase") return item.purchaseStatus === value;
          return item.status === value;
        }).length,
      }))
      .filter((option) => option.count > 0),
  ];

  return (
    <>
      <CollectionPage
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
        feature={
          /* Collapsed by default, and never popped up on its own. */
          asking ? (
            <div id="leisure-suggester" className="focus-suggester">
              <SuggestionCard />
            </div>
          ) : undefined
        }
        tabs={tabs}
        tabValue={kind}
        onTabChange={(id) => setParam("kind", id)}
        tabsLabel={t("leisure:filters.kind")}
        toolbar={
          <>
            {statusOptions.length > 1 && (
              <FilterChips
                label={t("leisure:filters.status")}
                options={statusOptions}
                value={status}
                onChange={(value) => setParam("status", value)}
              />
            )}
            <SearchField
              label={t("leisure:searchIn", { collection: t(`leisure:kinds.${kind}`) })}
              value={query}
              onChange={(value) => setParam("q", value)}
              resultCount={query ? visible.length : undefined}
            />
          </>
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            title={
              query || status !== ALL
                ? t("leisure:noMatches")
                : t(`leisure:emptyIn.${kind}.title`)
            }
            hint={
              query || status !== ALL ? undefined : t(`leisure:emptyIn.${kind}.hint`)
            }
          />
        ) : (
          /*
           * Twenty rows at a time. A hundred books is a real amount to own and
           * a page nobody scrolls to the end of; the count on the button says
           * how deep the list actually goes.
           */
          <PagedList items={visible} pageSize={20} resetKey={`${kind}:${status}:${query}`}>
            {(shown) => (
              <CompactList>
                {shown.map((item) => (
                  <li key={item.id}>
                    <LeisureRow item={item} onEdit={setEditing} onDelete={setDeleting} />
                  </li>
                ))}
              </CompactList>
            )}
          </PagedList>
        )}
      </CollectionPage>

      <LeisureFormModal
        show={creating || Boolean(editing)}
        item={editing}
        defaultKind={kind}
        onClose={() => {
          setCreating(false);
          setEditing(undefined);
        }}
      />

      <ConfirmDialog
        show={Boolean(deleting)}
        title={t("leisure:actions.deleteTitle")}
        body={t("leisure:actions.deleteBody", { title: deleting?.title ?? "" })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          if (deleting) deleteItem(deleting.id);
          setDeleting(undefined);
        }}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  );
}
