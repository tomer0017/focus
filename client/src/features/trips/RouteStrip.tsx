import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useLocale } from "../../i18n/useLocale";
import { dateKeyToIso } from "../../lib/dateKey";
import { formatDayKey, formatShortDate } from "../../lib/format";
import { nightsAt } from "../../lib/trips";
import type { Trip, TripDestination } from "../../types";

interface RouteStripProps {
  trip: Trip;
  /** The leg currently being looked at, when the strip is driving a panel. */
  value?: string;
  onSelect?: (destinationId: string) => void;
  /** Tab semantics, for the itinerary. Omitted when the strip is only a summary. */
  idPrefix?: string;
}

/**
 * Where this trip goes, in order, as one line.
 *
 * This is the answer to the complaint that started this pass: the screen said
 * "Japan 2027, 12 days" and then made you open three cards to find out that it
 * meant Tokyo, then Kyoto, then Osaka. A trip's shape is a sequence of places
 * with nights in each, and that is a route — so it is drawn as one.
 *
 * The connector between two stops is not decoration: it is the leg of travel
 * between them, and it carries how you get there. Ordering is chronological and
 * flows with the writing direction, so in Hebrew the first stop is on the right
 * and the arrow points left — the reading order and the travel order agree,
 * which is what stops an RTL route from reading backwards.
 *
 * Below `md` it becomes a vertical timeline. A horizontal route at 375px is
 * either three unreadable columns or a scroll surface with no scrollbar, and a
 * route you have to drag sideways to read is not a route you can see.
 */
export function RouteStrip({ trip, value, onSelect, idPrefix }: RouteStripProps) {
  const { t } = useTranslation(["trips"]);
  const { locale } = useLocale();

  const stops = trip.destinations;
  // One stop is not a route. A hotel stay gets its facts without the drawing.
  if (stops.length === 0) return null;

  /*
   * A range within one year prints the year once. "5 Dec 2026 – 7 Dec 2026" is
   * two lines in a 150px cell and says the year twice for no reason; the year
   * only earns its place when the leg actually crosses one.
   */
  const dates = (stop: TripDestination): string | null => {
    if (!stop.arriveOn) return null;
    if (!stop.leaveOn) return formatDayKey(stop.arriveOn, locale);

    const sameYear = stop.arriveOn.slice(0, 4) === stop.leaveOn.slice(0, 4);
    const from = sameYear
      ? formatShortDate(dateKeyToIso(stop.arriveOn), locale)
      : formatDayKey(stop.arriveOn, locale);
    return `${from} – ${formatDayKey(stop.leaveOn, locale)}`;
  };

  const interactive = Boolean(onSelect);

  return (
    <nav
      className={`focus-route focus-route--${stops.length === 1 ? "single" : "multi"}`}
      aria-label={t("trips:route.label")}
      role={idPrefix ? "tablist" : undefined}
    >
      <ol className="focus-route__list">
        {stops.map((stop, index) => {
          const nights = nightsAt(stop);
          const active = stop.id === value;
          const label = dates(stop);

          const body = (
            <>
              <span className="focus-route__marker" aria-hidden="true" />
              <Thumbnail imageUrl={stop.imageUrl} thumb={stop.thumb} size="sm" />
              <span className="focus-route__body">
                <span className="focus-route__name" dir="auto">
                  {stop.name}
                </span>
                {label && <span className="focus-route__dates">{label}</span>}
                {nights !== null && (
                  <span className="focus-route__nights">
                    {t("trips:nights", { count: nights })}
                  </span>
                )}
              </span>
            </>
          );

          return (
            <li key={stop.id} className={`focus-route__stop${active ? " is-active" : ""}`}>
              {interactive ? (
                <button
                  type="button"
                  role={idPrefix ? "tab" : undefined}
                  id={idPrefix ? `${idPrefix}-tab-${stop.id}` : undefined}
                  aria-selected={idPrefix ? active : undefined}
                  aria-current={!idPrefix && active ? "true" : undefined}
                  className="focus-route__button"
                  onClick={() => onSelect?.(stop.id)}
                >
                  {body}
                  {/* The state in words, so the ring is never the only signal. */}
                  {active && (
                    <span className="visually-hidden">{t("trips:route.showing")}</span>
                  )}
                </button>
              ) : (
                <span className="focus-route__button">{body}</span>
              )}

              {/*
                The leg between two stops. It sits *after* the stop it leaves
                from, so it never appears after the last one — there is no
                journey out of the final city inside this trip.
              */}
              {index < stops.length - 1 && (
                <span className="focus-route__leg" aria-hidden="true">
                  <span className="focus-route__line" />
                  <Icon name="arrowForward" size={13} flipForRtl />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
