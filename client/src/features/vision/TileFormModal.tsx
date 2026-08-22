import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { THUMBS, THUMB_KEYS } from "../../assets/thumbs";
import { UrlImageField, type UrlImageStatus } from "../../components/ui/UrlImageField";
import { isImageUrl } from "../../lib/links";
import type { SavedItem, ThumbKey, VisionTile, VisionTileSize } from "../../types";
import type { NewVisionTile } from "../../state/visionContext";

const SIZES: VisionTileSize[] = ["small", "medium", "large"];
type PictureSource = "url" | "artwork";

interface TileFormModalProps {
  show: boolean;
  /** Present when editing an existing tile. */
  tile?: VisionTile;
  savedItems: SavedItem[];
  onClose: () => void;
  onSubmit: (tile: NewVisionTile) => void;
}

/**
 * Add or edit a tile: a picture from a URL, or from the local artwork set.
 *
 * The URL is checked and previewed before it can be saved. Only the address is
 * stored — the image is never downloaded and never encoded into local storage,
 * which is why a board with thirty pictures still fits in a few kilobytes.
 * A URL that will not load is refused here rather than becoming a broken tile.
 */
export function TileFormModal({ show, tile, savedItems, onClose, onSubmit }: TileFormModalProps) {
  const { t } = useTranslation(["vision", "common"]);

  const [source, setSource] = useState<PictureSource>("artwork");
  const [imageUrl, setImageUrl] = useState("");
  const [thumb, setThumb] = useState<ThumbKey>("sea");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState<VisionTileSize>("medium");
  const [savedItemId, setSavedItemId] = useState("");
  const [urlStatus, setUrlStatus] = useState<UrlImageStatus>("empty");

  useEffect(() => {
    if (!show) return;
    setSource(tile?.imageUrl ? "url" : "artwork");
    setImageUrl(tile?.imageUrl ?? "");
    setThumb(tile?.thumb ?? "sea");
    setCaption(tile?.caption ?? "");
    setCategory(tile?.category ?? "");
    setSize(tile?.size ?? "medium");
    setSavedItemId(tile?.savedItemId ?? "");
  }, [show, tile]);

  const pickSavedItem = (id: string): void => {
    setSavedItemId(id);
    const item = savedItems.find((entry) => entry.id === id);
    if (!item) return;
    setSource("artwork");
    setThumb(item.thumb);
    setCaption(item.title);
    if (item.category) setCategory(item.category);
  };

  const canSubmit = source === "artwork" || (isImageUrl(imageUrl) && urlStatus === "ok");

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            thumb: source === "artwork" ? thumb : undefined,
            imageUrl: source === "url" ? imageUrl.trim() : undefined,
            caption: caption.trim() || undefined,
            category: category.trim() || undefined,
            size,
            savedItemId: savedItemId || undefined,
          });
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {tile ? t("vision:editTitle") : t("vision:addTile")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <fieldset className="mb-3">
            <legend className="form-label fw-medium">{t("vision:pictureSource")}</legend>
            <div className="focus-pills" role="radiogroup" aria-label={t("vision:pictureSource")}>
              {(["artwork", "url"] as PictureSource[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={source === value}
                  className={`focus-pills__item ${source === value ? "is-active" : ""}`}
                  onClick={() => setSource(value)}
                >
                  {t(`vision:source.${value}`)}
                </button>
              ))}
            </div>
          </fieldset>

          {source === "url" ? (
            <div className="mb-3">
              <UrlImageField
                id="tile-url"
                label={t("vision:imageUrl")}
                value={imageUrl}
                onChange={setImageUrl}
                onStatusChange={setUrlStatus}
              />
            </div>
          ) : (
            <fieldset className="mb-3">
              <legend className="form-label fw-medium">{t("vision:picture")}</legend>
              <div className="focus-thumb-picker">
                {THUMB_KEYS.map((key) => (
                  <label key={key} className="focus-thumb-picker__option">
                    <input
                      type="radio"
                      name="tile-thumb"
                      className="visually-hidden"
                      checked={thumb === key}
                      onChange={() => setThumb(key)}
                    />
                    <img
                      src={THUMBS[key]}
                      alt={t(`vision:artwork.${key}`)}
                      className={thumb === key ? "is-selected" : ""}
                      width={80}
                      height={45}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mb-3">
            <label htmlFor="tile-saved" className="form-label fw-medium">
              {t("vision:fromSaved")}
            </label>
            <select
              id="tile-saved"
              className="form-select"
              value={savedItemId}
              onChange={(event) => pickSavedItem(event.target.value)}
            >
              <option value="">{t("vision:noSavedItem")}</option>
              {savedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="tile-caption" className="form-label fw-medium">
                {t("vision:caption")}
              </label>
              <input
                id="tile-caption"
                className="form-control"
                dir="auto"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tile-category" className="form-label fw-medium">
                {t("vision:category")}
              </label>
              <input
                id="tile-category"
                className="form-control"
                dir="auto"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tile-size" className="form-label fw-medium">
                {t("vision:size")}
              </label>
              <select
                id="tile-size"
                className="form-select"
                value={size}
                onChange={(event) => setSize(event.target.value as VisionTileSize)}
              >
                {SIZES.map((value) => (
                  <option key={value} value={value}>
                    {t(`vision:sizes.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {t("common:actions.save")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
