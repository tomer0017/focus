import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { useLocale } from "../../i18n/useLocale";
import { formatDateTime } from "../../lib/format";
import { isExternalUrl } from "../../lib/links";
import type { Trip, TripFlight, TripStay } from "../../types";

interface BookingsAreaProps {
  trip: Trip;
  onAdd: (type: "flight" | "stay") => void;
  onEditFlight: (flight: TripFlight) => void;
  onEditStay: (stay: TripStay) => void;
  onRemoveFlight: (flight: TripFlight) => void;
  onRemoveStay: (stay: TripStay) => void;
  /** Past trips keep their bookings as a record, and stop offering to change them. */
  readOnly?: boolean;
}

/**
 * Everything that has been booked, in one place, as rows.
 *
 * A flight is a number, a route and a time; a hotel is a name, an address and
 * two dates. Those are rows, not cards — the old screen hid them inside a
 * collapsed definition list under the summary, which meant the confirmation
 * number you need at a check-in desk was two taps and a scroll away.
 *
 * The detail everyone actually looks up — the confirmation code — is printed on
 * the row rather than behind a disclosure, and set `dir="ltr"` because a
 * booking reference is never Hebrew.
 */
export function BookingsArea({
  trip,
  onAdd,
  onEditFlight,
  onEditStay,
  onRemoveFlight,
  onRemoveStay,
  readOnly = false,
}: BookingsAreaProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();
  const [editing, setEditing] = useState(false);

  const flights = [...trip.flights].sort((a, b) =>
    (a.departsAt ?? "").localeCompare(b.departsAt ?? "")
  );
  const stays = [...trip.stays].sort((a, b) => (a.checkIn ?? "").localeCompare(b.checkIn ?? ""));

  const empty = flights.length === 0 && stays.length === 0;

  const controls = (onEdit: () => void, onRemove: () => void, label: string) =>
    editing && !readOnly ? (
      <>
        <button
          type="button"
          className="focus-icon-button border"
          onClick={onEdit}
          aria-label={t("common:actions.editNamed", { name: label })}
        >
          <Icon name="edit" size={13} />
        </button>
        <button
          type="button"
          className="focus-icon-button border"
          onClick={onRemove}
          aria-label={t("common:actions.deleteNamed", { name: label })}
        >
          <Icon name="trash" size={13} />
        </button>
      </>
    ) : undefined;

  return (
    <div className="focus-bookings">
      {!readOnly && (
        <div className="focus-bookings__bar">
          {editing && (
            <>
              <Button variant="outline-primary" size="sm" onClick={() => onAdd("flight")}>
                <Icon name="plane" size={13} />
                {t("trips:edit.addFlight")}
              </Button>
              <Button variant="outline-primary" size="sm" onClick={() => onAdd("stay")}>
                <Icon name="bed" size={13} />
                {t("trips:edit.addStay")}
              </Button>
            </>
          )}
          <Button
            variant={editing ? "primary" : "outline-secondary"}
            size="sm"
            onClick={() => setEditing((current) => !current)}
          >
            <Icon name={editing ? "check" : "edit"} size={13} />
            {editing ? t("common:actions.doneEditing") : t("common:actions.edit")}
          </Button>
        </div>
      )}

      {empty && (
        <div className="focus-trip-empty">
          <p className="mb-2">{t("trips:bookings.empty")}</p>
          {!readOnly && (
            <Button variant="primary" size="sm" onClick={() => onAdd("flight")}>
              <Icon name="plus" size={14} />
              {t("trips:edit.addFlight")}
            </Button>
          )}
        </div>
      )}

      {flights.length > 0 && (
        <CompactList>
          {flights.map((flight) => {
            const label = flight.number ?? t("trips:flight");
            return (
              <li key={flight.id}>
                <CompactRow
                  leading={<Icon name="plane" size={16} />}
                  eyebrow={t("trips:flight")}
                  title={label}
                  detail={
                    flight.from && flight.to ? `${flight.from} → ${flight.to}` : flight.note
                  }
                  badges={
                    flight.confirmation ? (
                      <span className="focus-chip focus-chip--muted" dir="ltr">
                        {flight.confirmation}
                      </span>
                    ) : undefined
                  }
                  meta={
                    <>
                      {flight.departsAt && (
                        <span className="focus-booking__time">
                          <time dateTime={flight.departsAt}>
                            {formatDateTime(flight.departsAt, locale)}
                          </time>
                        </span>
                      )}
                      {isExternalUrl(flight.url) && (
                        <ExternalLink href={flight.url}>{t("trips:openBooking")}</ExternalLink>
                      )}
                    </>
                  }
                  actions={controls(
                    () => onEditFlight(flight),
                    () => onRemoveFlight(flight),
                    label
                  )}
                />
              </li>
            );
          })}
        </CompactList>
      )}

      {stays.length > 0 && (
        <CompactList>
          {stays.map((stay) => (
            <li key={stay.id}>
              <CompactRow
                leading={<Icon name="bed" size={16} />}
                eyebrow={t("trips:bookings.stay")}
                title={stay.name}
                detail={stay.address ?? stay.note}
                badges={
                  stay.confirmation ? (
                    <span className="focus-chip focus-chip--muted" dir="ltr">
                      {stay.confirmation}
                    </span>
                  ) : undefined
                }
                meta={
                  <>
                    {stay.checkIn && (
                      <span className="focus-booking__time">
                        <time dateTime={stay.checkIn}>
                          {formatDateTime(stay.checkIn, locale)}
                        </time>
                      </span>
                    )}
                    {stay.checkOut && (
                      <span className="focus-booking__time focus-booking__time--out">
                        <time dateTime={stay.checkOut}>
                          {formatDateTime(stay.checkOut, locale)}
                        </time>
                      </span>
                    )}
                    {isExternalUrl(stay.url) && (
                      <ExternalLink href={stay.url}>{t("trips:openBooking")}</ExternalLink>
                    )}
                  </>
                }
                actions={controls(() => onEditStay(stay), () => onRemoveStay(stay), stay.name)}
              />
            </li>
          ))}
        </CompactList>
      )}
    </div>
  );
}
