import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePages } from "../../state/pagesContext";
import { SPACES } from "../../mocks/spaces";
import { normaliseUrl } from "../../lib/links";
import type { SavedItem, SavedItemKind, SavedItemSource, SpaceId, ThumbKey } from "../../types";

const KINDS: SavedItemKind[] = [
  "link",
  "video",
  "image",
  "recipe",
  "product",
  "document",
  "note",
  "inspiration",
  "location",
];

const SOURCES: SavedItemSource[] = [
  "web",
  "youtube",
  "tiktok",
  "instagram",
  "pinterest",
  "maps",
  "store",
  "file",
  "own",
];

/** Artwork stands in for a preview image, chosen by what kind of thing it is. */
const THUMB_FOR_KIND: Record<SavedItemKind, ThumbKey> = {
  link: "city",
  video: "camera",
  image: "camera",
  recipe: "salad",
  product: "sideboard",
  document: "document",
  note: "notebook",
  inspiration: "plant",
  location: "mountain",
};

interface QuickSaveModalProps {
  show: boolean;
  onClose: () => void;
}

/**
 * Quick save: drop something in now, sort it out later.
 *
 * No metadata is fetched from the pasted URL — the kind, source and note the
 * user picks are what make the item findable again, and a real fetch would
 * need a server and a cross-origin proxy neither of which exists yet.
 */
export function QuickSaveModal({ show, onClose }: QuickSaveModalProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { addSavedItem } = usePages();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [kind, setKind] = useState<SavedItemKind>("link");
  const [source, setSource] = useState<SavedItemSource>("web");
  const [spaceId, setSpaceId] = useState<SpaceId>("personal");

  // A fresh form every time it opens; a half-filled leftover is never wanted.
  useEffect(() => {
    if (!show) return;
    setTitle("");
    setUrl("");
    setNote("");
    setCategory("");
    setKind("link");
    setSource("web");
    setSpaceId("personal");
  }, [show]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const item: SavedItem = {
      id: `saved-${Date.now().toString(36)}`,
      kind,
      title: trimmed,
      note: note.trim() || undefined,
      category: category.trim() || undefined,
      source,
      // A placeholder never becomes a destination; the card shows a preview.
      url: normaliseUrl(url),
      spaceId,
      thumb: THUMB_FOR_KIND[kind],
      contextIds: [],
      savedAt: new Date().toISOString(),
    };
    addSavedItem(item);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {t("pages:quickSave.title")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="qs-title" className="form-label fw-medium">
              {t("pages:quickSave.name")}
            </label>
            <input
              id="qs-title"
              className="form-control"
              value={title}
              dir="auto"
              required
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="qs-url" className="form-label fw-medium">
              {t("pages:quickSave.url")}
            </label>
            <input
              id="qs-url"
              type="url"
              className="form-control"
              value={url}
              dir="ltr"
              placeholder="https://"
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="qs-kind" className="form-label fw-medium">
                {t("pages:quickSave.kind")}
              </label>
              <select
                id="qs-kind"
                className="form-select"
                value={kind}
                onChange={(event) => setKind(event.target.value as SavedItemKind)}
              >
                {KINDS.map((value) => (
                  <option key={value} value={value}>
                    {t(`common:savedKinds.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qs-source" className="form-label fw-medium">
                {t("common:fields.source")}
              </label>
              <select
                id="qs-source"
                className="form-select"
                value={source}
                onChange={(event) => setSource(event.target.value as SavedItemSource)}
              >
                {SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {t(`common:sources.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qs-space" className="form-label fw-medium">
                {t("pages:quickSave.space")}
              </label>
              <select
                id="qs-space"
                className="form-select"
                value={spaceId}
                onChange={(event) => setSpaceId(event.target.value as SpaceId)}
              >
                {SPACES.map((space) => (
                  <option key={space.id} value={space.id}>
                    {t(`common:spaces.${space.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qs-category" className="form-label fw-medium">
                {t("pages:quickSave.category")}
              </label>
              <input
                id="qs-category"
                className="form-control"
                value={category}
                dir="auto"
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="qs-note" className="form-label fw-medium">
              {t("pages:quickSave.note")}
            </label>
            <textarea
              id="qs-note"
              className="form-control"
              rows={2}
              value={note}
              dir="auto"
              onChange={(event) => setNote(event.target.value)}
            />
            <p className="form-text mb-0">{t("pages:quickSave.noteHint")}</p>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {t("common:actions.save")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
