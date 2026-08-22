import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKeyLong } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import type { TripDayPlan, TripDestination } from "../../types";

interface TripDayCardProps {
  day: TripDayPlan;
  destination?: TripDestination;
  /** Every destination, so a day can be moved to another city. */
  destinations?: TripDestination[];
  index: number;
  onChange: (patch: Partial<TripDayPlan>) => void;
  onRemove?: () => void;
  onMove?: (direction: -1 | 1) => void;
  /** "What to wear" for this day, when the trip context can supply it. */
  outfitSection?: ReactNode;
}

/** The three parts of a day everybody fills in. */
const MAIN_SLOTS = ["morning", "afternoon", "evening"] as const;

/** The rest: shown when they hold something, and on request when they do not. */
const EXTRA_SLOTS = ["alternatives", "bookings", "clothing", "notes"] as const;

/**
 * One day of the trip, editable in place.
 *
 * Morning, afternoon and evening are three fields on a day — not three
 * systems. Clothing, bookings and notes sit in the same card for the same
 * reason: they are facts about that day, and splitting them into their own
 * screens is how a trip planner turns into four apps.
 */
export function TripDayCard({
  day,
  destination,
  destinations,
  index,
  onChange,
  onRemove,
  onMove,
  outfitSection,
}: TripDayCardProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  const hasExtras = EXTRA_SLOTS.some((slot) => (day[slot] ?? "").trim().length > 0);
  const [showExtras, setShowExtras] = useState(hasExtras);

  return (
    <article className="focus-day-card">
      <header className="focus-day-card__head">
        <span className="focus-day-card__number">{t("trips:dayNumber", { count: index + 1 })}</span>
        <p className="focus-day-card__date mb-0">
          <time dateTime={dateKeyToIso(day.date)}>{formatDayKeyLong(day.date, locale)}</time>
        </p>
        {destinations && destinations.length > 0 ? (
          <>
            <label className="visually-hidden" htmlFor={`day-${day.id}-destination`}>
              {t("trips:edit.moveDayTo")}
            </label>
            <select
              id={`day-${day.id}-destination`}
              className="form-select form-select-sm focus-day-card__destination"
              value={day.destinationId}
              onChange={(event) => onChange({ destinationId: event.target.value })}
            >
              {destinations.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          destination && (
            <span className="focus-chip focus-chip--info" dir="auto">
              {destination.name}
            </span>
          )
        )}

        {(onMove || onRemove) && (
          <span className="focus-day-card__controls">
            {onMove && (
              <>
                <button
                  type="button"
                  className="focus-icon-button border"
                  onClick={() => onMove(-1)}
                  aria-label={t("trips:edit.moveDayEarlier")}
                >
                  <Icon name="chevronUp" size={13} />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  onClick={() => onMove(1)}
                  aria-label={t("trips:edit.moveDayLater")}
                >
                  <Icon name="chevronDown" size={13} />
                </button>
              </>
            )}
            {onRemove && (
              <button
                type="button"
                className="focus-icon-button border"
                onClick={onRemove}
                aria-label={t("trips:edit.removeDay")}
              >
                <Icon name="trash" size={13} />
              </button>
            )}
          </span>
        )}
      </header>

      <div className="focus-day-card__slots">
        {MAIN_SLOTS.map((slot) => (
          <div key={slot} className="focus-day-card__slot">
            <label className="focus-labelled__label" htmlFor={`day-${day.id}-${slot}`}>
              {t(`trips:slots.${slot}`)}
            </label>
            <textarea
              id={`day-${day.id}-${slot}`}
              className="form-control form-control-sm"
              rows={2}
              dir="auto"
              value={day[slot] ?? ""}
              onChange={(event) => onChange({ [slot]: event.target.value })}
            />
          </div>
        ))}

        {showExtras &&
          EXTRA_SLOTS.map((slot) => (
            <div key={slot} className="focus-day-card__slot">
              <label className="focus-labelled__label" htmlFor={`day-${day.id}-${slot}`}>
                {t(`trips:slots.${slot}`)}
              </label>
              <textarea
                id={`day-${day.id}-${slot}`}
                className="form-control form-control-sm"
                rows={2}
                dir="auto"
                value={day[slot] ?? ""}
                onChange={(event) => onChange({ [slot]: event.target.value })}
              />
            </div>
          ))}
      </div>

      {outfitSection}

      {!hasExtras && (
        <button
          type="button"
          className="focus-day-card__more"
          aria-expanded={showExtras}
          onClick={() => setShowExtras((current) => !current)}
        >
          {showExtras ? t("trips:fewerFields") : t("trips:moreFields")}
        </button>
      )}
    </article>
  );
}
