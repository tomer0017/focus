import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDateTime } from "../../lib/format";
import { nextFlight, nextStay } from "../../lib/trips";
import { tripPhase, type TripArea, type TripReadiness } from "../../lib/tripShape";
import type { Trip } from "../../types";

interface TripBriefProps {
  trip: Trip;
  readiness: TripReadiness;
  progress: { done: number; total: number };
  onGo: (area: TripArea) => void;
}

/**
 * The three facts that decide whether this trip needs you today.
 *
 * One row, not three cards. The information is: what to do next, the first
 * thing that actually happens, and whether anything is still owed — and each is
 * a sentence, so wrapping each in a bordered box was ninety pixels of chrome per
 * clause. Everything here is also a way in: the next action goes to the
 * checklist, the flight to bookings, the missing count to whatever is missing.
 *
 * It renders nothing at all for a trip that is over. A finished trip has no
 * next action, and inventing one is how a screen starts nagging about the past.
 */
export function TripBrief({ trip, readiness, progress, onGo }: TripBriefProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  if (tripPhase(trip) === "past") return null;

  const flight = nextFlight(trip);
  const stay = nextStay(trip);
  const missing = readiness.total - readiness.done;

  const facts: { key: string; icon: "star" | "plane" | "bed" | "alert"; label: string; value: string; go: TripArea }[] = [];

  if (trip.nextAction) {
    facts.push({
      key: "next",
      icon: "star",
      label: t("common:fields.nextAction"),
      value: trip.nextAction,
      go: "checklist",
    });
  }

  /*
   * The flight if there is one, otherwise the first place to sleep. Both is one
   * fact too many for a summary line, and the flight is the one with a time on
   * it that you cannot be late for.
   */
  if (flight?.departsAt) {
    facts.push({
      key: "flight",
      icon: "plane",
      label: t("trips:brief.firstFlight"),
      value: `${flight.number ? `${flight.number} · ` : ""}${formatDateTime(flight.departsAt, locale)}`,
      go: "bookings",
    });
  } else if (stay?.checkIn) {
    facts.push({
      key: "stay",
      icon: "bed",
      label: t("trips:brief.firstStay"),
      value: `${stay.name} · ${formatDateTime(stay.checkIn, locale)}`,
      go: "bookings",
    });
  }

  if (missing > 0) {
    facts.push({
      key: "missing",
      icon: "alert",
      label: t("trips:readiness.stillMissing"),
      value: t(`trips:readiness.missing.${readiness.missing[0]}`),
      go: areaForCheck(readiness.missing[0]),
    });
  }

  if (facts.length === 0 && progress.total === 0) return null;

  return (
    <div className="focus-brief-row">
      <ul className="list-unstyled focus-brief-row__facts mb-0">
        {facts.map((fact) => (
          <li key={fact.key}>
            <button
              type="button"
              className={`focus-brief-fact focus-brief-fact--${fact.key}`}
              onClick={() => onGo(fact.go)}
            >
              <Icon name={fact.icon} size={14} />
              <span className="focus-brief-fact__label">{fact.label}</span>
              <span className="focus-brief-fact__value focus-clamp-1" dir="auto">
                {fact.value}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {progress.total > 0 && (
        <button
          type="button"
          className="focus-brief-row__progress"
          onClick={() => onGo("checklist")}
        >
          <span className="focus-mini-bar" aria-hidden="true">
            <span
              style={{ inlineSize: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </span>
          {t("trips:brief.packed", { done: progress.done, total: progress.total })}
        </button>
      )}
    </div>
  );
}

/** Where a missing fact is filled in. */
function areaForCheck(key: string): TripArea {
  switch (key) {
    case "flights":
    case "stays":
      return "bookings";
    case "days":
    case "where":
      return "itinerary";
    case "packing":
      return "checklist";
    default:
      return "itinerary";
  }
}
