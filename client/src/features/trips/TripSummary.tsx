import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { useLocale } from "../../i18n/useLocale";
import { formatDateTime } from "../../lib/format";
import { nextFlight, nextStay } from "../../lib/trips";
import { isExternalUrl } from "../../lib/links";
import type { Trip } from "../../types";

/**
 * Flight and hotel, compact by default.
 *
 * The two lines you need at the airport are always visible; the confirmation
 * number, the address and the note are one click away. Showing all of it all
 * the time is how a travel page becomes a wall you stop reading.
 */
export function TripSummary({ trip }: { trip: Trip }) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const flight = nextFlight(trip);
  const stay = nextStay(trip);
  if (!flight && !stay) return null;

  return (
    <section className="focus-travel">
      <div className="focus-travel__row">
        {flight && (
          <div className="focus-travel__item">
            <p className="focus-travel__label">
              <Icon name="plane" size={14} />
              {t("trips:nextFlight")}
            </p>
            <p className="focus-travel__value mb-0">
              <span className="fw-semibold">{flight.number}</span>
              {flight.from && flight.to && (
                <span className="focus-travel__route" dir="ltr">
                  {flight.from} → {flight.to}
                </span>
              )}
            </p>
            {flight.departsAt && (
              <p className="focus-travel__when mb-0">
                <time dateTime={flight.departsAt}>{formatDateTime(flight.departsAt, locale)}</time>
              </p>
            )}
          </div>
        )}

        {stay && (
          <div className="focus-travel__item">
            <p className="focus-travel__label">
              <Icon name="bed" size={14} />
              {t("trips:nextStay")}
            </p>
            <p className="focus-travel__value mb-0" dir="auto">
              <span className="fw-semibold">{stay.name}</span>
            </p>
            {stay.checkIn && (
              <p className="focus-travel__when mb-0">
                <time dateTime={stay.checkIn}>{formatDateTime(stay.checkIn, locale)}</time>
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          className="focus-travel__toggle"
          aria-expanded={expanded}
          aria-controls="travel-detail"
          onClick={() => setExpanded((current) => !current)}
        >
          <Icon name={expanded ? "chevronUp" : "chevronDown"} size={15} />
          {expanded ? t("trips:hideDetails") : t("trips:showDetails")}
        </button>
      </div>

      {expanded && (
        <dl id="travel-detail" className="focus-travel__detail">
          {trip.flights.map((entry) => (
            <div key={entry.id}>
              <dt dir="ltr">{entry.number ?? t("trips:flight")}</dt>
              <dd>
                {entry.departsAt && (
                  <span>
                    {t("trips:departs")}: {formatDateTime(entry.departsAt, locale)}
                  </span>
                )}
                {entry.arrivesAt && (
                  <span>
                    {t("trips:arrives")}: {formatDateTime(entry.arrivesAt, locale)}
                  </span>
                )}
                {entry.confirmation && (
                  <span dir="ltr">
                    {t("trips:confirmation")}: {entry.confirmation}
                  </span>
                )}
                {entry.note && (
                  <span dir="auto" className="focus-travel__note">
                    {entry.note}
                  </span>
                )}
                {isExternalUrl(entry.url) && (
                  <ExternalLink href={entry.url}>{t("trips:openBooking")}</ExternalLink>
                )}
              </dd>
            </div>
          ))}

          {trip.stays.map((entry) => (
            <div key={entry.id}>
              <dt dir="auto">{entry.name}</dt>
              <dd>
                {entry.address && <span dir="auto">{entry.address}</span>}
                {entry.checkIn && (
                  <span>
                    {t("trips:checkIn")}: {formatDateTime(entry.checkIn, locale)}
                  </span>
                )}
                {entry.checkOut && (
                  <span>
                    {t("trips:checkOut")}: {formatDateTime(entry.checkOut, locale)}
                  </span>
                )}
                {entry.confirmation && (
                  <span dir="ltr">
                    {t("trips:confirmation")}: {entry.confirmation}
                  </span>
                )}
                {entry.note && (
                  <span dir="auto" className="focus-travel__note">
                    {entry.note}
                  </span>
                )}
                {isExternalUrl(entry.url) && (
                  <ExternalLink href={entry.url}>{t("trips:openBooking")}</ExternalLink>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
