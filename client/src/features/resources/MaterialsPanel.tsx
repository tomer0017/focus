import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { BoardImage } from "../../components/ui/BoardImage";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { SearchField } from "../../components/ui/SearchField";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { isExternalUrl, normaliseUrl } from "../../lib/links";
import { THUMB_FOR_KIND, savedItemId } from "../../lib/savedItems";
import {
  MATERIAL_KINDS,
  countByShelf,
  filterMaterials,
  isGridShelf,
  pageSizeFor,
  paginate,
  sortMaterials,
  type MaterialFilter,
  type MaterialKind,
} from "../../lib/projectMaterials";
import { usePages } from "../../state/pagesContext";
import type { SavedItem, SavedItemSource } from "../../types";

const VIDEO_SOURCES: SavedItemSource[] = ["youtube", "tiktok", "instagram", "web"];

/** Which saved-item kind each add-form produces. */
const KIND_FOR_TAB: Record<MaterialKind, SavedItem["kind"]> = {
  links: "link",
  documents: "document",
  images: "image",
  videos: "video",
};

interface MaterialsPanelProps {
  /**
   * The id new material is filed against — a project, a leisure item, a
   * training plan, a family profile.
   *
   * This is the explicit parent, written into `SavedItem.contextIds`. Nothing
   * here infers an owner from a title, a route or an id prefix.
   */
  contextId: string;
  /** Everything already attached to that context. */
  materials: SavedItem[];
  /** Shows the add form. Callers put it behind their own edit action. */
  canAdd?: boolean;

  /*
   * The view state.
   *
   * Given as props, it lives in the caller's URL — which is what lets a
   * refresh, the back button and a shared link land on the same shelf and the
   * same page. Omitted, the panel keeps it internally, which is right for a
   * panel already nested inside a tab that is itself in the URL.
   */
  filter?: MaterialFilter;
  query?: string;
  page?: number;
  onFilterChange?: (filter: MaterialFilter) => void;
  onQueryChange?: (query: string) => void;
  onPageChange?: (page: number) => void;
}

/**
 * Everything one thing holds: links, documents, pictures and videos.
 *
 * One component for four areas. Projects, leisure items, training plans and
 * family profiles all need exactly this, and it existed twice — once with a
 * filter, a search and real paging, once with an add form — which is two sets
 * of bugs and two ideas of what a broken picture looks like. This is both,
 * merged.
 *
 * These are ordinary `SavedItem`s attached through `contextIds`, the app's one
 * association mechanism. There is no `ProjectDocument`, `FamilyImage`,
 * `TrainingVideo` or `LeisureLink`, and an item attached here is the same
 * entity everywhere else it appears.
 *
 * Nothing is uploaded and nothing is fetched: a document is an address and the
 * panel says so, a video names its platform rather than inventing a thumbnail,
 * and a picture that fails to load says so rather than being replaced by
 * artwork that would look like the user's own.
 */
