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
import type { SavedItem, SavedItemKind, SavedItemSource } from "../../types";

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

interface ResourcePanelsProps {
  /**
   * The id new material is filed against — a leisure item, a training plan.
   *
   * This is the explicit parent, written into `SavedItem.contextIds`. Nothing
   * here infers an owner from a title, a route or an id prefix.
   */
  contextId: string;
  /** Everything already attached to that context. */
  materials: SavedItem[];
  /** Adding is behind the caller's one edit action. */
  isEditing: boolean;
}

/**
 * Links, documents, pictures and videos, for anything that can hold them.
 *
 * One component, two callers: a leisure item and a training plan both need
 * exactly this, and building it twice would have been two sets of bugs and two
 * ideas of what a broken picture looks like.
 *
 * These are ordinary `SavedItem`s — the same model learning pages, trips and
 * quick save all use — attached through `contextIds`, the app's one association
 * mechanism. There is no `TrainingDocument`, no `LeisureLink` and no second
 * media model, and an item attached here is the same entity everywhere else it
 * appears.
 *
 * Nothing is uploaded and nothing is fetched. A document is an address, a video
 * is an address with a platform label the user chose, and a picture that fails
 * to load says so rather than being replaced with artwork that would look like
 * the user's own.
 */
export function ResourcePanels({ contextId, materials, isEditing }: ResourcePanelsProps) {
  const { t } = useTranslation(["resources", "pages", "common"]);
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
    label: t(`resources:${name}`),
    badge: byTab[name].length > 0 ? String(byTab[name].length) : undefined,
  }));

  const shown = byTab[tab];

  return (
    <>
      <SegmentedNav
        label={t("resources:label")}
        items={tabs}
        value={tab}
        onChange={(id) => setTab(id as MaterialTab)}
        variant="pills"
      />

      <div className="mt-3">
        {shown.length === 0 ? (
          <EmptyState title={t(`resources:empty.${tab}`)} />
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
                      <ExternalLink href={entry.url}>{t("resources:open")}</ExternalLink>
                    ) : (
                      <span className="focus-chip focus-chip--muted">
                        {t("resources:noLink")}
                      </span>
                    )
                  }
                />
              </li>
            ))}
          </CompactList>
        )}

        {isEditing && <AddMaterial tab={tab} contextId={contextId} onAdd={addSavedItem} />}
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
