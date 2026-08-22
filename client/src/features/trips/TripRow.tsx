import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import { tripLength } from "../../lib/trips";
import { daysUntilTrip, tripKindOf, tripPhase, type TripReadiness } from "../../lib/tripShape";
import type { Trip } from "../../types";

interface TripRowProps {
  trip: Trip;
  readiness: TripReadiness;
  /** Ticked / total on the trip's own list, when it has one. */
  progress?: { done: number; total: number };
}

/**
 * One trip, scannable in a line and a half.
 *
 * A row, not a card. Twenty trips as cards is four screens of mostly white; the
 * five facts that decide which one you want — where, when, how long, how far
 * off, and whether anything is still owed — fit on one line beside a thumbnail,
 * and everything else is on the trip's own screen.
 *
 * The picture stays because a trip without one is hard to pick out of a list,
 * but it is a 56px thumbnail, not a banner.
 */
export function TripRow({ trip, readiness, progress }: TripRowProps) {
  const { t } = useTranslation(["trips"]);
  const { locale } = useLocale();

  const phase = tripPhase(trip);
  const days = daysUntilTrip(trip);

  const when =
    phase === "travelling"
      ? t("trips:phase.travellingNow")
      : phase === "past"
        ? t("trips:phase.past")
        : t("trips:phase.inDays", { count: days });

  const missing = phase === "past" ? 0 : readiness.total - readiness.done;

  return (
    <article className={`focus-trip-row focus-trip-row--${phase}`}>
      <BoardImage
        className="focus-trip-row__image"
        imageUrl={trip.coverImageUrl}
        thumb={trip.coverThumb}
      />

      <div className="focus-trip-row__body">
        <p className="focus-trip-row__eyebrow mb-0">
          <span>{t(`trips:kinds.${tripKindOf(trip)}`)}</span>
          {trip.countries.length > 0 && <span dir="auto">{trip.countries.join(" · ")}</span>}
        </p>

        <h3 className="focus-trip-row__title mb-0">
          <Link to={`/trips/${trip.id}`} className="stretched-link" dir="auto">
            {trip.title}
          </Link>
        </h3>

        <p className="focus-trip-row__dates mb-0">
          <time dateTime={dateKeyToIso(trip.startDate)}>
            {formatDayKey(trip.startDate, locale)}
          </time>
          {" – "}
          <time dateTime={dateKeyToIso(trip.endDate)}>{formatDayKey(trip.endDate, locale)}</time>
          {" · "}
          {t("trips:dayCount", { count: tripLength(trip) })}
        </p>

        {trip.nextAction && phase !== "past" && (
          <p className="focus-trip-row__next focus-clamp-1 mb-0" dir="auto">
            {trip.nextAction}
          </p>
        )}
      </div>

      <div className="focus-trip-row__state">
        <span className={`focus-trip-countdown focus-trip-countdown--${phase}`}>{when}</span>

        {progress && progress.total > 0 && (
          <span className="focus-trip-row__progress">
            {t("trips:packedCount", { done: progress.done, total: progress.total })}
          </span>
        )}

        {/* A count, and the word for what it counts — never a bare dot. */}
        {missing > 0 && (
          <span className="focus-chip focus-chip--warning">
            <Icon name="alert" size={12} />
            {t("trips:readiness.missingCount", { count: missing })}
          </span>
        )}
      </div>
    </article>
  );
}