export function MaterialsPanel({
  contextId,
  materials,
  canAdd = false,
  filter: filterProp,
  query: queryProp,
  page: pageProp,
  onFilterChange,
  onQueryChange,
  onPageChange,
}: MaterialsPanelProps) {
  const { t } = useTranslation(["pages", "common", "resources"]);
  const { addSavedItem } = usePages();

  const [ownFilter, setOwnFilter] = useState<MaterialFilter>("all");
  const [ownQuery, setOwnQuery] = useState("");
  const [ownPage, setOwnPage] = useState(1);

  const filter = filterProp ?? ownFilter;
  const query = queryProp ?? ownQuery;
  const page = pageProp ?? ownPage;

  // Changing the shelf or the search resets the page either way: page 4 of
  // "links" means nothing once you are looking at pictures.
  const changeFilter = (next: MaterialFilter): void => {
    if (onFilterChange) onFilterChange(next);
    else {
      setOwnFilter(next);
      setOwnPage(1);
    }
  };
  const changeQuery = (next: string): void => {
    if (onQueryChange) onQueryChange(next);
    else {
      setOwnQuery(next);
      setOwnPage(1);
    }
  };
  const changePage = (next: number): void => {
    if (onPageChange) onPageChange(next);
    else setOwnPage(next);
  };

  const counts = useMemo(() => countByShelf(materials), [materials]);

  const matched = useMemo(
    () => sortMaterials(filterMaterials(materials, { filter, query: query || undefined })),
    [materials, filter, query]
  );

  const paged = useMemo(
    () => paginate(matched, page, pageSizeFor(filter)),
    [matched, page, filter]
  );

  const options: FilterOption<MaterialFilter>[] = [
    { value: "all", label: t("pages:materials.all"), count: materials.length },
    ...MATERIAL_KINDS.map((kind) => ({
      value: kind as MaterialFilter,
      label: t(`resources:${kind}`),
      count: counts[kind],
    })).filter((option) => option.count > 0),
  ];

  /* Nothing saved and nothing to add with: one quiet line, not a panel. */
  if (materials.length === 0 && !canAdd) {
    return <EmptyState title={t("pages:materials.empty")} hint={t("pages:materials.emptyHint")} />;
  }

  /** Which shelf the add form files into. "All" defaults to a link. */
  const addTab: MaterialKind = filter === "all" ? "links" : filter;

  return (
    <>
      {materials.length > 0 && (
        <div className="focus-collection__toolbar">
          {options.length > 1 && (
            <FilterChips
              label={t("pages:materials.filterLabel")}
              options={options}
              value={filter}
              onChange={changeFilter}
            />
          )}
          <SearchField
            label={t("pages:materials.search")}
            value={query}
            onChange={changeQuery}
            resultCount={query ? matched.length : undefined}
          />
        </div>
      )}

      {/* Said once, on the shelf it applies to — not under every document. */}
      {filter === "documents" && (
        <div className="mb-2">
          <InfoNote>{t("resources:documentsNote")}</InfoNote>
        </div>
      )}

      {materials.length === 0 ? (
        <p className="focus-dash-empty">{t("pages:materials.empty")}</p>
      ) : paged.items.length === 0 ? (
        <p className="focus-dash-empty">{t("pages:materials.noMatches")}</p>
      ) : isGridShelf(filter) ? (
        <ul className="focus-gallery list-unstyled mb-0">
          {paged.items.map((item) => (
            <li key={item.id} className="focus-gallery__item">
              <MaterialTile item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <CompactList>
          {paged.items.map((item) => (
            <li key={item.id}>
              <CompactRow
                title={item.title}
                detail={item.note}
                eyebrow={t(`pages:saved.sources.${item.source}`)}
                leading={<Thumbnail imageUrl={item.url} thumb={item.thumb} size="sm" />}
                meta={
                  isExternalUrl(item.url) ? (
                    <ExternalLink href={item.url!}>{t("resources:open")}</ExternalLink>
                  ) : (
                    <span className="focus-chip focus-chip--muted">{t("resources:noLink")}</span>
                  )
                }
              />
            </li>
          ))}
        </CompactList>
      )}

      {paged.pageCount > 1 && (
        <nav className="focus-pager" aria-label={t("pages:materials.pagination")}>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={paged.page <= 1}
            onClick={() => changePage(paged.page - 1)}
          >
            <Icon name="arrowBack" size={14} flipForRtl />
            {t("pages:materials.previous")}
          </button>
          <span className="focus-pager__count">
            {t("pages:materials.pageOf", { page: paged.page, total: paged.pageCount })}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={paged.page >= paged.pageCount}
            onClick={() => changePage(paged.page + 1)}
          >
            {t("pages:materials.next")}
            <Icon name="arrowForward" size={14} flipForRtl />
          </button>
        </nav>
      )}

      {canAdd && <AddMaterial tab={addTab} contextId={contextId} onAdd={addSavedItem} />}
    </>
  );
}

/**
 * A picture or a video, as a tile.
 *
 * A video gets no invented thumbnail — where there is no picture, the tile
 * names the platform instead, which is honest and is also what somebody
 * recognises it by.
 */
function MaterialTile({ item }: { item: SavedItem }) {
  const { t } = useTranslation(["pages", "resources"]);

  const body =
    item.kind === "video" ? (
      <span className="focus-video-tile">
        <Icon name="external" size={18} />
        <span>{t(`pages:saved.sources.${item.source}`)}</span>
      </span>
    ) : (
      <BoardImage className="focus-gallery__image" imageUrl={item.url} thumb={item.thumb} alt="" />
    );

  return (
    <figure className="mb-0">
      {isExternalUrl(item.url) ? (
        <ExternalLink href={item.url!} className="focus-gallery__open">
          {body}
        </ExternalLink>
      ) : (
        body
      )}
      <figcaption className="focus-clamp-1" dir="auto">
        {item.title}
      </figcaption>
    </figure>
  );
}

/**
 * Add one address to this item.
 *
 * The form asks for the tab's own shape: a picture previews before it is kept,
 * a video is told where it came from, and a document says plainly that only its
 * address is stored. Nothing is read from the URL — a real fetch would need a
 * server and a cross-origin proxy, neither of which exists.
 */
function AddMaterial({
  tab,
  contextId,
  onAdd,
}: {
  tab: MaterialKind;
  contextId: string;
  onAdd: (entry: SavedItem) => void;
}) {
  const { t } = useTranslation(["resources", "pages", "common"]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [source, setSource] = useState<SavedItemSource>("youtube");

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const kind = KIND_FOR_TAB[tab];
    onAdd({
      id: savedItemId(),
      kind,
      title: trimmed,
      note: note.trim() || undefined,
      // A placeholder never becomes a destination — see lib/links.ts.
      url: normaliseUrl(url),
      source: tab === "videos" ? source : "web",
      spaceId: "personal",
      thumb: THUMB_FOR_KIND[kind],
      // The explicit parent. Nothing here is matched by title or by id prefix.
      contextIds: [contextId],
      savedAt: new Date().toISOString(),
    });

    setTitle("");
    setUrl("");
    setNote("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <Icon name="plus" size={15} /> {t(`resources:add.${tab}`)}
      </Button>
    );
  }

  return (
    <form className="focus-resource-form mt-3" onSubmit={submit}>
      <div>
        <label htmlFor="res-panel-title" className="form-label fw-medium">
          {t("resources:name")}
        </label>
        <input
          id="res-panel-title"
          className="form-control"
          dir="auto"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      {tab === "images" ? (
        <UrlImageField
          id="res-panel-image"
          label={t("resources:imageUrl")}
          value={url}
          onChange={setUrl}
        />
      ) : (
        <div>
          <label htmlFor="res-panel-url" className="form-label fw-medium">
            {t("resources:url")}
          </label>
          <input
            id="res-panel-url"
            type="url"
            dir="ltr"
            className="form-control"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
      )}

      {tab === "videos" && (
        <div>
          <label htmlFor="res-panel-source" className="form-label fw-medium">
            {t("resources:source")}
          </label>
          <select
            id="res-panel-source"
            className="form-select"
            value={source}
            onChange={(event) => setSource(event.target.value as SavedItemSource)}
          >
            {VIDEO_SOURCES.map((value) => (
              <option key={value} value={value}>
                {t(`pages:saved.sources.${value}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="res-panel-note" className="form-label fw-medium">
          {t("resources:note")}
        </label>
        <input
          id="res-panel-note"
          className="form-control"
          dir="auto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      {tab === "documents" && (
        <p className="form-text mb-0">{t("resources:documentsNote")}</p>
      )}

      <div className="d-flex gap-2">
        <Button type="submit" size="sm" variant="primary">
          {t("common:actions.add")}
        </Button>
        <Button type="button" size="sm" variant="outline-secondary" onClick={() => setOpen(false)}>
          {t("common:actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
