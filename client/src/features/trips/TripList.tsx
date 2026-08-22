import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "../sections/Section";
import type { SectionSpan } from "../sections/sectionSpan";
import { useChecklists } from "../../state/checklistsContext";
import { progressOf } from "../../lib/checklist";
import { tripReadiness, upcomingTrips } from "../../lib/tripShape";
import { TripRow } from "./TripRow";
import type { Trip } from "../../types";

/**
 * Trips inside the Trips space: what is coming, and a way to the whole screen.
 *
 * The space view is about the *material* of travelling — gear, places, notes,
 * lists — and listing every trip here would duplicate the trips screen inside
 * it. Three upcoming rows answer "is anything close", and the heading's action
 * goes to the screen that answers everything else.
 */
export function TripList({
  title,
  trips,
  span,
}: {
  title: string;
  trips: Trip[];
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}) {
  const { t } = useTranslation(["trips"]);
  const { getChecklist } = useChecklists();

  const upcoming = upcomingTrips(trips).slice(0, 3);

  return (
    <Section
      title={title}
      hasContent={upcoming.length > 0}
      span={span ?? "full"}
      action={
        <Link to="/trips" className="focus-section-action">
          {t("trips:allTrips")}
        </Link>
      }
    >
      <ul className="list-unstyled focus-trip-rows mb-0">
        {upcoming.map((trip) => {
          const progress = progressOf(getChecklist(`trip:${trip.id}`));
          return (
            <li key={trip.id}>
              <TripRow
                trip={trip}
                readiness={tripReadiness(trip, progress.done, progress.total)}
                progress={progress}
              />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
