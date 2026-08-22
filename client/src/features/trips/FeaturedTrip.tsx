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

interface FeaturedTripProps {
  trip: Trip;
  readiness: TripReadiness;
}

/**
 * The trip that is actually coming, given the top of the screen.
 *
 * One trip, never a carousel: the question the screen opens with is "what is
 * next", and that has exactly one answer. It is a wide row rather than a hero
 * banner — the countdown, the next action and what is still owed are what you
 * came for, and a 300px photograph above them would push all three below the
 * fold on a laptop.
 */
export function FeaturedTrip({ trip, readiness }: FeaturedTripProps) {
  const { t } = useTranslation(["trips"]);
  const { locale } = useLocale();

  const phase = tripPhase(trip);
  const days = daysUntilTrip(trip);
  const when =
    phase === "travelling"
      ? t("trips:phase.travellingNow")
      : t("trips:phase.inDays", { count: days });

  return (
    <article className="focus-featured">
      <BoardImage
        className="focus-featured__image"
        imageUrl={trip.coverImageUrl}
        thumb={trip.coverThumb}
      />

      <div className="focus-featured__body">
        <p className="focus-featured__eyebrow mb-0">
          <span className={`focus-trip-countdown focus-trip-countdown--${phase}`}>{when}</span>
          <span>{t(`trips:kinds.${tripKindOf(trip)}`)}</span>
          <span>{t(`trips:status.${trip.status}`)}</span>
        </p>

        <h2 className="focus-featured__title mb-0">
          <Link to={`/trips/${trip.id}`} className="stretched-link" dir="auto">
            {trip.title}
          </Link>
        </h2>

        <p className="focus-featured__dates mb-0">
          {trip.countries.length > 0 && (
            <span dir="auto">{trip.countries.join(" · ")}</span>
          )}
          <span>
            <time dateTime={dateKeyToIso(trip.startDate)}>
              {formatDayKey(trip.startDate, locale)}
            </time>
            {" – "}
            <time dateTime={dateKeyToIso(trip.endDate)}>
              {formatDayKey(trip.endDate, locale)}
            </time>
          </span>
          <span>{t("trips:dayCount", { count: tripLength(trip) })}</span>
        </p>

        {trip.nextAction && (
          <p className="focus-featured__next mb-0">
            <span className="focus-featured__next-label">{t("trips:overview.next")}</span>
            <span dir="auto">{trip.nextAction}</span>
          </p>
        )}

        {readiness.total > 0 && (
          <p className="focus-featured__ready mb-0">
            <span className="focus-trip-meter" aria-hidden="true">
              {Array.from({ length: readiness.total }, (_, index) => (
                <span key={index} className={index < readiness.done ? "is-done" : ""} />
              ))}
            </span>
            {t("trips:readiness.count", { done: readiness.done, total: readiness.total })}
            {readiness.missing.length > 0 && (
              <span className="focus-featured__missing">
                <Icon name="alert" size={12} />
                {t(`trips:readiness.missing.${readiness.missing[0]}`)}
              </span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
