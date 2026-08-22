import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { BoardImage } from "../../components/ui/BoardImage";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { hostLabel, normaliseUrl } from "../../lib/links";
import { THUMB_FOR_KIND, savedItemId } from "../../lib/savedItems";
import {
  LEARNING_LEVELS,
  LEARNING_RESOURCE_TABS,
  isResourceTab,
  kindForTab,
  learningResources,
  resourceCounts,
  resourcesIn,
  type LearningLevelFilter,
  type LearningResourceTab,
  type ResolvedLearningResource,
} from "../../lib/learning";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel, PageSummary, SavedItem, SavedItemSource } from "../../types";

/** Where a video was saved from. The user's own answer — nothing is fetched. */
const VIDEO_SOURCES: SavedItemSource[] = ["youtube", "instagram", "tiktok", "web"];

interface LearningResourcesProps {
  page: PageSummary;
  filter: LearningLevelFilter;
  isEditing: boolean;
}

/**
 * Everything saved for one learning page, one kind at a time.
 *
 * Four panels — links, documents, pictures, videos — over **one** storage
 * model. They are `SavedItem`s with the page in their `contextIds`, exactly
 * like a recipe's attachments or a trip's inspiration; what makes them a
 * learning resource is the level the page files them under, which lives on the
 * page and not on the item, so the same video can be beginner material here and
 * the only advanced thing somewhere else.
 *
 * One panel is open at a time on purpose. Somebody who saved forty things over
 * two years does not want all forty at once — they want the six videos, or the
 * two documents, and the level strip above narrows even that.
 */
