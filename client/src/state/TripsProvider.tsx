import { useCallback, useMemo, type ReactNode } from "react";
import { tripsRepository } from "../repositories";
import type { Trip, TripFood } from "../types";
import { TripsContext, type NewTripDraft, type TripsContextValue } from "./tripsContext";
import { usePersistentState } from "./usePersistentState";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Trips and everything inside them.
 *
 * Destinations, day plans and food live on the trip rather than in their own
 * slices: they are never read without it, and keeping them together means one
 * write per edit instead of three that could disagree.
 */
export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = usePersistentState(tripsRepository);

  const getTrip = useCallback((id: string) => trips.find((trip) => trip.id === id), [trips]);

  /*
   * A new trip is five facts and eight empty arrays. The one thing it is given
   * beyond that is a first destination, when the user named a place: an
   * itinerary with nowhere in it has no day to add a plan to, and making them
   * type the place a second time to get one is a form asking twice.
   */
  const addTrip = useCallback<TripsContextValue["addTrip"]>(
    (draft: NewTripDraft) => {
      const id = newId("trip");
      const place = draft.destination?.trim();
      const trip: Trip = {
        id,
        title: draft.title.trim(),
        kind: draft.kind,
        countries: place ? [place] : [],
        startDate: draft.startDate,
        endDate: draft.endDate,
        status: "dreaming",
        flights: [],
        stays: [],
        destinations: place
          ? [
              {
                id: newId("destination"),
                name: place,
                arriveOn: draft.startDate,
                leaveOn: draft.endDate,
                goodToKnow: [],
                savedItemIds: [],
              },
            ]
          : [],
        days: [],
        food: [],
        outfits: [],
        createdAt: new Date().toISOString(),
      };
      setTrips((current) => [...current, trip]);
      return id;
    },
    [setTrips]
  );

  const patchTrip = useCallback(
    (id: string, updater: (trip: Trip) => Trip) => {
      setTrips((current) => current.map((trip) => (trip.id === id ? updater(trip) : trip)));
    },
    [setTrips]
  );

  const updateTrip = useCallback<TripsContextValue["updateTrip"]>(
    (id, patch) => patchTrip(id, (trip) => ({ ...trip, ...patch })),
    [patchTrip]
  );

  const updateDay = useCallback<TripsContextValue["updateDay"]>(
    (tripId, dayId, patch) =>
      patchTrip(tripId, (trip) => ({
        ...trip,
        days: trip.days.map((day) => (day.id === dayId ? { ...day, ...patch } : day)),
      })),
    [patchTrip]
  );

  const updateDestination = useCallback<TripsContextValue["updateDestination"]>(
    (tripId, destinationId, patch) =>
      patchTrip(tripId, (trip) => ({
        ...trip,
        destinations: trip.destinations.map((destination) =>
          destination.id === destinationId ? { ...destination, ...patch } : destination
        ),
      })),
    [patchTrip]
  );

  const updateFood = useCallback<TripsContextValue["updateFood"]>(
    (tripId, foodId, patch) =>
      patchTrip(tripId, (trip) => ({
        ...trip,
        food: trip.food.map((entry) => (entry.id === foodId ? { ...entry, ...patch } : entry)),
      })),
    [patchTrip]
  );

  const addFood = useCallback(
    (tripId: string, food: Omit<TripFood, "id">) =>
      patchTrip(tripId, (trip) => ({
        ...trip,
        food: [...trip.food, { ...food, id: newId("food") }],
      })),
    [patchTrip]
  );

  const removeFood = useCallback(
    (tripId: string, foodId: string) =>
      patchTrip(tripId, (trip) => ({
        ...trip,
        food: trip.food.filter((entry) => entry.id !== foodId),
      })),
    [patchTrip]
  );

  const value = useMemo<TripsContextValue>(
    () => ({
      trips,
      getTrip,
      addTrip,
      updateTrip,
      updateDay,
      updateDestination,
      updateFood,
      addFood,
      removeFood,
    }),
    [trips, getTrip, addTrip, updateTrip, updateDay, updateDestination, updateFood, addFood, removeFood]
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}
