import { createContext, useContext } from "react";
import type { Trip, TripDayPlan, TripDestination, TripFood, TripKind } from "../types";

/** The five facts a trip starts with. */
export interface NewTripDraft {
  title: string;
  kind: TripKind;
  /** A country or a place name. Becomes the first destination when given. */
  destination?: string;
  startDate: string;
  endDate: string;
}

export interface TripsContextValue {
  trips: Trip[];
  getTrip: (id: string) => Trip | undefined;
  /**
   * Starts a trip from the five facts the first form asks for, and returns its
   * id so the caller can open it. Everything else — flights, destinations,
   * days, looks — is filled in on the trip's own screen, because a form that
   * asked for all of it up front is a form nobody finishes.
   */
  addTrip: (draft: NewTripDraft) => string;
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id">>) => void;
  updateDay: (tripId: string, dayId: string, patch: Partial<TripDayPlan>) => void;
  updateDestination: (
    tripId: string,
    destinationId: string,
    patch: Partial<TripDestination>
  ) => void;
  updateFood: (tripId: string, foodId: string, patch: Partial<TripFood>) => void;
  /**
   * Replaces whole collections at once — destinations, days, flights, stays.
   *
   * Deliberately not eight more specific methods: the forms already build the
   * new array, and `updateTrip` writes it in one go. Fewer entry points, one
   * write per edit, and nothing that can leave two arrays disagreeing.
   */
  addFood: (tripId: string, food: Omit<TripFood, "id">) => void;
  removeFood: (tripId: string, foodId: string) => void;
}

export const TripsContext = createContext<TripsContextValue | null>(null);

export function useTrips(): TripsContextValue {
  const value = useContext(TripsContext);
  if (!value) {
    throw new Error("useTrips must be used inside <TripsProvider>");
  }
  return value;
}
