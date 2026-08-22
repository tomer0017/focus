import { createContext, useContext } from "react";
import type { EventKind, EventSection, EventSectionKind, FocusEvent, SpaceId } from "../types";

export interface EventDraft {
  kind: EventKind;
  title: string;
  startsAt: string;
  spaceId: SpaceId;
  description?: string;
  /** When false, the event starts empty instead of from its template. */
  useTemplate: boolean;
}

export interface EventsContextValue {
  events: FocusEvent[];
  getEvent: (id: string) => FocusEvent | undefined;
  createEvent: (draft: EventDraft) => FocusEvent;
  updateEvent: (id: string, patch: Partial<Omit<FocusEvent, "id" | "sections">>) => void;
  deleteEvent: (id: string) => void;
  addSection: (eventId: string, kind: EventSectionKind) => void;
  removeSection: (eventId: string, sectionId: string) => void;
  /** -1 moves a section earlier, 1 later. */
  moveSectionBy: (eventId: string, sectionId: string, direction: -1 | 1) => void;
  updateSection: (eventId: string, sectionId: string, patch: Partial<EventSection>) => void;
}

export const EventsContext = createContext<EventsContextValue | null>(null);

export function useEvents(): EventsContextValue {
  const value = useContext(EventsContext);
  if (!value) {
    throw new Error("useEvents must be used inside <EventsProvider>");
  }
  return value;
}
