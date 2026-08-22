import { useCallback, useMemo, type ReactNode } from "react";
import { eventsRepository } from "../repositories";
import {
  createEventSections,
  isListSection,
  isReferenceSection,
  moveSection,
  normaliseSectionOrder,
} from "../lib/eventTemplates";
import type { EventSection, EventSectionKind, FocusEvent } from "../types";
import { EventsContext, type EventDraft, type EventsContextValue } from "./eventsContext";
import { usePersistentState } from "./usePersistentState";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Events and their sections, persisted locally.
 *
 * A section stores its `kind` and only stores a title once the user renames
 * it, so seeding a template never writes one language into the data.
 */
export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = usePersistentState(eventsRepository);

  const getEvent = useCallback((id: string) => events.find((event) => event.id === id), [events]);

  const patchEvent = useCallback(
    (id: string, updater: (event: FocusEvent) => FocusEvent) => {
      setEvents((current) => current.map((event) => (event.id === id ? updater(event) : event)));
    },
    [setEvents]
  );

  const createEvent = useCallback(
    (draft: EventDraft): FocusEvent => {
      const id = newId("event");
      const event: FocusEvent = {
        id,
        kind: draft.kind,
        title: draft.title,
        startsAt: draft.startsAt,
        spaceId: draft.spaceId,
        description: draft.description,
        sections: draft.useTemplate ? createEventSections(draft.kind, id) : [],
        createdAt: new Date().toISOString(),
      };
      setEvents((current) => [...current, event]);
      return event;
    },
    [setEvents]
  );

  const updateEvent = useCallback<EventsContextValue["updateEvent"]>(
    (id, patch) => patchEvent(id, (event) => ({ ...event, ...patch })),
    [patchEvent]
  );

  const deleteEvent = useCallback(
    (id: string) => setEvents((current) => current.filter((event) => event.id !== id)),
    [setEvents]
  );

  const addSection = useCallback(
    (eventId: string, kind: EventSectionKind) => {
      patchEvent(eventId, (event) => {
        const section: EventSection = {
          id: newId(`${eventId}-${kind}`),
          kind,
          order: event.sections.length,
          ...(isListSection(kind) ? { items: [] } : {}),
          ...(isReferenceSection(kind) || kind === "recipes" ? { savedItemIds: [] } : {}),
        };
        return { ...event, sections: normaliseSectionOrder([...event.sections, section]) };
      });
    },
    [patchEvent]
  );

  const removeSection = useCallback(
    (eventId: string, sectionId: string) => {
      patchEvent(eventId, (event) => ({
        ...event,
        sections: normaliseSectionOrder(
          event.sections.filter((section) => section.id !== sectionId)
        ),
      }));
    },
    [patchEvent]
  );

  const moveSectionBy = useCallback(
    (eventId: string, sectionId: string, direction: -1 | 1) => {
      patchEvent(eventId, (event) => ({
        ...event,
        sections: moveSection(event.sections, sectionId, direction),
      }));
    },
    [patchEvent]
  );

  const updateSection = useCallback(
    (eventId: string, sectionId: string, patch: Partial<EventSection>) => {
      patchEvent(eventId, (event) => ({
        ...event,
        sections: event.sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section
        ),
      }));
    },
    [patchEvent]
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      getEvent,
      createEvent,
      updateEvent,
      deleteEvent,
      addSection,
      removeSection,
      moveSectionBy,
      updateSection,
    }),
    [
      events,
      getEvent,
      createEvent,
      updateEvent,
      deleteEvent,
      addSection,
      removeSection,
      moveSectionBy,
      updateSection,
    ]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}
