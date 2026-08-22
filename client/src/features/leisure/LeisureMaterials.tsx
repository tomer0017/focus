import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { BoardImage } from "../../components/ui/BoardImage";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Icon } from "../../components/ui/Icon";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { normaliseUrl } from "../../lib/links";
import { THUMB_FOR_KIND, savedItemId } from "../../lib/savedItems";
import { usePages } from "../../state/pagesContext";
import type { LeisureItem, SavedItem, SavedItemKind, SavedItemSource } from "../../types";

/** The four panels, and the saved-item kind each one files into. */
const TABS = ["links", "documents", "images", "videos"] as const;
type MaterialTab = (typeof TABS)[number];

const KIND_FOR_TAB: Record<MaterialTab, SavedItemKind> = {
  links: "link",
  documents: "document",
  images: "image",
  videos: "video",
};

const VIDEO_SOURCES: SavedItemSource[] = ["youtube", "tiktok", "instagram", "web"];

interface LeisureMaterialsProps {
  item: LeisureItem;
  materials: SavedItem[];
  isEditing: boolean;
}

/**
 * Links, documents, pictures and videos for one saved thing.
 *
 * These are ordinary `SavedItem`s — the same model the learning pages, the
 * trips and quick save all use — attached through `contextIds`, which is the
 * app's one association mechanism. There is no `LeisureLink`, no
 * `LeisureDocument` and no second media model, and an item attached here is
 * still the same entity everywhere else it appears.
 *
 * Nothing is uploaded and nothing is fetched. A document is an address, a video
 * is an address with a platform label the user chose, and a picture that fails
 * to load says so rather than being replaced with artwork that would look like
 * the user's own.
 */
export function LeisureMaterials({ item, materials, isEditing }: LeisureMaterialsProps) {
  const { t } = useTranslation(["leisure", "pages", "common"]);
  const { addSavedItem } = usePages();
  const [tab, setTab] = useState<MaterialTab>("links");

  const byTab = useMemo(() => {
    const groups: Record<MaterialTab, SavedItem[]> = {
      links: [],
      documents: [],
      images: [],
      videos: [],
    };
    for (const entry of materials) {
      const target = TABS.find((name) => KIND_FOR_TAB[name] === entry.kind);
      // Anything saved under another kind still belongs to the item, and the
      // links panel is where a thing with an address is findable.
      groups[target ?? "links"].push(entry);
    }
    return groups;
  }, [materials]);

  const tabs: SegmentedItem[] = TABS.map((name) => ({
    id: name,
    label: t(`leisure:materials.${name}`),
    badge: byTab[name].length > 0 ? String(byTab[name].length) : undefined,
  }));

  const shown = byTab[tab];

  return (
    <>
      <SegmentedNav
        label={t("leisure:materials.label")}
        items={tabs}
        value={tab}
        onChange={(id) => setTab(id as MaterialTab)}
        variant="pills"
      />

      <div className="mt-3">
        {shown.length === 0 ? (
          <EmptyState title={t(`leisure:materials.empty.${tab}`)} />
        ) : tab === "images" ? (
          <div className="focus-gallery">
            {shown.map((entry) => (
              <figure key={entry.id} className="focus-gallery__item">
                <BoardImage
                  className="focus-gallery__image"
                  imageUrl={entry.url}
                  thumb={entry.thumb}
                  alt={entry.title}
                />
                <figcaption dir="auto">{entry.title}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <CompactList>
            {shown.map((entry) => (
              <li key={entry.id}>
                <CompactRow
                  title={entry.title}
                  detail={entry.note}
                  eyebrow={
                    tab === "videos" ? t(`pages:saved.sources.${entry.source}`) : undefined
                  }
                  meta={
                    entry.url ? (
                      <ExternalLink href={entry.url}>{t("leisure:materials.open")}</ExternalLink>
                    ) : (
                      <span className="focus-chip focus-chip--muted">
                        {t("leisure:materials.noLink")}
                      </span>
                    )
                  }
                />
              </li>
            ))}
          </CompactList>
        )}

        {isEditing && <AddMaterial tab={tab} contextId={item.id} onAdd={addSavedItem} />}
      </div>
    </>
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
  tab: MaterialTab;
  contextId: string;
  onAdd: (entry: SavedItem) => void;
}) {
  const { t } = useTranslation(["leisure", "pages", "common"]);
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
        <Icon name="plus" size={15} /> {t(`leisure:materials.add.${tab}`)}
      </Button>
    );
  }

  return (
    <form className="focus-resource-form mt-3" onSubmit={submit}>
      <div>
        <label htmlFor="leisure-res-title" className="form-label fw-medium">
          {t("leisure:materials.name")}
        </label>
        <input
          id="leisure-res-title"
          className="form-control"
          dir="auto"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      {tab === "images" ? (
        <UrlImageField
          id="leisure-res-image"
          label={t("leisure:materials.imageUrl")}
          value={url}
          onChange={setUrl}
        />
      ) : (
        <div>
          <label htmlFor="leisure-res-url" className="form-label fw-medium">
            {t("leisure:materials.url")}
          </label>
          <input
            id="leisure-res-url"
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
          <label htmlFor="leisure-res-source" className="form-label fw-medium">
            {t("leisure:materials.source")}
          </label>
          <select
            id="leisure-res-source"
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
        <label htmlFor="leisure-res-note" className="form-label fw-medium">
          {t("leisure:materials.note")}
        </label>
        <input
          id="leisure-res-note"
          className="form-control"
          dir="auto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      {tab === "documents" && (
        <p className="form-text mb-0">{t("leisure:materials.documentsNote")}</p>
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
