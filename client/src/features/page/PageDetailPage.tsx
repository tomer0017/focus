import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { usePages } from "../../state/pagesContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { notesForPage } from "../../lib/projectNotes";
import { Icon } from "../../components/ui/Icon";
import { BackButton } from "../../components/ui/BackButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { BlockedBadge, PageTypeBadge, SpaceBadge, StatusBadge } from "../../components/ui/Badges";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { ErrorState } from "../../components/ui/ErrorState";
import { ResumeBrief } from "./ResumeBrief";
import { ProjectNotes } from "./ProjectNotes";
import { ProjectProgressImages, ProjectVisionImage } from "./ProjectImages";
import { ChecklistPageView } from "./ChecklistPageView";
import { LearningPageView } from "./LearningPageView";
import { EditPageModal } from "../edit/EditPageModal";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useChecklists } from "../../state/checklistsContext";
import { progressOf } from "../../lib/checklist";
import { categoryLabel, categoryOf } from "../../lib/projectCategories";
import { isBlocked, type SavedItem } from "../../types";

/**
 * Four content tabs, and no "Overview" among them.
 *
 * The overview is the brief above them, always visible — repeating it inside a
 * tab would be the same information twice on one screen. Materials is one tab
 * rather than three, because "documents", "links" and "useful notes" are the
 * same question: what do I have that helps here.
 *
 * "Future" is gone: it held one legacy field, and that field is now an ordinary
 * note like any other. A tab whose only job was to show one optional sentence
 * was a tab that was usually empty.
 */
const TABS = ["tasks", "materials", "inspiration", "history"] as const;
type TabId = (typeof TABS)[number];

/** Saved items that read as inspiration rather than as reference material. */
const INSPIRATION_KINDS: SavedItem["kind"][] = ["inspiration", "image", "product"];

export function PageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const { getPage, updatePage, savedItemsFor, savedItems, categories, setNotes, setVisionImage, setProgressImages } =
    usePages();
  const { getChecklist } = useChecklists();
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  const page = id ? getPage(id) : undefined;
  const ownerId = `page:${id ?? ""}`;

  const related = useMemo(() => (page ? savedItemsFor(page.id) : []), [page, savedItemsFor]);
  const notes = useMemo(() => (page ? notesForPage(page) : []), [page]);
  const inspiration = related.filter((item) => INSPIRATION_KINDS.includes(item.kind));
  const progress = progressOf(getChecklist(`page:${id ?? ""}`));
  const category = page
    ? categories.find((entry) => entry.id === categoryOf(page))
    : undefined;
  const materials = related.filter((item) => !INSPIRATION_KINDS.includes(item.kind));

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
   * screen was asking it "why does this exist?" and "what is the next action?"
   * — questions a checklist answers by being a checklist. It gets its own
   * arrangement of the same shared pieces.
   */
  if (page.type === "checklist") {
    return <ChecklistPageView page={page} />;
  }

  /*
   * A learning page leads with where you stopped rather than with a vision
   * picture and four content tabs. The mechanisms are the same shared ones —
   * notes, a checklist, saved items — arranged for the one question somebody
   * opens it with after three months away.
   */
  if (page.type === "learning") {
    return <LearningPageView page={page} />;
  }

  const savedGrid = (items: SavedItem[], emptyKey: string) =>
    items.length > 0 ? (
      <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
        {items.map((item) => (
          <li key={item.id}>
            <SavedItemCard item={item} />
          </li>
        ))}
      </ul>
    ) : (
      <p className="focus-tab-empty mb-0">{t(emptyKey)}</p>
    );

  const tabContent = (tab: TabId) => {
    switch (tab) {
      case "tasks":
        return <ChecklistSection ownerId={ownerId} />;

      case "materials":
        return savedGrid(materials, "pages:empty.materials");

      case "inspiration":
        return savedGrid(inspiration, "pages:empty.inspiration");

      case "history":
        return (
          <ul className="list-unstyled focus-timeline mb-0">
            <li className="focus-timeline__entry">
              <span className="focus-timeline__dot" aria-hidden="true" />
              <div>
                <p className="focus-timeline__when mb-0">
                  <time dateTime={page.lastUpdatedAt}>
                    {formatDate(page.lastUpdatedAt, locale)} ·{" "}
                    {formatRelativeDay(page.lastUpdatedAt, locale)}
                  </time>
                </p>
                <p className="mb-0">{t("pages:history.lastUpdated")}</p>
              </div>
            </li>
            {page.completedAt && (
              <li className="focus-timeline__entry">
                <span className="focus-timeline__dot focus-timeline__dot--done" aria-hidden="true" />
                <div>
                  <p className="focus-timeline__when mb-0">
                    <time dateTime={page.completedAt}>{formatDate(page.completedAt, locale)}</time>
                  </p>
                  <p className="mb-0">{t("common:status.completed")}</p>
                </div>
              </li>
            )}
            {page.pausedReason && (
              <li className="focus-timeline__entry">
                <span className="focus-timeline__dot" aria-hidden="true" />
                <div>
                  <p className="focus-timeline__when mb-0">{t("common:status.paused")}</p>
                  <p className="mb-0" dir="auto">
                    {page.pausedReason}
                  </p>
                </div>
              </li>
            )}
          </ul>
        );
    }
  };

  return (
    <div className="focus-detail">
      <PageHeader
        before={<BackButton />}
        title={page.title}
        titleIsUserContent
        meta={
          <>
            {/* Small, and only when the project has one. The picture belongs to
                the brief below; here it is an identifier, not a display. */}
            <Thumbnail imageUrl={page.visionImageUrl} size="sm" />
            <PageTypeBadge type={page.type} />
            {page.type === "project" && category && (
              <span className="focus-chip focus-chip--muted" dir={category.name ? "auto" : undefined}>
                {categoryLabel(category, t)}
              </span>
            )}
            <SpaceBadge spaceId={page.spaceId} />
            <StatusBadge status={page.status} />
            {isBlocked(page) && <BlockedBadge />}
            {progress.total > 0 && (
              <span className="focus-chip focus-chip--muted">
                {t("pages:progressCount", { done: progress.done, total: progress.total })}
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
          <Button
            variant={isEditing ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setIsEditing((current) => !current)}
          >
            <Icon name={isEditing ? "check" : "edit"} size={15} />
            {isEditing ? t("common:actions.doneEditing") : t("common:actions.edit")}
          </Button>
        }
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

      <ResumeBrief page={page} />

      {isEditing && (
        <div className="focus-edit-bar">
          <p className="focus-edit-bar__note mb-0">{t("common:mock.editHint")}</p>
          <Button variant="outline-secondary" size="sm" onClick={() => setIsEditingFields(true)}>
            <Icon name="edit" size={15} />
            {t("pages:edit.openFields")}
          </Button>
        </div>
      )}

      <ProjectNotes
        notes={notes}
        isEditing={isEditing}
        onChange={(next) => setNotes(page.id, next)}
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

      <div className="focus-tabs" role="tablist" aria-label={t("pages:contentTabs")}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            className={`focus-tabs__tab ${activeTab === tab ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`pages:tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="focus-tabpanel"
      >
        {tabContent(activeTab)}
      </div>

      <EditPageModal
        page={isEditingFields ? page : null}
        onClose={() => setIsEditingFields(false)}
        onSave={updatePage}
      />
    </div>
  );
}
