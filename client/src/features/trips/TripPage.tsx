import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTrips } from "../../state/tripsContext";
import { usePages } from "../../state/pagesContext";
import { useChecklists } from "../../state/checklistsContext";
import { BackButton } from "../../components/ui/BackButton";
import { ErrorState } from "../../components/ui/ErrorState";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { progressOf } from "../../lib/checklist";
import {
  freeDates,
  moveInArray,
  swapDayDates,
  tripId,
} from "../../lib/trips";
import {
  tripAreas,
  tripPhase,
  tripReadiness,
  type TripArea,
} from "../../lib/tripShape";
import type { ProjectNote, TripDestination, TripOutfit } from "../../types";
import { TripHero } from "./TripHero";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { RouteStrip } from "./RouteStrip";
import { TripBrief } from "./TripBrief";
import { ProjectNotes } from "../page/ProjectNotes";
import { noteBlocksFor } from "../../lib/tripShape";
import { ItineraryArea } from "./ItineraryArea";
import { BookingsArea } from "./BookingsArea";
import { OutfitsArea } from "./OutfitsArea";
import { ChecklistArea } from "./ChecklistArea";
import { TripEditModal } from "./TripEditModal";
import { DestinationFormModal, type DestinationDraft } from "./DestinationFormModal";
import { OutfitFormModal } from "./OutfitFormModal";
import { BookingFormModal, type BookingDraft } from "./BookingFormModal";

/**
 * One trip.
 *
 * A trip is not a project and does not use the project screen. It is a hero
 * that gives it an identity, and then exactly one area at a time — which is the
 * change: the screen this replaces stacked six sections' worth of destinations,
 * days, bookings, looks, lists and saved links down one page, so a short
 * weekend and an eleven-day itinerary both arrived as a wall.
 *
 * Which areas exist depends on the trip. A camping weekend carries no bookings
 * tab and no outfit planner, because nothing in it would ever fill them.
 */
