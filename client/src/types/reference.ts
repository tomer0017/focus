/**
 * A pointer from one thing in Focus to another.
 *
 * The alternative — copying the entity, or giving every new model its own
 * `familyProfileId` / `tripId` / `pageId` field — is what turns a small app
 * into a schema nobody can change. One reference shape means one resolver, one
 * search index entry and one broken-reference check.
 *
 * A reference is *weak on purpose*: the target may have been deleted. Nothing
 * cascades. `hrefForReference` returns the address to open, and the UI is
 * expected to cope with the target no longer existing.
 */

export type EntityKind =
  | "page"
  | "event"
  | "routine"
  | "savedItem"
  | "trip"
  | "recipe"
  | "family"
  | "commitment"
  | "medication"
  | "leisure"
  | "menu"
  | "scheduled";

export interface EntityReference {
  kind: EntityKind;
  id: string;
}

/** Stable string form, for map keys and `key=` props. */
export function referenceKey(reference: EntityReference): string {
  return `${reference.kind}:${reference.id}`;
}

export function sameReference(
  a: EntityReference | undefined,
  b: EntityReference | undefined
): boolean {
  if (!a || !b) return false;
  return a.kind === b.kind && a.id === b.id;
}

/**
 * Where a reference leads.
 *
 * `undefined` means "this kind has no screen of its own" — a medication is read
 * inside its profile, not at a URL. Returning undefined rather than a plausible
 * path keeps the app from rendering a link it cannot honour, which is the same
 * rule `lib/links.ts` enforces for external destinations.
 */
export function hrefForReference(reference: EntityReference): string | undefined {
  switch (reference.kind) {
    case "page":
      return `/pages/${reference.id}`;
    case "event":
      return `/events/${reference.id}`;
    case "routine":
      return `/routines/${reference.id}`;
    case "trip":
      return `/trips/${reference.id}`;
    case "recipe":
      return `/recipes/${reference.id}`;
    case "family":
      return `/family/${reference.id}`;
    case "menu":
      return `/manage/menus/${reference.id}`;
    case "savedItem":
    case "commitment":
    case "medication":
    case "leisure":
    case "scheduled":
      return undefined;
  }
}

/** The checklist owner key for a reference — the app's one checklist address. */
export function checklistOwnerFor(reference: EntityReference): string {
  return referenceKey(reference);
}
