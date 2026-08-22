import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Icon } from "../../components/ui/Icon";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { normaliseUrl } from "../../lib/links";
import { tripId } from "../../lib/trips";
import type { Trip, TripFlight, TripStatus, TripStay } from "../../types";

const STATUSES: TripStatus[] = ["dreaming", "booking", "planned", "travelling", "done"];

interface TripEditModalProps {
  show: boolean;
  trip: Trip;
  onClose: () => void;
  onSave: (patch: Partial<Omit<Trip, "id">>) => void;
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
 * Everything about the trip that is not a destination or a day.
 *
 * One modal rather than a dozen inline fields: these are facts you set once
 * when the flight is booked and then only re-read. Cancel closes without
 * writing — the drafts live here, and only Save calls the repository.
 */
export function TripEditModal({ show, trip, onClose, onSave }: TripEditModalProps) {
  const { t } = useTranslation(["trips", "common"]);

  const [title, setTitle] = useState("");
  const [countries, setCountries] = useState("");
  const [cover, setCover] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("planned");
  const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState("");
  const [flights, setFlights] = useState<TripFlight[]>([]);
  const [stays, setStays] = useState<TripStay[]>([]);

  useEffect(() => {
    if (!show) return;
    setTitle(trip.title);
    setCountries(trip.countries.join(", "));
    setCover(trip.coverImageUrl ?? "");
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setStatus(trip.status);
    setNextAction(trip.nextAction ?? "");
    setNotes(trip.notes ?? "");
    setFlights(trip.flights.map((flight) => ({ ...flight })));
    setStays(trip.stays.map((stay) => ({ ...stay })));
  }, [show, trip]);

  const patchFlight = (id: string, patch: Partial<TripFlight>): void =>
    setFlights((current) => current.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const patchStay = (id: string, patch: Partial<TripStay>): void =>
    setStays((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <Modal show={show} onHide={onClose} centered scrollable size="lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !startDate || !endDate) return;
          onSave({
            title: title.trim(),
            countries: countries
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            coverImageUrl: normaliseUrl(cover),
            startDate,
            endDate,
            status,
            nextAction: nextAction.trim() || undefined,
            notes: notes.trim() || undefined,
            flights: flights.map((flight) => ({ ...flight, url: normaliseUrl(flight.url) })),
            stays: stays.map((stay) => ({ ...stay, url: normaliseUrl(stay.url) })),
          });
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {t("trips:edit.title")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="trip-title" className="form-label fw-medium">
              {t("trips:edit.name")}
            </label>
            <input
              id="trip-title"
              className="form-control"
              dir="auto"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="trip-countries" className="form-label fw-medium">
                {t("trips:edit.countries")}
              </label>
              <input
                id="trip-countries"
                className="form-control"
                dir="auto"
                value={countries}
                onChange={(event) => setCountries(event.target.value)}
              />
              <p className="form-text mb-0">{t("trips:edit.countriesHint")}</p>
            </div>
            <div>
              <label htmlFor="trip-status" className="form-label fw-medium">
                {t("trips:edit.status")}
              </label>
              <select
                id="trip-status"
                className="form-select"
                value={status}
                onChange={(event) => setStatus(event.target.value as TripStatus)}
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`trips:status.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trip-start" className="form-label fw-medium">
                {t("trips:edit.startDate")}
              </label>
              <input
                id="trip-start"
                type="date"
                className="form-control"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="trip-end" className="form-label fw-medium">
                {t("trips:edit.endDate")}
              </label>
              <input
                id="trip-end"
                type="date"
                className="form-control"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="trip-next-action" className="form-label fw-medium">
              {t("common:fields.nextAction")}
            </label>
            <input
              id="trip-next-action"
              className="form-control"
              dir="auto"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
            />
          </div>

          <div className="mt-3">
            <UrlImageField
              id="trip-cover"
              label={t("trips:edit.cover")}
              hint={t("vision:imageUrlHint", { ns: "vision" })}
              value={cover}
              onChange={setCover}
            />
          </div>

          <div className="mt-3">
            <label htmlFor="trip-notes" className="form-label fw-medium">
              {t("trips:edit.note")}
            </label>
            <textarea
              id="trip-notes"
              className="form-control"
              rows={2}
              dir="auto"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <hr className="my-4" />

          <h3 className="h6">{t("trips:edit.flights")}</h3>
          {flights.map((flight) => {
            const departs = splitIso(flight.departsAt);
            const arrives = splitIso(flight.arrivesAt);
            return (
              <fieldset key={flight.id} className="focus-edit-block">
                <div className="focus-form-row">
                  <div>
                    <label className="form-label" htmlFor={`flight-number-${flight.id}`}>
                      {t("trips:edit.flightNumber")}
                    </label>
                    <input
                      id={`flight-number-${flight.id}`}
                      className="form-control form-control-sm"
                      dir="ltr"
                      value={flight.number ?? ""}
                      onChange={(event) => patchFlight(flight.id, { number: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`flight-from-${flight.id}`}>
                      {t("trips:edit.from")}
                    </label>
                    <input
                      id={`flight-from-${flight.id}`}
                      className="form-control form-control-sm"
                      dir="ltr"
                      value={flight.from ?? ""}
                      onChange={(event) => patchFlight(flight.id, { from: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`flight-to-${flight.id}`}>
                      {t("trips:edit.to")}
                    </label>
                    <input
                      id={`flight-to-${flight.id}`}
                      className="form-control form-control-sm"
                      dir="ltr"
                      value={flight.to ?? ""}
                      onChange={(event) => patchFlight(flight.id, { to: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`flight-conf-${flight.id}`}>
                      {t("trips:confirmation")}
                    </label>
                    <input
                      id={`flight-conf-${flight.id}`}
                      className="form-control form-control-sm"
                      dir="ltr"
                      value={flight.confirmation ?? ""}
                      onChange={(event) =>
                        patchFlight(flight.id, { confirmation: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`flight-dep-${flight.id}`}>
                      {t("trips:departs")}
                    </label>
                    <div className="focus-datetime">
                      <input
                        id={`flight-dep-${flight.id}`}
                        type="date"
                        className="form-control form-control-sm"
                        value={departs.date}
                        onChange={(event) =>
                          patchFlight(flight.id, {
                            departsAt: joinIso(event.target.value, departs.time),
                          })
                        }
                      />
                      <input
                        type="time"
                        className="form-control form-control-sm"
                        aria-label={t("trips:departs")}
                        value={departs.time}
                        onChange={(event) =>
                          patchFlight(flight.id, {
                            departsAt: joinIso(departs.date, event.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`flight-arr-${flight.id}`}>
                      {t("trips:arrives")}
                    </label>
                    <div className="focus-datetime">
                      <input
                        id={`flight-arr-${flight.id}`}
                        type="date"
                        className="form-control form-control-sm"
                        value={arrives.date}
                        onChange={(event) =>
                          patchFlight(flight.id, {
                            arrivesAt: joinIso(event.target.value, arrives.time),
                          })
                        }
                      />
                      <input
                        type="time"
                        className="form-control form-control-sm"
                        aria-label={t("trips:arrives")}
                        value={arrives.time}
                        onChange={(event) =>
                          patchFlight(flight.id, {
                            arrivesAt: joinIso(arrives.date, event.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="focus-edit-block__foot">
                  <input
                    className="form-control form-control-sm"
                    dir="ltr"
                    placeholder="https://"
                    aria-label={t("trips:openBooking")}
                    value={flight.url ?? ""}
                    onChange={(event) => patchFlight(flight.id, { url: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() =>
                      setFlights((current) => current.filter((f) => f.id !== flight.id))
                    }
                  >
                    <Icon name="trash" size={13} />
                    {t("trips:edit.removeFlight")}
                  </Button>
                </div>
              </fieldset>
            );
          })}
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => setFlights((current) => [...current, { id: tripId("flight") }])}
          >
            <Icon name="plus" size={14} />
            {t("trips:edit.addFlight")}
          </Button>

          <h3 className="h6 mt-4">{t("trips:edit.stays")}</h3>
          {stays.map((stay) => {
            const checkIn = splitIso(stay.checkIn);
            const checkOut = splitIso(stay.checkOut);
            return (
              <fieldset key={stay.id} className="focus-edit-block">
                <div className="focus-form-row">
                  <div>
                    <label className="form-label" htmlFor={`stay-name-${stay.id}`}>
                      {t("trips:edit.stayName")}
                    </label>
                    <input
                      id={`stay-name-${stay.id}`}
                      className="form-control form-control-sm"
                      dir="auto"
                      value={stay.name}
                      onChange={(event) => patchStay(stay.id, { name: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`stay-address-${stay.id}`}>
                      {t("trips:edit.address")}
                    </label>
                    <input
                      id={`stay-address-${stay.id}`}
                      className="form-control form-control-sm"
                      dir="auto"
                      value={stay.address ?? ""}
                      onChange={(event) => patchStay(stay.id, { address: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`stay-in-${stay.id}`}>
                      {t("trips:checkIn")}
                    </label>
                    <input
                      id={`stay-in-${stay.id}`}
                      type="date"
                      className="form-control form-control-sm"
                      value={checkIn.date}
                      onChange={(event) =>
                        patchStay(stay.id, { checkIn: joinIso(event.target.value, checkIn.time) })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`stay-out-${stay.id}`}>
                      {t("trips:checkOut")}
                    </label>
                    <input
                      id={`stay-out-${stay.id}`}
                      type="date"
                      className="form-control form-control-sm"
                      value={checkOut.date}
                      onChange={(event) =>
                        patchStay(stay.id, { checkOut: joinIso(event.target.value, checkOut.time) })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor={`stay-conf-${stay.id}`}>
                      {t("trips:confirmation")}
                    </label>
                    <input
                      id={`stay-conf-${stay.id}`}
                      className="form-control form-control-sm"
                      dir="ltr"
                      value={stay.confirmation ?? ""}
                      onChange={(event) => patchStay(stay.id, { confirmation: event.target.value })}
                    />
                  </div>
                </div>

                <div className="focus-edit-block__foot">
                  <input
                    className="form-control form-control-sm"
                    dir="ltr"
                    placeholder="https://"
                    aria-label={t("trips:openBooking")}
                    value={stay.url ?? ""}
                    onChange={(event) => patchStay(stay.id, { url: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setStays((current) => current.filter((s) => s.id !== stay.id))}
                  >
                    <Icon name="trash" size={13} />
                    {t("trips:edit.removeStay")}
                  </Button>
                </div>
              </fieldset>
            );
          })}
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() =>
              setStays((current) => [...current, { id: tripId("stay"), name: "" }])
            }
          >
            <Icon name="plus" size={14} />
            {t("trips:edit.addStay")}
          </Button>

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
