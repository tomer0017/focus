import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { usePages } from "../../state/pagesContext";
import { useChecklists } from "../../state/checklistsContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { notesForPage } from "../../lib/projectNotes";
import { progressOf } from "../../lib/checklist";
import { categoryLabel, categoryOf } from "../../lib/projectCategories";
import type { MaterialFilter } from "../../lib/projectMaterials";
import { MATERIAL_KINDS } from "../../lib/projectMaterials";
import { BackButton } from "../../components/ui/BackButton";
import { BlockedBadge, StatusBadge } from "../../components/ui/Badges";
import { ErrorState } from "../../components/ui/ErrorState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { EditPageModal } from "../edit/EditPageModal";
import { ChecklistPageView } from "./ChecklistPageView";
import { LearningPageView } from "./LearningPageView";
import { ProjectFocusBand } from "./ProjectFocusBand";
import { MaterialsPanel } from "../resources/MaterialsPanel";
import { ProjectNotes } from "./ProjectNotes";
import { ProjectProgressImages, ProjectVisionImage } from "./ProjectImages";
import { isBlocked } from "../../types";

/**
 * A project, as a compact folder rather than a questionnaire.
 *
 * Three tabs — **overview · tasks · materials** — with the header and the focus
 * band above them, always visible. What that replaced: four tabs, a full-width
 * vision picture, a four-panel brief, the notes, and a progress gallery all
 * stacked down one page before the tabs even began.
 *
 * Two of the old tabs are gone for the same reason. **Inspiration** was
 * divided from materials by a hard-coded list of saved-item kinds — a division
 * the screen invented, since a photograph of the existing garden is reference
 * *and* inspiration depending on the day. **History** held three facts, and
 * those are chips in the header now.
 *
 * The tab lives in the URL, so a refresh, the back button and a shared link all
 * land on the same panel.
 */
const TABS = ["overview", "tasks", "materials"] as const;
type TabId = (typeof TABS)[number];

function isFilter(value: string | null): value is MaterialFilter {
  return value === "all" || MATERIAL_KINDS.includes(value as (typeof MATERIAL_KINDS)[number]);
}

