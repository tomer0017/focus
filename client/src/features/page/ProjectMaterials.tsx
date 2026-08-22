import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { SearchField } from "../../components/ui/SearchField";
import { BoardImage } from "../../components/ui/BoardImage";
import { Thumbnail } from "../../components/ui/Thumbnail";
import {
  MATERIAL_KINDS,
  countByShelf,
  filterMaterials,
  isGridShelf,
  pageSizeFor,
  paginate,
  sortMaterials,
  type MaterialFilter,
} from "../../lib/projectMaterials";
import { isExternalUrl } from "../../lib/links";
import type { SavedItem } from "../../types";

interface ProjectMaterialsProps {
  items: SavedItem[];
  filter: MaterialFilter;
  query: string;
  page: number;
  onFilterChange: (filter: MaterialFilter) => void;
  onQueryChange: (query: string) => void;
  onPageChange: (page: number) => void;
}

/**
 * Everything a project holds, on one shelf.
 *
 * This replaces two tabs — "materials" and "inspiration" — that were divided by
 * a hard-coded list of saved-item kinds. The division was the screen's idea,
 * not the user's: a photograph of the existing garden is reference *and*
 * inspiration depending on the day. What people actually look for is a kind of
 * thing — a link, a document, a picture, a video — so that is the filter.
 *
 * Links and documents read as rows; pictures and videos read as a grid. Both
 * page at a size that produces a screen of about the same length.
 */
export function ProjectMaterials({
  items,
  filter,
  query,
  page,
  onFilterChange,
  onQueryChange,
  onPageChange,
}: ProjectMaterialsProps) {
  const { t } = useTranslation(["pages", "common", "resources"]);

  const counts = useMemo(() => countByShelf(items), [items]);

  const matched = useMemo(
    () => sortMaterials(filterMaterials(items, { filter, query: query || undefined })),
    [items, filter, query]
  );

  const paged = useMemo(
    () => paginate(matched, page, pageSizeFor(filter)),
    [matched, page, filter]
  );

  const options: FilterOption<MaterialFilter>[] = [
    { value: "all", label: t("pages:materials.all"), count: items.length },
    ...MATERIAL_KINDS.map((kind) => ({
      value: kind as MaterialFilter,
      label: t(`resources:${kind}`),
      count: counts[kind],
    })).filter((option) => option.count > 0),
  ];

  if (items.length === 0) {
    return <EmptyState title={t("pages:materials.empty")} hint={t("pages:materials.emptyHint")} />;
  }

  return (
    <>
      <div className="focus-collection__toolbar">
        {options.length > 1 && (
          <FilterChips
            label={t("pages:materials.filterLabel")}
            options={options}
            value={filter}
            onChange={onFilterChange}
          />
        )}
        <SearchField
          label={t("pages:materials.search")}
          value={query}
          onChange={onQueryChange}
          resultCount={query ? matched.length : undefined}
        />
      </div>

      {/* Said once, on the shelf it applies to — not under every document. */}
      {filter === "documents" && (
        <div className="mb-2">
          <InfoNote>{t("resources:documentsNote")}</InfoNote>
        </div>
      )}

      {paged.items.length === 0 ? (
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
            onClick={() => onPageChange(paged.page - 1)}
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
            onClick={() => onPageChange(paged.page + 1)}
          >
            {t("pages:materials.next")}
            <Icon name="arrowForward" size={14} flipForRtl />
          </button>
        </nav>
      )}
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
