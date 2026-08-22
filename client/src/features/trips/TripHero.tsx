import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import { tripLength } from "../../lib/trips";
import { daysUntilTrip, tripKindOf, tripPhase } from "../../lib/tripShape";
import type { Trip } from "../../types";

interface TripHeroProps {
  trip: Trip;
  onEdit: () => void;
}

/**
 * The identity of a trip, in one band.
 *
 * A cover picture is what makes a trip feel like that trip rather than a row in
 * a database, so it is here — but capped, and beside the facts rather than
 * above them. The old screen gave it 230px of full-width height and pushed
 * every fact below the fold, which is the opposite of what a cover is for.
 *
 * The countdown is the loudest thing in the band, because "in 96 days" is what
 * tells you whether to act today; the dates sit under it, because "in 96 days"
 * is no use for writing in a diary.
 */
export function TripHero({ trip, onEdit }: TripHeroProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  const phase = tripPhase(trip);
  const days = daysUntilTrip(trip);
  const length = tripLength(trip);

  /*
   * Written out in words, never carried by the accent colour alone. A finished
   * trip gets none at all: the status chip already reads "been there", and a
   * countdown saying the same thing twice on one line is furniture.
   */
  const countdown =
    phase === "travelling"
      ? t("trips:phase.travellingNow")
      : phase === "past"
        ? null
        : t("trips:phase.inDays", { count: days });

  return (
    <header className={`focus-trip-hero focus-trip-hero--${phase}`}>
      <div className="focus-trip-hero__cover">
        <BoardImage
          className="focus-trip-hero__image"
          imageUrl={trip.coverImageUrl}
          thumb={trip.coverThumb}
        />
      </div>

      <div className="focus-trip-hero__body">
        <p className="focus-trip-hero__eyebrow">
          <span>{t(`trips:kinds.${tripKindOf(trip)}`)}</span>
          {trip.countries.length > 0 && (
            <span dir="auto">{trip.countries.join(" · ")}</span>
          )}
          <span>{t(`trips:status.${trip.status}`)}</span>
        </p>

        <div className="focus-trip-hero__title-row">
          <h1 className="focus-trip-hero__title mb-0" dir="auto">
            {trip.title}
          </h1>
          <Button variant="outline-primary" size="sm" onClick={onEdit}>
            <Icon name="edit" size={14} />
            {t("trips:edit.title")}
          </Button>
        </div>

        <p className="focus-trip-hero__when mb-0">
          {countdown && (
            <span className={`focus-trip-countdown focus-trip-countdown--${phase}`}>
              {countdown}
            </span>
          )}
          <span className="focus-trip-hero__dates">
            <time dateTime={dateKeyToIso(trip.startDate)}>
              {formatDayKey(trip.startDate, locale)}
            </time>
            {" – "}
            <time dateTime={dateKeyToIso(trip.endDate)}>{formatDayKey(trip.endDate, locale)}</time>
            {" · "}
            {t("trips:dayCount", { count: length })}
          </span>
        </p>

        {/*
          The readiness meter and the next action used to live here. They moved
          to the brief row under the route, where they sit beside the first
          flight and what is still missing — printing them in both places was
          the same sentence twice on one screen.
        */}
      </div>
    </header>
  );
}
