import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { addDaysToKey, todayKey } from "../../lib/dateKey";
import type { TripKind } from "../../types";
import type { NewTripDraft } from "../../state/tripsContext";

const KINDS: TripKind[] = ["abroad", "hotel", "weekend", "outdoors"];

interface NewTripModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (draft: NewTripDraft) => void;
}

/**
 * Five fields, and then you are in the trip.
 *
 * Not the trip's whole edit form. Flights, destinations, days, looks and lists
 * are things you find out over weeks, and a dialog that asked for them at the
 * moment of "we're going to Greece in May" is a dialog people abandon. The kind
 * of trip is asked here and only here, because it decides what the screen leads
 * with — and it is the one thing the app genuinely cannot work out on its own.
 */
export function NewTripModal({ show, onClose, onCreate }: NewTripModalProps) {
  const { t } = useTranslation(["trips", "common"]);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TripKind>("abroad");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!show) return;
    const start = addDaysToKey(todayKey(), 30);
    setTitle("");
    setKind("abroad");
    setDestination("");
    setStartDate(start);
    setEndDate(addDaysToKey(start, 4));
  }, [show]);

  /* An end before a start is the one thing this form can meaningfully refuse. */
  const invalidRange = Boolean(startDate && endDate && endDate < startDate);
  const canSave = title.trim().length > 0 && Boolean(startDate) && Boolean(endDate) && !invalidRange;

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          onCreate({ title, kind, destination, startDate, endDate });
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {t("trips:newTrip")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="new-trip-title" className="form-label fw-medium">
              {t("trips:edit.name")}
            </label>
            <input
              id="new-trip-title"
              className="form-control"
              dir="auto"
              required
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <fieldset className="mb-3">
            <legend className="form-label fw-medium">{t("trips:kind")}</legend>
            <div className="focus-kind-choices">
              {KINDS.map((value) => (
                <label key={value} className={`focus-kind-choice${kind === value ? " is-active" : ""}`}>
                  <input
                    type="radio"
                    name="new-trip-kind"
                    className="visually-hidden"
                    value={value}
                    checked={kind === value}
                    onChange={() => setKind(value)}
                  />
                  <span className="focus-kind-choice__name">{t(`trips:kinds.${value}`)}</span>
                  <span className="focus-kind-choice__hint">{t(`trips:kindHints.${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="focus-form-row">
            <div>
              <label htmlFor="new-trip-destination" className="form-label fw-medium">
                {t("trips:edit.destinationPlace")}
              </label>
              <input
                id="new-trip-destination"
                className="form-control"
                dir="auto"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="new-trip-start" className="form-label fw-medium">
                {t("trips:edit.startDate")}
              </label>
              <input
                id="new-trip-start"
                type="date"
                className="form-control"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="new-trip-end" className="form-label fw-medium">
                {t("trips:edit.endDate")}
              </label>
              <input
                id="new-trip-end"
                type="date"
                className="form-control"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                aria-describedby={invalidRange ? "new-trip-range-error" : undefined}
              />
            </div>
          </div>

          {invalidRange && (
            <p id="new-trip-range-error" className="text-danger small mt-2 mb-0">
              {t("trips:edit.endBeforeStart")}
            </p>
          )}

          <p className="form-text mt-3 mb-0">{t("trips:newTripHint")}</p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {t("trips:newTrip")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
