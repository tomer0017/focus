import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { normaliseUrl } from "../../lib/links";
import { tripId } from "../../lib/trips";
import type { TripDestination, TripFlight, TripStay } from "../../types";

export type BookingDraft =
  | { type: "flight"; flight: TripFlight }
  | { type: "stay"; stay: TripStay };

interface BookingFormModalProps {
  show: boolean;
  /** `flight` or `stay`; which fields the form shows. */
  type: "flight" | "stay";
  flight?: TripFlight;
  stay?: TripStay;
  destinations: TripDestination[];
  onClose: () => void;
  onSave: (draft: BookingDraft) => void;
}

/** `2026-08-20T18:00:00.000Z` → the two halves an `<input>` pair wants. */
function splitIso(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: "", time: "" };

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

function joinIso(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "00:00").split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0).toISOString();
}

/**
 * One flight, or one place to sleep.
 *
 * These used to be edited as two repeating lists inside the trip's own edit
 * modal — a form that grew a row every time something was booked, and which you
 * had to scroll past to reach anything else. A booking is one thing with six
 * facts, so it gets one focused dialog. Cancel genuinely discards: the drafts
 * live here and only Save reaches the repository.
 */
export function BookingFormModal({
  show,
  type,
  flight,
  stay,
  destinations,
  onClose,
  onSave,
}: BookingFormModalProps) {
  const { t } = useTranslation(["trips", "common"]);

  const [number, setNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!show) return;
    const start = splitIso(type === "flight" ? flight?.departsAt : stay?.checkIn);
    const end = splitIso(type === "flight" ? flight?.arrivesAt : stay?.checkOut);

    setNumber(flight?.number ?? "");
    setFrom(flight?.from ?? "");
    setTo(flight?.to ?? "");
    setName(stay?.name ?? "");
    setDestinationId(stay?.destinationId ?? "");
    setAddress(stay?.address ?? "");
    setStartDate(start.date);
    setStartTime(start.time);
    setEndDate(end.date);
    setEndTime(end.time);
    setConfirmation((type === "flight" ? flight?.confirmation : stay?.confirmation) ?? "");
    setUrl((type === "flight" ? flight?.url : stay?.url) ?? "");
    setNote((type === "flight" ? flight?.note : stay?.note) ?? "");
  }, [show, type, flight, stay]);

  const title =
    type === "flight"
      ? flight
        ? t("trips:bookings.editFlight")
        : t("trips:edit.addFlight")
      : stay
        ? t("trips:bookings.editStay")
        : t("trips:edit.addStay");

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (type === "flight") {
            onSave({
              type: "flight",
              flight: {
                id: flight?.id ?? tripId("flight"),
                number: number.trim() || undefined,
                from: from.trim() || undefined,
                to: to.trim() || undefined,
                departsAt: joinIso(startDate, startTime),
                arrivesAt: joinIso(endDate, endTime),
                confirmation: confirmation.trim() || undefined,
                url: normaliseUrl(url),
                note: note.trim() || undefined,
              },
            });
          } else {
            const trimmed = name.trim();
            if (!trimmed) return;
            onSave({
              type: "stay",
              stay: {
                id: stay?.id ?? tripId("stay"),
                name: trimmed,
                destinationId: destinationId || undefined,
                address: address.trim() || undefined,
                checkIn: joinIso(startDate, startTime),
                checkOut: joinIso(endDate, endTime),
                confirmation: confirmation.trim() || undefined,
                url: normaliseUrl(url),
                note: note.trim() || undefined,
              },
            });
          }
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {title}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-row">
            {type === "flight" ? (
              <>
                <div>
                  <label htmlFor="booking-number" className="form-label fw-medium">
                    {t("trips:edit.flightNumber")}
                  </label>
                  <input
                    id="booking-number"
                    className="form-control"
                    dir="ltr"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="booking-from" className="form-label fw-medium">
                    {t("trips:edit.from")}
                  </label>
                  <input
                    id="booking-from"
                    className="form-control"
                    dir="ltr"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="booking-to" className="form-label fw-medium">
                    {t("trips:edit.to")}
                  </label>
                  <input
                    id="booking-to"
                    className="form-control"
                    dir="ltr"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="booking-name" className="form-label fw-medium">
                    {t("trips:edit.stayName")}
                  </label>
                  <input
                    id="booking-name"
                    className="form-control"
                    dir="auto"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                {destinations.length > 0 && (
                  <div>
                    <label htmlFor="booking-destination" className="form-label fw-medium">
                      {t("trips:outfits.destination")}
                    </label>
                    <select
                      id="booking-destination"
                      className="form-select"
                      value={destinationId}
                      onChange={(event) => setDestinationId(event.target.value)}
                    >
                      <option value="">{t("trips:outfits.anyDestination")}</option>
                      {destinations.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="booking-address" className="form-label fw-medium">
                    {t("trips:edit.address")}
                  </label>
                  <input
                    id="booking-address"
                    className="form-control"
                    dir="auto"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="booking-start-date" className="form-label fw-medium">
                {type === "flight" ? t("trips:departs") : t("trips:checkIn")}
              </label>
              <input
                id="booking-start-date"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="booking-start-time" className="form-label fw-medium">
                {t("trips:bookings.time")}
              </label>
              <input
                id="booking-start-time"
                type="time"
                className="form-control"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="booking-end-date" className="form-label fw-medium">
                {type === "flight" ? t("trips:arrives") : t("trips:checkOut")}
              </label>
              <input
                id="booking-end-date"
                type="date"
                className="form-control"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="booking-end-time" className="form-label fw-medium">
                {t("trips:bookings.time")}
              </label>
              <input
                id="booking-end-time"
                type="time"
                className="form-control"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="booking-confirmation" className="form-label fw-medium">
                {t("trips:confirmation")}
              </label>
              <input
                id="booking-confirmation"
                className="form-control"
                dir="ltr"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="booking-url" className="form-label fw-medium">
              {t("trips:openBooking")}
            </label>
            <input
              id="booking-url"
              type="url"
              className="form-control"
              dir="ltr"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>

          <div className="mt-3">
            <label htmlFor="booking-note" className="form-label fw-medium">
              {t("trips:edit.note")}
            </label>
            <textarea
              id="booking-note"
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