export function LearningResources({ page, filter, isEditing }: LearningResourcesProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { savedItems, addLearningResource, setLearningResource, removeLearningResource } =
    usePages();
  const [params, setParams] = useSearchParams();
  const [lightbox, setLightbox] = useState<SavedItem | null>(null);

  const tab: LearningResourceTab = isResourceTab(params.get("material"))
    ? (params.get("material") as LearningResourceTab)
    : "links";

  const setTab = (value: string): void => {
    const next = new URLSearchParams(params);
    if (value === "links") next.delete("material");
    else next.set("material", value);
    setParams(next, { replace: true });
  };

  const all = learningResources(page, savedItems);
  const counts = resourceCounts(all, filter);
  const shown = resourcesIn(all, tab, filter);

  const levelName = (level: LearningLevel | undefined): string =>
    level ? t(`pages:learning.levels.${level}`) : t("pages:learning.levels.general");

  const items = LEARNING_RESOURCE_TABS.map((value) => ({
    id: value,
    label: t(`pages:learning.material.${value}`),
    badge: String(counts[value] || ""),
  }));

  /** The level control that appears beside each resource in edit mode. */
  const levelPicker = (resource: ResolvedLearningResource) => (
    <>
      <label className="visually-hidden" htmlFor={`res-level-${resource.item.id}`}>
        {t("pages:learning.material.levelOf", { name: resource.item.title })}
      </label>
      <select
        id={`res-level-${resource.item.id}`}
        className="form-select form-select-sm focus-level-select"
        value={resource.level ?? ""}
        onChange={(event) =>
          setLearningResource(page.id, resource.item.id, {
            level: (event.target.value || undefined) as LearningLevel | undefined,
          })
        }
      >
        <option value="">{t("pages:learning.levels.general")}</option>
        {LEARNING_LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`pages:learning.levels.${level}`)}
          </option>
        ))}
      </select>
    </>
  );

  const removeButton = (resource: ResolvedLearningResource) => (
    <button
      type="button"
      className="focus-icon-button border focus-icon-button--danger"
      onClick={() => removeLearningResource(page.id, resource.item.id)}
      aria-label={t("pages:learning.material.remove", { name: resource.item.title })}
    >
      <Icon name="close" size={15} />
    </button>
  );

  const openButton = (resource: ResolvedLearningResource) =>
    resource.item.url ? (
      <ExternalLink href={resource.item.url} className="focus-resource__open">
        {t("common:actions.open")}
      </ExternalLink>
    ) : null;

  /** Links and documents share a shape, because they are the same fact. */
  const renderRows = () => (
    <CompactList>
      {shown.map((resource) => (
        <li key={resource.item.id}>
          <CompactRow
            title={resource.item.title}
            eyebrow={hostLabel(resource.item.url) ?? t(`common:sources.${resource.item.source}`)}
            detail={resource.note}
            badges={
              <span className="focus-chip focus-chip--muted">{levelName(resource.level)}</span>
            }
            actions={
              <>
                {openButton(resource)}
                {isEditing && levelPicker(resource)}
                {isEditing && removeButton(resource)}
              </>
            }
          />
        </li>
      ))}
    </CompactList>
  );

  const renderImages = () => (
    <ul className="focus-gallery list-unstyled mb-0">
      {shown.map((resource) => (
        <li key={resource.item.id} className="focus-gallery__item">
          <button
            type="button"
            className="focus-gallery__open"
            onClick={() => setLightbox(resource.item)}
          >
            <BoardImage
              className="focus-gallery__image"
              imageUrl={resource.item.url}
              thumb={resource.item.url ? undefined : resource.item.thumb}
            />
            <span className="visually-hidden">
              {t("pages:learning.material.view", { name: resource.item.title })}
            </span>
          </button>
          <p className="focus-gallery__caption focus-clamp-1 mb-0" dir="auto">
            {resource.item.title}
          </p>
          <p className="focus-gallery__meta mb-0">
            <span className="focus-chip focus-chip--muted">{levelName(resource.level)}</span>
          </p>
          {isEditing && (
            <div className="focus-gallery__actions">
              {levelPicker(resource)}
              {removeButton(resource)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const renderVideos = () => (
    <ul className="focus-gallery focus-gallery--video list-unstyled mb-0">
      {shown.map((resource) => (
        <li key={resource.item.id} className="focus-gallery__item">
          {/* No thumbnail is invented. Nothing is fetched from YouTube, TikTok
              or Instagram, so the tile says which platform it is and stops. */}
          <span className="focus-video-tile" aria-hidden="true">
            <Icon name="external" size={18} />
            <span className="focus-video-tile__source">
              {t(`common:sources.${resource.item.source}`)}
            </span>
          </span>
          <p className="focus-gallery__caption focus-clamp-1 mb-0" dir="auto">
            {resource.item.url ? (
              <ExternalLink href={resource.item.url}>{resource.item.title}</ExternalLink>
            ) : (
              resource.item.title
            )}
          </p>
          {resource.note && (
            <p className="focus-gallery__note focus-clamp-1 mb-0" dir="auto">
              {resource.note}
            </p>
          )}
          <p className="focus-gallery__meta mb-0">
            <span className="focus-chip focus-chip--muted">{levelName(resource.level)}</span>
          </p>
          {isEditing && (
            <div className="focus-gallery__actions">
              {levelPicker(resource)}
              {removeButton(resource)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <section className="focus-section focus-section--full mt-3">
      <h2 className="focus-section-title">{t("pages:learning.material.title")}</h2>

      <SegmentedNav
        label={t("pages:learning.material.choose")}
        items={items}
        value={tab}
        onChange={setTab}
        variant="pills"
        idPrefix={`learn-material-${page.id}`}
        collapse
      />

      <div
        role="tabpanel"
        id={`learn-material-${page.id}-panel-${tab}`}
        aria-labelledby={`learn-material-${page.id}-tab-${tab}`}
        className="focus-material-panel"
      >
        {/* Said where the claim is made, and only on the panel that makes it. */}
        {tab === "documents" && (
          <div className="mb-3">
            <InfoNote>{t("pages:learning.material.documentsNote")}</InfoNote>
          </div>
        )}

        {shown.length === 0 ? (
          <p className="focus-day-empty mb-0">
            {filter === "all"
              ? t("pages:learning.material.empty")
              : t("pages:learning.material.emptyAtLevel")}
          </p>
        ) : tab === "images" ? (
          renderImages()
        ) : tab === "videos" ? (
          renderVideos()
        ) : (
          renderRows()
        )}

        {isEditing && (
          <AddResource
            tab={tab}
            onAdd={(item, level) => addLearningResource(page.id, item, { level })}
          />
        )}
      </div>

      <Modal show={lightbox !== null} onHide={() => setLightbox(null)} centered size="lg">
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h6 mb-0" dir="auto">
            {lightbox?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lightbox && (
            <BoardImage className="focus-lightbox__image" imageUrl={lightbox.url} alt="" />
          )}
          {lightbox?.note && (
            <p className="mt-2 mb-0" dir="auto">
              {lightbox.note}
            </p>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
}

/**
 * One form for all four panels.
 *
 * The panel decides the kind and which fields make sense: a picture needs a
 * preview before it is kept, a video needs to be told where it came from, and
 * neither needs a separate storage model. Nothing is uploaded and no file is
 * read — only an address is ever stored, which is the same rule the vision
 * board and the trip covers follow.
 */
function AddResource({
  tab,
  onAdd,
}: {
  tab: LearningResourceTab;
  onAdd: (item: SavedItem, level: LearningLevel | undefined) => void;
}) {
  const { t } = useTranslation(["pages", "common"]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [level, setLevel] = useState<LearningLevel | "">("");
  const [source, setSource] = useState<SavedItemSource>("youtube");

  const reset = (): void => {
    setTitle("");
    setUrl("");
    setNote("");
    setLevel("");
    setSource("youtube");
  };

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const kind = kindForTab(tab);
    onAdd(
      {
        id: savedItemId(),
        kind,
        title: trimmed,
        note: note.trim() || undefined,
        // A placeholder never becomes a destination — see lib/links.ts.
        url: normaliseUrl(url),
        source: tab === "videos" ? source : "web",
        spaceId: "personal",
        thumb: THUMB_FOR_KIND[kind],
        contextIds: [],
        savedAt: new Date().toISOString(),
      },
      level || undefined
    );
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <Icon name="plus" size={15} /> {t(`pages:learning.material.add.${tab}`)}
      </Button>
    );
  }

  return (
    <form className="focus-resource-form mt-3" onSubmit={submit}>
      <div>
        <label htmlFor="res-title" className="form-label fw-medium">
          {t("pages:learning.material.name")}
        </label>
        <input
          id="res-title"
          className="form-control"
          dir="auto"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      {tab === "images" ? (
        <UrlImageField
          id="res-image"
          label={t("pages:learning.material.imageUrl")}
          hint={t("pages:learning.material.imageHint")}
          value={url}
          onChange={setUrl}
        />
      ) : (
        <div>
          <label htmlFor="res-url" className="form-label fw-medium">
            {t("pages:learning.material.url")}
          </label>
          <input
            id="res-url"
            type="url"
            dir="ltr"
            className="form-control"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
      )}

      <div className="focus-field-row">
        <div>
          <label htmlFor="res-new-level" className="form-label fw-medium">
            {t("pages:learning.level")}
          </label>
          <select
            id="res-new-level"
            className="form-select"
            value={level}
            onChange={(event) => setLevel(event.target.value as LearningLevel | "")}
          >
            <option value="">{t("pages:learning.levels.general")}</option>
            {LEARNING_LEVELS.map((option) => (
              <option key={option} value={option}>
                {t(`pages:learning.levels.${option}`)}
              </option>
            ))}
          </select>
        </div>

        {tab === "videos" && (
          <div>
            <label htmlFor="res-source" className="form-label fw-medium">
              {t("common:fields.source")}
            </label>
            <select
              id="res-source"
              className="form-select"
              value={source}
              onChange={(event) => setSource(event.target.value as SavedItemSource)}
            >
              {VIDEO_SOURCES.map((option) => (
                <option key={option} value={option}>
                  {t(`common:sources.${option}`)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="res-note" className="form-label fw-medium">
          {t("pages:learning.material.note")}
        </label>
        <input
          id="res-note"
          className="form-control"
          dir="auto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="focus-resource-form__actions">
        <Button
          variant="outline-secondary"
          size="sm"
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          {t("common:actions.cancel")}
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={!title.trim()}>
          {t("common:actions.save")}
        </Button>
      </div>
    </form>
  );
}
