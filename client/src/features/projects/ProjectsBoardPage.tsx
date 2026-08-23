import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { usePages } from "../../state/pagesContext";
import { useChecklists } from "../../state/checklistsContext";
import { progressOf } from "../../lib/checklist";
import { boardProjects, columnPages, targetIndexBeside } from "../../lib/projectBoard";
import { categoryLabel, categoryOf } from "../../lib/projectCategories";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import { CompactList } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import type { PageSummary } from "../../types";
import { ProjectRow } from "./ProjectRow";
import { PauseReasonModal } from "./PauseReasonModal";
import { CategoriesModal } from "./CategoriesModal";

/** Every status, plus the pseudo-status that answers "what is stuck". */
type StatusFilter = "active" | "blocked" | "paused" | "completed";

const STATUS_ORDER: StatusFilter[] = ["active", "blocked", "paused", "completed"];

/**
 * The project workspace: which kind, then which state, then one list.
 *
 * It used to be three columns side by side, every project a ~200px card. That
 * shape has two problems and both get worse with use: a column you are not
 * working in still costs a third of the screen, and "completed" is unbounded —
 * seventy finished projects were seventy cards nobody would ever scroll past.
 *
 * Now the category is a tab and the state is a filter, so the screen shows one
 * answer at a time, and the archive is paged rather than poured onto the page.
 * Both choices live in the URL, so a refresh and a shared link land in the same
 * place — and so the space views can link straight to a category.
 *
 * "Blocked" is a filter here, never a fifth status: a project is active *and*
 * blocked, and giving it a column of its own would have made being stuck look
 * like a stage of work.
 */
export function ProjectsBoardPage() {
  const { t } = useTranslation(["projects", "common"]);
  const { pages, categories, moveProject, setPausedReason } = usePages();
  const { getChecklist } = useChecklists();
  const [params, setParams] = useSearchParams();

  const [reasonFor, setReasonFor] = useState<PageSummary | null>(null);
  const [managing, setManaging] = useState(false);
  const [query, setQuery] = useState("");

  const projects = useMemo(() => boardProjects(pages), [pages]);

  const category = params.get("category") ?? categories[0]?.id ?? "";
  const status = (params.get("status") as StatusFilter | null) ?? "active";

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const inCategory = useMemo(
    () => projects.filter((page) => categoryOf(page) === category),
    [projects, category]
  );

  const matchesStatus = (page: PageSummary, filter: StatusFilter): boolean =>
    filter === "blocked"
      ? Boolean(page.blocker?.trim())
      : page.status === filter;

  /*
   * Search runs over the whole category, not the current status. Looking for a
   * project you half remember is exactly the moment you do not know whether you
   * parked it or finished it.
   */
  const term = query.trim().toLowerCase();
  const listed = useMemo(() => {
    const base = term
      ? inCategory.filter((page) =>
          [page.title, page.nextAction, page.currentState, page.blocker]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(term))
        )
      : inCategory.filter((page) => matchesStatus(page, status));

    // Keep the board's own ordering so a project that was arranged stays put.
    const order = columnPages(pages, base[0]?.status ?? "active").map((page) => page.id);
    return [...base].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
    });
  }, [inCategory, term, status, pages]);

  const statusOptions: FilterOption<StatusFilter>[] = STATUS_ORDER.map((value) => ({
    value,
    label:
      value === "blocked" ? t("projects:filters.blocked") : t(`common:status.${value}`),
    count: inCategory.filter((page) => matchesStatus(page, value)).length,
  }));

  const tabs = categories.map((entry) => ({
    id: entry.id,
    label: categoryLabel(entry, t),
    isUserContent: Boolean(entry.name),
    badge: String(projects.filter((page) => categoryOf(page) === entry.id).length || ""),
  }));

  const manageAction = (
    <Button variant="outline-secondary" size="sm" onClick={() => setManaging(true)}>
      <Icon name="settings" size={14} />
      {t("projects:categories.manage")}
    </Button>
  );

  if (projects.length === 0) {
    return (
      <CollectionPage title={t("projects:title")} lead={t("projects:lead")}>
        <EmptyState title={t("projects:empty.title")} hint={t("projects:empty.hint")} />
      </CollectionPage>
    );
  }

  return (
    <>
      <CollectionPage
        title={t("projects:title")}
        lead={t("projects:lead")}
        action={manageAction}
        tabs={tabs}
        tabValue={category}
        onTabChange={(id) => setParam("category", id)}
        tabsLabel={t("projects:categories.choose")}
        toolbar={
          <>
            {/* Search replaces the status filter rather than stacking with it:
                two narrowings at once is how you end up staring at an empty
                list and blaming the search. */}
            {!term && (
              <FilterChips
                label={t("projects:filters.label")}
                options={statusOptions}
                value={status}
                onChange={(value) => setParam("status", value)}
              />
            )}
            <SearchField
              label={t("projects:searchLabel")}
              value={query}
              onChange={setQuery}
              resultCount={listed.length}
            />
          </>
        }
      >
        {listed.length === 0 ? (
          <p className="focus-day-empty mb-0">
            {term ? t("projects:noMatches") : t("projects:noneInStatus")}
          </p>
        ) : (
          <PagedList items={listed} pageSize={20} resetKey={`${category}|${status}|${term}`}>
            {(visible) => (
              <CompactList>
                {visible.map((page, index) => (
                  <li key={page.id}>
                    <ProjectRow
                      page={page}
                      categoryLabel={
                        categories.find((entry) => entry.id === categoryOf(page))
                          ? categoryLabel(
                              categories.find((entry) => entry.id === categoryOf(page))!,
                              t
                            )
                          : t("projects:categories.none")
                      }
                      progress={progressOf(getChecklist(`project:${page.id}`))}
                      onStatusChange={(next) => moveProject(page.id, next)}
                      /*
                       * Named neighbours, not screen positions. `boardOrder`
                       * numbers a whole status column across every category,
                       * and this screen shows one category — so an on-screen
                       * index means nothing to `moveProject`. Say which row to
                       * swap with and let the column work out where that is.
                       */
                      onMove={(direction) => {
                        const neighbour = listed[index + direction];
                        if (!neighbour) return;
                        moveProject(
                          page.id,
                          page.status,
                          targetIndexBeside(
                            columnPages(projects, page.status).map((entry) => entry.id),
                            page.id,
                            neighbour.id,
                            direction
                          )
                        );
                      }}
                      onEditReason={() => setReasonFor(page)}
                      /*
                       * Reordering is off while searching: the results mix
                       * statuses and are not in column order, so "below the
                       * next row" would not mean anything. The ends are judged
                       * against the whole filtered list, not the rendered page,
                       * so the last row on screen can still move down.
                       */
                      canReorder={!term}
                      isFirst={index === 0}
                      isLast={index === listed.length - 1}
                    />
                  </li>
                ))}
              </CompactList>
            )}
          </PagedList>
        )}
      </CollectionPage>

      <PauseReasonModal
        page={reasonFor}
        onClose={() => setReasonFor(null)}
        onSave={(reason) => {
          if (reasonFor) setPausedReason(reasonFor.id, reason);
        }}
      />

      <CategoriesModal show={managing} onClose={() => setManaging(false)} />
    </>
  );
}
