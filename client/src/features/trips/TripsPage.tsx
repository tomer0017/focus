import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ShowMore } from "../../components/ui/ShowMore";
import { useTrips } from "../../state/tripsContext";
import { useChecklists } from "../../state/checklistsContext";
import { progressOf } from "../../lib/checklist";
import { featuredTrip, pastTrips, tripReadiness, upcomingTrips } from "../../lib/tripShape";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { FeaturedTrip } from "./FeaturedTrip";
import { TripRow } from "./TripRow";
import { NewTripModal } from "./NewTripModal";
import type { Trip } from "../../types";

type Group = "upcoming" | "past";

/**
 * Every trip, answering five questions and stopping.
 *
 * What is next, how far off it is, what it still needs, what else is planned,
 * and where the finished ones went. Upcoming and past are never one continuous
 * list — a trip from two years ago and a trip in three weeks want completely
 * different things from you, and interleaving them by date makes the screen
 * lie about which is which.
 *
 * The next trip is lifted out of the list rather than merely sorted to the top,
 * because "what is next" is the question people arrive with; the same trip is
 * then not repeated in the list below it.
 */
export function TripsPage() {
  const { t } = useTranslation(["trips", "common"]);
  const navigate = useNavigate();
  const { trips, addTrip } = useTrips();
  const { getChecklist } = useChecklists();

  const [group, setGroup] = useState<Group>("upcoming");
  const [creating, setCreating] = useState(false);

  const featured = useMemo(() => featuredTrip(trips), [trips]);
  const upcoming = useMemo(
    () => upcomingTrips(trips).filter((trip) => trip.id !== featured?.id),
    [trips, featured]
  );
  const past = useMemo(() => pastTrips(trips), [trips]);

  const progressOfTrip = (trip: Trip) => progressOf(getChecklist(`trip:${trip.id}`));
  const readinessOf = (trip: Trip) => {
    const progress = progressOfTrip(trip);
    return tripReadiness(trip, progress.done, progress.total);
  };

  const groups: SegmentedItem[] = [
    {
      id: "upcoming",
      label: t("trips:groups.upcoming"),
      badge: String(upcoming.length + (featured ? 1 : 0) || ""),
    },
    { id: "past", label: t("trips:groups.past"), badge: String(past.length || "") },
  ];

  const list = group === "upcoming" ? upcoming : past;

  const newTripAction = (
    <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
      <Icon name="plus" size={14} />
      {t("trips:newTrip")}
    </Button>
  );

  return (
    <div className="focus-trips">
      <PageHeader title={t("trips:title")} lead={t("trips:lead")} action={newTripAction} />

      {trips.length === 0 ? (
        <EmptyState
          title={t("trips:emptyTitle")}
          hint={t("trips:emptyHint")}
          action={newTripAction}
        />
      ) : (
        <>
          {featured && <FeaturedTrip trip={featured} readiness={readinessOf(featured)} />}

          {/* Both groups exist as a control even when one is empty — otherwise
              finishing your last trip makes the past silently unreachable. */}
          <SegmentedNav
            label={t("trips:groups.choose")}
            items={groups}
            value={group}
            onChange={(id) => setGroup(id as Group)}
            variant="tabs"
          />

          {list.length === 0 ? (
            <p className="focus-day-empty mb-0">
              {group === "upcoming" ? t("trips:groups.noneUpcoming") : t("trips:groups.nonePast")}
            </p>
          ) : (
            <ShowMore items={list} limit={6}>
              {(visible) => (
                <ul className="list-unstyled focus-trip-rows mb-0">
                  {visible.map((trip) => (
                    <li key={trip.id}>
                      <TripRow
                        trip={trip}
                        readiness={readinessOf(trip)}
                        progress={progressOfTrip(trip)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </ShowMore>
          )}
        </>
      )}

      <NewTripModal
        show={creating}
        onClose={() => setCreating(false)}
        onCreate={(draft) => navigate(`/trips/${addTrip(draft)}`)}
      />
    </div>
  );
}
