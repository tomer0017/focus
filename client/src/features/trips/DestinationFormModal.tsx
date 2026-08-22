import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { normaliseUrl } from "../../lib/links";
import { tripId } from "../../lib/trips";
import type { TripDestination, TripStay } from "../../types";

export interface DestinationDraft {
  destination: TripDestination;
  stay: TripStay | null;
}

interface DestinationFormModalProps {
  show: boolean;
  /** Present when editing; absent when adding. */
  destination?: TripDestination;
  stay?: TripStay;
  onClose: () => void;
  onSave: (draft: DestinationDraft) => void;
}

function dateOnly(iso?: string): string {
  if (!iso) return "";
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function atNoon(date: string): string | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0).toISOString();
}

/**
 * A city, and where you are sleeping in it.
 *
 * The stay is edited here rather than in a separate form because that is how
 * people think about it — "Kyoto, four nights, the ryokan near Gion" is one
 * decision. It is still stored on the trip's `stays` array, linked by
 * `destinationId`, so the travel summary keeps working unchanged.
 */
export function DestinationFormModal({
  show,
  destination,
  stay,
  onClose,
  onSave,
}: DestinationFormModalProps) {
  const { t } = useTranslation(["trips", "common"]);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [arriveOn, setArriveOn] = useState("");
  const [leaveOn, setLeaveOn] = useState("");
  const [goodToKnow, setGoodToKnow] = useState("");
  const [clothing, setClothing] = useState("");
  const [stayName, setStayName] = useState("");
  const [stayAddress, setStayAddress] = useState("");
  const [stayUrl, setStayUrl] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    if (!show) return;
    setName(destination?.name ?? "");
    setCountry(destination?.country ?? "");
    setImageUrl(destination?.imageUrl ?? "");
    setArriveOn(destination?.arriveOn ?? "");
    setLeaveOn(destination?.leaveOn ?? "");
    setGoodToKnow((destination?.goodToKnow ?? []).join("\n"));
    setClothing(destination?.clothing ?? "");
    setStayName(stay?.name ?? "");
    setStayAddress(stay?.address ?? "");
    setStayUrl(stay?.url ?? "");
    setCheckIn(dateOnly(stay?.checkIn));
    setCheckOut(dateOnly(stay?.checkOut));
  }, [show, destination, stay]);

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;

          const id = destination?.id ?? tripId("destination");
          const hasStay = stayName.trim().length > 0;

          onSave({
            destination: {
              ...(destination ?? { id, goodToKnow: [], savedItemIds: [] }),
              id,
              name: trimmed,
              country: country.trim() || undefined,
              imageUrl: normaliseUrl(imageUrl),
              arriveOn: arriveOn || undefined,
              leaveOn: leaveOn || undefined,
              clothing: clothing.trim() || undefined,
              goodToKnow: goodToKnow.split("\n").filter((line) => line.trim()),
            },
            stay: hasStay
              ? {
                  ...(stay ?? { id: tripId("stay"), name: "" }),
                  name: stayName.trim(),
                  destinationId: id,
                  address: stayAddress.trim() || undefined,
                  url: normaliseUrl(stayUrl),
                  checkIn: atNoon(checkIn),
                  checkOut: atNoon(checkOut),
                }
              : null,
          });
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {destination ? t("trips:edit.editDestination") : t("trips:edit.addDestination")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-row">
            <div>
              <label htmlFor="dest-name" className="form-label fw-medium">
                {t("trips:edit.city")}
              </label>
              <input
                id="dest-name"
                className="form-control"
                dir="auto"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-country" className="form-label fw-medium">
                {t("trips:edit.country")}
              </label>
              <input
                id="dest-country"
                className="form-control"
                dir="auto"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-arrive" className="form-label fw-medium">
                {t("trips:edit.arriveOn")}
              </label>
              <input
                id="dest-arrive"
                type="date"
                className="form-control"
                value={arriveOn}
                onChange={(event) => setArriveOn(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-leave" className="form-label fw-medium">
                {t("trips:edit.leaveOn")}
              </label>
              <input
                id="dest-leave"
                type="date"
                className="form-control"
                value={leaveOn}
                onChange={(event) => setLeaveOn(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <UrlImageField
              id="dest-image"
              label={t("trips:edit.destinationImage")}
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>

          <div className="mt-3">
            <label htmlFor="dest-gtk" className="form-label fw-medium">
              {t("trips:goodToKnow")}
            </label>
            <textarea
              id="dest-gtk"
              className="form-control"
              rows={3}
              dir="auto"
              placeholder={t("trips:goodToKnowEdit")}
              value={goodToKnow}
              onChange={(event) => setGoodToKnow(event.target.value)}
            />
          </div>

          <div className="mt-3">
            <label htmlFor="dest-clothing" className="form-label fw-medium">
              {t("trips:clothing")}
            </label>
            <textarea
              id="dest-clothing"
              className="form-control"
              rows={2}
              dir="auto"
              value={clothing}
              onChange={(event) => setClothing(event.target.value)}
            />
          </div>

          <hr className="my-4" />
          <h3 className="h6">{t("trips:edit.stay")}</h3>

          <div className="focus-form-row">
            <div>
              <label htmlFor="dest-stay-name" className="form-label fw-medium">
                {t("trips:edit.stayName")}
              </label>
              <input
                id="dest-stay-name"
                className="form-control"
                dir="auto"
                value={stayName}
                onChange={(event) => setStayName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-stay-address" className="form-label fw-medium">
                {t("trips:edit.address")}
              </label>
              <input
                id="dest-stay-address"
                className="form-control"
                dir="auto"
                value={stayAddress}
                onChange={(event) => setStayAddress(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-check-in" className="form-label fw-medium">
                {t("trips:checkIn")}
              </label>
              <input
                id="dest-check-in"
                type="date"
                className="form-control"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dest-check-out" className="form-label fw-medium">
                {t("trips:checkOut")}
              </label>
              <input
                id="dest-check-out"
                type="date"
                className="form-control"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="dest-stay-url" className="form-label fw-medium">
              {t("trips:openBooking")}
            </label>
            <input
              id="dest-stay-url"
              type="url"
              className="form-control"
              dir="ltr"
              placeholder="https://"
              value={stayUrl}
              onChange={(event) => setStayUrl(event.target.value)}
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
