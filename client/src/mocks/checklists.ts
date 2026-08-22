import type { Checklist } from "../types";
import { fromTemplate } from "../lib/checklist";
import { BUILT_IN_TEMPLATES } from "./checklistTemplates";

/**
 * Seeded checklists, keyed by owner. Trips and checklist pages start from a
 * built-in template; project task lists are written out, because a project's
 * tasks are the user's own words rather than a packing list.
 */

function seededFromTemplate(ownerId: string, templateId: string, doneCount: number): Checklist {
  const template = BUILT_IN_TEMPLATES.find((entry) => entry.id === templateId);
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  const checklist = fromTemplate(ownerId, template);
  // Tick the first `doneCount` items so progress is not always zero in a demo.
  let remaining = doneCount;
  return {
    ...checklist,
    groups: checklist.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (remaining <= 0) return item;
        remaining -= 1;
        return { ...item, done: true };
      }),
    })),
  };
}

let counter = 0;
const id = (prefix: string): string => `${prefix}-seed-${(counter += 1)}`;

export const MOCK_CHECKLISTS: Record<string, Checklist> = {
  "page:before-a-flight": seededFromTemplate("page:before-a-flight", "trip-short", 8),
  "page:trip-north": seededFromTemplate("page:trip-north", "trip-camping", 5),
  "trip:japan-2027": seededFromTemplate("trip:japan-2027", "trip-standard", 11),

  // Household shopping — what the Manage → Shopping screen is actually for.
  "page:weekly-shop": seededFromTemplate("page:weekly-shop", "shop-weekly", 4),
  "page:holiday-shop": seededFromTemplate("page:holiday-shop", "shop-holiday", 2),
  "page:cleaning-supplies": seededFromTemplate("page:cleaning-supplies", "shop-cleaning", 3),

  "page:sorcol": {
    ownerId: "page:sorcol",
    updatedAt: new Date().toISOString(),
    groups: [
      {
        id: id("group"),
        title: "Size model",
        items: [
          { id: id("item"), text: "Model for size M", done: true },
          { id: id("item"), text: "Models for S and L", done: false },
          { id: id("item"), text: "Print one trial size", done: false },
        ],
      },
      {
        id: id("group"),
        title: "Site",
        items: [
          { id: id("item"), text: "Size chart component", done: false, note: "M renders, the rest are placeholders" },
          { id: id("item"), text: "Order flow copy", done: false },
          { id: id("item"), text: "Checkout smoke test", done: false },
        ],
      },
    ],
  },

  "page:living-room-renovation": {
    ownerId: "page:living-room-renovation",
    updatedAt: new Date().toISOString(),
    groups: [
      {
        id: id("group"),
        title: "Decisions",
        items: [
          { id: id("item"), text: "Wall colour", done: true },
          { id: id("item"), text: "Sideboard", done: false, note: "Oak fits, walnut is 8cm too wide" },
          { id: id("item"), text: "Sofa", done: false },
        ],
      },
      {
        id: id("group"),
        title: "Ordering",
        items: [
          { id: id("item"), text: "Measure the alcove again", done: true },
          { id: id("item"), text: "Check delivery times", done: false },
        ],
      },
    ],
  },
};