export function PageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const {
    getPage,
    updatePage,
    savedItemsFor,
    savedItems,
    categories,
    setNotes,
    setVisionImage,
    setProgressImages,
  } = usePages();
  const { getChecklist } = useChecklists();
  const [params, setParams] = useSearchParams();

  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const page = id ? getPage(id) : undefined;
  const ownerId = `page:${id ?? ""}`;

  const materials = useMemo(() => (page ? savedItemsFor(page.id) : []), [page, savedItemsFor]);
  const notes = useMemo(() => (page ? notesForPage(page) : []), [page]);
  const progress = progressOf(getChecklist(ownerId));

  const tabParam = params.get("tab");
  const tab: TabId = TABS.includes(tabParam as TabId) ? (tabParam as TabId) : "overview";

  const filterParam = params.get("kind");
  const filter: MaterialFilter = isFilter(filterParam) ? filterParam : "all";
  const query = params.get("q") ?? "";
  const pageNumber = Number(params.get("page") ?? "1") || 1;

  const setParam = (changes: Record<string, string | undefined>): void => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "" || value === "all" || value === "1") next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  if (!page) {
    return (
      <div className="focus-detail">
        <div className="mb-3">
          <BackButton />
        </div>
        <ErrorState
          title={t("common:errors.pageNotFoundTitle")}
          message={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
        />
      </div>
    );
  }

  /*
   * A packing list for two nights up north is not a project, and the project
   * screen was asking it "why does this exist?" — a question a checklist
   * answers by being a checklist.
   */
  if (page.type === "checklist") return <ChecklistPageView page={page} />;

  /*
   * A learning page leads with where you stopped rather than with four content
   * tabs. Same shared mechanisms, arranged for the question somebody opens it
   * with after three months away.
   */
  if (page.type === "learning") return <LearningPageView page={page} />;

  const category = categories.find((entry) => entry.id === categoryOf(page));

  const tabs: SegmentedItem[] = [
    { id: "overview", label: t("pages:tabs.overview") },
    {
      id: "tasks",
      label: t("pages:tabs.tasks"),
      badge: progress.total > 0 ? `${progress.done}/${progress.total}` : undefined,
    },
    {
      id: "materials",
      label: t("pages:tabs.materials"),
      badge: materials.length > 0 ? String(materials.length) : undefined,
    },
  ];

  return (
    <div className="focus-detail">
      <PageHeader
        before={<BackButton />}
        title={page.title}
        titleIsUserContent
        meta={
          <>
            {/* Small, and only when there is one — an identifier, not a display. */}
            <Thumbnail imageUrl={page.visionImageUrl} size="sm" />
            {category && (
              <span
                className="focus-chip focus-chip--muted"
                dir={category.name ? "auto" : undefined}
              >
                {categoryLabel(category, t)}
              </span>
            )}
            <StatusBadge status={page.status} />
            {isBlocked(page) && <BlockedBadge />}
            {/* The three facts the old history tab held, where they are read. */}
            {page.pausedReason && (
              <span className="focus-chip focus-chip--muted" dir="auto">
                {page.pausedReason}
              </span>
            )}
            {page.completedAt && (
              <span className="text-secondary small">
                {t("common:fields.completedOn")}:{" "}
                <time dateTime={page.completedAt}>{formatDate(page.completedAt, locale)}</time>
              </span>
            )}
            <span className="text-secondary small">
              <time dateTime={page.lastUpdatedAt}>
                {t("common:time.updatedRelative", {
                  when: formatRelativeDay(page.lastUpdatedAt, locale),
                })}
              </time>
            </span>
          </>
        }
        action={
          <>
            <Button variant="outline-secondary" size="sm" onClick={() => setIsEditingFields(true)}>
              {t("pages:edit.openFields")}
            </Button>
            <Button
              variant={isEditing ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => setIsEditing((current) => !current)}
            >
              <Icon name={isEditing ? "check" : "edit"} size={15} />
              {isEditing ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </>
        }
      />

      <ProjectFocusBand
        page={page}
        progress={progress}
        onOpenTasks={() => setParam({ tab: "tasks" })}
      />

      <SegmentedNav
        label={t("pages:contentTabs")}
        items={tabs}
        value={tab}
        onChange={(next) => setParam({ tab: next, page: undefined })}
        variant="tabs"
        idPrefix="project"
        collapse
      />

      <div
        role="tabpanel"
        id={`project-panel-${tab}`}
        aria-labelledby={`project-tab-${tab}`}
        className="focus-collection__body"
      >
        {tab === "overview" && (
          <>
            {/*
              Where it stands and where you stopped, as two short lines rather
              than two headed panels. They are structured fields because the
              overview screen reads them — but on the project's own page they
              are context, not the headline.
            */}
            {(page.currentState || page.stoppedAt) && (
              <div className="focus-project-summary">
                {page.currentState && (
                  <p className="mb-0" dir="auto">
                    <span className="focus-project-summary__label">
                      {t("common:fields.currentState")}
                    </span>{" "}
                    {page.currentState}
                  </p>
                )}
                {page.stoppedAt && (
                  <p className="mb-0" dir="auto">
                    <span className="focus-project-summary__label">
                      {t("common:fields.stoppedAt")}
                    </span>{" "}
                    {page.stoppedAt}
                  </p>
                )}
              </div>
            )}

            <ProjectNotes
              notes={notes}
              isEditing={isEditing}
              onChange={(next) => setNotes(page.id, next)}
            />

            <ProjectVisionImage
              title={page.title}
              source={{
                imageUrl: page.visionImageUrl,
                savedItemId: page.visionSavedItemId,
                linkUrl: page.visionLinkUrl,
              }}
              savedItems={savedItems}
              isEditing={isEditing}
              onSave={(patch) => setVisionImage(page.id, patch)}
            />

            {(page.progressImages?.length || isEditing) && (
              <section className="focus-detail__progress">
                <h2 className="focus-note__title">{t("pages:images.progressHeading")}</h2>
                <ProjectProgressImages
                  images={page.progressImages ?? []}
                  savedItems={savedItems}
                  isEditing={isEditing}
                  onChange={(next) => setProgressImages(page.id, next)}
                />
              </section>
            )}
          </>
        )}

        {tab === "tasks" && <ChecklistSection ownerId={ownerId} />}

        {tab === "materials" && (
          <MaterialsPanel
            contextId={page.id}
            materials={materials}
            canAdd={isEditing}
            filter={filter}
            query={query}
            page={pageNumber}
            // Changing the shelf or the search resets the page: page 4 of
            // "links" means nothing once you are looking at pictures.
            onFilterChange={(next) => setParam({ kind: next, page: undefined })}
            onQueryChange={(next) => setParam({ q: next, page: undefined })}
            onPageChange={(next) => setParam({ page: String(next) })}
          />
        )}
      </div>

      <EditPageModal
        page={isEditingFields ? page : null}
        onClose={() => setIsEditingFields(false)}
        onSave={updatePage}
      />
    </div>
  );
}