export function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["trips", "common"]);
  const { trips, getTrip, updateTrip, updateDay, updateDestination, updateFood, addFood, removeFood } =
    useTrips();
  const { savedItems } = usePages();
  const { getChecklist } = useChecklists();

  const [area, setArea] = useState<TripArea | null>(null);
  /*
   * Which leg is being looked at. It lives here rather than inside the
   * itinerary because the route strip above the tabs drives it too — pressing
   * Kyoto up there and finding the itinerary still on Tokyo would be two
   * controls disagreeing about one fact.
   */
  const [legId, setLegId] = useState<string>("");
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [destinationForm, setDestinationForm] = useState<{ id: string | null } | null>(null);
  const [outfitForm, setOutfitForm] = useState<{ id: string | null; dayId?: string } | null>(null);
  const [bookingForm, setBookingForm] = useState<{
    type: "flight" | "stay";
    id: string | null;
  } | null>(null);

  const trip = id ? getTrip(id) : undefined;

  const saved = useMemo(
    () => (trip ? savedItems.filter((item) => item.contextIds.includes(`trip:${trip.id}`)) : []),
    [savedItems, trip]
  );

  const checklist = trip ? getChecklist(`trip:${trip.id}`) : undefined;
  const progress = progressOf(checklist);
  const readiness = useMemo(
    () => (trip ? tripReadiness(trip, progress.done, progress.total) : { done: 0, total: 0, missing: [] }),
    [trip, progress.done, progress.total]
  );

  const areas = useMemo(() => (trip ? tripAreas(trip, saved.length) : []), [trip, saved.length]);

  /*
   * The set of areas changes as a trip fills in — adding a flight to a weekend
   * gives it a bookings tab. If the one on screen disappears, fall back rather
   * than rendering an empty panel for an area that no longer exists.
   */
  useEffect(() => {
    if (areas.length > 0 && (area === null || !areas.includes(area))) setArea(areas[0]);
  }, [areas, area]);

  /* Exactly one leg is selected whenever the trip has any. */
  useEffect(() => {
    const stops = trip?.destinations ?? [];
    if (stops.length === 0) return;
    if (!stops.some((stop) => stop.id === legId)) setLegId(stops[0].id);
  }, [trip, legId]);

  if (!trip) {
    return (
      <div className="focus-detail">
        <div className="mb-3">
          <BackButton />
        </div>
        <ErrorState
          title={t("common:errors.pageNotFoundTitle")}
          message={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
        />
      </div>
    );
  }

  const phase = tripPhase(trip);

  /* ------------------------------------------------------- destinations -- */

  const saveDestination = (draft: DestinationDraft): void => {
    const exists = trip.destinations.some((entry) => entry.id === draft.destination.id);
    const destinations = exists
      ? trip.destinations.map((entry) =>
          entry.id === draft.destination.id ? draft.destination : entry
        )
      : [...trip.destinations, draft.destination];

    const others = trip.stays.filter((entry) => entry.destinationId !== draft.destination.id);
    const stays = draft.stay ? [...others, draft.stay] : others;

    updateTrip(trip.id, { destinations, stays });
  };

  const removeDestination = (destinationId: string): void => {
    const target = trip.destinations.find((entry) => entry.id === destinationId);
    // Removing a city removes its days with it; saying so is the whole point
    // of the confirmation.
    const dayCount = trip.days.filter((day) => day.destinationId === destinationId).length;
    const confirmed = window.confirm(
      t("trips:edit.confirmRemoveDestination", { name: target?.name ?? "", count: dayCount })
    );
    if (!confirmed) return;

    updateTrip(trip.id, {
      destinations: trip.destinations.filter((entry) => entry.id !== destinationId),
      days: trip.days.filter((day) => day.destinationId !== destinationId),
      stays: trip.stays.filter((stay) => stay.destinationId !== destinationId),
    });
  };

  const moveDestination = (destinationId: string, direction: -1 | 1): void => {
    const index = trip.destinations.findIndex((entry) => entry.id === destinationId);
    updateTrip(trip.id, { destinations: moveInArray(trip.destinations, index, direction) });
  };

  /* ---------------------------------------------------------------- days -- */

  const addDay = (forDestination: string): void => {
    const date = freeDates(trip)[0] ?? trip.startDate;
    updateTrip(trip.id, {
      days: [...trip.days, { id: tripId("day"), date, destinationId: forDestination }],
    });
  };

  const removeDay = (dayId: string): void => {
    updateTrip(trip.id, { days: trip.days.filter((day) => day.id !== dayId) });
  };

  const moveDay = (dayId: string, direction: -1 | 1): void => {
    updateTrip(trip.id, { days: swapDayDates(trip.days, dayId, direction) });
  };

  /* ------------------------------------------------------------ bookings -- */

  const saveBooking = (draft: BookingDraft): void => {
    if (draft.type === "flight") {
      const exists = trip.flights.some((entry) => entry.id === draft.flight.id);
      updateTrip(trip.id, {
        flights: exists
          ? trip.flights.map((entry) => (entry.id === draft.flight.id ? draft.flight : entry))
          : [...trip.flights, draft.flight],
      });
    } else {
      const exists = trip.stays.some((entry) => entry.id === draft.stay.id);
      updateTrip(trip.id, {
        stays: exists
          ? trip.stays.map((entry) => (entry.id === draft.stay.id ? draft.stay : entry))
          : [...trip.stays, draft.stay],
      });
    }
  };

  /* ------------------------------------------------------------- outfits -- */

  const saveOutfit = (outfit: TripOutfit, assignDayId?: string): void => {
    const withDay =
      assignDayId && !outfit.dayIds.includes(assignDayId)
        ? { ...outfit, dayIds: [...outfit.dayIds, assignDayId] }
        : outfit;
    const exists = trip.outfits.some((entry) => entry.id === withDay.id);
    updateTrip(trip.id, {
      outfits: exists
        ? trip.outfits.map((entry) => (entry.id === withDay.id ? withDay : entry))
        : [...trip.outfits, withDay],
    });
  };

  const assignOutfit = (outfitId: string, dayId: string): void => {
    updateTrip(trip.id, {
      outfits: trip.outfits.map((entry) =>
        entry.id === outfitId && !entry.dayIds.includes(dayId)
          ? { ...entry, dayIds: [...entry.dayIds, dayId] }
          : entry
      ),
    });
  };

  const unassignOutfit = (outfitId: string, dayId: string): void => {
    updateTrip(trip.id, {
      outfits: trip.outfits.map((entry) =>
        entry.id === outfitId
          ? { ...entry, dayIds: entry.dayIds.filter((value) => value !== dayId) }
          : entry
      ),
    });
  };

  /*
   * Choosing a look for a day marks it selected and demotes any other look
   * already chosen for that same day back to an idea — a day has one outfit.
   */
  const selectOutfit = (outfitId: string, dayId?: string): void => {
    updateTrip(trip.id, {
      outfits: trip.outfits.map((entry) => {
        if (entry.id === outfitId) return { ...entry, status: "selected" as const };
        if (dayId && entry.status === "selected" && entry.dayIds.includes(dayId)) {
          return { ...entry, status: "idea" as const };
        }
        return entry;
      }),
    });
  };

  /* ---------------------------------------------------------------- nav -- */

  const items: SegmentedItem[] = areas.map((entry) => ({
    id: entry,
    label: t(`trips:tabs.${entry}`),
    badge:
      entry === "checklist" && progress.total > 0
        ? `${progress.done}/${progress.total}`
        : entry === "saved" && saved.length > 0
          ? String(saved.length)
          : undefined,
  }));

  const copyFrom = trips
    .filter((entry) => entry.id !== trip.id)
    .map((entry) => ({ ownerId: `trip:${entry.id}`, label: entry.title }));

  return (
    <div className="focus-detail focus-detail--wide focus-trip">
      <div className="focus-trip__back">
        <BackButton />
      </div>

      <TripHero trip={trip} onEdit={() => setEditingTrip(true)} />

      {/*
        Above the tabs, in the order somebody reads a trip: what it is, where it
        goes, what it needs today. Nothing below repeats any of it.
      */}
      <RouteStrip trip={trip} value={legId} onSelect={setLegId} />

      <TripBrief trip={trip} readiness={readiness} progress={progress} onGo={setArea} />

      <SegmentedNav
        label={t("trips:navigation")}
        items={items}
        value={area ?? ""}
        onChange={(next) => setArea(next as TripArea)}
        variant="tabs"
        idPrefix="trip"
        collapse
      />

      <div
        role="tabpanel"
        id={`trip-panel-${area}`}
        aria-labelledby={`trip-tab-${area}`}
        className="focus-trip__panel"
      >
        {area === "notes" && (
          <div className="focus-trip-notes">
            <div className="focus-band__head">
              <h2 className="focus-band__title">{t("trips:notes")}</h2>
              <button
                type="button"
                className="focus-band__action focus-chip-button"
                onClick={() => setEditingNotes((current) => !current)}
              >
                {editingNotes ? t("common:actions.doneEditing") : t("common:actions.edit")}
              </button>
            </div>
            {noteBlocksFor(trip).length === 0 && !editingNotes ? (
              <p className="focus-day-empty mb-0">{t("trips:notesEmpty")}</p>
            ) : (
              <ProjectNotes
                notes={noteBlocksFor(trip)}
                isEditing={editingNotes}
                onChange={(notes: ProjectNote[]) => updateTrip(trip.id, { noteBlocks: notes })}
              />
            )}
          </div>
        )}

        {area === "itinerary" && (
          <ItineraryArea
            trip={trip}
            savedItems={saved}
            legId={legId}
            onEditDestination={(destinationId) => setDestinationForm({ id: destinationId })}
            onChangeDestination={(destinationId, patch: Partial<TripDestination>) =>
              updateDestination(trip.id, destinationId, patch)
            }
            onAddDestination={() => setDestinationForm({ id: null })}
            onRemoveDestination={removeDestination}
            onMoveDestination={moveDestination}
            onAddDay={addDay}
            onRemoveDay={removeDay}
            onMoveDay={moveDay}
            onChangeDay={(dayId, patch) => updateDay(trip.id, dayId, patch)}
            onFoodUpdate={(foodId, patch) => updateFood(trip.id, foodId, patch)}
            onFoodAdd={(entry) => addFood(trip.id, entry)}
            onFoodRemove={(foodId) => removeFood(trip.id, foodId)}
            onAssignOutfit={assignOutfit}
            onUnassignOutfit={unassignOutfit}
            onSelectOutfit={selectOutfit}
            onCreateOutfit={(dayId) => setOutfitForm({ id: null, dayId })}
          />
        )}

        {area === "bookings" && (
          <BookingsArea
            trip={trip}
            readOnly={phase === "past"}
            onAdd={(type) => setBookingForm({ type, id: null })}
            onEditFlight={(flight) => setBookingForm({ type: "flight", id: flight.id })}
            onEditStay={(stay) => setBookingForm({ type: "stay", id: stay.id })}
            onRemoveFlight={(flight) =>
              updateTrip(trip.id, {
                flights: trip.flights.filter((entry) => entry.id !== flight.id),
              })
            }
            onRemoveStay={(stay) =>
              updateTrip(trip.id, { stays: trip.stays.filter((entry) => entry.id !== stay.id) })
            }
          />
        )}

        {area === "outfits" && (
          <OutfitsArea
            trip={trip}
            savedItems={saved}
            onCreate={(dayId) => setOutfitForm({ id: null, dayId })}
            onEdit={(outfit) => setOutfitForm({ id: outfit.id })}
            onRemove={(outfit) =>
              updateTrip(trip.id, {
                outfits: trip.outfits.filter((entry) => entry.id !== outfit.id),
              })
            }
            onMove={(outfit, direction) => {
              const ordered = [...trip.outfits].sort((a, b) => a.order - b.order);
              const index = ordered.findIndex((entry) => entry.id === outfit.id);
              updateTrip(trip.id, {
                outfits: moveInArray(ordered, index, direction).map((entry, position) => ({
                  ...entry,
                  order: position,
                })),
              });
            }}
            onSelect={(outfit) => selectOutfit(outfit.id)}
          />
        )}

        {area === "checklist" && <ChecklistArea trip={trip} copyFrom={copyFrom} />}

        {area === "saved" && (
          <>
            {saved.length === 0 ? (
              <p className="focus-day-empty mb-0">{t("trips:noSaved")}</p>
            ) : (
              <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
                {saved.map((item) => (
                  <li key={item.id}>
                    <SavedItemCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <TripEditModal
        show={editingTrip}
        trip={trip}
        onClose={() => setEditingTrip(false)}
        onSave={(patch) => updateTrip(trip.id, patch)}
      />

      <OutfitFormModal
        show={outfitForm !== null}
        trip={trip}
        outfit={
          outfitForm?.id ? trip.outfits.find((entry) => entry.id === outfitForm.id) : undefined
        }
        savedItems={saved}
        onClose={() => setOutfitForm(null)}
        onSave={(outfit) => saveOutfit(outfit, outfitForm?.dayId)}
      />

      <DestinationFormModal
        show={destinationForm !== null}
        destination={
          destinationForm?.id
            ? trip.destinations.find((entry) => entry.id === destinationForm.id)
            : undefined
        }
        stay={
          destinationForm?.id
            ? trip.stays.find((entry) => entry.destinationId === destinationForm.id)
            : undefined
        }
        onClose={() => setDestinationForm(null)}
        onSave={saveDestination}
      />

      <BookingFormModal
        show={bookingForm !== null}
        type={bookingForm?.type ?? "flight"}
        flight={
          bookingForm?.type === "flight" && bookingForm.id
            ? trip.flights.find((entry) => entry.id === bookingForm.id)
            : undefined
        }
        stay={
          bookingForm?.type === "stay" && bookingForm.id
            ? trip.stays.find((entry) => entry.id === bookingForm.id)
            : undefined
        }
        destinations={trip.destinations}
        onClose={() => setBookingForm(null)}
        onSave={saveBooking}
      />
    </div>
  );
}
