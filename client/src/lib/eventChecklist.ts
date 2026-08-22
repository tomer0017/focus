import type { Checklist, ChecklistItem, EventSection, EventTask } from "../types";

/**
 * Adapter between an event section's flat item list and the shared `Checklist`.
 *
 * Events stored their items as `EventTask[]` before the shared checklist
 * existed. Migrating them into `focus.checklists` would mean rewriting stored
 * events and inventing an owner id for every section — a lot of risk for no
 * behaviour the user can see. Adapting instead means events render through the
 * one checklist component, keep their own storage shape, and lose nothing.
 *
 * The remaining debt is written down in PROJECT_STATE.md: event items live in
 * the event, not in the checklist repository, so they cannot yet be templated
 * or copied between events.
 */
export function sectionAsChecklist(section: EventSection): Checklist {
  return {
    ownerId: `event-section:${section.id}`,
    groups: [
      {
        id: section.id,
        items: (section.items ?? []).map((task) => ({
          id: task.id,
          text: task.title,
          done: task.done,
        })),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/** The items to store back on the section after a checklist edit. */
export function checklistAsTasks(checklist: Checklist): EventTask[] {
  return checklist.groups.flatMap((group) =>
    group.items.map((item: ChecklistItem) => ({
      id: item.id,
      title: item.text ?? "",
      done: item.done,
    }))
  );
}
