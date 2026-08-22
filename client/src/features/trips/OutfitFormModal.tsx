import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Icon } from "../../components/ui/Icon";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { normaliseUrl } from "../../lib/links";
import { tripId } from "../../lib/trips";
import { formatDayKey } from "../../lib/format";
import { useLocale } from "../../i18n/useLocale";
import type {
  OutfitClothingItem,
  OutfitOccasion,
  SavedItem,
  Trip,
  TripOutfit,
} from "../../types";

const OCCASIONS: OutfitOccasion[] = [
  "flight",
  "day",
  "evening",
  "restaurant",
  "beach",
  "walking",
  "custom",
];

interface OutfitFormModalProps {
  show: boolean;
  trip: Trip;
  outfit?: TripOutfit;
  savedItems: SavedItem[];
  onClose: () => void;
  onSave: (outfit: TripOutfit) => void;
}

/**
 * Create or edit a look.
 *
 * Three ways to give it a picture — an image address, something already saved
 * for this trip, or a Pinterest page that has no picture at all — because that
 * is how people actually collect outfit references. Nothing is fetched and
 * nothing is uploaded.
 */
export function OutfitFormModal({
  show,
  trip,
  outfit,
  savedItems,
  onClose,
  onSave,
}: OutfitFormModalProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [savedItemId, setSavedItemId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [occasion, setOccasion] = useState<OutfitOccasion>("day");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TripOutfit["status"]>("idea");
  const [dayIds, setDayIds] = useState<string[]>([]);
  const [items, setItems] = useState<OutfitClothingItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (!show) return;
    setTitle(outfit?.title ?? "");
    setImageUrl(outfit?.imageUrl ?? "");
    setPinterestUrl(outfit?.pinterestUrl ?? "");
    setSavedItemId(outfit?.savedItemId ?? "");
    setDestinationId(outfit?.destinationId ?? "");
    setOccasion(outfit?.occasion ?? "day");
    setNote(outfit?.note ?? "");
    setStatus(outfit?.status ?? "idea");
    setDayIds(outfit?.dayIds ?? []);
    setItems((outfit?.clothingItems ?? []).map((item) => ({ ...item })));
    setNewItem("");
  }, [show, outfit]);

  const days = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  const visibleDays = destinationId
    ? days.filter((day) => day.destinationId === destinationId)
    : days;

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            id: outfit?.id ?? tripId("outfit"),
            order: outfit?.order ?? trip.outfits.length,
            title: title.trim() || undefined,
            imageUrl: normaliseUrl(imageUrl),
            pinterestUrl: normaliseUrl(pinterestUrl),
            savedItemId: savedItemId || undefined,
            destinationId: destinationId || undefined,
            occasion,
            note: note.trim() || undefined,
            status,
            dayIds,
            clothingItems: items.filter((item) => item.name.trim()),
          });
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {outfit ? t("trips:outfits.edit") : t("trips:outfits.create")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="outfit-title" className="form-label fw-medium">
              {t("trips:outfits.name")}
            </label>
            <input
              id="outfit-title"
              className="form-control"
              dir="auto"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="outfit-destination" className="form-label fw-medium">
                {t("trips:outfits.destination")}
              </label>
              <select
                id="outfit-destination"
                className="form-select"
                value={destinationId}
                onChange={(event) => setDestinationId(event.target.value)}
              >
                <option value="">{t("trips:outfits.anyDestination")}</option>
                {trip.destinations.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="outfit-occasion" className="form-label fw-medium">
                {t("trips:outfits.occasion")}
              </label>
              <select
                id="outfit-occasion"
                className="form-select"
                value={occasion}
                onChange={(event) => setOccasion(event.target.value as OutfitOccasion)}
              >
                {OCCASIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`trips:outfits.occasions.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="outfit-status" className="form-label fw-medium">
                {t("trips:outfits.status")}
              </label>
              <select
                id="outfit-status"
                className="form-select"
                value={status}
                onChange={(event) => setStatus(event.target.value as TripOutfit["status"])}
              >
                <option value="idea">{t("trips:outfits.statuses.idea")}</option>
                <option value="selected">{t("trips:outfits.statuses.selected")}</option>
              </select>
            </div>
          </div>

          <fieldset className="mt-3">
            <legend className="form-label fw-medium">{t("trips:outfits.days")}</legend>
            <div className="focus-day-picker">
              {visibleDays.map((day) => (
                <label key={day.id} className="focus-day-picker__option">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={dayIds.includes(day.id)}
                    onChange={() =>
                      setDayIds((current) =>
                        current.includes(day.id)
                          ? current.filter((value) => value !== day.id)
                          : [...current, day.id]
                      )
                    }
                  />
                  <span>{formatDayKey(day.date, locale)}</span>
                </label>
              ))}
              {visibleDays.length === 0 && (
                <p className="text-secondary small mb-0">{t("trips:edit.noDays")}</p>
              )}
            </div>
          </fieldset>

          <hr className="my-4" />
          <h3 className="h6">{t("trips:outfits.picture")}</h3>

          <UrlImageField
            id="outfit-image"
            label={t("trips:outfits.imageUrl")}
            value={imageUrl}
            onChange={setImageUrl}
          />

          <div className="mt-3">
            <label htmlFor="outfit-pinterest" className="form-label fw-medium">
              {t("trips:outfits.pinterestUrl")}
            </label>
            <input
              id="outfit-pinterest"
              type="url"
              className="form-control"
              dir="ltr"
              placeholder="https://"
              value={pinterestUrl}
              aria-describedby="outfit-pinterest-hint"
              onChange={(event) => setPinterestUrl(event.target.value)}
            />
            <p id="outfit-pinterest-hint" className="form-text mb-0">
              {t("trips:outfits.pinterestHint")}
            </p>
          </div>

          <div className="mt-3">
            <label htmlFor="outfit-saved" className="form-label fw-medium">
              {t("trips:outfits.fromSaved")}
            </label>
            <select
              id="outfit-saved"
              className="form-select"
              value={savedItemId}
              onChange={(event) => setSavedItemId(event.target.value)}
            >
              <option value="">{t("trips:outfits.noSavedItem")}</option>
              {savedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <hr className="my-4" />
          <h3 className="h6">{t("trips:outfits.clothing")}</h3>

          <ul className="list-unstyled focus-clothing-list mb-2">
            {items.map((item) => (
              <li key={item.id} className="focus-clothing-list__row">
                <input
                  className="form-control form-control-sm"
                  dir="auto"
                  aria-label={t("trips:outfits.itemName")}
                  value={item.name}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id ? { ...entry, name: event.target.value } : entry
                      )
                    )
                  }
                />
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="form-control form-control-sm focus-clothing-list__qty"
                  aria-label={t("trips:outfits.quantity")}
                  value={item.quantity ?? 1}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, quantity: Number(event.target.value) }
                          : entry
                      )
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-icon-button text-secondary"
                  onClick={() => setItems((current) => current.filter((e) => e.id !== item.id))}
                  aria-label={t("trips:outfits.removeItem", { name: item.name })}
                >
                  <Icon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>

          <div className="focus-inline-form">
            <label className="visually-hidden" htmlFor="outfit-new-item">
              {t("trips:outfits.addItem")}
            </label>
            <input
              id="outfit-new-item"
              className="form-control form-control-sm"
              dir="auto"
              list="outfit-item-options"
              placeholder={t("trips:outfits.addItem")}
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
            />
            <datalist id="outfit-item-options">
              {[
                ...new Set(
                  trip.outfits.flatMap((entry) => entry.clothingItems.map((item) => item.name))
                ),
              ].map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <Button
              type="button"
              size="sm"
              variant="outline-primary"
              onClick={() => {
                const value = newItem.trim();
                if (!value) return;
                setItems((current) => [
                  ...current,
                  { id: tripId("clothing"), name: value, quantity: 1 },
                ]);
                setNewItem("");
              }}
            >
              {t("trips:outfits.add")}
            </Button>
          </div>

          <div className="mt-3">
            <label htmlFor="outfit-note" className="form-label fw-medium">
              {t("trips:outfits.note")}
            </label>
            <textarea
              id="outfit-note"
              className="form-control"
              rows={2}
              dir="auto"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <p className="form-text mt-3 mb-0">{t("trips:edit.saveHint")}</p>
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
